import { Utils } from './Utils';

class Bonus {
  constructor(position, typePosition, _gGameEngine) {
    this.types = ['speed', 'bomb', 'fire'];

    this.type = '';
    this.position = {};
    this.bmp = null;

    this.gGameEngine = _gGameEngine;

    this.setUp = (position, typePosition) => {
      this.type = this.types[typePosition];

      this.position = position;

      this.bmp = new createjs.Bitmap(this.gGameEngine.bonusesImg);
      let pixels = Utils.convertToBitmapPosition(position);
      this.bmp.x = pixels.x;
      this.bmp.y = pixels.y;
      this.bmp.sourceRect = new createjs.Rectangle(typePosition * 32, 0, 32, 32);
      this.gGameEngine.stage.addChild(this.bmp);
    };

    this.setUp(position, typePosition);
  }

  destroy() {
    this.gGameEngine.stage.removeChild(this.bmp);
    Utils.removeFromArray(this.gGameEngine.bonuses, this);
  }
}

export { Bonus };
