import { Application, Sprite, Assets, Rectangle, Texture } from "pixi.js";

const M = 20;
const N = 10;

// fill 2d array with 0 20 arrays of size 10
const field = Array.from({ length: M }, () => Array(N).fill(0));
console.log(field);

// I piece: 1,3,5,7
// Map with (x = n % 2, y = Math.floor(n / 2)):
// 1 → (1,0)
// 3 → (1,1)
// 5 → (1,2)
// 7 → (1,3)
// That gives a straight vertical line of 4 blocks.
//
//
// Create arrays of 4 points each containing objects
const a = Array.from({ length: 4 }, () => ({ x: 0, y: 0 }));
const b = Array.from({ length: 4 }, () => ({ x: 0, y: 0 }));
console.table(a);
// example: a[{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0}]

// // Example: access and modify
// a[0].x = 10;
// a[0].y = 20;
// // class version
// class Point {
//   constructor(x = 0, y = 0) {
//     this.x = x;
//     this.y = y;
//   }
// }
//
// const a = Array.from({ length: 4 }, () => new Point());
// const b = Array.from({ length: 4 }, () => new Point());

const figures = [
  [1, 3, 5, 7], // I
  [2, 4, 5, 7], // Z
  [3, 5, 4, 6], // S
  [3, 5, 4, 7], // T
  [2, 3, 5, 7], // L
  [3, 5, 7, 6], // J
  [2, 3, 4, 5], // O
];

(async () => {
  const app = new Application();
  globalThis.__PIXI_APP__ = app;
  await app.init({
    resizeTo: window,
    antialias: true,
    backgroundAlpha: 0,
    backgroundColor: 0x000000, // this is like window.clear(Color::Black)
  });
  app.canvas.style.position = "absolute";
  app.canvas.style.zIndex = "0";
  document.body.appendChild(app.canvas);
  const BASEURL = import.meta.env.BASE_URL;
  console.log(`Base Url: ${BASEURL}`);

  let t1, t2, t3;
  t1 = await Assets.load(BASEURL + "/images/cppRewrite/tiles.png");
  t2 = await Assets.load(BASEURL + "/images/cppRewrite/background.png");
  t3 = await Assets.load(BASEURL + "/images/cppRewrite/frame.png");

  let s, background, frame;
  s = Sprite.from(t1);
  background = Sprite.from(t2);
  frame = Sprite.from(t3);

  // Grab one block texture;
  s.texture.frame = new Rectangle(0, 0, 18, 18);
  s.height = 18;
  s.width = 18;
  s.texture.updateUvs();

  // create an array to store the 4 blocks of the piece
  // this way we don't have to have the block creation be part of our game loop
  // const blocks = Array.from({ length: 4 }, () => {
  //   const sprite = new Sprite(s.texture);
  //   sprite.width = 18;
  //   sprite.height = 18;
  //   app.stage.addChild(sprite);
  //   return sprite;
  // });

  let dx = 0,
    rotate = 0,
    colorNum = 1,
    timer = 0,
    delay = 0.3;

  window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowUp") rotate = true;
    else if (e.code === "ArrowLeft") dx = -1;
    else if (e.code === "ArrowRight") dx = 1;
  });

  let keys = {};

  // track when keys are pressed/released
  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
  });

  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });
  function check() {
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(a[i].x);
      const y = Math.floor(a[i].y);
      // console.log("Y: ", y, "X: ", x);
      if (x < 0 || x >= N || y >= M) return false;
      if (y >= 0 && field[y][x]) return false;
    }
    return true;
  }

  let n = Math.floor(Math.random() * 7);

  if (a[0].x === 0) {
    for (let i = 0; i < 4; i++) {
      a[i].x = Math.floor(figures[n][i] % 2);
      a[i].y = Math.floor(figures[n][i] / 2);
    }
  }

  // our while loop
  app.ticker.add((delta) => {
    // delta is a frame multiplier (1 ~ 1/60th second)
    const time = delta.deltaTime / 60; // convert to seconds
    timer += time;
    if (keys["ArrowDown"]) {
      delay = 0.05;
    } else {
      delay = 0.3; // normal fall speed
    }
    // ----------Movement----------
    for (let i = 0; i < 4; i++) {
      // b[i] = a[i];
      b[i] = { x: a[i].x, y: a[i].y };
      a[i].x += dx;
    }
    // if our check fails return to previous position saved in b.
    if (!check()) {
      for (let i = 0; i < 4; i++) {
        // a[i] = b[i];
        a[i] = { x: b[i].x, y: b[i].y };
      }
    }

    // ----------Rotate----------
    if (rotate) {
      let p = { x: a[1].x, y: a[1].y };
      for (let i = 0; i < 4; i++) {
        let x = a[i].y - p.y;
        let y = a[i].x - p.x;
        a[i].x = p.x - x;
        a[i].y = p.y + y;
      }
      if (!check()) {
        for (let i = 0; i < 4; i++) {
          // a[i] = b[i];
          a[i] = { x: b[i].x, y: b[i].y };
        }
      }
    }

    // ----------Tick----------
    if (timer > delay) {
      for (let i = 0; i < 4; i++) {
        // b[i] = a[i]
        b[i] = { x: a[i].x, y: a[i].y };
        a[i].y += 1;
      }
      if (!check()) {
        for (let i = 0; i < 4; i++) {
          field[b[i].y][b[i].x] = colorNum;
        }
        colorNum = 1 + Math.floor(Math.random() * 7);
        let n = Math.floor(Math.random() * 7);
        for (let i = 0; i < 4; i++) {
          a[i].x = figures[n][i] % 2;
          a[i].y = Math.floor(figures[n][i] / 2);
        }
      }
      timer = 0;
    }
    // Grab coordinates for our tetris piece, don't need this anymore
    // let n = 3;
    // if (a[0].x === 0) {
    //   for (let i = 0; i < 4; i++) {
    //     a[i].x = Math.floor(figures[n][i] % 2);
    //     a[i].y = Math.floor(figures[n][i] / 2);
    //   }
    // }
    //
    dx = 0;
    rotate = 0;
    delay = 0.3;

    // ----------Check Lines----------
    let k = M - 1;
    for (let i = M - 1; i > 0; i--) {
      let count = 0;
      for (let j = 0; j < N; j++) {
        if (field[i][j]) count++;
        field[k][j] = field[i][j];
      }
      if (count < N) k--;
    }

    // ----------Draw----------
    app.stage.removeChildren();
    app.stage.addChild(background);

    // Place tetris
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < N; j++) {
        if (field[i][j] == 0) continue;
        //
        // s.texture.frame = new Rectangle(field[i][j] * 18, 0, 18, 18);
        // s.texture.updateUvs();
        // const newSprite = new Sprite(s.texture);
        const tex = new Texture({
          source: s.texture.source,
          frame: new Rectangle(field[i][j] * 18, 0, 18, 18),
        });
        const newSprite = new Sprite(tex);

        newSprite.height = 18;
        newSprite.width = 18;
        newSprite.position.set(j * 18 + 28, i * 18 + 31); // 28, 31 is baord offset
        app.stage.addChild(newSprite);
        // console.table(field);
      }
    }

    // set positions and draw our tetris piece
    for (let i = 0; i < 4; i++) {
      const tex = new Texture({
        source: s.texture.source,
        frame: new Rectangle(colorNum * 18, 0, 18, 18),
      });
      const newSprite = new Sprite(tex);

      newSprite.height = 18;
      newSprite.width = 18;
      newSprite.position.set(a[i].x * 18 + 28, a[i].y * 18 + 31);
      app.stage.addChild(newSprite);
    }

    app.stage.addChild(frame);
    // Other way using blocks
    // update position
    // for (let i = 0; i < 4; i++) {
    //   blocks[i].position.set(a[i].x * 18, a[i].y * 18);
    // }
  });
})();
