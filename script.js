// ====================================================================
// PAW-MPKIN PATCH: A FELINE FALL FRENZY - GAME LOGIC (script.js)
// ====================================================================

// 1. SELECT NECESSARY ELEMENTS FROM THE DOM
const cat = document.getElementById('cat');
const pumpkin = document.getElementById('pumpkin'); // This is no longer used for spawning, but remains if you haven't deleted it from HTML
const scoreDisplay = document.getElementById('score');
const startMenu = document.getElementById('start-menu');
const startButton = document.getElementById('start-button');
const gameContainer = document.getElementById('game-container'); 

// 2. GAME STATE VARIABLES AND INTERVALS
let isJumping = false;
let score = 0;
let isGameOver = true; // Start as true so the game won't run until the button is clicked
let gameLoopInterval;      // For collision and scoring
let catAnimationInterval;  // For the cat's running animation
let obstacleSpawnInterval; // For creating new pumpkins
let frameToggle = true;    // State to track which cat animation frame to show

const GROUND_HEIGHT = 10; // Corresponds to the 'bottom: 10px' in CSS
const MAX_JUMP_HEIGHT = 90; // The height the cat reaches (90px above the ground)


// --- CAT RUNNING ANIMATION LOGIC ---
function animateCatRun() {
    if (!isGameOver) {
        // Toggle the background image source between FCat1.png and FCat2.png
        if (frameToggle) {
            cat.style.backgroundImage = "url('images/FCat2.png')";
        } else {
            cat.style.backgroundImage = "url('images/FCat1.png')";
        }
        frameToggle = !frameToggle; // Flip the state
    }
}


// --- DYNAMIC OBSTACLE SPAWNING LOGIC ---
function createPumpkin() {
    const newPumpkin = document.createElement('div');
    newPumpkin.classList.add('obstacle'); 
    
    // Set initial CSS properties (must match .obstacle class in CSS)
    newPumpkin.style.bottom = `${GROUND_HEIGHT}px`; 
    
    // Apply the pumpkin's movement animation (must match CSS keyframes name)
    // NOTE: If you increase the speed here (shorter duration), the collision check MUST be faster too.
    newPumpkin.style.animation = 'obstacleMove 2s linear'; 
    
    gameContainer.appendChild(newPumpkin);

    // Clean up: Remove the pumpkin element after its animation finishes
    // This prevents memory bloat by cleaning up off-screen elements.
    setTimeout(() => {
        newPumpkin.remove();
    }, 2000); // 2000ms matches the animation duration
}

// Recursive function to continuously spawn pumpkins at random intervals
function spawnLoop() {
    // Randomize the time before the next pumpkin appears (between 1.2s and 2.5s)
    const randomTime = Math.random() * (2500 - 1200) + 1200;
    
    obstacleSpawnInterval = setTimeout(() => {
        createPumpkin();
        if (!isGameOver) {
            spawnLoop(); // Call itself to continue the spawning cycle
        }
    }, randomTime);
}


// --- JUMP LOGIC ---
function jump() {
    // Only jump if game is running and cat isn't already in the air
    if (isJumping || isGameOver) {
        return; 
    }
    
    isJumping = true;
    // Start position is always the ground height
    let position = GROUND_HEIGHT; 
    
    // Timer for the jump up animation
    let upInterval = setInterval(() => {
        if (position >= (GROUND_HEIGHT + MAX_JUMP_HEIGHT)) {
            clearInterval(upInterval);
            
            // Start coming down
            let downInterval = setInterval(() => {
                // Land back on the ground level
                if (position <= GROUND_HEIGHT) { 
                    clearInterval(downInterval);
                    isJumping = false;
                    cat.style.bottom = `${GROUND_HEIGHT}px`; 
                    return;
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


// --- COLLISION CHECK LOGIC ---
function checkCollision() {
    if (isGameOver) return;
    
    const catRect = cat.getBoundingClientRect();
    
    // Loop through ALL dynamically spawned obstacles
    const obstacles = document.querySelectorAll('.obstacle');
    
    obstacles.forEach(pumpkin => {
        const pumpkinRect = pumpkin.getBoundingClientRect();
        
        // Collision detection logic
        if (
            // Horizontal Overlap: Is the cat's left edge past the pumpkin's left edge, AND 
            // the cat's right edge before the pumpkin's right edge?
            catRect.left < pumpkinRect.right && 
            catRect.right > pumpkinRect.left && 
            
            // Vertical Overlap: Is the cat's bottom edge below the pumpkin's top edge (i.e., touching the ground), AND
            // the cat's top edge above the pumpkin's bottom edge?
            catRect.bottom > pumpkinRect.top &&
            catRect.top < pumpkinRect.bottom
        ) {
            gameOver();
        }
    });
}

// --- START GAME LOGIC ---
function startGame() {
    isGameOver = false;

    // 1. Hide the menu and show the game elements
    startMenu.style.display = 'none';
    cat.style.visibility = 'visible';
    scoreDisplay.style.visibility = 'visible';

    // 2. Start all game loop elements
    catAnimationInterval = setInterval(animateCatRun, 100); 
    spawnLoop(); // Starts the recursive pumpkin spawning
    
    // Start the collision loop
    gameLoopInterval = setInterval(checkCollision, 10); 
}


// --- GAME OVER LOGIC ---
function gameOver() {
    isGameOver = true;
    
    // Stop all game loops
    clearInterval(gameLoopInterval);
    clearInterval(catAnimationInterval); 
    clearTimeout(obstacleSpawnInterval); 
    
    // Freeze all on-screen pumpkins
    document.querySelectorAll('.obstacle').forEach(obstacle => {
        obstacle.style.animationPlayState = 'paused';
    });
    
    alert(`Game Over! Your final score is: ${score}. Refresh to play again!`);
    
    // TODO: You will want to replace this alert with a styled 'Game Over' screen
    // and a 'Play Again' button later!
}


// --- EVENT LISTENERS ---

// Listener to start the game
startButton.addEventListener('click', startGame);

// Jump listeners (only active if the game has started)
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