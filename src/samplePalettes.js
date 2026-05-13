// Pre-loaded sample palettes for testing.
// Audio files are served from public/audio/.

const samplePalettes = [
  {
    id: 'sample-1',
    name: 'Field Test',
    date: 'Sample',
    nodes: [
      {
        id: 'sample-1-1',
        text: 'Ducks calling across a still pond at dusk',
        color: '#4caf50',
        audioUrl: '/audio/ducks.m4a',
        fileName: 'ducks.m4a',
        x: 20,
        y: 22,
        date: 'Sample',
      },
      {
        id: 'sample-1-2',
        text: 'A summer thunderstorm rolling in from the west',
        color: '#1565c0',
        audioUrl: '/audio/rain-and-thunder.m4a',
        fileName: 'rain-and-thunder.m4a',
        x: 55,
        y: 78,
        date: 'Sample',
      },
      {
        id: 'sample-1-3',
        text: 'The sticky sweetness of a hot afternoon',
        color: '#e91e63',
        audioUrl: '/audio/watermelon.m4a',
        fileName: 'watermelon.m4a',
        x: 82,
        y: 28,
        date: 'Sample',
      },
    ],
  },
];

export default samplePalettes;
