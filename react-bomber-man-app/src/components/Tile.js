import { Utils } from './Utils';

class Tile {
  constructor(material, position, _gGameEngine) {
    this.gGameEngine = _gGameEngine;

    /**
     * Entity position on map grid
     */
    this.position = {};

    /**
     * Bitmap dimensions
     */
    this.size = {
      w: 32,
      h: 32,
    };

    /**
     * Bitmap animation
     */
    this.bmp = null;

    this.material = '';

    this.setUp = (material, position) => {
      this.material = material;
      this.position = position;
      let img;
      if (material === 'grass') {
        img = this.gGameEngine.tilesImgs.grass;
      } else if (material === 'wall') {
        img = this.gGameEngine.tilesImgs.wall;
      } else if (material === 'wood') {
        img = this.gGameEngine.tilesImgs.wood;
      }
      this.bmp = new createjs.Bitmap(img);
      let pixels = Utils.convertToBitmapPosition(position);
      this.bmp.x = pixels.x;
      this.bmp.y = pixels.y;
    };

    this.setUp(material, position);
  }

  update() {}

  remove() {
    this.gGameEngine.stage.removeChild(this.bmp);
    for (let i = 0; i < this.gGameEngine.tiles.length; i++) {
      let tile = this.gGameEngine.tiles[i];
      if (this === tile) {
        this.gGameEngine.tiles.splice(i, 1);
      }
    }
  }
}

export { Tile };
