/// <reference types="vite/client" />

// Declare missing type definitions for react-plotly.js
declare module 'react-plotly.js' {
  import { PlotParams } from 'react-plotly.js';
  const Plot: React.ComponentType<PlotParams>;
  export default Plot;
}
