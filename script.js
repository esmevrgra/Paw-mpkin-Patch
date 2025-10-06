const cat = document.getElementById('cat');
const scoreDisplay = document.getElementById('score');
const startMenu = document.getElementById('start-menu');
const startButton = document.getElementById('start-button');
const gameContainer = document.getElementById('game-container'); 
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const playAgainButton = document.getElementById('play-again-button');
const highScoreDisplay = document.getElementById('high-score');

let isJumping = false;
let score = 0;
let isGameOver = true; 
let gameLoopInterval;
let catAnimationInterval;
let obstacleSpawnInterval;
let frameToggle = true;
let randomMixSequence = 0; 

let highScore = 0;
let currentStage = 1;      // Stage 1 = Singular Pumpkins
let stageScoreCounter = 0; // Counter for current stage goal (5)

const GROUND_HEIGHT = 10;
const MAX_JUMP_HEIGHT = 90;
// CRITICAL FIX: INCREASED to 130 to safely clear the Ghost's 124px height.
const MAX_JUMP_HEIGHT_BOOST = 130; 


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

// Generic function to create an obstacle with specific properties
function createObstacle(className, width, height, bottom, imageURL) {
    const newObstacle = document.createElement('div');
    newObstacle.classList.add('obstacle', className); 
    
    newObstacle.style.width = `${width}px`;
    newObstacle.style.height = `${height}px`;
    newObstacle.style.bottom = `${bottom}px`; 
    newObstacle.style.backgroundImage = `url('images/${imageURL}')`;
    newObstacle.style.animation = 'obstacleMove 2s linear'; 
    
    gameContainer.appendChild(newObstacle);

    // Scoring and Removal Logic (FIXED: Stage check moved here for accuracy)
    setTimeout(() => {
        if (!isGameOver) { 
            score++;
            stageScoreCounter++; // Increment stage counter
            scoreDisplay.textContent = `Score: ${score}`;

            // Check for stage advancement immediately after scoring
            if (stageScoreCounter >= 5) {
                currentStage++;
                stageScoreCounter = 0;
                // Limit stages to 5 (4 main stages + 1 randomized stage)
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
    createObstacle('pumpkin', 60, 45, GROUND_HEIGHT, 'FSingular_Pumpkinn.png');
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

// --- SPAWN LOOP (FIXED GHOST SEQUENCE) ---
function spawnLoop() {
    const randomTime = Math.random() * (2500 - 1200) + 1200;
    
    obstacleSpawnInterval = setTimeout(() => {
        
        let obstacleCreator;
        
        switch (currentStage) {
            case 1:
            obstacleCreator = createSingularPumpkin;
                break;
            case 2: 
            obstacleCreator = createGhost;
                break;
            case 3: 
                obstacleCreator =createDoublePumpkin;
                break;
            case 4:
            obstacleCreator = createTriplePumpkin;
            break;
            case 5: // Sequential Mix (Ghost after every 2 pumpkins)
            default:
                // Check if we've spawned 2 pumpkins already (randomMixSequence will be 2)
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
                break;
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
    
    // 1. DETERMINE WHICH MAX JUMP HEIGHT TO USE
    let maxJumpHeight;
    
    // Double and Triple pumpkins start at Stage 2. 
    if (currentStage >= 2) {
        // Use the new, higher jump determined by the MAX_JUMP_HEIGHT_BOOST constant
        maxJumpHeight = MAX_JUMP_HEIGHT_BOOST; 
    } else {
        // Use the normal jump for Singular Pumpkin (Stage 1)
        maxJumpHeight = MAX_JUMP_HEIGHT; 
    }
    
    // 2. EXECUTE THE JUMP
    let upInterval = setInterval(() => {
        // Use the selected maxJumpHeight here
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


// --- COLLISION CHECK LOGIC (FINAL SENSITIVITY FIX) ---
function checkCollision() {
    if (isGameOver) return;
    
    const fullCatRect = cat.getBoundingClientRect();
    const obstacles = document.querySelectorAll('.obstacle');
    
    // REDUCED CAT HITBOX VERTICALLY AND HORIZONTALLY
    const SHRINK_HORIZONTAL = 10;
    const SHRINK_VERTICAL_TOP = 30; // Increased shrink for vertical safety (was 15)
    const SHRINK_VERTICAL_BOTTOM = 5;

    const catHitbox = {
        left: fullCatRect.left + SHRINK_HORIZONTAL,
        right: fullCatRect.right - SHRINK_HORIZONTAL,
        top: fullCatRect.top + SHRINK_VERTICAL_TOP,
        bottom: fullCatRect.bottom - SHRINK_VERTICAL_BOTTOM
    };
    
    obstacles.forEach(pumpkin => {
        let pumpkinRect = pumpkin.getBoundingClientRect();
        
        // TARGETED SHRINK: Adjust the tall pumpkins hitbox
        if (pumpkin.classList.contains('double-pumpkin') || pumpkin.classList.contains('triple-pumpkin')) {
            // Reduces the effective collision height by 15 pixels for tall pumpkins only.
            pumpkinRect = {
                left: pumpkinRect.left,
                right: pumpkinRect.right,
                top: pumpkinRect.top + 15, // Pushes the collision top down by 15px (was 10)
                bottom: pumpkinRect.bottom
            };
        } 
        // TARGETED SHRINK: Adjust the Ghost's hitbox for better clearance (optional)
        else if (pumpkin.classList.contains('ghost')) {
            // Shrink horizontally to make passing underneath easier
            pumpkinRect = {
                left: pumpkinRect.left + 5,
                right: pumpkinRect.right - 5,
                top: pumpkinRect.top, 
                bottom: pumpkinRect.bottom
            };
        }
        
        // --- Final Collision Check ---
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
    randomMixSequence = 0; // Reset sequence tracker
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


// --- INITIALIZATION ---
cat.style.bottom = `${GROUND_HEIGHT}px`;
loadHighScore();