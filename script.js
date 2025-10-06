
const cat = document.getElementById('cat');
const scoreDisplay = document.getElementById('score');
const startMenu = document.getElementById('start-menu');
const startButton = document.getElementById('start-button');
const gameContainer = document.getElementById('game-container'); 
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const playAgainButton = document.getElementById('play-again-button');

let isJumping = false;
let score = 0;
let isGameOver = true; 
let gameLoopInterval;
let catAnimationInterval;
let obstacleSpawnInterval;
let frameToggle = true;

const GROUND_HEIGHT = 10;
const MAX_JUMP_HEIGHT = 90;


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

// --- DYNAMIC OBSTACLE SPAWNING LOGIC ---
function createPumpkin() {
    const newPumpkin = document.createElement('div');
    newPumpkin.classList.add('obstacle'); 
    
    newPumpkin.style.bottom = `${GROUND_HEIGHT}px`; 
    newPumpkin.style.animation = 'obstacleMove 2s linear'; 
    
    gameContainer.appendChild(newPumpkin);

    setTimeout(() => {
        // Only update score if the game is NOT over
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


// --- COLLISION & SCORE CHECK LOGIC ---
function checkCollision() {
    if (isGameOver) return;
    
    const fullCatRect = cat.getBoundingClientRect();
    const gameContainerRect = gameContainer.getBoundingClientRect();
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


// --- GAME OVER LOGIC ---
function gameOver() {
    isGameOver = true;
    
    clearInterval(gameLoopInterval);
    clearInterval(catAnimationInterval); 
    clearTimeout(obstacleSpawnInterval); 
    
    document.querySelectorAll('.obstacle').forEach(obstacle => {
        obstacle.style.animationPlayState = 'paused';
    });
    
    finalScoreDisplay.textContent = score; 
    gameOverScreen.style.display = 'flex'; 
}

// --- GAME RESET LOGIC ---
function resetGame() {
    document.querySelectorAll('.obstacle').forEach(obstacle => {
        obstacle.remove();
    });
    
    score = 0;
    scoreDisplay.textContent = 'Score: 0';
    isGameOver = true; 
    isJumping = false;
    cat.style.bottom = `${GROUND_HEIGHT}px`; 
    
    gameOverScreen.style.display = 'none';
    
    startMenu.style.display = 'flex'; 
}


// --- START GAME LOGIC ---
function startGame() {
    isGameOver = false;

    // Hides the start menu when playing
    startMenu.style.display = 'none';
    
    cat.style.visibility = 'visible';
    scoreDisplay.style.visibility = 'visible';

    // Focus for spacebar input
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

// Jump listeners
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
// Ensure the cat starts at the correct ground level immediately on load
cat.style.bottom = `${GROUND_HEIGHT}px`;