import { Utils } from './Utils';
import { Fire } from './Fire';

class Bomb {
  constructor(position, strength, _gGameEngine) {
    this.gGameEngine = _gGameEngine;

    /**
     * Entity position on map grid
     */
    this.position = {};

    /**
     * How far the fire reaches when bomb explodes
     */
    this.strength = 1;

    /**
     * Bitmap dimensions
     */
    this.size = {
      w: 28,
      h: 28,
    };

    /**
     * Bitmap animation
     */
    this.bmp = null;

    /**
     * Timer in frames
     */
    this.timer = 0;

    /**
     * Max timer value in seconds
     */
    this.timerMax = 2;

    this.exploded = false;

    this.fires = [];

    this.explodeListener = null;

    this.setUp = (position, strength) => {
      this.strength = strength;

      let spriteSheet = new createjs.SpriteSheet({
        images: [this.gGameEngine.bombImg],
        frames: {
          width: this.size.w,
          height: this.size.h,
          regX: 5,
          regY: 5,
        },
        animations: {
          idle: [0, 4, 'idle', 0.2],
        },
      });
      this.bmp = new createjs.Sprite(spriteSheet);
      this.bmp.gotoAndPlay('idle');

      this.position = position;

      let pixels = Utils.convertToBitmapPosition(position);
      this.bmp.x = pixels.x + this.size.w / 4;
      this.bmp.y = pixels.y + this.size.h / 4;

      this.fires = [];

      // Allow players and bots that are already on this position to escape
      let players = this.gGameEngine.getPlayersAndBots();
      for (let i = 0; i < players.length; i++) {
        let player = players[i];
        if (Utils.comparePositions(player.position, this.position)) {
          player.escapeBomb = this;
        }
      }
    };
    this.setUp(position, strength);
  }

  update() {
    if (this.exploded) {
      return;
    }

    this.timer++;
    if (this.timer > this.timerMax * createjs.Ticker.getMeasuredFPS()) {
      this.explode();
    }
  }

  explode() {
    this.exploded = true;

    if (!this.gGameEngine.mute && this.gGameEngine.soundtrackPlaying) {
      let bombSound = createjs.Sound.play('bomb');
      bombSound.setVolume(0.2);
    }

    // Fire in all directions!
    let positions = this.getDangerPositions();
    for (let i = 0; i < positions.length; i++) {
      let position = positions[i];
      this.fire(position);

      let material = this.gGameEngine.getTileMaterial(position);
      if (material === 'wood') {
        let tile = this.gGameEngine.getTile(position);
        tile.remove();
      } else if (material === 'grass') {
        // Explode bombs in fire
        for (let j = 0; j < this.gGameEngine.bombs.length; j++) {
          let bomb = this.gGameEngine.bombs[j];
          if (!bomb.exploded && Utils.comparePositions(bomb.position, position)) {
            bomb.explode();
          }
        }
      }
    }

    this.remove();
  }

  /**
   * Returns positions that are going to be covered by fire.
   */
  getDangerPositions() {
    let positions = [];
    positions.push(this.position);

    for (let i = 0; i < 4; i++) {
      let dirX;
      let dirY;
      if (i === 0) {
        dirX = 1;
        dirY = 0;
      } else if (i === 1) {
        dirX = -1;
        dirY = 0;
      } else if (i === 2) {
        dirX = 0;
        dirY = 1;
      } else if (i === 3) {
        dirX = 0;
        dirY = -1;
      }

      for (let j = 1; j <= this.strength; j++) {
        let explode = true;
        let last = false;

        let position = {
          x: this.position.x + j * dirX,
          y: this.position.y + j * dirY,
        };

        let material = this.gGameEngine.getTileMaterial(position);
        if (material === 'wall') {
          // One can not simply burn the wall
          explode = false;
          last = true;
        } else if (material === 'wood') {
          explode = true;
          last = true;
        }

        if (explode) {
          positions.push(position);
        }

        if (last) {
          break;
        }
      }
    }

    return positions;
  }

  fire(position) {
    let fire = new Fire(position, this, window.gGameEngine);
    this.fires.push(fire);
  }

  remove() {
    this.gGameEngine.stage.removeChild(this.bmp);
  }

  setExplodeListener(listener) {
    this.explodeListener = listener;
  }
}

export { Bomb };
