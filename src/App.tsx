import { CSSProperties } from 'react';
import { Tile, VirtualCanvas } from './VirtualCanvas';
import logo from './logo.svg';

export interface WindowSize {
  height: number;
  width: number;
}

const numTilesX = 1;
const numTilesY = 50;
const tileSizeX = 290;
const tileSizeY = 490;

const tiles: Tile[]  = [];

const imagestyle: CSSProperties = {
  height: '40vmin',
  background: '#1d2027'
}

for (let y = 0; y < numTilesY; y++) {
  const top = y * tileSizeY;

  tiles.push({
    top: top,
    left: tileSizeX,
    key: `(${tileSizeX},${top})`,
    content: <div>
      <h4>{ y + 1 }</h4>
      <img src={ logo } style={ imagestyle } className="App-logo" alt="logo" />
    </div>
  });
}

function App() {
  return (
    <VirtualCanvas contentWidth={numTilesX*tileSizeX} contentHeight={numTilesY*tileSizeY} tiles={tiles} />
  );
}

export default App;
