import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, Archive, RefreshCw, Volume2, Info, X, Music, Disc, BookOpen, ArrowLeft, Hash, Radio } from 'lucide-react';
import { analyzeDescription } from './colorWords';
import { useKinectron } from './useKinectron';
import samplePalettes from './samplePalettes';
import SOUND_LIBRARY from './soundLibrary';

// IP address of the computer running the Kinectron 1.0 server.
// Please refer to Kinectron 1.0 server to read your IP address.
const KINECTRON_IP = '10.33.6.192';

// Enable two-person mode via VITE_MULTI_PERSON=true in .env.local
const MULTI_PERSON = import.meta.env.VITE_MULTI_PERSON === 'true';

/**
 * ==========================================
 * UTILITIES
 * ==========================================
 */

// Maps a Hex color to an X/Y position on the field
const mapColorToPosition = (hex) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }

  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    x: h * 100, 
    y: (1 - l) * 100 
  };
};

/**
 * ==========================================
 * AUDIO ENGINE (Custom Hook)
 * ==========================================
 */

const useAudioField = (nodes, isInteractable) => {
  const audioContextRef = useRef(null);
  const sourcesRef = useRef({});
  const [activeNodeId, setActiveNodeId] = useState(null);
  // ── Multi-person ──────────────────────────────────────────────────────────
  const [activeNodeIds, setActiveNodeIds] = useState([]);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);


  useEffect(() => {
    Object.values(sourcesRef.current).forEach(obj => {
      if (obj.source) {
        try { obj.source.stop(); } catch(e) {}
      }
    });
    sourcesRef.current = {};
    setActiveNodeId(null);
    setActiveNodeIds([]);
  }, [nodes]);

  const loadAudio = useCallback(async (node) => {
    if (!audioContextRef.current) return;
    if (!node.audioUrl) return;
    if (sourcesRef.current[node.id] && sourcesRef.current[node.id].buffer) return;

    if (!sourcesRef.current[node.id]) {
        sourcesRef.current[node.id] = {
            buffer: null,
            source: null,
            gain: null,
            isPlaying: false
        };
    }

    try {
      const response = await fetch(node.audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      sourcesRef.current[node.id].buffer = audioBuffer;
    } catch (e) {
      console.error("Failed to load audio for node", node.id, e);
    }
  }, []);

  const updateMixing = useCallback((mouseX, mouseY, width, height) => {
    if (!audioContextRef.current || !isInteractable) return;

    const ctx = audioContextRef.current;
    const mouseXPct = (mouseX / width) * 100;
    const mouseYPct = (mouseY / height) * 100;
    const TUNING_RADIUS = 20;

    let closestDist = Infinity;
    let closestNode = null;

    nodes.forEach(node => {
      const dx = mouseXPct - node.x;
      const dy = mouseYPct - node.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < closestDist) {
        closestDist = dist;
        closestNode = node;
      }
    });

    nodes.forEach(node => {
        if (!sourcesRef.current[node.id]) {
             if (node === closestNode && closestDist < TUNING_RADIUS) {
                 loadAudio(node);
             }
             return;
        }
        
        const audioObj = sourcesRef.current[node.id];
        if (!audioObj.buffer) return;

        let targetGain = 0;
        if (node === closestNode && closestDist < TUNING_RADIUS) {
            targetGain = 1 - (closestDist / TUNING_RADIUS);
            targetGain = Math.pow(targetGain, 0.5);
        }

        if (targetGain > 0) {
            if (!audioObj.isPlaying) {
                const src = ctx.createBufferSource();
                src.buffer = audioObj.buffer;
                src.loop = true;
                const gainNode = ctx.createGain();
                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                
                src.connect(gainNode);
                gainNode.connect(ctx.destination);
                src.start(0);
                
                audioObj.source = src;
                audioObj.gain = gainNode;
                audioObj.isPlaying = true;
            }
            audioObj.gain.gain.cancelScheduledValues(ctx.currentTime);
            audioObj.gain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.1); 

        } else {
            if (audioObj.isPlaying && audioObj.gain) {
                audioObj.gain.gain.cancelScheduledValues(ctx.currentTime);
                audioObj.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
            }
        }
    });

    if (closestDist < TUNING_RADIUS) {
      setActiveNodeId(closestNode.id);
    } else {
      setActiveNodeId(null);
    }

  }, [nodes, isInteractable, loadAudio]);

  // ── Multi-person mixing ───────────────────────────────────────────────────
  // Each person independently activates their closest node within TUNING_RADIUS.
  // Per-node gain is the sum of all contributions, capped at 1.0.
  // This means two people on the same node = noticeably louder than one.
  const updateMixingMulti = useCallback((pixelPositions, width, height) => {
    if (!audioContextRef.current || !isInteractable) return;
    const ctx = audioContextRef.current;
    const TUNING_RADIUS = 20;

    // Convert pixel positions to percentages
    const positions = pixelPositions.map(p => ({
      x: (p.x / width) * 100,
      y: (p.y / height) * 100,
    }));

    // For each person, find their closest node and gain contribution
    const personClosest = positions.map(pos => {
      let closestDist = Infinity;
      let closestNode = null;
      nodes.forEach(node => {
        const dx = pos.x - node.x;
        const dy = pos.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) { closestDist = dist; closestNode = node; }
      });
      return { node: closestNode, dist: closestDist };
    });

    // Build combined gain map — sum contributions, cap at 1.0
    const gainMap = {};
    personClosest.forEach(({ node, dist }) => {
      if (node && dist < TUNING_RADIUS) {
        const g = Math.pow(1 - (dist / TUNING_RADIUS), 0.5);
        gainMap[node.id] = Math.min(1.0, (gainMap[node.id] || 0) + g);
      }
    });

    // Apply gains to audio nodes
    nodes.forEach(node => {
      if (!sourcesRef.current[node.id]) {
        if (gainMap[node.id]) loadAudio(node);
        return;
      }
      const audioObj = sourcesRef.current[node.id];
      if (!audioObj.buffer) return;

      const targetGain = gainMap[node.id] || 0;

      if (targetGain > 0) {
        if (!audioObj.isPlaying) {
          const src = ctx.createBufferSource();
          src.buffer = audioObj.buffer;
          src.loop = true;
          const gainNode = ctx.createGain();
          gainNode.gain.setValueAtTime(0, ctx.currentTime);
          src.connect(gainNode);
          gainNode.connect(ctx.destination);
          src.start(0);
          audioObj.source = src;
          audioObj.gain = gainNode;
          audioObj.isPlaying = true;
        }
        audioObj.gain.gain.cancelScheduledValues(ctx.currentTime);
        audioObj.gain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.1);
      } else {
        if (audioObj.isPlaying && audioObj.gain) {
          audioObj.gain.gain.cancelScheduledValues(ctx.currentTime);
          audioObj.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
        }
      }
    });

    // Track which node each person is tuned into (for descriptions)
    const ids = personClosest
      .filter(({ node, dist }) => node && dist < TUNING_RADIUS)
      .map(({ node }) => node.id);
    setActiveNodeIds(ids);
  }, [nodes, isInteractable, loadAudio]);

  const fadeOut = useCallback(() => {
      if (!audioContextRef.current) return;
      const ctx = audioContextRef.current;

      Object.values(sourcesRef.current).forEach(audioObj => {
          if (audioObj.isPlaying && audioObj.gain) {
              audioObj.gain.gain.cancelScheduledValues(ctx.currentTime);
              audioObj.gain.gain.setTargetAtTime(0, ctx.currentTime, 1.5);
          }
      });
      setActiveNodeId(null);
      setActiveNodeIds([]);
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { initAudio, updateMixing, updateMixingMulti, fadeOut, activeNodeId, activeNodeIds };
};

/**
 * ==========================================
 * UI COMPONENTS
 * ==========================================
 */

const ArchiveModal = ({ isOpen, onClose, onConfirm }) => {
  const [paletteName, setPaletteName] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-white/10 w-full max-w-sm p-6 rounded-2xl shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
          <X size={20} />
        </button>
        <h2 className="text-xl font-light text-white mb-2 tracking-wide">Name Your Palette</h2>
        <p className="text-neutral-400 text-xs mb-6">Give a name to this completed composition before archiving it.</p>
        
        <input
          type="text"
          value={paletteName}
          onChange={(e) => setPaletteName(e.target.value)}
          placeholder="e.g., Midnight Rain"
          className="w-full bg-neutral-800 border-none rounded-lg p-3 text-white placeholder-neutral-600 focus:ring-1 focus:ring-white/20 text-sm mb-6 outline-none"
          autoFocus
        />

        <button 
          onClick={() => onConfirm(paletteName || "Untitled Composition")}
          className="w-full bg-white text-black py-3 rounded-lg font-medium text-sm hover:bg-neutral-200 transition-colors"
        >
          Save to Library
        </button>
      </div>
    </div>
  );
};

const UploadModal = ({ isOpen, onClose, onAdd }) => {
  const [text, setText] = useState("");
  const [selectedSound, setSelectedSound] = useState(null);
  const [suggestedColor, setSuggestedColor] = useState(null);
  const [finalColor, setFinalColor] = useState("#808080");

  useEffect(() => {
    if (text.length > 5) {
      const timer = setTimeout(() => {
        const color = analyzeDescription(text);
        setSuggestedColor(color);
        setFinalColor(color);
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [text]);

  const handleHexChange = (e) => {
    let val = e.target.value;
    if (val.startsWith('#')) {
      setFinalColor(val);
    } else {
      setFinalColor(`#${val}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSound || !text) return;
    onAdd({
      text,
      color: finalColor,
      audioUrl: selectedSound.audioUrl,
      fileName: selectedSound.displayName,
    });
    setText("");
    setSelectedSound(null);
    setSuggestedColor(null);
    setFinalColor("#808080");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-white/10 w-full max-w-md p-6 rounded-2xl shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
          <X size={20} />
        </button>

        <h2 className="text-xl font-light text-white mb-6 tracking-wide">Add Memory to Archive</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-xs uppercase tracking-widest text-neutral-500">Sound</label>
              {selectedSound && (
                <span className="text-xs text-emerald-400 flex items-center space-x-1">
                  <Music size={11} />
                  <span className="truncate max-w-[180px]">{selectedSound.displayName}</span>
                </span>
              )}
            </div>
            <div className="max-h-44 overflow-y-auto space-y-1 custom-scrollbar pr-1">
              {SOUND_LIBRARY.map(sound => (
                <div
                  key={sound.fileName}
                  onClick={() => setSelectedSound(sound)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedSound?.fileName === sound.fileName
                      ? 'bg-white/15 border border-white/20'
                      : 'bg-neutral-800 hover:bg-neutral-700'
                  }`}
                >
                  <span className="text-sm text-neutral-200 truncate flex-1">{sound.displayName}</span>
                  {selectedSound?.fileName === sound.fileName && (
                    <span className="text-emerald-400 text-xs flex-shrink-0">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-neutral-500">Poetic Description</label>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g., The sound of rain on a tin roof in Kyoto..."
              className="w-full bg-neutral-800 border-none rounded-lg p-3 text-white placeholder-neutral-600 focus:ring-1 focus:ring-white/20 text-sm resize-none h-24 outline-none"
              maxLength={140}
            />
          </div>

          <div className="space-y-2">
             <div className="flex justify-between items-end">
               <label className="text-xs uppercase tracking-widest text-neutral-500">Emotional Tone</label>
               {suggestedColor && <span className="text-xs text-neutral-400">Algorithmic Color Suggestion</span>}
             </div>
             
             <div className="flex items-center space-x-3 bg-neutral-800 p-2 rounded-lg">
                <div className="flex-1 flex items-center space-x-2 pl-1">
                  <Hash size={14} className="text-neutral-500" />
                  <input 
                    type="text"
                    value={finalColor.replace('#', '')}
                    onChange={handleHexChange}
                    className="bg-transparent border-none text-white text-sm focus:ring-0 w-full uppercase font-mono outline-none"
                    maxLength={6}
                  />
                </div>

                <div className="relative w-8 h-8 overflow-hidden rounded-full border border-white/20 cursor-pointer hover:scale-110 transition-transform">
                  <input 
                    type="color"
                    value={finalColor}
                    onChange={(e) => setFinalColor(e.target.value)}
                    className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-none bg-transparent"
                  />
                </div>
             </div>
          </div>

          <button 
            type="submit"
            disabled={!selectedSound || !text}
            className="w-full bg-white text-black py-3 rounded-lg font-medium text-sm hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Integrate into Field
          </button>
        </form>
      </div>
    </div>
  );
};

const LibraryDrawer = ({ isOpen, onClose, palettes, onLoadPalette }) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-neutral-900/95 backdrop-blur-xl border-l border-white/10 z-50 p-6 shadow-2xl transition-all">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-light tracking-widest uppercase text-white">Library</h2>
        <button onClick={onClose}><X size={20} className="text-neutral-500 hover:text-white"/></button>
      </div>

      {palettes.length === 0 ? (
        <div className="text-neutral-600 text-sm text-center mt-10">
          <Archive size={32} className="mx-auto mb-4 opacity-20"/>
          <p>No archived compositions.</p>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto h-[80vh] pr-2 custom-scrollbar">
          {palettes.map(p => (
            <div 
              key={p.id} 
              onClick={() => onLoadPalette(p)}
              className="group cursor-pointer bg-neutral-800/30 hover:bg-neutral-800 border border-white/5 hover:border-white/20 p-4 rounded-lg transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white font-medium text-sm group-hover:text-emerald-400 transition-colors">{p.name}</h3>
                <span className="text-[10px] text-neutral-500 font-mono">{p.date}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-neutral-400">
                <Disc size={12} />
                <span>{p.nodes.length} Memories</span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-neutral-900 overflow-hidden flex">
                {p.nodes.map((n, i) => (
                  <div key={i} style={{ backgroundColor: n.color, flex: 1 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [palettes, setPalettes] = useState(samplePalettes); 
  const [currentPalette, setCurrentPalette] = useState([]);
  const [viewedPalette, setViewedPalette] = useState(null);
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [isArchiveModalOpen, setArchiveModalOpen] = useState(false);
  const [isLibraryOpen, setLibraryOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [kinectEnabled, setKinectEnabled] = useState(import.meta.env.VITE_KINECT_ON === 'true');
  const [kinectPositions, setKinectPositions] = useState([]);

  const activeNodes = viewedPalette ? viewedPalette.nodes : currentPalette;
  const containerRef = useRef(null);
  const { initAudio, updateMixing, updateMixingMulti, fadeOut, activeNodeId, activeNodeIds } = useAudioField(activeNodes, !isModalOpen && !isLibraryOpen && !isArchiveModalOpen);

  const coverage = useMemo(() => {
    const maxNodes = 12;
    return Math.min(100, Math.round((currentPalette.length / maxNodes) * 100));
  }, [currentPalette]);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    updateMixing(x, y, rect.width, rect.height);
  };

  const handleKinectPositions = useCallback((positions) => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    setKinectPositions(positions);
    initAudio();
    if (MULTI_PERSON) {
      updateMixingMulti(
        positions.map(p => ({ x: (p.x / 100) * width, y: (p.y / 100) * height })),
        width, height
      );
    } else {
      const p = positions[0];
      if (p) updateMixing((p.x / 100) * width, (p.y / 100) * height, width, height);
    }
  }, [updateMixing, updateMixingMulti, initAudio]);

  useKinectron({
    ip: KINECTRON_IP,
    enabled: kinectEnabled,
    simulate: import.meta.env.VITE_KINECT_SIMULATE === 'true',
    multiPerson: MULTI_PERSON,
    onPositions: handleKinectPositions,
  });

  const addNode = (data) => {
    const position = mapColorToPosition(data.color);
    const newNode = {
      id: Date.now().toString(),
      ...data,
      ...position,
      date: new Date().toLocaleDateString()
    };
    setCurrentPalette(prev => [...prev, newNode]);
    initAudio(); 
  };

  const confirmArchive = (name) => {
    if (currentPalette.length === 0) return;
    const newPalette = {
      id: Date.now(),
      name: name,
      date: new Date().toLocaleDateString(),
      nodes: [...currentPalette]
    };
    setPalettes(prev => [newPalette, ...prev]);
    setCurrentPalette([]);
    setArchiveModalOpen(false);
  };

  const activeNodeData = useMemo(() => {
    return activeNodes.find(n => n.id === activeNodeId);
  }, [activeNodeId, activeNodes]);

  // Multi-person: deduplicated list of active nodes (one per person, same node shown once)
  const activeNodeDatas = useMemo(() => {
    if (!MULTI_PERSON) return null;
    const seen = new Set();
    return activeNodeIds
      .map(id => activeNodes.find(n => n.id === id))
      .filter(n => { if (!n || seen.has(n.id)) return false; seen.add(n.id); return true; });
  }, [activeNodeIds, activeNodes]);

  return (
    <div 
      className="w-full h-screen bg-neutral-900 text-neutral-200 overflow-hidden font-sans select-none relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={fadeOut}
      onClick={initAudio} 
    >
      <div ref={containerRef} className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="absolute inset-0 w-full h-full filter blur-[80px] opacity-90 transition-opacity duration-1000">
           {activeNodes.map((node) => {
             const isActive = node.id === activeNodeId;
             return (
               <div
                 key={node.id}
                 className="absolute rounded-full mix-blend-screen animate-pulse-slow"
                 style={{
                   backgroundColor: node.color,
                   left: `${node.x}%`,
                   top: `${node.y}%`,
                   width: '45vw',
                   height: '45vw',
                   transform: 'translate(-50%, -50%)',
                   opacity: isActive ? 0.9 : 0.6,
                   filter: isActive ? 'brightness(1.5)' : 'brightness(1)',
                   transition: 'opacity 2s ease-in-out, filter 2s ease-in-out',
                 }}
               />
             );
           })}
        </div>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}
        />
        {kinectEnabled && kinectPositions.map((pos, i) => (
          <div
            key={i}
            className="absolute pointer-events-none z-10"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-4 h-4 rounded-full border-2 border-emerald-400 opacity-80" />
            <div className="absolute inset-0 w-4 h-4 rounded-full bg-emerald-400 opacity-20 animate-ping" />
          </div>
        ))}
      </div>

      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
        <div>
          <h1 className="text-sm font-medium tracking-[0.2em] text-neutral-400 uppercase">EchoField Sonic Archive</h1>
          {viewedPalette ? (
             <div className="flex items-center space-x-2 mt-2">
                <span className="text-white text-xl font-light italic">{viewedPalette.name}</span>
                <span className="text-neutral-600 text-xs border border-neutral-700 px-2 py-0.5 rounded-full">Archived</span>
             </div>
          ) : (
             <p className="text-xs text-neutral-600 mt-1">Studio Session • Active</p>
          )}
        </div>
        
        {!viewedPalette && (
          <div className="flex flex-col items-end pointer-events-auto">
            {coverage >= 8 && (
               <button
                  onClick={() => setArchiveModalOpen(true)}
                  className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full text-xs transition-all backdrop-blur-md"
               >
                 <Archive size={14} />
                 <span>Complete & Archive</span>
               </button>
            )}
          </div>
        )}

        {viewedPalette && (
           <button 
             onClick={() => setViewedPalette(null)}
             className="pointer-events-auto flex items-center space-x-2 bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-500/20 text-emerald-100 px-4 py-2 rounded-full text-xs transition-all backdrop-blur-md"
           >
             <ArrowLeft size={14} />
             <span>Back to Studio</span>
           </button>
        )}
      </div>

      {/* Single-person description */}
      {!MULTI_PERSON && (
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-all duration-700 z-20 ${activeNodeData ? 'opacity-100 scale-100' : 'opacity-0 scale-95 blur-sm'}`}>
          {activeNodeData && (
            <div className="max-w-md mx-auto">
              <div className="inline-block mb-4 p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
                <Volume2 size={24} className="text-white/80 animate-pulse" />
              </div>
              <p className="text-2xl md:text-3xl font-light text-white leading-relaxed font-serif italic shadow-black drop-shadow-lg">
                "{activeNodeData.text}"
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2 text-white/40 text-xs tracking-widest uppercase">
                <span>{activeNodeData.fileName}</span>
                <span>•</span>
                <span>{activeNodeData.date}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-person descriptions — stacked vertically */}
      {MULTI_PERSON && (
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-all duration-700 z-20 w-full max-w-lg px-8 ${activeNodeDatas?.length > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 blur-sm'}`}>
          <div className="flex flex-col items-center space-y-8">
            {activeNodeDatas?.map(node => (
              <div key={node.id} className="max-w-md mx-auto">
                <p className="text-2xl md:text-3xl font-light text-white leading-relaxed font-serif italic shadow-black drop-shadow-lg">
                  "{node.text}"
                </p>
                <div className="mt-3 flex items-center justify-center space-x-2 text-white/40 text-xs tracking-widest uppercase">
                  <span>{node.fileName}</span>
                  <span>•</span>
                  <span>{node.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeNodes.length === 0 && !isModalOpen && !isLibraryOpen && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center text-neutral-600 max-w-sm">
             <Disc size={48} className="mx-auto mb-4 opacity-20" />
             <p className="font-light"> The archive is silent.</p>
             <p className="text-sm mt-2 opacity-60">Upload audio to begin filling the void with color.</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-8 right-8 z-30 pointer-events-auto flex flex-col items-end space-y-4">
        {showIntro && !isLibraryOpen && (
          <div className="bg-black/40 backdrop-blur-md border border-white/5 p-4 rounded-lg max-w-xs text-sm text-neutral-300 mb-2">
             <div className="flex justify-between items-start mb-2">
               <span className="font-medium text-white">How to explore</span>
               <button onClick={() => setShowIntro(false)}><X size={14}/></button>
             </div>
             <p className="leading-relaxed opacity-80">
               Move your cursor across the field to tune into memories like a radio. 
             </p>
          </div>
        )}

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setKinectEnabled(prev => !prev)}
            className={`w-12 h-12 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all outline-none ${
              kinectEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-black/20 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'
            }`}
            title={kinectEnabled ? 'Kinect active — click to disable' : 'Enable Kinect input'}
          >
            <Radio size={20} />
          </button>

          <button
            onClick={() => setLibraryOpen(true)}
            className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 flex items-center justify-center text-neutral-400 hover:bg-white/10 hover:text-white transition-all outline-none"
            title="Library"
          >
            <BookOpen size={20} />
          </button>

          {!viewedPalette && (
            <button
              onClick={() => setModalOpen(true)}
              className="w-14 h-14 rounded-full bg-white text-black shadow-lg shadow-white/10 flex items-center justify-center hover:scale-105 transition-transform outline-none"
              title="Add Entry"
            >
              <Plus size={24} />
            </button>
          )}
        </div>
      </div>

      <UploadModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onAdd={addNode} 
      />

      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        onConfirm={confirmArchive}
      />

      <LibraryDrawer 
        isOpen={isLibraryOpen}
        onClose={() => setLibraryOpen(false)}
        palettes={palettes}
        onLoadPalette={(p) => {
          setViewedPalette(p);
          setLibraryOpen(false);
        }}
      />

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default App;