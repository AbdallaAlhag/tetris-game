import { Application, Container, Assets, Sprite } from "pixi.js";

// TODO:
// add single piece
//  - piece moving down (left or right)
//  - ability to rotate (up)
//  - speed up button (down)
//  - ability to jump down instantly
//    - with shadow piece to showcase where it will land

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
  const TOPX = 0;
  const BOTTOMX = board.height - BOARDPIECEHEIGHT * 3; // board.height - 3 board pieces
  const MIDDLEX = board.width / 2;

  // test code for simple piece
  const piece1Texture = await Assets.load(BASEURL + "/images/I.png");
  const piece1Sprite = Sprite.from(piece1Texture);
  piece1Sprite.scale.set(0.5);

  // piece1Sprite.rotation = Math.PI / 4;
  piece1Sprite.anchor.set(0.5, 0);
  piece1Sprite.x = board.width / 2;
  board.addChild(piece1Sprite);

  let dropCounter = 0;
  const dropInterval = 30; // frames before piece moves down (~0.5s at 60fps)
  console.log(piece1Sprite);
  app.ticker.add((delta) => {
    dropCounter += delta.deltaTime;
    if (dropCounter >= dropInterval && piece1Sprite.position.y <= BOTTOMX) {
      piece1Sprite.position.y += BOARDPIECEHEIGHT;
      dropCounter = 0; // reset counter
      console.log(piece1Sprite.position.y);
    }
  });
})();
