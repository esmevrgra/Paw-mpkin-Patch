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
//machine learning (attempt)
let detector;
let videoElement;
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

let highScore = 0;
let currentStage = 1;      // Stage 1 = Singular Pumpkins
let stageScoreCounter = 0; // Counter for current stage goal (5)

const GROUND_HEIGHT = 10;
const MAX_JUMP_HEIGHT = 90;
// CRITICAL FIX: INCREASED to 130 to safely clear the Ghost's 124px height.
const MAX_JUMP_HEIGHT_BOOST = 150;


//machine learning(attempt)
// REPLACE your existing setupWebcamAndML() function with this:
async function setupWebcamAndML() {
    // 1. Setup Video Element (hidden or background)
    videoElement = document.createElement('video');
    videoElement.width = VIDEO_WIDTH;
    videoElement.height = VIDEO_HEIGHT;
    videoElement.autoplay = true;
    
    // IMPORTANT: Temporarily append the video element to the body 
    // to ensure the browser registers it as part of the document.
    document.body.appendChild(videoElement);
    videoElement.style.display = 'none'; 

    try {
        // 2. Load the Hand Pose Detection Model
        const model = handPoseDetection.SupportedModels.MediaPipeHands;
        const detectorConfig = {
            runtime: 'mediapipe', // Use the optimized Mediapipe backend
            modelType: 'full'
        };
        // This is a time-consuming step; it may cause a delay.
        detector = await handPoseDetection.createDetector(model, detectorConfig);

        // 3. Start Webcam Stream - This is where the permission prompt happens
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;
        
        await new Promise((resolve) => {
            videoElement.onloadedmetadata = resolve;
        });

        // 4. Start the detection loop
        detectHandsLoop();
        
    } catch (error) {
        // --- CRITICAL ERROR LOGGING ---
        console.error("Webcam or ML Setup Failed:", error);

        // Alert the user with a clearer message
        let errorMessage = "Webcam access failed! Please check:";
        if (error.name === "NotAllowedError") {
            errorMessage += "\n1. Did you deny camera permission?";
            errorMessage += "\n2. Did you accidentally block it for this site?";
        } else if (error.name === "NotFoundError") {
            errorMessage += "\n1. Is your camera connected and working?";
        } else {
            errorMessage += "\n1. Is your browser blocking the camera (check the URL bar)?";
            errorMessage += "\n2. Are you running from http://localhost:8000?";
        }
        
        // This alert helps the user debug without opening the console
        alert(errorMessage); 
        
        // Disable ML control fallback:
        // You might want to re-enable your keyboard/click jump listeners here if it fails
        
        // Return to prevent the detection loop from starting
        return; 
    }
}

//machine learning (attempt)
// --- MACHINE LEARNING HAND DETECTION LOOP (NEW CODE) ---
async function detectHandsLoop() {
    // Stop the detection loop if the game is over
    if (isGameOver) {
        return;
    }
    
    // Check if the detector has been loaded
    if (detector) {
        // 1. Detect hands in the current video frame
        // Use the video element to feed the frame to the model
        const hands = await detector.estimateHands(videoElement, { flipHorizontal: false });

        if (hands.length > 0) {
            // Find the tip of the index finger (this is landmark keypoint index 8)
            const indexTip = hands[0].keypoints.find(kp => kp.name === 'index_finger_tip');

            if (indexTip) {
                // 2. Define the Z-axis threshold for triggering a jump. 
                // A negative Z-value means the finger is closer to the camera.
                const Z_THRESHOLD = -20; // Adjust this value for sensitivity 
                
                // 3. Trigger the jump if the finger is "pushed" toward the camera (Z-axis condition)
                if (indexTip.z < Z_THRESHOLD && !isJumping) {
                    // Call your existing jump function
                    jump(); 
                }
            }
        }
    }

    // Loop the detection process for the next video frame
    requestAnimationFrame(detectHandsLoop);
}


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
            case 5: // Sequential Mix (Ghost after every 2 pumpkins) hi
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
    console.log('Jump triggered');
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
    isGameOver = false; // Set this first

    startMenu.style.display = 'none';
    
    cat.style.visibility = 'visible';
    scoreDisplay.style.visibility = 'visible';

    // NEW: Start the webcam and ML model when the game starts
    setupWebcamAndML(); 

    gameContainer.focus(); // Focus for keyboard input (if kept)

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
    gameOverScreen.style.display = 'none';
    startMenu.style.display = 'flex';
    resetGame(); // Reset game state but stay on menu
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
    // Prevent default browser actions like scrolling/zooming on the game area
    event.preventDefault(); 
    if (!isGameOver) {
        jump();
    }
});



// --- INITIALIZATION ---
cat.style.bottom = `${GROUND_HEIGHT}px`;
loadHighScore();