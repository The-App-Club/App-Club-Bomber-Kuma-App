class Menu {
  constructor(_gGameEngine) {
    this.visible = true;

    this.views = [];

    this.setUp = (_gGameEngine) => {
      this.gGameEngine = _gGameEngine;
      this.gGameEngine.botsCount = 4;
      // this.gGameEngine.playersCount = 0;
      this.showLoader();
    };

    this.setUp(_gGameEngine);
  }

  show(text) {
    this.visible = true;

    this.draw(text);
  }

  hide() {
    this.visible = false;

    for (let i = 0; i < this.views.length; i++) {
      this.gGameEngine.stage.removeChild(this.views[i]);
    }

    this.views = [];
  }

  update() {
    if (this.visible) {
      for (let i = 0; i < this.views.length; i++) {
        this.gGameEngine.moveToFront(this.views[i]);
      }
    }
  }

  setHandCursor(btn) {
    btn.addEventListener('mouseover', function () {
      document.body.style.cursor = 'pointer';
    });
    btn.addEventListener('mouseout', function () {
      document.body.style.cursor = 'auto';
    });
  }

  setMode(mode) {
    this.hide();

    if (mode === 'single') {
      this.gGameEngine.botsCount = 3;
      this.gGameEngine.playersCount = 1;
    } else {
      this.gGameEngine.botsCount = 2;
      this.gGameEngine.playersCount = 2;
    }

    this.gGameEngine.playing = true;
    this.gGameEngine.restart();
  }

  draw(text) {
    let that = this;

    // semi-transparent black background
    let bgGraphics = new createjs.Graphics().beginFill('rgba(0, 0, 0, 0.5)').drawRect(0, 0, this.gGameEngine.size.w, this.gGameEngine.size.h);
    let bg = new createjs.Shape(bgGraphics);
    this.gGameEngine.stage.addChild(bg);
    this.views.push(bg);

    // game title
    text = text || [
      { text: 'Bomber', color: '#ffffff' },
      { text: 'girl', color: '#ff4444' },
    ];

    let title1 = new createjs.Text(text[0].text, 'bold 35px Helvetica', text[0].color);
    let title2 = new createjs.Text(text[1].text, 'bold 35px Helvetica', text[1].color);

    let titleWidth = title1.getMeasuredWidth() + title2.getMeasuredWidth();

    title1.x = this.gGameEngine.size.w / 2 - titleWidth / 2;
    title1.y = this.gGameEngine.size.h / 2 - title1.getMeasuredHeight() / 2 - 80;
    this.gGameEngine.stage.addChild(title1);
    this.views.push(title1);

    title2.x = title1.x + title1.getMeasuredWidth();
    title2.y = this.gGameEngine.size.h / 2 - title1.getMeasuredHeight() / 2 - 80;
    this.gGameEngine.stage.addChild(title2);
    this.views.push(title2);

    // modes buttons
    let modeSize = 110;
    let modesDistance = 20;
    let modesY = title1.y + title1.getMeasuredHeight() + 40;

    // singleplayer button
    let singleX = this.gGameEngine.size.w / 2 - modeSize - modesDistance;
    let singleBgGraphics = new createjs.Graphics().beginFill('rgba(0, 0, 0, 0.5)').drawRect(singleX, modesY, modeSize, modeSize);
    let singleBg = new createjs.Shape(singleBgGraphics);
    this.gGameEngine.stage.addChild(singleBg);
    this.views.push(singleBg);
    this.setHandCursor(singleBg);
    singleBg.addEventListener('click', function () {
      that.setMode('single');
    });

    let singleTitle1 = new createjs.Text('single', '16px Helvetica', '#ff4444');
    let singleTitle2 = new createjs.Text('player', '16px Helvetica', '#ffffff');
    let singleTitleWidth = singleTitle1.getMeasuredWidth() + singleTitle2.getMeasuredWidth();
    let modeTitlesY = modesY + modeSize - singleTitle1.getMeasuredHeight() - 20;

    singleTitle1.x = singleX + (modeSize - singleTitleWidth) / 2;
    singleTitle1.y = modeTitlesY;
    this.gGameEngine.stage.addChild(singleTitle1);
    this.views.push(singleTitle1);

    singleTitle2.x = singleTitle1.x + singleTitle1.getMeasuredWidth();
    singleTitle2.y = modeTitlesY;
    this.gGameEngine.stage.addChild(singleTitle2);
    this.views.push(singleTitle2);

    let iconsY = modesY + 13;
    let singleIcon = new createjs.Bitmap('img/betty.png');
    singleIcon.sourceRect = new createjs.Rectangle(0, 0, 48, 48);
    singleIcon.x = singleX + (modeSize - 48) / 2;
    singleIcon.y = iconsY;
    this.gGameEngine.stage.addChild(singleIcon);
    this.views.push(singleIcon);

    // multiplayer button
    let multiX = this.gGameEngine.size.w / 2 + modesDistance;
    let multiBgGraphics = new createjs.Graphics().beginFill('rgba(0, 0, 0, 0.5)').drawRect(multiX, modesY, modeSize, modeSize);
    let multiBg = new createjs.Shape(multiBgGraphics);
    this.gGameEngine.stage.addChild(multiBg);
    this.views.push(multiBg);
    this.setHandCursor(multiBg);
    multiBg.addEventListener('click', function () {
      that.setMode('multi');
    });

    let multiTitle1 = new createjs.Text('multi', '16px Helvetica', '#99cc00');
    let multiTitle2 = new createjs.Text('player', '16px Helvetica', '#ffffff');
    let multiTitleWidth = multiTitle1.getMeasuredWidth() + multiTitle2.getMeasuredWidth();

    multiTitle1.x = multiX + (modeSize - multiTitleWidth) / 2;
    multiTitle1.y = modeTitlesY;
    this.gGameEngine.stage.addChild(multiTitle1);
    this.views.push(multiTitle1);

    multiTitle2.x = multiTitle1.x + multiTitle1.getMeasuredWidth();
    multiTitle2.y = modeTitlesY;
    this.gGameEngine.stage.addChild(multiTitle2);
    this.views.push(multiTitle2);

    let multiIconGirl = new createjs.Bitmap('img/betty.png');
    multiIconGirl.sourceRect = new createjs.Rectangle(0, 0, 48, 48);
    multiIconGirl.x = multiX + (modeSize - 48) / 2 - 48 / 2 + 8;
    multiIconGirl.y = iconsY;
    this.gGameEngine.stage.addChild(multiIconGirl);
    this.views.push(multiIconGirl);

    let multiIconBoy = new createjs.Bitmap('img/betty2.png');
    multiIconBoy.sourceRect = new createjs.Rectangle(0, 0, 48, 48);
    multiIconBoy.x = multiX + (modeSize - 48) / 2 + 48 / 2 - 8;
    multiIconBoy.y = iconsY;
    this.gGameEngine.stage.addChild(multiIconBoy);
    this.views.push(multiIconBoy);
  }

  showLoader() {
    let bgGraphics = new createjs.Graphics().beginFill('#000000').drawRect(0, 0, this.gGameEngine.size.w, this.gGameEngine.size.h);
    let bg = new createjs.Shape(bgGraphics);
    this.gGameEngine.stage.addChild(bg);

    let loadingText = new createjs.Text('Loading...', '20px Helvetica', '#FFFFFF');
    loadingText.x = this.gGameEngine.size.w / 2 - loadingText.getMeasuredWidth() / 2;
    loadingText.y = this.gGameEngine.size.h / 2 - loadingText.getMeasuredHeight() / 2;
    this.gGameEngine.stage.addChild(loadingText);
    this.gGameEngine.stage.update();
  }
}

export { Menu };
