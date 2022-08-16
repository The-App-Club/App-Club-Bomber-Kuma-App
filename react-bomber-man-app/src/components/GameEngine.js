import { Menu } from './Menu';
import { Player } from './Player';
import { Tile } from './Tile';
import { Bonus } from './Bonus';
import { Bot } from './Bot';

class GameEngine {
  constructor(_gInputEngine) {
    this.gInputEngine = _gInputEngine;

    this.tileSize = 32;
    this.tilesX = 17;
    this.tilesY = 13;
    this.size = {};
    this.fps = 50;
    this.botsCount = 2 /* 0 - 3 */;
    this.playersCount = 2 /* 1 - 2 */;
    this.bonusesPercent = 16;

    this.stage = null;
    this.menu = null;
    this.players = [];
    this.bots = [];
    this.tiles = [];
    this.bombs = [];
    this.bonuses = [];

    this.playerBoyImg = null;
    this.playerGirlImg = null;
    this.playerGirl2Img = null;
    this.tilesImgs = {};
    this.bombImg = null;
    this.fireImg = null;
    this.bonusesImg = null;

    this.playing = false;
    this.mute = false;
    this.soundtrackLoaded = false;
    this.soundtrackPlaying = false;
    this.soundtrack = null;

    this.setUp = () => {
      this.size = {
        w: this.tileSize * this.tilesX,
        h: this.tileSize * this.tilesY,
      };
    };

    this.setUp();
  }
  load() {
    // Init canvas
    this.stage = new createjs.Stage('canvas');
    this.stage.enableMouseOver();

    // Load assets
    let queue = new createjs.LoadQueue();
    let that = this;
    queue.addEventListener('complete', function () {
      that.playerBoyImg = queue.getResult('playerBoy');
      that.playerGirlImg = queue.getResult('playerGirl');
      that.playerGirl2Img = queue.getResult('playerGirl2');
      that.tilesImgs.grass = queue.getResult('tile_grass');
      that.tilesImgs.wall = queue.getResult('tile_wall');
      that.tilesImgs.wood = queue.getResult('tile_wood');
      that.bombImg = queue.getResult('bomb');
      that.fireImg = queue.getResult('fire');
      that.bonusesImg = queue.getResult('bonuses');
      that.init();
    });
    queue.loadManifest([
      { id: 'playerBoy', src: 'img/george.png' },
      { id: 'playerGirl', src: 'img/betty.png' },
      { id: 'playerGirl2', src: 'img/betty2.png' },
      { id: 'tile_grass', src: 'img/tile_grass.png' },
      { id: 'tile_wall', src: 'img/tile_wall.png' },
      { id: 'tile_wood', src: 'img/tile_wood.png' },
      { id: 'bomb', src: 'img/bomb.png' },
      { id: 'fire', src: 'img/fire.png' },
      { id: 'bonuses', src: 'img/bonuses.png' },
    ]);

    // createjs.Sound.addEventListener('fileload', (event)=>{this.onSoundLoaded(event)});
    createjs.Sound.alternateExtensions = ['mp3'];
    createjs.Sound.registerSound('sound/bomb.ogg', 'bomb');
    createjs.Sound.registerSound('sound/game.ogg', 'game');

    // Create menu
    this.menu = new Menu(this);
  }

  init() {
    this.bombs = [];
    this.tiles = [];
    this.bonuses = [];

    // Draw tiles
    this.drawTiles();
    this.drawBonuses();

    this.spawnBots();
    this.spawnPlayers();

    // Toggle sound
    this.gInputEngine.addListener('mute', this.toggleSound);

    // Restart listener
    // Timeout because when you press enter in address bar too long, it would not show menu
    setTimeout(function () {
      this.gInputEngine.addListener('restart', function () {
        if (this.playersCount === 0) {
          this.menu.setMode('single');
        } else {
          this.menu.hide();
          this.restart();
        }
      });
    }, 200);

    // Escape listener
    this.gInputEngine.addListener('escape', function () {
      if (!this.menu.visible) {
        this.menu.show();
      }
    });

    // Start loop
    if (!createjs.Ticker.hasEventListener('tick')) {
      createjs.Ticker.addEventListener('tick', () => {
        this.update(this);
      });
      // https://createjs.com/docs/easeljs/classes/Ticker.html#method_setFPS
      createjs.Ticker.framerate = this.fps;
    }

    if (this.playersCount > 0) {
      if (this.soundtrackLoaded) {
        this.playSoundtrack();
      }
    }

    if (!this.playing) {
      this.menu.show();
    }
  }

  onSoundLoaded(sound) {
    if (sound.id === 'game') {
      this.soundtrackLoaded = true;
      if (this.playersCount > 0) {
        this.playSoundtrack();
      }
    }
  }

  playSoundtrack() {
    if (!this.soundtrackPlaying) {
      // The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.
      this.soundtrack = createjs.Sound.play('game', 'none', 0, 0, -1);
      this.soundtrack.setVolume(1);
      this.soundtrackPlaying = true;
    }
  }

  update() {
    // Player
    for (let i = 0; i < this.players.length; i++) {
      let player = this.players[i];
      player.update();
    }

    // Bots
    for (let i = 0; i < this.bots.length; i++) {
      let bot = this.bots[i];
      bot.update();
    }

    // Bombs
    for (let i = 0; i < this.bombs.length; i++) {
      let bomb = this.bombs[i];
      bomb.update();
    }

    // Menu
    this.menu.update();

    // Stage
    this.stage.update();
  }

  drawTiles() {
    for (let i = 0; i < this.tilesY; i++) {
      for (let j = 0; j < this.tilesX; j++) {
        if (i === 0 || j === 0 || i === this.tilesY - 1 || j === this.tilesX - 1 || (j % 2 === 0 && i % 2 === 0)) {
          // Wall tiles
          let tile = new Tile('wall', { x: j, y: i }, this);
          this.stage.addChild(tile.bmp);
          this.tiles.push(tile);
        } else {
          // Grass tiles
          let tile = new Tile('grass', { x: j, y: i }, this);
          this.stage.addChild(tile.bmp);

          // Wood tiles
          if (!(i <= 2 && j <= 2) && !(i >= this.tilesY - 3 && j >= this.tilesX - 3) && !(i <= 2 && j >= this.tilesX - 3) && !(i >= this.tilesY - 3 && j <= 2)) {
            let wood = new Tile('wood', { x: j, y: i }, this);
            this.stage.addChild(wood.bmp);
            this.tiles.push(wood);
          }
        }
      }
    }
  }

  drawBonuses() {
    // Cache woods tiles
    let woods = [];
    for (let i = 0; i < this.tiles.length; i++) {
      let tile = this.tiles[i];
      if (tile.material === 'wood') {
        woods.push(tile);
      }
    }

    // Sort tiles randomly
    woods.sort(function () {
      return 0.5 - Math.random();
    });

    // Distribute bonuses to quarters of map precisely fairly
    for (let j = 0; j < 4; j++) {
      let bonusesCount = Math.round((woods.length * this.bonusesPercent * 0.01) / 4);
      let placedCount = 0;
      for (let i = 0; i < woods.length; i++) {
        if (placedCount > bonusesCount) {
          break;
        }

        let tile = woods[i];
        if (
          (j === 0 && tile.position.x < this.tilesX / 2 && tile.position.y < this.tilesY / 2) ||
          (j === 1 && tile.position.x < this.tilesX / 2 && tile.position.y > this.tilesY / 2) ||
          (j === 2 && tile.position.x > this.tilesX / 2 && tile.position.y < this.tilesX / 2) ||
          (j === 3 && tile.position.x > this.tilesX / 2 && tile.position.y > this.tilesX / 2)
        ) {
          let typePosition = placedCount % 3;
          let bonus = new Bonus(tile.position, typePosition, this);
          this.bonuses.push(bonus);

          // Move wood to front
          this.moveToFront(tile.bmp);

          placedCount++;
        }
      }
    }
  }

  spawnBots() {
    this.bots = [];

    if (this.botsCount >= 1) {
      let bot2 = new Bot({ x: 1, y: this.tilesY - 2 }, this, this.gInputEngine);
      this.bots.push(bot2);
    }

    if (this.botsCount >= 2) {
      let bot3 = new Bot({ x: this.tilesX - 2, y: 1 }, this, this.gInputEngine);
      this.bots.push(bot3);
    }

    if (this.botsCount >= 3) {
      let bot = new Bot({ x: this.tilesX - 2, y: this.tilesY - 2 }, this, this.gInputEngine);
      this.bots.push(bot);
    }

    if (this.botsCount >= 4) {
      let bot = new Bot({ x: 1, y: 1 }, this, this.gInputEngine);
      this.bots.push(bot);
    }
  }

  spawnPlayers() {
    this.players = [];

    if (this.playersCount >= 1) {
      let player = new Player({ x: 1, y: 1 }, this, this.gInputEngine);
      this.players.push(player);
    }
  }

  /**
   * Checks whether two rectangles intersect.
   */
  intersectRect(a, b) {
    return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom;
  }

  /**
   * Returns tile at given position.
   */
  getTile(position) {
    for (let i = 0; i < this.tiles.length; i++) {
      let tile = this.tiles[i];
      if (tile.position.x === position.x && tile.position.y === position.y) {
        return tile;
      }
    }
  }

  /**
   * Returns tile material at given position.
   */
  getTileMaterial(position) {
    let tile = this.getTile(position);
    return tile ? tile.material : 'grass';
  }

  gameOver(status) {
    if (this.menu.visible) {
      return;
    }

    if (status === 'win') {
      let winText = 'You won!';
      if (this.playersCount > 1) {
        let winner = this.getWinner();
        winText = winner === 0 ? 'Player 1 won!' : 'Player 2 won!';
      }
      this.menu.show([
        { text: winText, color: '#669900' },
        { text: ' ;D', color: '#99CC00' },
      ]);
    } else {
      this.menu.show([
        { text: 'Game Over', color: '#CC0000' },
        { text: ' :(', color: '#FF4444' },
      ]);
    }
  }

  getWinner() {
    for (let i = 0; i < this.players.length; i++) {
      let player = this.players[i];
      if (player.alive) {
        return i;
      }
    }
  }

  restart() {
    this.gInputEngine.removeAllListeners();
    this.stage.removeAllChildren();
    this.init();
  }

  /**
   * Moves specified child to the front.
   */
  moveToFront(child) {
    // let children = this.stage.getNumChildren();
    let children = this.stage.children.length;
    this.stage.setChildIndex(child, children - 1);
  }

  toggleSound() {
    if (this.mute) {
      this.mute = false;
      this.soundtrack.resume();
    } else {
      this.mute = true;
      this.soundtrack.pause();
    }
  }

  countPlayersAlive() {
    let playersAlive = 0;
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].alive) {
        playersAlive++;
      }
    }
    return playersAlive;
  }

  getPlayersAndBots() {
    let players = [];

    for (let i = 0; i < this.players.length; i++) {
      players.push(this.players[i]);
    }

    for (let i = 0; i < this.bots.length; i++) {
      players.push(this.bots[i]);
    }

    return players;
  }
}

export { GameEngine };
