import { Application, Container, Assets, Sprite } from "pixi.js";

(async () => {
  // ----------------------Create App-------------------------
  const app = new Application();
  globalThis.__PIXI_APP__ = app;

  await app.init({
    resizeTo: window,
    antialias: true,
    backgroundAlpha: 0, // keep transparent if you want CSS background behind
    // resolution: window.devicePixelRatio || 1,
  });
  app.canvas.style.position = "absolute";
  app.canvas.style.zIndex = "0";
  document.body.appendChild(app.canvas);
  // need base url to make sure everything works locally and in production
  const BASEURL = import.meta.env.BASE_URL;
  console.log(`Base Url: ${BASEURL}`);

  // ----------------------Create Freeze Button-------------------------
  const button = document.createElement("button");
  button.addEventListener("click", () => {
    app.ticker.stop();
  });
  button.textContent = "Freeze";
  // quick styles
  button.style.position = "absolute";
  button.style.padding = "10px 20px";
  button.style.backgroundColor = "#3498db";
  button.style.color = "white";
  button.style.border = "none";
  button.style.borderRadius = "5px";
  button.style.cursor = "pointer";
  button.style.zIndex = "1000"; // higher than the Pixi canvas
  document.body.appendChild(button);

  // ----------------------Create Main Background-------------------------
  const randomIndex = Math.floor(Math.random() * 6) + 1; // 1..7
  const gameBackgroundTexture = await Assets.load(
    `${BASEURL}images/natureBackground${randomIndex}.jpeg`,
  );
  const gameBackgroundSprite = Sprite.from(gameBackgroundTexture);
  // gameBackgroundSprite.alpha = 0.9;

  function cover() {
    const sw = app.screen.width; // in CSS pixels
    const sh = app.screen.height;
    const iw = gameBackgroundTexture.source.width;
    const ih = gameBackgroundTexture.source.height;

    let bg = gameBackgroundSprite;
    const scale = Math.max(sw / iw, sh / ih);
    bg.width = iw * scale;
    bg.height = ih * scale;

    // center
    bg.x = (sw - bg.width) * 0.5;
    bg.y = (sh - bg.height) * 0.5;
  }
  cover();
  window.addEventListener("resize", cover);

  app.stage.addChildAt(gameBackgroundSprite, 0);

  // ----------------------Create Main Board-------------------------
  const board = new Container();
  app.stage.addChild(board);
  const nextBoard = new Container();
  app.stage.addChild(nextBoard);

  const backgroundTexture = await Assets.load(BASEURL + "/images/Board.png");
  const backGroundSprite = Sprite.from(backgroundTexture);
  backGroundSprite.scale.set(0.5, 0.5);
  backGroundSprite.id = "background";
  board.addChild(backGroundSprite);

  board.pivot.set(board.width / 2, board.height / 2);
  board.position.set(app.screen.width / 2, app.screen.height / 2);

  // ----------------------Create Next Board------------------------
  const nextBoardTexture = await Assets.load(BASEURL + "/images/nextBoard.png");
  const nextBoardBackgroundSprite = Sprite.from(nextBoardTexture);
  nextBoardBackgroundSprite.scale.set(0.5, 0.5);
  nextBoard.addChild(nextBoardBackgroundSprite);
  nextBoard.pivot.set(0, nextBoard.height / 2);
  nextBoard.position.set(
    app.screen.width / 2 + board.width / 2,
    app.screen.height / 3.45,
  );
})();
