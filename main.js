import { Application, Container, Assets, Sprite } from "pixi.js";

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
  // board is 768 x 1408 pixels
  // let's make a container this time
  const container = new Container();
  app.stage.addChild(container);

  const backgroundTexture = await Assets.load("/images/Board.png");
  const backGroundSprite = Sprite.from(backgroundTexture);
  backGroundSprite.scale.set(0.5, 0.5);
  container.addChild(backGroundSprite);

  container.pivot.set(container.width / 2, container.height / 2);
  container.position.set(app.screen.width / 2, app.screen.height / 2);
})();
