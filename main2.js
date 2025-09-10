import {
  Application,
  Container,
  Assets,
  Sprite,
  Rectangle,
  Texture,
} from "pixi.js";

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
  gameBackgroundSprite.alpha = 0.9;

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
    app.screen.height / 3.25,
  );

  // ----------------------Initiliaze Board and Piece Arrays + Controls and Variables------------------------
  const M = 20;
  const N = 10;

  const field = Array.from({ length: M }, () => Array(N).fill(0));
  console.log(field);

  const a = Array.from({ length: 4 }, () => ({ x: 0, y: 0 }));
  const b = Array.from({ length: 4 }, () => ({ x: 0, y: 0 }));
  console.table(a);

  const figures = [
    [1, 3, 5, 7], // I
    [2, 4, 5, 7], // Z
    [3, 5, 4, 6], // S
    [3, 5, 4, 7], // T
    [2, 3, 5, 7], // L
    [3, 5, 7, 6], // J
    [2, 3, 4, 5], // O
  ];
  //
  // example figure =
  // [1][2]
  // [3][4]
  // [5][6]
  // [6][8]

  let ghostTexture = await Assets.load(BASEURL + "images/ghost.png");
  // let ghostSprite = Sprite.from(ghostTexture);
  // ghostSprite.scale.set(0.5);
  // ghostSprite.height = 32;
  // ghostSprite.width = 32;
  //
  let blockTexture = await Assets.load(BASEURL + "images/block.png");
  let blockSprite = Sprite.from(blockTexture);
  blockSprite.scale.set(0.5, 0.5);

  // Grab one block color for our block sprite  32 x 32, interesting how we have to grab 64 x 64 but height and width is true
  // to scale which is half so 32 x 32
  blockSprite.texture.frame = new Rectangle(0, 0, 64, 64);
  blockSprite.height = 32;
  blockSprite.width = 32;
  blockSprite.texture.updateUvs();

  // Interesting we need to offset blockSprite when initially adding it. Just for intial piece test.
  // board.addChild(blockSprite);
  // blockSprite.position.set(32, 32);

  // let n = Math.floor(Math.random() * 7);
  let queue = [];
  for (let i = 0; i < 5; i++) {
    queue.push(Math.floor(Math.random() * 7));
    // queue.push(0);
  }
  let n = queue.shift();
  if (a[0].x === 0) {
    for (let i = 0; i < 4; i++) {
      a[i].x = Math.floor(figures[n][i] % 2) + 4;

      a[i].y =
        n == 0
          ? Math.floor(figures[n][i] / 2)
          : Math.floor(figures[n][i] / 2) - 1;
    }
  }
  console.table(a);
  let dx = 0,
    rotate = false,
    // colorNum = 1,
    colorNum = n + 1,
    timer = 0,
    delay = 0.3,
    drop = false;

  window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowUp") rotate = true;
    else if (e.code === "Space") drop = true;
    else if (e.code === "ArrowLeft") dx = -1;
    else if (e.code === "ArrowRight") dx = 1;
  });
  let keys = {};
  window.addEventListener("keydown", (e) => {
    if (e.code == "ArrowDown") keys[e.code] = true;
  });
  window.addEventListener("keyup", (e) => {
    if (e.code == "ArrowDown") keys[e.code] = false;
  });

  function checkCollision() {
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(a[i].x);
      const y = Math.floor(a[i].y);
      if (x < 0 || x >= N || y >= M) return false;
      if (y >= 0 && field[y][x]) return false;
    }
    return true;
  }

  function reverseActionCheck() {
    if (!checkCollision()) {
      for (let i = 0; i < 4; i++) {
        a[i] = { x: b[i].x, y: b[i].y };
      }
    }
  }
  function updateNextBoard() {
    nextBoard.removeChildren();
    nextBoard.addChild(nextBoardBackgroundSprite);
    let gap = 10;
    queue.forEach((blockIndex) => {
      for (let i = 0; i < 4; i++) {
        const tempTexture = new Texture({
          source: blockSprite.texture.source,
          frame: new Rectangle(blockIndex * 64, 0, 64, 64),
        });
        let x = Math.floor(figures[blockIndex][i] % 2);
        let y = Math.floor(figures[blockIndex][i] / 2);

        const tempSprite = new Sprite(tempTexture);
        tempSprite.height = 32;
        tempSprite.width = 32;
        tempSprite.scale.set(0.25);
        tempSprite.position.set(
          (nextBoard.width - 32) / 2 + x * 18,
          gap + y * 18,
        );
        nextBoard.addChild(tempSprite);
      }

      gap += 90;
    });
  }

  function calculateDrop() {
    let drop = M;
    for (let i = 0; i < 4; i++) {
      let x = a[i].x;
      let y = a[i].y;

      let d = 0;
      while (y + d + 1 < M && field[y + d + 1][x] === 0) {
        d++;
      }
      drop = Math.min(drop, d);
    }
    return drop;
  }
  function placeGhost() {
    let drop = calculateDrop();

    for (let i = 0; i < 4; i++) {
      let ghostSprite = Sprite.from(ghostTexture);
      ghostSprite.scale.set(0.5);
      ghostSprite.height = 32;
      ghostSprite.width = 32;
      ghostSprite.alpha = 0.7;
      ghostSprite.position.set(a[i].x * 32 + 32, (drop + a[i].y) * 32 + 32);
      board.addChild(ghostSprite);
    }
  }

  placeGhost();
  updateNextBoard();

  // ----------------------Game Loop And Game Algo------------------------
  app.ticker.add((delta) => {
    const time = delta.deltaTime / 60;
    timer += time;
    if (keys["ArrowDown"]) {
      delay = 0.05;
    } else {
      delay = 0.3;
    }

    // -----------------Movement--------------------
    for (let i = 0; i < 4; i++) {
      b[i] = { x: a[i].x, y: a[i].y };
      a[i].x += dx;
    }

    reverseActionCheck();
    // -----------------Rotate--------------------
    if (rotate) {
      let p = { x: a[1].x, y: a[1].y };

      for (let i = 0; i < 4; i++) {
        let x = a[i].y - p.y;
        let y = a[i].x - p.x;
        a[i].x = p.x - x;
        a[i].y = p.y + y;
      }
      reverseActionCheck();
    }

    // -----------------Drop--------------------
    if (drop) {
      let d = calculateDrop();

      for (let i = 0; i < 4; i++) {
        b[i] = { x: a[i].x, y: a[i].y };
        a[i].y = d + a[i].y;
      }
      reverseActionCheck();
    }

    // -----------------Tick--------------------
    if (timer > delay) {
      for (let i = 0; i < 4; i++) {
        // b[i] = a[i]
        b[i] = { x: a[i].x, y: a[i].y };
        a[i].y += 1;
      }
      if (!checkCollision()) {
        for (let i = 0; i < 4; i++) {
          field[b[i].y][b[i].x] = colorNum;
        }
        // colorNum = 1 + Math.floor(Math.random() * 7);
        // let n = Math.floor(Math.random() * 7);
        let n = queue.shift();
        queue.push(Math.floor(Math.random() * 7));
        colorNum = n + 1;
        for (let i = 0; i < 4; i++) {
          a[i].x = (figures[n][i] % 2) + 4;
          a[i].y =
            n == 0
              ? Math.floor(figures[n][i] / 2)
              : Math.floor(figures[n][i] / 2) - 1;
        }
        updateNextBoard();
      }
      timer = 0;
    }

    // reset variables before we draw
    dx = 0;
    rotate = false;
    drop = false;
    delay = 0.3;

    // -----------------Check Lines--------------------
    let k = M - 1;
    for (let i = M - 1; i > 0; i--) {
      let count = 0;
      for (let j = 0; j < N; j++) {
        if (field[i][j]) count++;
        field[k][j] = field[i][j];
      }
      if (count < N) k--;
    }
    // -----------------Drawing--------------------
    board.removeChildren();
    board.addChild(backGroundSprite);

    // Place tetris
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < N; j++) {
        if (field[i][j] == 0) continue;
        //
        // s.texture.frame = new Rectangle(field[i][j] * 18, 0, 18, 18);
        // s.texture.updateUvs();
        // const tempSprite = new Sprite(s.texture);
        const tempTexture = new Texture({
          source: blockSprite.texture.source,
          frame: new Rectangle((field[i][j] - 1) * 64, 0, 64, 64),
        });
        const tempSprite = new Sprite(tempTexture);

        tempSprite.height = 18;
        tempSprite.width = 18;
        tempSprite.scale.set(0.5);
        tempSprite.position.set(j * 32 + 32, i * 32 + 32);
        board.addChild(tempSprite);
      }
    }
    // Draw our tetris piece
    for (let i = 0; i < 4; i++) {
      const tempTexture = new Texture({
        source: blockSprite.texture.source,
        frame: new Rectangle((colorNum - 1) * 64, 0, 64, 64),
      });
      const tempSprite = new Sprite(tempTexture);
      tempSprite.height = 32;
      tempSprite.width = 32;
      tempSprite.scale.set(0.5);
      tempSprite.position.set(a[i].x * 32 + 32, a[i].y * 32 + 32);
      board.addChild(tempSprite);
    }
    placeGhost();
  });
})();
