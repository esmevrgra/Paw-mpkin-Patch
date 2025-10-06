
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

const GROUND_HEIGHT = 10;
const MAX_JUMP_HEIGHT = 90;

// --- HIGH SCORE LOGIC ---
function loadHighScore() {
    const storedHighScore = localStorage.getItem('pawmpkinHighScore');
    if (storedHighScore) {
        highScore = parseInt(storedHighScore);
    }
    // Update the element's content so it is ready when the game over screen is shown
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

// --- DYNAMIC OBSTACLE SPAWNING & SCORING LOGIC ---
function createPumpkin() {
    const newPumpkin = document.createElement('div');
    newPumpkin.classList.add('obstacle'); 
    
    newPumpkin.style.bottom = `${GROUND_HEIGHT}px`; 
    newPumpkin.style.animation = 'obstacleMove 2s linear'; 
    
    gameContainer.appendChild(newPumpkin);

    setTimeout(() => {
        if (!isGameOver) { 
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
        }
        newPumpkin.remove();
    }, 2000); 
}

// Recursive function to continuously spawn pumpkins at random intervals
function spawnLoop() {
    const randomTime = Math.random() * (2500 - 1200) + 1200;
    
    obstacleSpawnInterval = setTimeout(() => {
        createPumpkin();
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
    
    let upInterval = setInterval(() => {
        if (position >= (GROUND_HEIGHT + MAX_JUMP_HEIGHT)) {
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
    
    // Hitbox adjustment values (in pixels)
    const SHRINK_HORIZONTAL = 10;
    const SHRINK_VERTICAL_TOP = 15;
    const SHRINK_VERTICAL_BOTTOM = 5;

    // Create a NEW, smaller, virtual hitbox for the cat
    const catHitbox = {
        left: fullCatRect.left + SHRINK_HORIZONTAL,
        right: fullCatRect.right - SHRINK_HORIZONTAL,
        top: fullCatRect.top + SHRINK_VERTICAL_TOP,
        bottom: fullCatRect.bottom - SHRINK_VERTICAL_BOTTOM
    };
    
    obstacles.forEach(pumpkin => {
        const pumpkinRect = pumpkin.getBoundingClientRect();
        
        // --- COLLISION CHECK (Game Over) ---
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


// --- GAME OVER LOGIC (FINAL) ---
function gameOver() {
    isGameOver = true;
    
    clearInterval(gameLoopInterval);
    clearInterval(catAnimationInterval); 
    clearTimeout(obstacleSpawnInterval); 
    
    document.querySelectorAll('.obstacle').forEach(obstacle => {
        obstacle.style.animationPlayState = 'paused';
    });

    // High Score Check and Save
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('pawmpkinHighScore', highScore);
    }
    
    // Always update high score element content
    highScoreDisplay.textContent = `High Score: ${highScore}`;
    finalScoreDisplay.textContent = score; 
    
    // Show Game Over screen (which contains the high score element)
    gameOverScreen.style.display = 'flex'; 
}

// --- GAME RESET LOGIC (FINAL) ---
function resetGame() {
    document.querySelectorAll('.obstacle').forEach(obstacle => {
        obstacle.remove();
    });
    
    score = 0;
    scoreDisplay.textContent = 'Score: 0';
    isGameOver = true; 
    isJumping = false;
    cat.style.bottom = `${GROUND_HEIGHT}px`; 
    
    // Hide game over screen
    gameOverScreen.style.display = 'none';
    
    startMenu.style.display = 'flex'; 
    
    // Reload high score data (updates variable and element content)
    loadHighScore(); 
}


// --- START GAME LOGIC ---
function startGame() {
    isGameOver = false;

    startMenu.style.display = 'none';
    
    cat.style.visibility = 'visible';
    scoreDisplay.style.visibility = 'visible';
    // Removed visibility control for high score element

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
// Removed visibility control for high score element