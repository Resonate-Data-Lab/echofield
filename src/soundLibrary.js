// Manifest of available sounds in public/audio/.
// Add new sounds by dropping files into public/audio/ and adding an entry here.
// displayName is what participants see in the sound picker.

const SOUND_LIBRARY = [
  { fileName: 'airplane-water.WAV',                       displayName: 'Airplane Water' },
  { fileName: 'at-graze.m4a',                             displayName: 'At Graze' },
  { fileName: 'balloon-stampede.m4a',                     displayName: 'Balloon Stampede' },
  { fileName: 'blackboard-writing.wav',                   displayName: 'Blackboard Writing' },
  { fileName: 'electric-kettle-boiling.m4a',              displayName: 'Electric Kettle Boiling' },
  { fileName: 'faucet-brushing-teeth.m4a',                displayName: 'Faucet / Brushing Teeth' },
  { fileName: 'hair-dryer.m4a',                           displayName: 'Hair Dryer' },
  { fileName: 'hiccup.wav',                               displayName: 'Hiccup' },
  { fileName: 'it-takes-12-secs-to-breathe.m4a',         displayName: 'It Takes 12 Seconds to Breathe' },
  { fileName: 'lakum-duckum.m4a',                         displayName: 'Lakum Duckum' },
  { fileName: 'lakum-dukum-2.m4a',                        displayName: 'Lakum Dukum 2' },
  { fileName: 'leaf-blower.WAV',                          displayName: 'Leaf Blower' },
  { fileName: 'mill-creek-water.wav',                     displayName: 'Mill Creek Water' },
  { fileName: 'mill-creek-wind.m4a',                      displayName: 'Mill Creek Wind' },
  { fileName: 'olin-leak.wav',                            displayName: 'Olin Leak' },
  { fileName: 'pencil-sharpener.m4a',                     displayName: 'Pencil Sharpener' },
  { fileName: 'plane-overhead_mixdown.wav',               displayName: 'Plane Overhead' },
  { fileName: 'plane-to-whitman.m4a',                     displayName: 'Plane to Whitman' },
  { fileName: 'putting-a-phone-underwater-by-maxey.m4a',  displayName: 'Phone Underwater (by Maxey)' },
  { fileName: 'quacking-wings-flapping.WAV',              displayName: 'Quacking / Wings Flapping' },
  { fileName: 'squeaky-swing.m4a',                        displayName: 'Squeaky Swing' },
  { fileName: 'wait-wait-wait.m4a',                       displayName: 'Wait Wait Wait' },
  { fileName: 'walking-across-campus.m4a',                displayName: 'Walking Across Campus' },
  { fileName: 'wallula-gap-tree-bell.m4a',                displayName: 'Wallula Gap Tree Bell' },
  { fileName: 'waterfall.WAV',                            displayName: 'Waterfall' },
  { fileName: 'watermelon.m4a',                           displayName: 'Watermelon' },
  { fileName: 'whitman-undergraduate-conference-jazz.m4a',displayName: 'Whitman Conference Jazz' },
  { fileName: 'yellow-lights-are-flashing.m4a',           displayName: 'Yellow Lights Are Flashing' },
].map(s => ({ ...s, audioUrl: `/audio/${s.fileName}` }));

export default SOUND_LIBRARY;
