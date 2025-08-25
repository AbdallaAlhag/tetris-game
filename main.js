import { Application, Container, Assets, Sprite } from "pixi.js";

// TODO:
// add single piece
//  - piece moving down (left or right) => done
//  - ability to rotate (up) => Done
//  - speed up button (down) => Done
//  - ability to jump down instantly => Done
//    - with shadow piece to showcase where it will land
//  - Add all pieces => done
//  - Create a system that works with the current piece => done
//  - drop pieces and create new pieces => done
//  - add collision to blocks => done
//  - add collision based on shape with grid map => in progress
//  - bugs:
//    - our 4 x 1 piece falls short of our bottom and left border by one piece => delt with
//    - 2x2 piece is one off border => delt with
//    - space drop bugged, doesn't continue the loop
//    - collision bugged on 4 x 1 piece
//    - rotation on left border is one shy while rotation on right border is one over.

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
  // single block is 64 x 64 pixels,
  // board is 768 x 1408 pixels, which is 12 pieces width and 22 pieces height
  // but board is also 10 width and 20 high without border
  // let's make a container this time
  const board = new Container();
  app.stage.addChild(board);

  const backgroundTexture = await Assets.load(BASEURL + "/images/Board.png");
  const backGroundSprite = Sprite.from(backgroundTexture);
  backGroundSprite.scale.set(0.5, 0.5);
  backGroundSprite.id = "background";
  board.addChild(backGroundSprite);

  board.pivot.set(board.width / 2, board.height / 2);
  board.position.set(app.screen.width / 2, app.screen.height / 2);

  // Top and Bottom x of the board
  const BOARDPIECEHEIGHT = board.height / 22;
  const BOARDPIECEWIDTH = board.width / 12;
  const BOTTOMX = board.height - BOARDPIECEHEIGHT * 2; // board.height - 2 board pieces
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
  let currentRotation = 1;
  for (let i = 0; i < 7; i++) {
    // console.log(BASEURL + `images/piece${i}.png`);
    const pieceTexture = await Assets.load(BASEURL + `images/piece${i}.png`);
    textures.push(pieceTexture);
    const pieceSprite = Sprite.from(pieceTexture);
    pieceSprite.scale.set(0.5);
    pieceSprite.id = "piece";
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

  const I = [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const O = [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
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

  const pieceGrids = [I, J, L, O, S, T, Z];
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
  // console.log(pieces);
  let currentIndex = Math.floor(Math.random() * 7);
  let currentSprite = pieces[currentIndex];
  // console.log(currentSprite);

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
    let h = currentSprite.height;

    let border;
    switch (currentRotation) {
      case 1:
        border = op(x, anchorX * w);
        //            currentSprite.x - currentSprite.anchor.x * currentSprite.width;
        break;
      case 2:
        border = op(x, anchorY * h);
        //            currentSprite.x - currentSprite.anchor.y * currentSprite.height;
        break;
      case 3:
        border = op(x, (1 - anchorX) * w);
        // currentSprite.x -
        // (1 - currentSprite.anchor.x) * currentSprite.width;
        break;
      case 4:
        border = op(x, (1 - anchorY) * h);
        //   currentSprite.x -
        //   (1 - currentSprite.anchor.y) * currentSprite.height;
        break;
    }
    return border;
  }

  function pieceControls() {
    if (KEYS["ArrowUp"]) {
      currentSprite.angle = currentSprite.angle + 90;
      currentRotation = ((currentRotation + 1) % 4) + 1; // loop rotation 1 to 4 with 1 being original position
      KEYS["ArrowUp"] = false;
    }
    if (KEYS["ArrowLeft"]) {
      let spriteLeft = calculateBorder("-");
      // if (currentRotation % 2 == 0) {
      //   spriteLeft = currentSprite.x;
      // } else {
      //   spriteLeft =
      //     currentSprite.x - currentSprite.anchor.x * currentSprite.width;
      // }
      if (spriteLeft > BOARDPIECEWIDTH) {
        // greater than the boarder piece,
        currentSprite.x -= BOARDPIECEWIDTH;
      }
      KEYS["ArrowLeft"] = false;
    }
    if (KEYS["ArrowRight"]) {
      // console.log(LEFTBORDER - BOARDPIECEWIDTH, currentSprite.x);
      // let spriteRight =
      //   currentSprite.x + (1 - currentSprite.anchor.x) * currentSprite.width;
      let spriteRight = calculateBorder("+");
      if (spriteRight < LEFTBORDER - BOARDPIECEWIDTH) {
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

  let bottomReached = false;

  function dropPiece() {
    let dropCounter = 0;
    const dropInterval = 60; // frames before piece moves down (~1s at 60fps)

    const dropFunction = (delta) => {
      dropCounter += delta.deltaTime * SPEED;

      if (bottomReached) {
        dropCounter = 0;
        console.log("remove drop");
        app.ticker.remove(dropFunction());
        return;
      }
      if (dropCounter >= dropInterval && currentSprite.position.y <= BOTTOMX) {
        currentSprite.position.y += BOARDPIECEHEIGHT;
        dropCounter = 0; // reset counter
      }
    };

    app.ticker.add(dropFunction);
  }

  dropPiece();

  function cloneSprite(index = Math.floor(Math.random() * 7)) {
    let texture = textures[index];
    let template = pieces[index];
    const s = new Sprite(texture);

    s.anchor.set(template.anchor.x, template.anchor.y);
    s.scale.set(template.scale.x, template.scale.y);
    s.x = MIDDLEX;
    s.id = "piece";
    // console.log(s);
    return s;
  }

  // // cal this function on every sprite in our container but the background, probably want to give it an id of 'background'
  // function borderCollision(lockedSprite) {
  //   // we have to find top border of sprites on board
  //   // and then bottom borders of currentSprite and see if they share the same
  //   // y position
  //   let locked = lockedSprite.getBounds();
  //   let current = currentSprite.getBounds();
  //
  //   let lockedLeft = locked.x - lockedSprite.anchor.x * locked.width;
  //   let lockedRight = lockedLeft + locked.width;
  //
  //   let currentLeft = current.x - currentSprite.anchor.x * current.width;
  //   let currentRight = currentLeft + current.width;
  //
  //   // current y + width = bottom and locked.y is probbaly top but anchor might play a role
  //   if (
  //     current.y + current.height * currentSprite.anchor.y ==
  //       locked.y - locked.height * lockedSprite.anchor.y &&
  //     !(currentLeft >= lockedRight || currentRight <= lockedLeft)
  //   ) {
  //     console.log("collision detected");
  //     return false;
  //   }
  //   return true;
  // }

  // grab the blockMatrix from our pieceGrids array;
  // we can use the boardGrid and currentSprite to get x and y position.

  // we can check collision for bottom or for border
  function gridCollision(blockMatrix) {
    let currentBlockMatrix = blockMatrix;
    console.log("reached collision check");

    // grab the position from the board and convert it to fit our boardMap array,
    // most likely position / 12 or 22 rounded up i asssume
    // I think our position is expected to be upper left to correctly work. might have to do some
    // math to represents our anchor correclty but upper left is probably best so we should
    // relocate upper ancho temporarily

    // posX and posY should be upper left corner of our block
    let posX = Math.round(
      (currentSprite.position.x -
        currentSprite.anchor.x * currentSprite.width) /
        BOARDPIECEWIDTH,
    );
    let posY = Math.round(
      (currentSprite.position.y -
        currentSprite.anchor.y * currentSprite.width) /
        BOARDPIECEHEIGHT,
    );
    // 1 is no rotation and 3 is flipped upside down
    // bottom position is different based on which way we rotate. also anchor is not exactly even on all
    // most are 2/3 anchors
    let bottomPosY;
    if (currentRotation % 2 == 0) {
      bottomPosY =
        Math.round(
          currentSprite.position.y +
            currentSprite.anchor.y * currentSprite.width,
        ) / BOARDPIECEWIDTH;
    } else {
      bottomPosY = Math.round(
        (currentSprite.position.y +
          currentSprite.anchor.y * currentSprite.height) /
          BOARDPIECEHEIGHT,
      );
    }
    // console.log(
    //   `sprite position x: ${currentSprite.position.x} and sprite position y: ${currentSprite.position.y}`,
    // );
    // console.log(`position x: ${posX} and position y: ${posY}`);
    // app.ticker.stop();
    // our current block based on its current rotation, 1 = no rotation
    for (let i = 0; i < currentRotation - 1; i++) {
      currentBlockMatrix = rotateClockWise(blockMatrix);
    }
    // console.log(currentBlockMatrix);
    // app.ticker.stop();
    function addPieceToBoard() {
      for (let row = 0; row < currentBlockMatrix.length; row++) {
        for (let col = 0; col < currentBlockMatrix[row].length; col++) {
          // check if our blockMatrix position is filled
          if (currentBlockMatrix[row][col]) {
            const boardX = posX + col;
            const boardY = posY + row - 1; // our piece stops when it reaches a filled piece so we want to set it to that piece - 1
            console.log(boardX, boardY);
            // ahhh we gotta switch it up since it's row, col intead of col, row which would be x,y
            // but we do y,x in our array.
            boardMap[boardY][boardX] = 1;
          }
        }
      }
      console.log(boardMap);
    }

    for (let row = 0; row < currentBlockMatrix.length; row++) {
      for (let col = 0; col < currentBlockMatrix[row].length; col++) {
        // check if our blockMatrix position is filled

        if (currentBlockMatrix[row][col]) {
          const boardX = posX + col;
          const boardY = posY + row;

          // detect wall/ bottom collision (going to move bottom collision since piece does not stop at wall collision)
          // good wall detection but maybe we remove it
          if (
            boardX < 0 ||
            boardX >= boardMap[0].length
            // || boardY >= boardMap.length
          ) {
            return true;
          }
          // check if filled cell collides or bottom collision
          // dont check it if piece is partial on top of the board for respawn
          // okay bottom reached is not just boardY, it should be posY at the bottom of the piece not the top left
          console.log(bottomPosY >= boardMap.length - 1);
          console.log(bottomPosY, boardMap.length - 1);
          if (
            (boardY >= 0 && boardMap[boardY][boardX] == 1) ||
            bottomPosY >= boardMap.length - 1
          ) {
            console.log("adding to baoard map");
            addPieceToBoard();
            return true;
          }
        }
      }
    }

    return false;
  }
  function rotateClockWise(mat) {
    const n = mat.length;

    const res = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        res[j][n - 1 - i] = mat[i][j];
      }
    }
    return res;
  }

  function pieceLoop() {
    let randomIndex = Math.floor(Math.random() * 7);
    if (
      // currentSprite.position.y == BOTTOMX ||
      // !(
      //   board.children.toReversed().every((e, index) => {
      //     // test on every sprite but background and last sprite which is current
      //     if (e.id === "background" || index === 0) {
      //       return true; // skip these
      //     }
      //     console.log("checking");
      //     return borderCollision(e);
      //   }) && !bottomReached
      // )
      gridCollision(pieceGrids[currentIndex])
    ) {
      console.log("reachedbottom");
      app.ticker.remove(pieceControls);
      // currentSprite = cloneSprite(pieces[Math.floor(Math.random() * 7)]);
      currentSprite = cloneSprite(randomIndex);
      currentRotation = 1;
      currentIndex = randomIndex;
      board.addChild(currentSprite);
      bottomReached = true;
      app.ticker.add(pieceControls);
      // dropPiece(); // stacks app.ticker()

      // console.log(app.ticker);
      // let listener = app.ticker._head;
      // let count = 0;
      // while (listener) {
      //   count++;
      //   listener = listener.next;
      // }
      // console.log(count);
    }
    if (currentSprite.y <= BOTTOMX) {
      bottomReached = false;
    }
  }

  app.ticker.add(pieceLoop);
})();
