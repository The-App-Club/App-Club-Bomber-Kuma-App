import { Utils } from './Utils';
import { Bomb } from './Bomb';

class Player {
  constructor(position, _gGameEngine, _gInputEngine) {
    this.gGameEngine = _gGameEngine;
    this.gInputEngine = _gInputEngine;

    this.id = 0;

    /**
     * Moving speed
     */
    this.velocity = 2;

    /**
     * Max number of bombs user can spawn
     */
    this.bombsMax = 1;

    /**
     * How far the fire reaches when bomb explodes
     */
    this.bombStrength = 1;

    /**
     * Entity position on map grid
     */
    this.position = {};

    /**
     * Bitmap dimensions
     */
    this.size = {
      w: 48,
      h: 48,
    };

    /**
     * Bitmap animation
     */
    this.bmp = null;

    this.alive = true;

    this.bombs = [];

    this.controls = {
      up: 'up',
      left: 'left',
      down: 'down',
      right: 'right',
      bomb: 'bomb',
    };

    /**
     * Bomb that player can escape from even when there is a collision
     */
    this.escapeBomb = null;

    this.deadTimer = 0;

    this.setUp = (position) => {
      let img = this.gGameEngine.playerBoyImg;
      if (this.id === 0) {
        img = this.gGameEngine.playerGirlImg;
      }
      let spriteSheet = new createjs.SpriteSheet({
        images: [img],
        frames: { width: this.size.w, height: this.size.h, regX: 10, regY: 12 },
        animations: {
          idle: [0, 0, 'idle'],
          down: [0, 3, 'down', 0.1],
          left: [4, 7, 'left', 0.1],
          up: [8, 11, 'up', 0.1],
          right: [12, 15, 'right', 0.1],
          dead: [16, 16, 'dead', 0.1],
        },
      });
      this.bmp = new createjs.Sprite(spriteSheet);

      this.position = position;
      let pixels = Utils.convertToBitmapPosition(position);
      this.bmp.x = pixels.x;
      this.bmp.y = pixels.y;

      this.gGameEngine.stage.addChild(this.bmp);

      this.bombs = [];
      this.setBombsListener();
    };

    this.setUp(position);
  }

  serialize() {
    // https://stackoverflow.com/questions/3710275/does-javascript-have-the-interface-type-such-as-javas-interface
    return 'Player';
  }

  setBombsListener() {
    // Subscribe to bombs spawning
    let that = this;
    this.gInputEngine.addListener(this.controls.bomb, () => {
      // Check whether there is already bomb on this position
      for (let i = 0; i < this.gGameEngine.bombs.length; i++) {
        let bomb = this.gGameEngine.bombs[i];
        if (Utils.comparePositions(bomb.position, that.position)) {
          return;
        }
      }
      // https://dev.to/gaurangdhorda/constructor-name-is-not-working-in-production-3ik4
      if (that.serialize() === 'Player') {
        let unexplodedBombs = 0;
        for (let i = 0; i < that.bombs.length; i++) {
          if (!that.bombs[i].exploded) {
            unexplodedBombs++;
          }
        }

        if (unexplodedBombs < that.bombsMax) {
          let bomb = new Bomb(that.position, that.bombStrength, this.gGameEngine);
          this.gGameEngine.stage.addChild(bomb.bmp);
          that.bombs.push(bomb);
          this.gGameEngine.bombs.push(bomb);

          bomb.setExplodeListener(function () {
            Utils.removeFromArray(that.bombs, bomb);
          });
        }
      }
    });
  }

  update() {
    if (!this.alive) {
      //this.fade();
      return;
    }
    if (this.gGameEngine.menu.visible) {
      return;
    }
    let position = { x: this.bmp.x, y: this.bmp.y };

    let dirX = 0;
    let dirY = 0;
    if (this.gInputEngine.actions[this.controls.up]) {
      this.animate('up');
      position.y -= this.velocity;
      dirY = -1;
    } else if (this.gInputEngine.actions[this.controls.down]) {
      this.animate('down');
      position.y += this.velocity;
      dirY = 1;
    } else if (this.gInputEngine.actions[this.controls.left]) {
      this.animate('left');
      position.x -= this.velocity;
      dirX = -1;
    } else if (this.gInputEngine.actions[this.controls.right]) {
      this.animate('right');
      position.x += this.velocity;
      dirX = 1;
    } else {
      this.animate('idle');
    }

    if (position.x != this.bmp.x || position.y != this.bmp.y) {
      if (!this.detectBombCollision(position)) {
        if (this.detectWallCollision(position)) {
          // If we are on the corner, move to the aisle
          let cornerFix = this.getCornerFix(dirX, dirY);
          if (cornerFix) {
            let fixX = 0;
            let fixY = 0;
            if (dirX) {
              fixY = cornerFix.y - this.bmp.y > 0 ? 1 : -1;
            } else {
              fixX = cornerFix.x - this.bmp.x > 0 ? 1 : -1;
            }
            this.bmp.x += fixX * this.velocity;
            this.bmp.y += fixY * this.velocity;
            this.updatePosition();
          }
        } else {
          this.bmp.x = position.x;
          this.bmp.y = position.y;
          this.updatePosition();
        }
      }
    }

    if (this.detectFireCollision()) {
      this.die();
    }

    this.handleBonusCollision();
  }

  /**
   * Checks whether we are on corner to target position.
   * Returns position where we should move before we can go to target.
   */
  getCornerFix(dirX, dirY) {
    let edgeSize = 30;

    // fix position to where we should go first
    let position = {};

    // possible fix position we are going to choose from
    let pos1 = { x: this.position.x + dirY, y: this.position.y + dirX };
    let bmp1 = Utils.convertToBitmapPosition(pos1);

    let pos2 = { x: this.position.x - dirY, y: this.position.y - dirX };
    let bmp2 = Utils.convertToBitmapPosition(pos2);

    // in front of current position
    if (
      this.gGameEngine.getTileMaterial({
        x: this.position.x + dirX,
        y: this.position.y + dirY,
      }) === 'grass'
    ) {
      position = this.position;
    }
    // right bottom
    // left top
    else if (this.gGameEngine.getTileMaterial(pos1) === 'grass' && Math.abs(this.bmp.y - bmp1.y) < edgeSize && Math.abs(this.bmp.x - bmp1.x) < edgeSize) {
      if (
        this.gGameEngine.getTileMaterial({
          x: pos1.x + dirX,
          y: pos1.y + dirY,
        }) === 'grass'
      ) {
        position = pos1;
      }
    }
    // right top
    // left bottom
    else if (this.gGameEngine.getTileMaterial(pos2) === 'grass' && Math.abs(this.bmp.y - bmp2.y) < edgeSize && Math.abs(this.bmp.x - bmp2.x) < edgeSize) {
      if (
        this.gGameEngine.getTileMaterial({
          x: pos2.x + dirX,
          y: pos2.y + dirY,
        }) === 'grass'
      ) {
        position = pos2;
      }
    }

    if (position.x && this.gGameEngine.getTileMaterial(position) === 'grass') {
      return Utils.convertToBitmapPosition(position);
    }
  }

  /**
   * Calculates and updates entity position according to its actual bitmap position
   */
  updatePosition() {
    this.position = Utils.convertToEntityPosition(this.bmp);
  }

  /**
   * Returns true when collision is detected and we should not move to target position.
   */
  detectWallCollision(position) {
    let player = {};
    player.left = position.x;
    player.top = position.y;
    player.right = player.left + this.size.w;
    player.bottom = player.top + this.size.h;

    // Check possible collision with all wall and wood tiles
    let tiles = this.gGameEngine.tiles;
    for (let i = 0; i < tiles.length; i++) {
      let tilePosition = tiles[i].position;

      let tile = {};
      tile.left = tilePosition.x * this.gGameEngine.tileSize + 25;
      tile.top = tilePosition.y * this.gGameEngine.tileSize + 20;
      tile.right = tile.left + this.gGameEngine.tileSize - 30;
      tile.bottom = tile.top + this.gGameEngine.tileSize - 30;

      if (this.gGameEngine.intersectRect(player, tile)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns true when the bomb collision is detected and we should not move to target position.
   */
  detectBombCollision(pixels) {
    let position = Utils.convertToEntityPosition(pixels);

    for (let i = 0; i < this.gGameEngine.bombs.length; i++) {
      let bomb = this.gGameEngine.bombs[i];
      // Compare bomb position
      if (bomb.position.x === position.x && bomb.position.y === position.y) {
        // Allow to escape from bomb that appeared on my field
        if (bomb === this.escapeBomb) {
          return false;
        } else {
          return true;
        }
      }
    }

    // I have escaped already
    if (this.escapeBomb) {
      this.escapeBomb = null;
    }

    return false;
  }

  detectFireCollision() {
    let bombs = this.gGameEngine.bombs;
    for (let i = 0; i < bombs.length; i++) {
      let bomb = bombs[i];
      for (let j = 0; j < bomb.fires.length; j++) {
        let fire = bomb.fires[j];
        let collision = bomb.exploded && fire.position.x === this.position.x && fire.position.y === this.position.y;
        if (collision) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Checks whether we have got bonus and applies it.
   */
  handleBonusCollision() {
    for (let i = 0; i < this.gGameEngine.bonuses.length; i++) {
      let bonus = this.gGameEngine.bonuses[i];
      if (Utils.comparePositions(bonus.position, this.position)) {
        this.applyBonus(bonus);
        bonus.destroy();
      }
    }
  }

  /**
   * Applies bonus.
   */
  applyBonus(bonus) {
    if (bonus.type === 'speed') {
      this.velocity += 0.8;
    } else if (bonus.type === 'bomb') {
      this.bombsMax++;
    } else if (bonus.type === 'fire') {
      this.bombStrength++;
    }
  }

  /**
   * Changes animation if requested animation is not already current.
   */
  animate(animation) {
    if (!this.bmp.currentAnimation || this.bmp.currentAnimation.indexOf(animation) === -1) {
      this.bmp.gotoAndPlay(animation);
    }
  }

  die() {
    this.alive = false;

    if (this.gGameEngine.countPlayersAlive() === 1 && this.gGameEngine.playersCount === 2) {
      this.gGameEngine.gameOver('win');
    } else if (this.gGameEngine.countPlayersAlive() === 0) {
      this.gGameEngine.gameOver('lose');
    }

    this.bmp.gotoAndPlay('dead');
    this.fade();
  }

  fade() {
    let timer = 0;
    let bmp = this.bmp;
    let fade = setInterval(function () {
      timer++;

      if (timer > 30) {
        bmp.alpha -= 0.05;
      }
      if (bmp.alpha <= 0) {
        clearInterval(fade);
      }
    }, 30);
  }
}

export { Player };
