import { Utils } from './Utils';

class Fire {
  constructor(position, bomb, _gGameEngine) {
    this.gGameEngine = _gGameEngine;

    /**
     * Entity position on map grid
     */
    this.position = {};

    /**
     * Bitmap dimensions
     */
    this.size = {
      w: 38,
      h: 38,
    };

    /**
     * Bitmap animation
     */
    this.bmp = null;

    /**
     * The bomb that triggered this fire
     */
    this.bomb = null;

    this.setUp = (position, bomb) => {
      this.bomb = bomb;
      let spriteSheet = new createjs.SpriteSheet({
        images: [this.gGameEngine.fireImg],
        frames: { width: this.size.w, height: this.size.h, regX: 0, regY: 0 },
        animations: {
          idle: [0, 5, null, 0.4],
        },
      });
      this.bmp = new createjs.Sprite(spriteSheet);
      this.bmp.gotoAndPlay('idle');
      let that = this;
      this.bmp.addEventListener('animationend', function () {
        that.remove();
      });

      this.position = position;

      let pixels = Utils.convertToBitmapPosition(position);
      this.bmp.x = pixels.x + 2;
      this.bmp.y = pixels.y - 5;

      this.gGameEngine.stage.addChild(this.bmp);
    };

    this.setUp(position, bomb);
  }

  update() {}

  remove() {
    if (this.bomb.explodeListener) {
      this.bomb.explodeListener();
      this.bomb.explodeListener = null;
    }

    this.gGameEngine.stage.removeChild(this.bmp);

    for (let i = 0; i < this.bomb.fires.length; i++) {
      let fire = this.bomb.fires[i];
      if (this === fire) {
        this.bomb.fires.splice(i, 1);
      }
    }

    for (let i = 0; i < this.gGameEngine.bombs.length; i++) {
      let bomb = this.gGameEngine.bombs[i];
      if (this.bomb === bomb) {
        this.gGameEngine.bombs.splice(i, 1);
      }
    }
  }
}

export { Fire };
