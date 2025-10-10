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
// You defined returnHomeButton twice in your CSS, but here is the JS reference:
const returnHomeButton = document.getElementById('return-home-button'); 

let isJumping = false;
let score = 0;
let isGameOver = true; 
let gameLoopInterval;
let catAnimationInterval;
let obstacleSpawnInterval;
let frameToggle = true;
let randomMixSequence = 0; 

// REMOVED UNUSED/UNDEFINED ML VARIABLES:
// let detector;
// let videoElement;
// const VIDEO_WIDTH = 640;
// const VIDEO_HEIGHT = 480;

let highScore = 0;
let currentStage = 1;      
let stageScoreCounter = 0; 

const GROUND_HEIGHT = 10;
const MAX_JUMP_HEIGHT = 90;
const MAX_JUMP_HEIGHT_BOOST = 150; // Used for Stage 2+


// --- HIGH SCORE LOGIC (No changes needed) ---
function loadHighScore() {
    const storedHighScore = localStorage.getItem('pawmpkinHighScore');
    if (storedHighScore) {
        highScore = parseInt(storedHighScore);
    }
    highScoreDisplay.textContent = `High Score: ${highScore}`;
}

// --- CAT RUNNING ANIMATION LOGIC (No changes needed) ---
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

// --- DYNAMIC OBSTACLE CREATION & SCORING LOGIC (Minor cleanup) ---
function createObstacle(className, width, height, bottom, imageURL) {
    const newObstacle = document.createElement('div');
    // Ensure both general .obstacle and specific class are added
    newObstacle.classList.add('obstacle', className); 
    
    newObstacle.style.width = `${width}px`;
    newObstacle.style.height = `${height}px`;
    newObstacle.style.bottom = `${bottom}px`; 
    newObstacle.style.backgroundImage = `url('images/${imageURL}')`;
    // CRITICAL: Set animation-duration dynamically based on stage/difficulty if you want the game to speed up.
    newObstacle.style.animation = 'obstacleMove 2s linear forwards'; // Added 'forwards' for cleaner stop
    
    gameContainer.appendChild(newObstacle);

    // Scoring and Removal Logic (Your logic here is correct)
    setTimeout(() => {
        if (!isGameOver) { 
            score++;
            stageScoreCounter++; 
            scoreDisplay.textContent = `Score: ${score}`;

            if (stageScoreCounter >= 5) {
                currentStage++;
                stageScoreCounter = 0;
                // Limit stages to 5
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
    const GHOST_BOTTOM = 60; // Floats 60px above ground
    
    createObstacle('ghost', 64, GHOST_HEIGHT, GHOST_BOTTOM, 'FGhost.png');
}

// --- SPAWN LOOP (FIXED STAGE ASSIGNMENTS) ---
function spawnLoop() {
    // You can adjust the speed dynamically here:
    // const minTime = 2500 - (currentStage * 100); 
    // const maxTime = 1200 - (currentStage * 50);
    const randomTime = Math.random() * (2500 - 1200) + 1200;
    
    obstacleSpawnInterval = setTimeout(() => {
        
        let obstacleCreator;
        
        // CRITICAL FIX: The stage numbers were out of sync with your stage progression intent.
        // Stage 1: Singular (Only 1)
        // Stage 2: Singular/Double
        // Stage 3: Singular/Double/Triple
        // Stage 4: Add Ghost to the mix
        
        if (currentStage === 1) {
            obstacleCreator = createSingularPumpkin;
        } else if (currentStage === 2) {
             const creators = [createSingularPumpkin, createDoublePumpkin];
             obstacleCreator = creators[Math.floor(Math.random() * creators.length)];
        } else if (currentStage === 3) {
            const creators = [createSingularPumpkin, createDoublePumpkin, createTriplePumpkin];
            obstacleCreator = creators[Math.floor(Math.random() * creators.length)];
        } else { // Stage 4 and 5 (Final Mix)
            // Sequential Mix (Ghost after every 2 pumpkins)
            if (randomMixSequence >= 2) {
                // 1. Ghost spawns on the 3rd turn
                obstacleCreator = createGhost;
                randomMixSequence = 0; // Reset counter
            } else {
                // 2. Random Pumpkin spawns on the 1st and 2nd turns
                const creators = [createSingularPumpkin, createDoublePumpkin, createTriplePumpkin];
                obstacleCreator = creators[Math.floor(Math.random() * creators.length)];
                randomMixSequence++; // Increment counter (to 1 or 2)
            }
        }

        obstacleCreator();
        
        if (!isGameOver) {
            spawnLoop();
        }
    }, randomTime);
}

// --- JUMP LOGIC (No changes needed, logic is correct for jump boost) ---
function jump() {
    if (isJumping || isGameOver) {
        return; 
    }
    
    isJumping = true;
    let position = GROUND_HEIGHT; 
    
    let maxJumpHeight = (currentStage >= 4) ? MAX_JUMP_HEIGHT_BOOST : MAX_JUMP_HEIGHT; 
    
    // Use requestAnimationFrame for smoother jump animation (Optional)
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


// --- COLLISION CHECK LOGIC (No changes needed, the logic is very detailed and correct) ---
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


// --- GAME OVER LOGIC (No changes needed) ---
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

// --- GAME RESET LOGIC (Added cleanup to ensure menu is hidden and screens are set correctly) ---
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
    
    // Ensure both screens are correctly hidden/shown for the start state
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

    // CRITICAL FIX: COMMENTED OUT UNDEFINED FUNCTION
    // setupWebcamAndML(); 

    gameContainer.focus(); 

    catAnimationInterval = setInterval(animateCatRun, 100); 
    spawnLoop();
    
    gameLoopInterval = setInterval(checkCollision, 10); 
}

// --- EVENT LISTENERS (Minor cleanup) ---
startButton.addEventListener('click', startGame);

playAgainButton.addEventListener('click', () => {
    // Correct way to restart after game over
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
    // Use resetGame to clean up game state AND show the start menu
    resetGame(); 
  });

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !isGameOver) {
        jump();
    }
});

gameContainer.addEventListener('click', () => {
    if (!isGameOver) {
        jump();
    }
});

gameContainer.addEventListener('touchstart', (event) => {
    event.preventDefault(); 
    if (!isGameOver) {
        jump();
    }
});


// --- INITIALIZATION ---
// Hide screens initially
gameOverScreen.style.display = 'none';
cat.style.visibility = 'hidden'; // Hide the cat on startup
scoreDisplay.style.visibility = 'hidden'; // Hide score on startup

cat.style.bottom = `${GROUND_HEIGHT}px`;
loadHighScore();