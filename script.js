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


// --- HIGH SCORE LOGIC ---
function loadHighScore() {
    const storedHighScore = localStorage.getItem('pawmpkinHighScore');
    if (storedHighScore) {
        highScore = parseInt(storedHighScore);
    }
    highScoreDisplay.textContent = `High Score: ${highScore}`;
}

// --- CAT RUNNING ANIMATION LOGIC ---
function animateCatRun() {
    if (!isGameOver) {
        if (frameToggle) {
            cat.style.backgroundImage = "url('images/FCat2.png')";
        } else {
            cat.style.backgroundImage = "url('images/FCat1.png')";
        }
        frameToggle = !frameToggle;
    }
}

// --- DYNAMIC OBSTACLE CREATION & SCORING LOGIC ---
function createObstacle(className, width, height, bottom, imageURL) {
    const newObstacle = document.createElement('div');
    newObstacle.classList.add('obstacle', className); 
    
    newObstacle.style.width = `${width}px`;
    newObstacle.style.height = `${height}px`;
    newObstacle.style.bottom = `${bottom}px`; 
    newObstacle.style.backgroundImage = `url('images/${imageURL}')`;
    newObstacle.style.animation = 'obstacleMove 2s linear forwards'; // Added 'forwards'
    
    gameContainer.appendChild(newObstacle);

    // Scoring and Removal Logic
    setTimeout(() => {
        if (!isGameOver) { 
            score++;
            stageScoreCounter++; 
            scoreDisplay.textContent = `Score: ${score}`;

            // Check for stage advancement immediately after scoring
            if (stageScoreCounter >= 5) {
                currentStage++;
                stageScoreCounter = 0;
                if (currentStage > 5) {
                    currentStage = 5; 
                }
            }
        }
        newObstacle.remove();
    }, 2000); 
}

// Stage 1: Singular Pumpkin
function createSingularPumpkin() {
    createObstacle('singular-pumpkin', 60, 45, GROUND_HEIGHT, 'FSingular_Pumpkinn.png');
}

// Stage 2: Double Pumpkin
function createDoublePumpkin() {
    createObstacle('double-pumpkin', 60, 90, GROUND_HEIGHT, 'FTwo_Pumpkins.png');
}

// Stage 3: Triple Pumpkin
function createTriplePumpkin() {
    createObstacle('triple-pumpkin', 60, 135, GROUND_HEIGHT, 'FThree_Pumpkins.png');
}

// Stage 4: Ghost (floats high)
function createGhost() {
    const GHOST_HEIGHT = 64;
    const GHOST_BOTTOM = 60; 
    
    createObstacle('ghost', 64, GHOST_HEIGHT, GHOST_BOTTOM, 'FGhost.png');
}

// --- SPAWN LOOP (Revised Stage Logic) ---
function spawnLoop() {
    const randomTime = Math.random() * (2500 - 1200) + 1200;
    
    obstacleSpawnInterval = setTimeout(() => {
        
        let obstacleCreator;
        
        if (currentStage === 1) {
            obstacleCreator = createSingularPumpkin;
        } else if (currentStage === 2) {
             const creators = [createSingularPumpkin, createDoublePumpkin];
             obstacleCreator = creators[Math.floor(Math.random() * creators.length)];
        } else if (currentStage === 3) {
            const creators = [createSingularPumpkin, createDoublePumpkin, createTriplePumpkin];
            obstacleCreator = creators[Math.floor(Math.random() * creators.length)];
        } else { // Stage 4 and 5 (Final Mix with Ghost)
            if (randomMixSequence >= 2) {
                obstacleCreator = createGhost;
                randomMixSequence = 0;
            } else {
                const creators = [createSingularPumpkin, createDoublePumpkin, createTriplePumpkin];
                obstacleCreator = creators[Math.floor(Math.random() * creators.length)];
                randomMixSequence++;
            }
        }

        obstacleCreator();
        
        if (!isGameOver) {
            spawnLoop();
        }
    }, randomTime);
}


// --- JUMP LOGIC ---
function jump() {
    if (isJumping || isGameOver) {
        return; 
    }
    
    isJumping = true;
    let position = GROUND_HEIGHT; 
    
    let maxJumpHeight = (currentStage >= 4) ? MAX_JUMP_HEIGHT_BOOST : MAX_JUMP_HEIGHT; 
    
    let upInterval = setInterval(() => {
        if (position >= (GROUND_HEIGHT + maxJumpHeight)) { 
            clearInterval(upInterval);
            
            let downInterval = setInterval(() => {
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


// --- COLLISION CHECK LOGIC ---
function checkCollision() {
    if (isGameOver) return;
    
    const fullCatRect = cat.getBoundingClientRect();
    const obstacles = document.querySelectorAll('.obstacle');
    
    const SHRINK_HORIZONTAL = 10;
    const SHRINK_VERTICAL_TOP = 30; 
    const SHRINK_VERTICAL_BOTTOM = 5;

    const catHitbox = {
        left: fullCatRect.left + SHRINK_HORIZONTAL,
        right: fullCatRect.right - SHRINK_HORIZONTAL,
        top: fullCatRect.top + SHRINK_VERTICAL_TOP,
        bottom: fullCatRect.bottom - SHRINK_VERTICAL_BOTTOM
    };
    
    obstacles.forEach(pumpkin => {
        let pumpkinRect = pumpkin.getBoundingClientRect();
        
        if (pumpkin.classList.contains('double-pumpkin') || pumpkin.classList.contains('triple-pumpkin')) {
            pumpkinRect = {
                left: pumpkinRect.left,
                right: pumpkinRect.right,
                top: pumpkinRect.top + 15, 
                bottom: pumpkinRect.bottom
            };
        } 
        else if (pumpkin.classList.contains('ghost')) {
            pumpkinRect = {
                left: pumpkinRect.left + 5,
                right: pumpkinRect.right - 5,
                top: pumpkinRect.top, 
                bottom: pumpkinRect.bottom
            };
        }
        
        if (
            catHitbox.left < pumpkinRect.right && 
            catHitbox.right > pumpkinRect.left && 
            catHitbox.bottom > pumpkinRect.top &&
            catHitbox.top < pumpkinRect.bottom
        ) {
            gameOver();
            return;
        }
    });
}


// --- GAME OVER LOGIC ---
function gameOver() {
    isGameOver = true;
    
    clearInterval(gameLoopInterval);
    clearInterval(catAnimationInterval); 
    clearTimeout(obstacleSpawnInterval); 
    
    document.querySelectorAll('.obstacle').forEach(obstacle => {
        obstacle.style.animationPlayState = 'paused';
    });

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('pawmpkinHighScore', highScore);
    }
    
    highScoreDisplay.textContent = `High Score: ${highScore}`;
    finalScoreDisplay.textContent = score; 
    
    gameOverScreen.style.display = 'flex'; 
}

// --- GAME RESET LOGIC ---
function resetGame() {
    document.querySelectorAll('.obstacle').forEach(obstacle => {
        obstacle.remove();
    });
    
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


// --- START GAME LOGIC ---
function startGame() {
    isGameOver = false; 

    startMenu.style.display = 'none';
    
    cat.style.visibility = 'visible';
    scoreDisplay.style.visibility = 'visible';

    // REMOVED: setupWebcamAndML() call (as it was undefined)

    gameContainer.focus(); 

    catAnimationInterval = setInterval(animateCatRun, 100); 
    spawnLoop();
    
    gameLoopInterval = setInterval(checkCollision, 10); 
}

// --- EVENT LISTENERS ---
startButton.addEventListener('click', startGame);

playAgainButton.addEventListener('click', () => {
    resetGame();
    startGame();
});

howToPlayBtn.addEventListener('click', () => {
    instructions.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    instructions.style.display = 'none';
});
  
returnHomeButton.addEventListener('click', () => {
    resetGame();
});

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !isGameOver) {
        jump();
    }
});

// Listener for desktop clicks
gameContainer.addEventListener('click', () => {
    if (!isGameOver) {
        jump();
    }
});

// **CRITICAL MOBILE FIX:** Added { passive: false } for reliable touch detection
gameContainer.addEventListener('touchstart', (event) => {
    // Prevent default browser actions like scrolling/zooming on the game area
    event.preventDefault(); 
    if (!isGameOver) {
        jump();
    }
}, { passive: false });


// --- INITIALIZATION ---
gameOverScreen.style.display = 'none';
cat.style.visibility = 'hidden'; 
scoreDisplay.style.visibility = 'hidden'; 

cat.style.bottom = `${GROUND_HEIGHT}px`;
loadHighScore();