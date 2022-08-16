import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import './index.css';

import { InputEngine } from './components/InputEngine';
import { GameEngine } from './components/GameEngine';

function App() {
  useEffect(() => {
    const gInputEngine = new InputEngine();
    const gGameEngine = new GameEngine(gInputEngine);

    window.gGameEngine = gGameEngine;
    window.gInputEngine = gInputEngine;

    gGameEngine.load();
  }, []);

  return (
    <div className="container">
      <div id="game">
        <canvas id="canvas" width="545" height="416"></canvas>
      </div>
    </div>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
