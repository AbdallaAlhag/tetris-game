import { Application, Container, Assets, Sprite } from "pixi.js";

// TODO:
// add single piece
//  - piece moving down (left or right) => done
//  - ability to rotate (up) => Done
//  - speed up button (down) => Done
//  - ability to jump down instantly => Done
//    - with shadow piece to showcase where it will land
//  - Add all pieces
//  - Create a system that works with the current piece => done
//  - drop pieces and create new pieces
//  - our 4 x 1 piece falls short of our left border by one piece

(async () => {
  const app = new Application();
  globalThis.__PIXI_APP__ = app;

  await app.init({
    resizeTo: window,
    backgroundColor: 0xd3d3d3,
    antialias: true,
    // resolution: window.devicePixelRatio || 1,
  });
  app.canvas.style.position = "absolute";
  document.body.appendChild(app.canvas);
  // need base url to make sure everything works locally and in production
  const BASEURL = import.meta.env.BASE_URL;
  console.log(`Base Url: ${BASEURL}`);

  // single block is 64 x 64 pixels,
  // board is 768 x 1408 pixels, which is 12 pieces width and 22 pieces height
  // but board is also 10 width and 20 high without border
  // let's make a container this time
  const board = new Container();
  app.stage.addChild(board);

  const backgroundTexture = await Assets.load(BASEURL + "/images/Board.png");
  const backGroundSprite = Sprite.from(backgroundTexture);
  backGroundSprite.scale.set(0.5, 0.5);
  board.addChild(backGroundSprite);

  board.pivot.set(board.width / 2, board.height / 2);
  board.position.set(app.screen.width / 2, app.screen.height / 2);

  // Top and Bottom x of the board
  const BOARDPIECEHEIGHT = board.height / 22;
  const BOARDPIECEWIDTH = board.width / 12;
  const BOTTOMX = board.height - BOARDPIECEHEIGHT * 3; // board.height - 2 board pieces
  const MIDDLEX = board.width / 2;
  const LEFTBORDER = board.width;
  let SPEED = 1;

  // test code for simple piece
  // const piece1Texture = await Assets.load(BASEURL + "/images/piece1.png");
  // const piece1Sprite = Sprite.from(piece1Texture);
  // piece1Sprite.scale.set(0.5);

  //  Load all the peices
  // let pieces = [iterable[Symbol.iterator: self.anchor[0], self.anchor[1];
  let pieces = [];
  let textures = [];
  for (let i = 0; i < 7; i++) {
    console.log(BASEURL + `images/piece${i}.png`);
    const pieceTexture = await Assets.load(BASEURL + `images/piece${i}.png`);
    textures.push(pieceTexture);
    const pieceSprite = Sprite.from(pieceTexture);
    pieceSprite.scale.set(0.5);
    pieceSprite.id = "piece" + i;
    pieceSprite.x = MIDDLEX;
    if ([1, 2, 4, 5, 6].includes(i)) {
      pieceSprite.anchor.set(2 / 3, 1 / 2); // blocks [3,2]
      pieces.push(pieceSprite);
    } else if (i == 0) {
      pieceSprite.anchor.set(1 / 2, 0); // block [4,1]
      pieces.push(pieceSprite);
    } else {
      pieceSprite.anchor.set(1 / 2, 1 / 2); // block [2,3]
      pieces.push(pieceSprite);
    }
  }

  // block represents x,y of our block
  // pieces[6].block = [3, 2]; // sizgaz block top left, bottom right
  // // anchor = (2/3, 1/2)
  // pieces[5].block = [3, 2]; // crown block
  // pieces[4].block = [3, 2]; // sigzag block top right, bottom left
  // pieces[3].block = [2, 2]; // square block
  // // anchor = (0.5, 0.5)
  // pieces[2].block = [3, 2]; // L block right side
  // pieces[1].block = [3, 2]; // L block left side
  // pieces[0].block = [4, 1]; // I block
  // //anchor = (0.5, 0)

  console.log(pieces);
  let currentSprite = pieces[0];
  console.log(currentSprite);

  // Add keyboard input
  const KEYS = {};
  window.addEventListener("keydown", (e) => {
    if (
      e.code == "ArrowRight" ||
      e.code == "ArrowLeft" ||
      e.code == "ArrowDown" ||
      e.code == "Space"
    )
      KEYS[e.code] = true;
  });
  window.addEventListener("keyup", (e) => {
    if (e.code == "ArrowUp") {
      KEYS[e.code] = true;
    } else {
      KEYS[e.code] = false;
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code == "ArrowDown") {
      SPEED = 1;
      KEYS["ArrowDown"] = false;
    }
  });

  function pieceControls() {
    if (KEYS["ArrowUp"]) {
      currentSprite.angle = currentSprite.angle + 90;
      KEYS["ArrowUp"] = false;
    }
    if (KEYS["ArrowLeft"]) {
      if (currentSprite.x > 3 * BOARDPIECEWIDTH) {
        // greater than the boarder piece,
        currentSprite.x -= BOARDPIECEWIDTH;
      }
      KEYS["ArrowLeft"] = false;
    }
    if (KEYS["ArrowRight"]) {
      console.log(LEFTBORDER - BOARDPIECEWIDTH, currentSprite.x);
      if (currentSprite.x < LEFTBORDER - BOARDPIECEWIDTH * 2) {
        // greater than the boarder piece,
        currentSprite.x += BOARDPIECEWIDTH;
      }
      KEYS["ArrowRight"] = false;
    }
    if (KEYS["ArrowDown"]) {
      SPEED = 10;
      KEYS["ArrowDown"] = false;
    }
    if (KEYS["Space"]) {
      currentSprite.y = BOTTOMX + BOARDPIECEHEIGHT;
    }
  }
  app.ticker.add(pieceControls);

  board.addChild(currentSprite);
  function dropPiece(piece) {
    let dropCounter = 0;
    const dropInterval = 60; // frames before piece moves down (~1s at 60fps)

    app.ticker.add((delta) => {
      dropCounter += delta.deltaTime * SPEED;
      if (dropCounter >= dropInterval && piece.position.y <= BOTTOMX) {
        piece.position.y += BOARDPIECEHEIGHT;
        dropCounter = 0; // reset counter
      }
    });
  }

  dropPiece(currentSprite);

  function cloneSprite(index = Math.floor(Math.random() * 7)) {
    let texture = textures[index];
    let template = pieces[index];
    const s = new Sprite(texture);

    s.anchor.set(template.anchor.x, template.anchor.y);
    s.scale.set(template.scale.x, template.scale.y);
    s.x = MIDDLEX;
    console.log(s);
    return s;
  }

  let bottomReached = false;
  function pieceLoop() {
    if (currentSprite.position.y == BOTTOMX && !bottomReached) {
      console.log("reachedbottom");
      app.ticker.remove(pieceControls);
      // currentSprite = cloneSprite(pieces[Math.floor(Math.random() * 7)]);
      currentSprite = cloneSprite();
      board.addChild(currentSprite);
      app.ticker.add(pieceControls);
      dropPiece(currentSprite);
      bottomReached = true;
    }
    if (currentSprite.y <= BOTTOMX) {
      bottomReached = false;
    }
  }

  app.ticker.add(pieceLoop);
})();
