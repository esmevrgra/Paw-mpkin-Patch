// === DOM ELEMENTS ===
const cat = document.getElementById('cat');
const scoreDisplay = document.getElementById('score');
const startMenu = document.getElementById('start-menu');
const startButton = document.getElementById('start-button');
const gameContainer = document.getElementById('game-container');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const playAgainButton = document.getElementById('play-again-button');
const highScoreDisplay = document.getElementById('high-score');
const howToPlayBtn = document.getElementById('how-to-play-button');
const instructions = document.getElementById('instructions');
const closeBtn = document.getElementById('close-instructions');
const returnHomeButton = document.getElementById('return-home-button');

// === GAME VARIABLES ===
let isJumping = false;
let score = 0;
let isGameOver = true;
let gameLoopInterval;
let catAnimationInterval;
let obstacleSpawnInterval;
let frameToggle = true;
let randomMixSequence = 0;

let highScore = 0;
let currentStage = 1;
let stageScoreCounter = 0;

const GROUND_HEIGHT = 10;
const MAX_JUMP_HEIGHT = 90;
const MAX_JUMP_HEIGHT_BOOST = 150;

// === LOAD HIGH SCORE ===
function loadHighScore() {
  const storedHighScore = localStorage.getItem('pawmpkinHighScore');
  if (storedHighScore) {
    highScore = parseInt(storedHighScore);
  }
  highScoreDisplay.textContent = `High Score: ${highScore}`;
}

// === CAT ANIMATION ===
function animateCatRun() {
  if (!isGameOver) {
    cat.style.backgroundImage = frameToggle
      ? "url('images/FCat2.png')"
      : "url('images/FCat1.png')";
    frameToggle = !frameToggle;
  }
}

// === OBSTACLE CREATION ===
function createObstacle(className, width, height, bottom, imageURL) {
  const newObstacle = document.createElement('div');
  newObstacle.classList.add('obstacle', className);
  newObstacle.style.width = `${width}px`;
  newObstacle.style.height = `${height}px`;
  newObstacle.style.bottom = `${bottom}px`;
  newObstacle.style.backgroundImage = `url('images/${imageURL}')`;
  newObstacle.style.animation = 'obstacleMove 2s linear forwards';
  gameContainer.appendChild(newObstacle);

  setTimeout(() => {
    if (!isGameOver) {
      score++;
      stageScoreCounter++;
      scoreDisplay.textContent = `Score: ${score}`;
      if (stageScoreCounter >= 5) {
        currentStage++;
        stageScoreCounter = 0;
        if (currentStage > 5) currentStage = 5;
      }
    }
    newObstacle.remove();
  }, 2000);
}

// === OBSTACLE VARIANTS ===
function createSingularPumpkin() {
  createObstacle('singular-pumpkin', 60, 45, GROUND_HEIGHT, 'FSingular_Pumpkinn.png');
}
function createDoublePumpkin() {
  createObstacle('double-pumpkin', 60, 90, GROUND_HEIGHT, 'FTwo_Pumpkins.png');
}
function createTriplePumpkin() {
  createObstacle('triple-pumpkin', 60, 135, GROUND_HEIGHT, 'FThree_Pumpkins.png');
}
function createGhost() {
  createObstacle('ghost', 64, 64, 60, 'FGhost.png');
}

// === OBSTACLE LOOP ===
function spawnLoop() {
  const randomTime = Math.random() * (2500 - 1200) + 1200;
  obstacleSpawnInterval = setTimeout(() => {
    let obstacleCreator;

    if (currentStage === 1) obstacleCreator = createSingularPumpkin;
    else if (currentStage === 2) {
      const arr = [createSingularPumpkin, createDoublePumpkin];
      obstacleCreator = arr[Math.floor(Math.random() * arr.length)];
    } else if (currentStage === 3) {
      const arr = [createSingularPumpkin, createDoublePumpkin, createTriplePumpkin];
      obstacleCreator = arr[Math.floor(Math.random() * arr.length)];
    } else {
      if (randomMixSequence >= 2) {
        obstacleCreator = createGhost;
        randomMixSequence = 0;
      } else {
        const arr = [createSingularPumpkin, createDoublePumpkin, createTriplePumpkin];
        obstacleCreator = arr[Math.floor(Math.random() * arr.length)];
        randomMixSequence++;
      }
    }

    obstacleCreator();
    if (!isGameOver) spawnLoop();
  }, randomTime);
}

// === JUMP LOGIC ===
function jump() {
  if (isJumping || isGameOver) return;

  isJumping = true;
  let position = GROUND_HEIGHT;
  const maxJumpHeight = currentStage >= 4 ? MAX_JUMP_HEIGHT_BOOST : MAX_JUMP_HEIGHT;

  const upInterval = setInterval(() => {
    if (position >= GROUND_HEIGHT + maxJumpHeight) {
      clearInterval(upInterval);
      const downInterval = setInterval(() => {
        if (position <= GROUND_HEIGHT) {
          clearInterval(downInterval);
          isJumping = false;
          cat.style.bottom = `${GROUND_HEIGHT}px`;
          return;
        }
        position -= 5;
        cat.style.bottom = position + 'px';
      }, 20);
    }
    position += 5;
    cat.style.bottom = position + 'px';
  }, 20);
}

// === COLLISION DETECTION ===
function checkCollision() {
  if (isGameOver) return;

  const fullCatRect = cat.getBoundingClientRect();
  const obstacles = document.querySelectorAll('.obstacle');

  const catHitbox = {
    left: fullCatRect.left + 10,
    right: fullCatRect.right - 10,
    top: fullCatRect.top + 30,
    bottom: fullCatRect.bottom - 5,
  };

  obstacles.forEach((pumpkin) => {
    let rect = pumpkin.getBoundingClientRect();

    if (pumpkin.classList.contains('double-pumpkin') || pumpkin.classList.contains('triple-pumpkin')) {
      rect = { left: rect.left, right: rect.right, top: rect.top + 15, bottom: rect.bottom };
    } else if (pumpkin.classList.contains('ghost')) {
      rect = { left: rect.left + 5, right: rect.right - 5, top: rect.top, bottom: rect.bottom };
    }

    if (
      catHitbox.left < rect.right &&
      catHitbox.right > rect.left &&
      catHitbox.bottom > rect.top &&
      catHitbox.top < rect.bottom
    ) {
      gameOver();
      return;
    }
  });
}

// === GAME FLOW ===
function gameOver() {
  isGameOver = true;
  clearInterval(gameLoopInterval);
  clearInterval(catAnimationInterval);
  clearTimeout(obstacleSpawnInterval);

  document.querySelectorAll('.obstacle').forEach(o => (o.style.animationPlayState = 'paused'));

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('pawmpkinHighScore', highScore);
  }

  highScoreDisplay.textContent = `High Score: ${highScore}`;
  finalScoreDisplay.textContent = score;
  gameOverScreen.style.display = 'flex';
}

function resetGame() {
  document.querySelectorAll('.obstacle').forEach(o => o.remove());
  score = 0;
  stageScoreCounter = 0;
  currentStage = 1;
  randomMixSequence = 0;
  scoreDisplay.textContent = 'Score: 0';
  isGameOver = true;
  isJumping = false;
  cat.style.bottom = `${GROUND_HEIGHT}px`;
  gameOverScreen.style.display = 'none';
  startMenu.style.display = 'flex';
  loadHighScore();
}

function startGame() {
  isGameOver = false;
  startMenu.style.display = 'none';
  gameOverScreen.style.display = 'none';
  cat.style.visibility = 'visible';
  scoreDisplay.style.visibility = 'visible';

  catAnimationInterval = setInterval(animateCatRun, 100);
  spawnLoop();
  gameLoopInterval = setInterval(checkCollision, 10);
  gameContainer.focus();
}

// === BUTTON HANDLERS ===
function stopPropagationIfEvent(e) {
  if (e && e.stopPropagation) e.stopPropagation();
}

startButton.addEventListener('click', (e) => {
  stopPropagationIfEvent(e);
  startGame();
});

playAgainButton.addEventListener('click', (e) => {
  stopPropagationIfEvent(e);
  resetGame();
  startGame();
});

howToPlayBtn.addEventListener('click', (e) => {
  stopPropagationIfEvent(e);
  instructions.style.display = 'block';
});

closeBtn.addEventListener('click', (e) => {
  stopPropagationIfEvent(e);
  instructions.style.display = 'none';
});

returnHomeButton.addEventListener('click', (e) => {
  stopPropagationIfEvent(e);
  resetGame();
});

// === KEYBOARD INPUT ===
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !isGameOver) {
    e.preventDefault();
    jump();
  }
});

// === UNIFIED INPUT: POINTER EVENTS ===
let lastJump = 0;
const JUMP_DELAY = 50;

function tryJumpFromInput(e) {
  const now = Date.now();
  if (now - lastJump < JUMP_DELAY) return;
  lastJump = now;
  if (!isGameOver) {
    if (e && e.preventDefault) e.preventDefault();
    jump();
  }
}

if (window.PointerEvent) {
  gameContainer.addEventListener('pointerdown', tryJumpFromInput);
} else {
  gameContainer.addEventListener('touchstart', tryJumpFromInput, { passive: false });
  gameContainer.addEventListener('click', tryJumpFromInput);
}

// === INITIALIZATION ===
gameOverScreen.style.display = 'none';
cat.style.visibility = 'hidden';
scoreDisplay.style.visibility = 'hidden';
cat.style.bottom = `${GROUND_HEIGHT}px`;
loadHighScore();
