import { Utils } from './Utils';
import { Player } from './Player';
import { Bomb } from './Bomb';

class Bot extends Player {
  constructor(position, _gGameEngine, _gInputEngine) {
    // https://stackoverflow.com/questions/31067368/how-to-extend-a-class-without-having-to-use-super-in-es6
    super(position, _gGameEngine, _gInputEngine);

    this.gGameEngine = _gGameEngine;
    this.gInputEngine = _gInputEngine;

    /**
     * Current direction
     */
    this.direction = 'up';
    this.lastDirection = '';

    /**
     * Directions that are not allowed to go because of collision
     */
    this.excludeDirections = [];

    /**
     * Current X axis direction
     */
    this.dirX = 0;

    /**
     * Current Y axis direction
     */
    this.dirY = -1;

    /**
     * Target position on map we are heading to
     */
    this.previousPosition = {};
    this.targetPosition = {};
    this.targetBitmapPosition = {};

    this.bombsMax = 1;

    this.wait = false;

    this.startTimerMax = 60;
    this.startTimer = 0;
    this.started = false;

    this.setUp = (position) => {
      this.findTargetPosition();
      this.startTimerMax = Math.random() * 60;
    };

    this.setUp(position);
  }

  serialize() {
    // https://stackoverflow.com/questions/3710275/does-javascript-have-the-interface-type-such-as-javas-interface
    super.serialize();
    return 'Bot';
  }

  update() {
    if (!this.alive) {
      this.fade();
      return;
    }

    this.wait = false;

    if (!this.started && this.startTimer < this.startTimerMax) {
      this.startTimer++;
      if (this.startTimer >= this.startTimerMax) {
        this.started = true;
      }
      this.animate('idle');
      this.wait = true;
    }

    if (this.targetBitmapPosition.x === this.bmp.x && this.targetBitmapPosition.y === this.bmp.y) {
      // If we bumped into the wood, burn it!
      // If we are near player, kill it!
      if (this.getNearWood() || this.wantKillPlayer()) {
        this.plantBomb();
      }

      // When in safety, wait until explosion
      if (this.bombs.length) {
        if (this.isSafe(this.position)) {
          this.wait = true;
        }
      }

      if (!this.wait) {
        this.findTargetPosition();
      }
    }

    if (!this.wait) {
      this.moveToTargetPosition();
    }
    this.handleBonusCollision();

    if (this.detectFireCollision()) {
      // Bot has to die
      this.die();
    }
  }

  /**
   * Finds the next tile position where we should move.
   */
  findTargetPosition() {
    let target = { x: this.position.x, y: this.position.y };
    target.x += this.dirX;
    target.y += this.dirY;

    let targets = this.getPossibleTargets();
    // Do not go the same way if possible
    if (targets.length > 1) {
      let previousPosition = this.getPreviousPosition();
      for (let i = 0; i < targets.length; i++) {
        let item = targets[i];
        if (item.x === previousPosition.x && item.y === previousPosition.y) {
          targets.splice(i, 1);
        }
      }
    }
    this.targetPosition = this.getRandomTarget(targets);
    if (this.targetPosition && this.targetPosition.x) {
      this.loadTargetPosition(this.targetPosition);
      this.targetBitmapPosition = Utils.convertToBitmapPosition(this.targetPosition);
    }
  }

  /**
   * Moves a step forward to target position.
   */
  moveToTargetPosition() {
    this.animate(this.direction);

    let velocity = this.velocity;
    let distanceX = Math.abs(this.targetBitmapPosition.x - this.bmp.x);
    let distanceY = Math.abs(this.targetBitmapPosition.y - this.bmp.y);
    if (distanceX > 0 && distanceX < this.velocity) {
      velocity = distanceX;
    } else if (distanceY > 0 && distanceY < this.velocity) {
      velocity = distanceY;
    }

    let targetPosition = {
      x: this.bmp.x + this.dirX * velocity,
      y: this.bmp.y + this.dirY * velocity,
    };
    if (!this.detectWallCollision(targetPosition)) {
      this.bmp.x = targetPosition.x;
      this.bmp.y = targetPosition.y;
    }

    this.updatePosition();
  }

  /**
   * Returns near grass tiles.
   */
  getPossibleTargets() {
    let targets = [];
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

      let position = { x: this.position.x + dirX, y: this.position.y + dirY };
      if (this.gGameEngine.getTileMaterial(position) === 'grass' && !this.hasBomb(position)) {
        targets.push(position);
      }
    }

    let safeTargets = [];
    for (let i = 0; i < targets.length; i++) {
      let target = targets[i];
      if (this.isSafe(target)) {
        safeTargets.push(target);
      }
    }

    let isLucky = Math.random() > 0.3;
    return safeTargets.length > 0 && isLucky ? safeTargets : targets;
  }

  /**
   * Loads vectors and animation name for target position.
   */
  loadTargetPosition(position) {
    this.dirX = position.x - this.position.x;
    this.dirY = position.y - this.position.y;
    if (this.dirX === 1 && this.dirY === 0) {
      this.direction = 'right';
    } else if (this.dirX === -1 && this.dirY === 0) {
      this.direction = 'left';
    } else if (this.dirX === 0 && this.dirY === 1) {
      this.direction = 'down';
    } else if (this.dirX === 0 && this.dirY === -1) {
      this.direction = 'up';
    }
  }

  /**
   * Gets previous position by current position and direction vector.
   */
  getPreviousPosition() {
    let previous = { x: this.targetPosition.x, y: this.targetPosition.y };
    previous.x -= this.dirX;
    previous.y -= this.dirY;
    return previous;
  }

  /**
   * Returns random item from array.
   */
  getRandomTarget(targets) {
    return targets[Math.floor(Math.random() * targets.length)];
  }

  applyBonus(bonus) {
    // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/super
    super.applyBonus(bonus); // Parent.method

    // It is too dangerous to have more bombs available
    this.bombsMax = 1;
  }

  /**
   * Game is over when no bots and one player left.
   */
  die() {
    super.die(); // Parent.method
    let botsAlive = false;

    // Cache bots
    let bots = [];
    for (let i = 0; i < this.gGameEngine.bots.length; i++) {
      bots.push(this.gGameEngine.bots[i]);
    }

    for (let i = 0; i < bots.length; i++) {
      let bot = bots[i];
      // Remove bot
      if (bot === this) {
        this.gGameEngine.bots.splice(i, 1);
      }
      if (bot.alive) {
        botsAlive = true;
      }
    }

    if (!botsAlive && this.gGameEngine.countPlayersAlive() === 1) {
      this.gGameEngine.gameOver('win');
    }
  }

  /**
   * Checks whether there is any wood around.
   */
  getNearWood() {
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

      let position = { x: this.position.x + dirX, y: this.position.y + dirY };
      if (this.gGameEngine.getTileMaterial(position) === 'wood') {
        return this.gGameEngine.getTile(position);
      }
    }
  }

  /**
   * Checks whether player is near. If yes and we are angry, return true.
   */
  wantKillPlayer() {
    let isNear = false;

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

      let position = { x: this.position.x + dirX, y: this.position.y + dirY };
      for (let j = 0; j < this.gGameEngine.players.length; j++) {
        let player = this.gGameEngine.players[j];
        if (player.alive && Utils.comparePositions(player.position, position)) {
          isNear = true;
          break;
        }
      }
    }

    let isAngry = Math.random() > 0.5;
    if (isNear && isAngry) {
      return true;
    }
  }

  /**
   * Places the bomb in current position
   */
  plantBomb() {
    for (let i = 0; i < this.gGameEngine.bombs.length; i++) {
      let bomb = this.gGameEngine.bombs[i];
      if (Utils.comparePositions(bomb.position, this.position)) {
        return;
      }
    }

    if (this.bombs.length < this.bombsMax) {
      let bomb = new Bomb(this.position, this.bombStrength, window.gGameEngine);
      this.gGameEngine.stage.addChild(bomb.bmp);
      this.bombs.push(bomb);
      this.gGameEngine.bombs.push(bomb);

      let that = this;
      bomb.setExplodeListener(function () {
        Utils.removeFromArray(that.bombs, bomb);
        that.wait = false;
      });
    }
  }

  /**
   * Checks whether position is safe  and possible explosion cannot kill us.
   */
  isSafe(position) {
    for (let i = 0; i < this.gGameEngine.bombs.length; i++) {
      let bomb = this.gGameEngine.bombs[i];
      let fires = bomb.getDangerPositions();
      for (let j = 0; j < fires.length; j++) {
        let fire = fires[j];
        if (Utils.comparePositions(fire, position)) {
          return false;
        }
      }
    }
    return true;
  }

  hasBomb(position) {
    for (let i = 0; i < this.gGameEngine.bombs.length; i++) {
      let bomb = this.gGameEngine.bombs[i];
      if (Utils.comparePositions(bomb.position, position)) {
        return true;
      }
    }
    return false;
  }
}

export { Bot };
