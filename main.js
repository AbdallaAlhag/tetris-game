import { Application, Container, Assets, Sprite } from "pixi.js";

// TODO:
//  - piece moving down (left or right) => done
//  - ability to rotate (up) => Done
//  - speed up button (down) => Done
//  - ability to jump down instantly => Done
//    - with shadow piece to showcase where it will land => Done
//  - Add all pieces => done
//  - Create a system that works with the current piece => done
//  - drop pieces and create new pieces => done
//  - add collision to blocks => done
//  - add collision based on shape with grid map => Done
//  Current:
//  - work on line clearing;
//  - point stystem or levels
//  - Next 4 piece indicator
//  - BONUS:
//    - reverse button
//    - bomb piece

//  - BUGS:
//    - WORK ON WALL COLLISION AND PIECE COLLISION WITH ROTATION IN MIND! => Done
//      - little weird as it kicks two pieces some times but no out of bounds pieces
//    - space drop bugged, doesn't continue the loop => Done
//    - Work on bottom border due to rotation.
//      - 4 x 1 don't work with bottom border and left side, fix but bottom border works for the rest! => Done
//    - last roatation does not work correctly. => Done
//    - fix boardmap not updating properly, sometimes off by one index. => Done
//    - fix off one by index for rotation 3 and 4. off by one x for position 3 and off by one y for position 4. => Done
//    - fix ghost piece wall collision and rotation.
//    - drop prediction should show the lowest we can drop from top to bottom and stop before piece collision not bottom to top which
//    - game doesn't break or end when pieces stack at the top.

(async () => {
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

  // freeze button temp button
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
  // single block is 64 x 64 pixels,
  // board is 768 x 1408 pixels, which is 12 pieces width and 22 pieces height
  // but board is also 10 width and 20 high without border
  // let's make a container this time
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

  // next container info.
  const nextBoardTexture = await Assets.load(BASEURL + "/images/nextBoard.png");
  const nextBoardBackgroundSprite = Sprite.from(nextBoardTexture);
  nextBoardBackgroundSprite.scale.set(0.5, 0.5);
  nextBoard.addChild(nextBoardBackgroundSprite);
  nextBoard.pivot.set(0, nextBoard.height / 2);
  nextBoard.position.set(
    app.screen.width / 2 + board.width / 2,
    app.screen.height / 3.45,
  );

  // Top and Bottom x of the board
  const BOARDPIECEHEIGHT = board.height / 22;
  const BOARDPIECEWIDTH = board.width / 12;
  const BOTTOM = board.height - BOARDPIECEHEIGHT; // board.height - 2 board pieces
  const MIDDLEX = board.width / 2;
  const RIGHTBORDER = board.width;
  let SPEED = 1;

  //  Load all the peices
  // let pieces = [iterable[Symbol.iterator: self.anchor[0], self.anchor[1];
  let pieces = [];
  let ghostPieces = [];
  let textures = [];
  let ghostTextures = [];
  let currentRotation = 1;
  for (let i = 0; i < 7; i++) {
    // console.log(BASEURL + `images/piece${i}.png`);
    const pieceTexture = await Assets.load(BASEURL + `images/piece${i}.png`);
    const ghostTexture = await Assets.load(BASEURL + `images/ghost${i}.png`);
    textures.push(pieceTexture);
    ghostTextures.push(ghostTexture);
    const pieceSprite = Sprite.from(pieceTexture);
    const ghostSprite = Sprite.from(ghostTexture);
    pieceSprite.scale.set(0.5);
    ghostSprite.scale.set(0.5);
    pieceSprite.x = MIDDLEX;
    ghostSprite.x = MIDDLEX;

    // modify the ghost to show up better.
    ghostSprite.alpha = 0.75;
    ghostSprite.id = "ghost";

    if ([1, 2, 4, 5, 6].includes(i)) {
      pieceSprite.anchor.set(2 / 3, 1 / 2); // blocks [3,2]
      pieces.push(pieceSprite);
      ghostSprite.anchor.set(2 / 3, 1 / 2);
      ghostPieces.push(ghostSprite);
    } else if (i == 0) {
      pieceSprite.anchor.set(1 / 2, 0); // block [4,1]
      pieces.push(pieceSprite);
      ghostSprite.anchor.set(1 / 2, 0);
      ghostPieces.push(ghostSprite);
    } else {
      pieceSprite.anchor.set(1 / 2, 1 / 2); // block [2,3]
      pieces.push(pieceSprite);
      ghostSprite.anchor.set(1 / 2, 1 / 2);
      ghostPieces.push(ghostSprite);
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

  // const I = [
  //   [0, 0, 0, 0],
  //   [1, 1, 1, 1],
  //   [0, 0, 0, 0],
  //   [0, 0, 0, 0],
  // ];
  const I = [
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const O = [
    [1, 1, 0, 0],
    [1, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const T = [
    [0, 1, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const L = [
    [0, 0, 1, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const J = [
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const S = [
    [0, 1, 1, 0],
    [1, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const Z = [
    [1, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  let pieceGrids = [I, J, L, O, S, T, Z];
  let originalPieceGrids = structuredClone(pieceGrids);
  let boardMap = [];
  // create board that represents our board with borders set up as -1
  for (let i = 0; i < 22; i++) {
    boardMap[i] = Array(12);
    for (let j = 0; j < 12; j++) {
      if (i == 0 || i == 21 || j == 0 || j == 11) {
        boardMap[i][j] = -1;
      } else {
        boardMap[i][j] = 0;
      }
    }
  }
  console.log(boardMap);

  let pieceQueue = [
    Math.floor(Math.random() * 7),
    Math.floor(Math.random() * 7),
    Math.floor(Math.random() * 7),
    Math.floor(Math.random() * 7),
  ];
  let currentIndex = Math.floor(Math.random() * 7);
  let currentSprite = pieces[currentIndex];
  let currentGhost = ghostPieces[currentIndex];
  let shifted = false;

  // add initial pieces to our nextBoard and then we probably should make a function that updates it and call it when we change pieces.
  function updateNextBoard() {
    nextBoard.removeChildren(1, 4);
    for (let i = 0; i < 4; i++) {
      const pieceTexture = textures[pieceQueue[i]];
      const pieceSprite = Sprite.from(pieceTexture);
      pieceSprite.scale.set(0.5);
      pieceSprite.x = MIDDLEX / 2.5;
      pieceSprite.position.y =
        (nextBoard.height / 4) * i + 0.05 * nextBoard.height;
      nextBoard.addChild(pieceSprite);
    }
  }
  updateNextBoard();
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

  // guess we take in an operator that is + for right border and - for left border
  function calculateBorder(operator) {
    //we want to find the left most border
    const ops = {
      "+": (a, b) => a + b,
      "-": (a, b) => a - b,
    };
    const op = ops[operator];
    let x = currentSprite.x;
    let anchorX = currentSprite.anchor.x;
    let anchorY = currentSprite.anchor.y;
    let w = currentSprite.width;

    let border;

    if (currentIndex == 0) {
      switch (currentRotation) {
        case 1:
        case 3:
          border = op(x, anchorX * w);
          break;
        case 2:
          border = operator == "+" ? x : x - anchorX * 2 * currentSprite.height;
          break;
        case 4:
          border = operator == "-" ? x : x + anchorX * 2 * currentSprite.height;
          break;
      }
      return border;
    }
    switch (currentRotation) {
      case 1:
        if (operator == "-") {
          border = op(x, anchorX * w);
        } else {
          border = op(x, (1 - anchorX) * w);
        }
        break;
      case 2:
        border = op(x, anchorY * w);
        break;
      case 3:
        if (operator == "-") {
          border = op(x, (1 - anchorX) * w);
        } else {
          border = op(x, anchorX * w);
        }
        break;
      case 4:
        border = op(x, (1 - anchorY) * w);
        break;
    }
    return border;
  }

  // in case we rotate on the border and a piece falls out of bounds due to rotation.
  function checkRotationValid() {
    let valid =
      calculateBorder("-") > BOARDPIECEWIDTH &&
      calculateBorder("+") < RIGHTBORDER - BOARDPIECEWIDTH;

    const kicks = [
      { x: BOARDPIECEWIDTH, y: 0 },
      { x: -BOARDPIECEWIDTH, y: 0 },
      { x: 2 * BOARDPIECEWIDTH, y: 0 },
      { x: -2 * BOARDPIECEWIDTH, y: 0 },
      { x: 0, y: -BOARDPIECEHEIGHT },
    ];
    if (valid) {
      return;
    }
    for (let kick of kicks) {
      currentSprite.position.x += kick.x;
      currentSprite.position.y += kick.y;
      currentGhost.position.x += kick.x;
      currentGhost.position.y += kick.y;

      let kickedValid =
        calculateBorder("-") > BOARDPIECEWIDTH &&
        calculateBorder("+") < RIGHTBORDER - BOARDPIECEWIDTH;
      if (kickedValid) {
        break;
      }

      currentSprite.position.x -= kick.x;
      currentSprite.position.y -= kick.y;
      currentGhost.position.x -= kick.x;
      currentGhost.position.y -= kick.y;
    }
  }
  let drop = BOTTOM - BOARDPIECEHEIGHT;
  currentGhost.y = drop;
  function pieceControls() {
    if (KEYS["ArrowUp"]) {
      currentSprite.angle = currentSprite.angle + 90;
      currentGhost.angle = currentGhost.angle + 90;
      checkRotationValid();
      currentRotation++;
      currentRotation = ((currentRotation - 1) % 4) + 1;
      KEYS["ArrowUp"] = false;
      shifted = true;
    }
    if (KEYS["ArrowLeft"]) {
      let spriteLeft = calculateBorder("-");
      if (spriteLeft > BOARDPIECEWIDTH) {
        // greater than the boarder piece,
        currentSprite.x -= BOARDPIECEWIDTH;
        currentGhost.x -= BOARDPIECEWIDTH;
      }
      KEYS["ArrowLeft"] = false;
    }
    if (KEYS["ArrowRight"]) {
      let spriteRight = calculateBorder("+");
      if (spriteRight < RIGHTBORDER - BOARDPIECEWIDTH) {
        // greater than the boarder piece,
        currentSprite.x += BOARDPIECEWIDTH;
        currentGhost.x += BOARDPIECEWIDTH;
      }
      KEYS["ArrowRight"] = false;
    }
    if (KEYS["ArrowDown"]) {
      SPEED = 10;
      KEYS["ArrowDown"] = false;
    }
    if (KEYS["Space"]) {
      currentSprite.y = drop;
      KEYS["Space"] = false;
    }
  }
  app.ticker.add(pieceControls);

  board.addChild(currentSprite);
  board.addChild(currentGhost);

  let bottomReached = false;

  function dropPiece() {
    let dropCounter = 0;
    const dropInterval = 60; // frames before piece moves down (~1s at 60fps)

    const dropFunction = (delta) => {
      dropCounter += delta.deltaTime * SPEED;

      if (bottomReached) {
        dropCounter = 0;
        app.ticker.remove(dropFunction());
        return;
      }
      if (dropCounter >= dropInterval && currentSprite.position.y <= BOTTOM) {
        currentSprite.position.y += BOARDPIECEHEIGHT;
        dropCounter = 0; // reset counter
      }
    };

    app.ticker.add(dropFunction);
  }

  dropPiece();

  function cloneSprite(index) {
    let texture = textures[index];
    let template = pieces[index];
    const s = new Sprite(texture);

    s.anchor.set(template.anchor.x, template.anchor.y);
    s.scale.set(template.scale.x, template.scale.y);
    s.x = MIDDLEX;
    return s;
  }
  function cloneGhost(index) {
    let texture = ghostTextures[index];
    let template = ghostPieces[index];
    const s = new Sprite(texture);

    s.anchor.set(template.anchor.x, template.anchor.y);
    s.scale.set(template.scale.x, template.scale.y);
    s.x = MIDDLEX;
    s.alpha = 0.75;
    return s;
  }

  // grab the blockMatrix from our pieceGrids array;
  // we can use the boardGrid and currentSprite to get x and y position.

  // we can check collision for bottom or for border
  function gridCollision(blockMatrix) {
    let currentBlockMatrix = blockMatrix;

    // grab the position from the board and convert it to fit our boardMap array,
    // most likely position / 12 or 22 rounded up i asssume
    // I think our position is expected to be upper left to correctly work. might have to do some
    // math to represents our anchor correclty but upper left is probably best so we should
    // relocate upper ancho temporarily

    // posX and posY should be upper left corner of our block
    // fuck, we got to account for rotation. this is so fucking annoying
    // okay when we rotate, our width and height switch so we just got to account for that.
    let posX;
    let posY;
    if (currentRotation % 2 != 0) {
      // case 1 and 3
      if (currentRotation == 3) {
        posX = Math.ceil(
          (currentSprite.position.x -
            (1 - currentSprite.anchor.x) * currentSprite.width) /
            BOARDPIECEWIDTH,
        );
      } else if (currentRotation == 1) {
        posX = Math.ceil(
          (currentSprite.position.x -
            currentSprite.anchor.x * currentSprite.width) /
            BOARDPIECEWIDTH,
        );
      }
      posY = Math.floor(
        (currentSprite.position.y -
          currentSprite.anchor.y * currentSprite.height) /
          BOARDPIECEHEIGHT,
      );
    } else {
      posX = Math.ceil(
        (currentSprite.position.x -
          currentSprite.anchor.x * currentSprite.height) /
          BOARDPIECEWIDTH,
      );
      if (currentRotation == 2) {
        posY = Math.floor(
          (currentSprite.position.y -
            currentSprite.anchor.y * currentSprite.width) /
            BOARDPIECEHEIGHT,
        );
      } else if (currentRotation == 4) {
        posY = Math.ceil(
          (currentSprite.position.y -
            (1 - currentSprite.anchor.y) * currentSprite.width) /
            BOARDPIECEHEIGHT,
        );
      }
    }

    // 4 x 1 needs its own calc
    if (currentIndex == 0) {
      if (currentRotation % 2 == 0) {
        posX =
          currentRotation == 2
            ? Math.round(
                (currentSprite.position.x - BOARDPIECEWIDTH) / BOARDPIECEWIDTH,
              )
            : Math.round(
                (currentSprite.position.x - BOARDPIECEWIDTH) / BOARDPIECEWIDTH,
              );
      }
      if (currentRotation % 2 == 0) {
        // rotation 2 or 4
        posY = Math.floor(
          (currentSprite.position.y - 2 * BOARDPIECEHEIGHT) / BOARDPIECEHEIGHT,
        );
      } else {
        // rotation 1 or 3
        posY =
          currentRotation == 1
            ? Math.floor(currentSprite.position.y / BOARDPIECEHEIGHT)
            : Math.floor(
                (currentSprite.position.y - BOARDPIECEHEIGHT) /
                  BOARDPIECEHEIGHT,
              );
      }
    }
    // 1 is no rotation and 3 is flipped upside down
    // bottom position is different based on which way we rotate. also anchor is not exactly even on all
    // most are 2/3 anchors
    let bottomPosY;
    if (currentIndex != 0) {
      // I don't need to use anchor to calculate the height since we have the posY (which is the top left), we can just add the height to it
      // console.log(posY, currentSprite.width / BOARDPIECEHEIGHT);
      let distanceFromBottom =
        currentRotation % 2 != 1 ? currentSprite.width : currentSprite.height;
      bottomPosY = Math.floor(posY + distanceFromBottom / BOARDPIECEHEIGHT);
      // if (currentRotation % 2 != 0) {
      //   bottomPosY =
      //     Math.round(
      //       currentSprite.position.y +
      //         currentSprite.anchor.y * currentSprite.height,
      //     ) / BOARDPIECEWIDTH;
      // } else if (currentRotation == 2) {
      //   bottomPosY = Math.round(
      //     (currentSprite.position.y +
      //       currentSprite.anchor.x * currentSprite.height) /
      //       BOARDPIECEHEIGHT,
      //   );
      // } else {
      //   bottomPosY = Math.round(
      //     (currentSprite.position.y +
      //       currentSprite.anchor.y * currentSprite.height) /
      //       BOARDPIECEHEIGHT,
      //   );
      // }
    } else {
      if (currentRotation % 2 == 0) {
        bottomPosY = Math.floor(
          (currentSprite.position.y + 2 * BOARDPIECEHEIGHT) / BOARDPIECEHEIGHT,
        );
      } else if (currentRotation == 1) {
        bottomPosY = Math.floor(
          (currentSprite.position.y + BOARDPIECEHEIGHT) / BOARDPIECEHEIGHT,
        );
      } else {
        bottomPosY = Math.floor(currentSprite.position.y / BOARDPIECEHEIGHT);
      }
    }
    // our current block based on its current rotation, 1 = no rotation
    if (shifted) {
      // for (let i = 0; i < currentRotation - 1; i++) {
      currentBlockMatrix = rotateClockWise(blockMatrix);
      pieceGrids[currentIndex] = currentBlockMatrix;
      // console.log(currentBlockMatrix);
      // }
      shifted = false;
      // console.log("shifted properly");
      // console.table(currentBlockMatrix);
    }
    function addPieceToBoard() {
      // console.table(currentBlockMatrix);
      for (let row = 0; row < currentBlockMatrix.length; row++) {
        for (let col = 0; col < currentBlockMatrix[row].length; col++) {
          // check if our blockMatrix position is filled
          if (currentBlockMatrix[row][col]) {
            const boardX = posX + col;
            const boardY = posY + row; // our piece stops when it reaches a filled piece so we want to set it to that piece - 1
            // ahhh we gotta switch it up since it's row, col intead of col, row which would be x,y
            // but we do y,x in our array.
            if (boardY <= 21 && boardX <= 11) {
              boardMap[boardY][boardX] = 1;
              // console.log(
              //   "boardY, boardX: ",
              //   boardY,
              //   boardX,
              //   "posY, posX: ",
              //   posY,
              //   posX,
              //   "bottom pos y; ",
              //   bottomPosY,
              // );
            }
          }
        }
      }
      // console.table(boardMap);
    }

    // let's also determine the drop position while we check for collision.
    // we can search our boardmap from bottom to top to find the values under our current column that do not collide.
    // top left = posY, posX where posY is row and posX is colmn
    let dropFound = false;
    drop = BOTTOM - BOARDPIECEHEIGHT;
    for (let ROW = boardMap.length - 1; ROW > 1; ROW--) {
      let COL = posX;
      let count = 0;
      if (dropFound) break;
      for (let r = 0; r < currentBlockMatrix.length; r++) {
        for (let c = 0; c < currentBlockMatrix[r].length; c++) {
          if (currentBlockMatrix[r][c]) {
            const boardX = COL + c;
            const boardY = ROW + r;

            if (boardY >= 0 && boardY <= 21 && boardX <= 11) {
              if (
                bottomPosY < boardMap.length - 1 &&
                boardY > 1 &&
                boardMap[boardY][boardX] !== 1 &&
                boardMap[boardY][boardX] !== -1
              ) {
                count++;
                if (count == 4) {
                  dropFound = true;
                  // drop = bottomPosY + ROW;
                  drop = boardY * BOARDPIECEHEIGHT;
                  currentGhost.y = drop;
                  // drop should be a value above or equal to 20
                  // our orignal drop was BOTTOM - BOARDPIECEHEIGHT which was 31 pixels
                  // i forget the length of bottom but we need to make an equation that works on pixels not array indices.

                  // console.log(
                  //   `drop: ${drop}, boardX: ${boardX}, boardY: ${boardY}`,
                  // );
                }
              }
            }
          }
        }
      }
    }

    // console.log(posY, posX);
    for (let row = 0; row < currentBlockMatrix.length; row++) {
      for (let col = 0; col < currentBlockMatrix[row].length; col++) {
        // check if our blockMatrix position is filled

        if (currentBlockMatrix[row][col]) {
          const boardX = posX + col;
          const boardY = posY + row;
          // console.log("first: ", boardY >= 0 && boardY <= 21 && boardX <= 11);
          // console.log("second: ", boardMap[boardY + 1][boardX] === 1);
          // console.log("third: ", bottomPosY >= boardMap.length - 1);
          if (boardY >= 0 && boardY <= 21 && boardX <= 11) {
            // console.log(boardY, boardX, boardMap[boardY][boardX]);
            // okay these three cases should be split into two sections with the first two calling addPieceToBoard but not stopping
            // until after while the other should remain the same.
            // so check if boardY === 1 then reduce it by one instead of checking early since that messes up our gui.

            // Mostly split these two if statements to help debug issues. Combine later
            if (bottomPosY >= boardMap.length - 1) {
              addPieceToBoard();
              return true;
            }
            // more of a check at the bottom rather then a top end of game check.
            if (boardY > 1 && boardMap[boardY + 1][boardX] === 1) {
              addPieceToBoard();
              return true;
            }
          }
        }
      }
    }

    return false;
  }
  function rotateClockWise(mat) {
    const n = mat.length;
    // console.log("before rotation: ");
    // console.table(mat);

    const res = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        res[j][n - 1 - i] = mat[i][j];
      }
    }
    // console.log("rotation: ", res);
    // after we rotate we want to make sure we shift the values up and to the left.
    // if we just make it rotate to the left and up, it might not give us the same value.
    // [0, 0, 1, 0]
    // [1, 1, 1, 0]
    // [0, 0, 0, 0]
    // [0, 0, 0, 0]
    //
    // to:
    //
    // [0,0,1,0]
    // [0,0,1,0]
    // [0,0,1,1]
    // [0,0,0,0]
    //
    // then finally :
    // [1,0,0,0]
    // [1,0,0,0]
    // [1,1,0,0]
    // [0,0,0,0]
    //

    // console.log("final result of shift:");
    // console.table(res);
    return shiftBlockLeft(res);
  }

  // ai generated code function. -- to lazy to write and fix the bugs introduced when dealing with other current bugs. lol bad programmer!
  function shiftBlockLeft(mat) {
    const rows = mat.length;
    const cols = mat[0].length;

    // find the leftmost column that contains a 1 anywhere
    let left = cols; // start as "infinity"
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (mat[r][c] === 1) {
          left = Math.min(left, c);
          break;
        }
      }
    }

    // no 1s or already flush left
    if (left === 0 || left === cols) {
      // let res = mat.map((row) => row.slice());
      // console.log("after rotation and no left shift");
      // console.table(res);
      return mat.map((row) => row.slice());
    }

    // shift all cells left by `left`
    const res = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = left; c < cols; c++) {
        res[r][c - left] = mat[r][c];
      }
    }
    // console.log("after rotation and left shift");
    // console.table(res);
    // console.log("-------------------------------------------------------");
    return res;
  }

  // let arr1 = pieceGrids[currentIndex];
  // console.log("original arry");
  // console.table(arr1);
  // console.log("rotate call 1");
  // arr1 = rotateClockWise(arr1);
  // console.log("rotate call 2");
  // arr1 = rotateClockWise(arr1);
  // console.log("rotate call 3");
  // arr1 = rotateClockWise(arr1);
  //
  // app.ticker.stop();

  function pieceLoop() {
    if (gridCollision(pieceGrids[currentIndex])) {
      let randomIndex = Math.floor(Math.random() * 7);
      app.ticker.remove(pieceControls);
      // resset our piece grids to original placements
      pieceGrids = structuredClone(originalPieceGrids);
      shifted = false;
      board.removeChild(currentGhost);
      currentIndex = pieceQueue.shift();
      currentSprite = cloneSprite(currentIndex);
      currentGhost = cloneGhost(currentIndex);
      pieceQueue.push(randomIndex);
      updateNextBoard();
      currentRotation = 1;
      board.addChild(currentSprite);
      board.addChild(currentGhost);
      bottomReached = true;
      app.ticker.add(pieceControls);
    }
    if (currentSprite.y <= BOTTOM) {
      bottomReached = false;
    }
  }

  app.ticker.add(pieceLoop);
})();
