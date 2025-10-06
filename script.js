
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

let highScore = 0;
let currentStage = 1;      // Stage 1 = Singular Pumpkins
let stageScoreCounter = 0; // Counter for current stage goal (5)

const GROUND_HEIGHT = 10;
const MAX_JUMP_HEIGHT = 90;
const MAX_JUMP_HEIGHT_BOOST = 120; // This is the new, higher jump!


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

// --- SPAWN LOOP (SIMPLIFIED) ---
function spawnLoop() {
    const randomTime = Math.random() * (2500 - 1200) + 1200;
    
    obstacleSpawnInterval = setTimeout(() => {
        
        // Stage check is no longer needed here, as it's handled in createObstacle's scoring.
        
        // Determine which obstacle to spawn
        let obstacleCreator;
        
        switch (currentStage) {
            case 1: // Singular Pumpkin
                obstacleCreator = createSingularPumpkin;
                break;
            case 2: // Double Pumpkin
                obstacleCreator = createDoublePumpkin;
                break;
            case 3: // Triple Pumpkin
                obstacleCreator = createTriplePumpkin;
                break;
            case 4: // Ghost
                obstacleCreator = createGhost;
                break;
            case 5: // Random Mix
            default:
                const creators = [
                    createSingularPumpkin, 
                    createDoublePumpkin, 
                    createTriplePumpkin, 
                    createGhost
                ];
                obstacleCreator = creators[Math.floor(Math.random() * creators.length)];
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
    // We use the boost for Stage 2 (Double) and Stage 3 (Triple) and all subsequent stages.
    if (currentStage >= 2) {
        maxJumpHeight = MAX_JUMP_HEIGHT_BOOST;
    } else {
        // Use the normal jump for Singular Pumpkin (Stage 1)
        maxJumpHeight = MAX_JUMP_HEIGHT; // Using the original 90px height
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


// --- COLLISION CHECK LOGIC (ADJUSTED SENSITIVITY) ---
function checkCollision() {
    if (isGameOver) return;
    
    const fullCatRect = cat.getBoundingClientRect();
    const obstacles = document.querySelectorAll('.obstacle');
    
    const SHRINK_HORIZONTAL = 10;
    const SHRINK_VERTICAL_TOP = 15;
    const SHRINK_VERTICAL_BOTTOM = 5;

    const catHitbox = {
        left: fullCatRect.left + SHRINK_HORIZONTAL,
        right: fullCatRect.right - SHRINK_HORIZONTAL,
        top: fullCatRect.top + SHRINK_VERTICAL_TOP,
        bottom: fullCatRect.bottom - SHRINK_VERTICAL_BOTTOM
    };
    
    obstacles.forEach(pumpkin => {
        let pumpkinRect = pumpkin.getBoundingClientRect();
        
        // **NEW: Targeted Hitbox Adjustment for Double/Triple Pumpkins**
        if (pumpkin.classList.contains('double-pumpkin') || pumpkin.classList.contains('triple-pumpkin')) {
            // By adding 10px to the 'top' boundary, we are making the effective collision 
            // box shorter by 10 pixels, giving the cat extra vertical clearance.
            pumpkinRect = {
                left: pumpkinRect.left,
                right: pumpkinRect.right,
                top: pumpkinRect.top + 10, // Pushes the collision top down by 10px
                bottom: pumpkinRect.bottom
            };
        }
        
        // --- Standard Collision Check ---
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