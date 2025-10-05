// 1. Select the necessary elements from the DOM
const cat = document.getElementById('cat');
const pumpkin = document.getElementById('pumpkin');
const scoreDisplay = document.getElementById('score');
// NEW: Select menu elements
const startMenu = document.getElementById('start-menu');
const startButton = document.getElementById('start-button');
const gameContainer = document.getElementById('game-container'); // Keep this for the click listener

// Game State variables
let isJumping = false;
let score = 0;
let isGameOver = false;

// Intervals
let gameLoopInterval;

// --- NEW: START GAME LOGIC ---
function startGame() {
    // 1. Hide the menu and show the game elements
    startMenu.style.display = 'none';
    cat.style.visibility = 'visible';
    pumpkin.style.visibility = 'visible';
    scoreDisplay.style.visibility = 'visible';

    // 2. Start the game logic
    startPumpkin(); // Begin moving the obstacles
    
    // 3. Start the collision/game loop
    gameLoopInterval = setInterval(() => {
        if (!isGameOver) {
            checkCollision();
            // Optional: Increment score here or in a separate scoring function
        }
    }, 10); 
}

// Event listener for the start button
startButton.addEventListener('click', startGame);

// Event listeners for movement (Spacebar for desktop, click/tap for mobile)
// NOTE: We should modify these to only jump if the game has started
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && startMenu.style.display === 'none') {
        jump();
    }
});

gameContainer.addEventListener('click', () => {
    if (startMenu.style.display === 'none') {
        jump();
    }
});


// --- JUMP LOGIC (NO CHANGE) ---
function jump() {
    if (isJumping || isGameOver) {
        return; 
    }
    // ... (rest of the jump function code) ...
    isJumping = true;
    let position = 0;
    // Timer to handle the jump up/down animation
    let upInterval = setInterval(() => {
        if (position >= 90) { // Max jump height
            clearInterval(upInterval);
            // Start coming down
            let downInterval = setInterval(() => {
                if (position <= 0) { // Back on the ground
                    clearInterval(downInterval);
                    isJumping = false;
                }
                position -= 5;
                cat.style.bottom = position + 'px';
            }, 20); // Speed of the fall
        }
        
        // Going up
        position += 5;
        cat.style.bottom = position + 'px';
    }, 20); // Speed of the jump
}


// --- OBSTACLE MOVEMENT & COLLISION (SLIGHT CHANGE TO REMOVE AUTORUN) ---

// Function to start the pumpkin animation (movement)
function startPumpkin() {
    // Apply the CSS animation defined in style.css
    pumpkin.style.animation = 'obstacleMove 2s infinite linear';
}

// Function to check for collisions
function checkCollision() {
    if (isGameOver) return;
    
    const catRect = cat.getBoundingClientRect();
    const pumpkinRect = pumpkin.getBoundingClientRect();
    
    if (
        catRect.left < pumpkinRect.right && 
        catRect.right > pumpkinRect.left && 
        catRect.bottom > pumpkinRect.top &&
        catRect.top < pumpkinRect.bottom
    ) {
        gameOver();
    }
}

// --- GAME OVER LOGIC (SLIGHT CHANGE) ---
function gameOver() {
    isGameOver = true;
    clearInterval(gameLoopInterval);
    pumpkin.style.animationPlayState = 'paused'; 
    
    // Optional: Bring the menu back up for a 'Play Again' button
    
    alert(`Game Over! Your final score is: ${score}. Refresh to play again!`);
}

// --- INITIAL STATE ---
// We removed the automatic calls to startPumpkin() and the setInterval loop
// because they are now controlled by the startGame() function.