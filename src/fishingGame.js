import * as THREE from 'three';

// Game state to track fishing activity
export const fishingGameState = {
  isNearFishingSpot: false,
  isFishing: false,
  interactionPromptVisible: false,
  fishingSign: null,
  fishingScene: null,
  fishingCamera: null,
  fishingRenderer: null,
  fishingRod: null,
  previousMovementState: null,
  isCasting: false,
  castingPhase: null,
  castingTime: 0,
  castingDuration: 0,
  playerInventory: {},
  castingTimeout: null
};

// Define fish types and their catch probabilities
export const fishTypes = {
  'Fathead Minnow': {
    probability: 0.6,
    image: '/assets/fish/fathead_minnow.jpg', // Path relative to public folder
    size: { min: '3cm', max: '8cm' }
  },
  'Bluegill': {
    probability: 0.25,
    image: '/assets/fish/bluegill.jpg',
    size: { min: '10cm', max: '25cm' }
  },
  'Largemouth Bass': {
    probability: 0.10,
    image: '/assets/fish/largemouth_bass.jpg',
    size: { min: '30cm', max: '60cm' }
  },
  'Channel Catfish': {
    probability: 0.05,
    image: '/assets/fish/channel_catfish.jpg',
    size: { min: '45cm', max: '100cm' }
  }
};

// Helper function to convert map coordinates to THREE.js position
export function coordsToPosition(coords, initialCenter) {
  return new THREE.Vector3(
    (coords[0] - initialCenter.lng) * 5000,
    0, // Set y to 0 (ground level)
    (coords[1] - initialCenter.lat) * 5000
  );
}

// Add fishing sign to the scene
export function addFishingSign(scene, map, initialCenter) {
  // Define fishing spot coordinates
  const fishingSpotCoords = [-76.590039, 40.152234];
  
  // Create a marker at the fishing spot location
  const el = document.createElement('div');
  el.className = 'fishing-marker';
  el.style.backgroundColor = '#e74c3c';
  el.style.width = '20px';
  el.style.height = '20px';
  el.style.borderRadius = '50%';
  el.style.border = '2px solid white';
  el.style.cursor = 'pointer';
  
  // Add the marker to the map
  try {
    const marker = new mapboxgl.Marker(el)
      .setLngLat(fishingSpotCoords)
      .setPopup(new mapboxgl.Popup().setHTML("<strong>Fishing Spot</strong><br>Press F to fish when nearby"))
      .addTo(map);
    
    console.log('Fishing marker added at coordinates:', fishingSpotCoords);
    
    // Store reference to the fishing spot position
    fishingGameState.fishingSign = {
      marker: marker,
      coordinates: fishingSpotCoords,
      position: coordsToPosition(fishingSpotCoords, initialCenter),
      interactionDistance: 50 // Increased distance in meters to make it easier to find
    };
    
    return marker;
  } catch (error) {
    console.error('Error adding fishing marker:', error);
    
    // Even if marker creation fails, still store the coordinates for interaction
    fishingGameState.fishingSign = {
      marker: null,
      coordinates: fishingSpotCoords,
      position: coordsToPosition(fishingSpotCoords, initialCenter),
      interactionDistance: 50 // Increased distance
    };
    
    return null;
  }
}

// Simplify the proximity check function
export function checkFishingSpotProximity(birdContainer, map) {
  if (!fishingGameState.fishingSign || !birdContainer || !map) {
    return;
  }
  
  // Get current player position and fishing spot position
  const playerCoords = map.getCenter();
  const spotCoords = fishingGameState.fishingSign.coordinates;
  
  // Calculate approximate distance in meters
  // This is a rough approximation that works for small distances
  const latDiff = Math.abs(playerCoords.lat - spotCoords[1]) * 111000; // 1 degree ≈ 111km
  const lngDiff = Math.abs(playerCoords.lng - spotCoords[0]) * 111000 * Math.cos(spotCoords[1] * Math.PI/180);
  const distanceInMeters = Math.sqrt(latDiff*latDiff + lngDiff*lngDiff);
  
  // Check if player is within interaction distance
  const wasNear = fishingGameState.isNearFishingSpot;
  fishingGameState.isNearFishingSpot = distanceInMeters < fishingGameState.fishingSign.interactionDistance;
  
  // Log the distance for debugging
  console.log(`Distance to fishing spot: ${distanceInMeters.toFixed(1)}m, Near: ${fishingGameState.isNearFishingSpot}`);
  
  // If player just entered the interaction zone
  if (!wasNear && fishingGameState.isNearFishingSpot) {
    showInteractionPrompt();
  } 
  // If player just left the interaction zone
  else if (wasNear && !fishingGameState.isNearFishingSpot) {
    hideInteractionPrompt();
  }
}

// Show the interaction prompt
export function showInteractionPrompt() {
  if (fishingGameState.interactionPromptVisible) return;
  
  const prompt = document.createElement('div');
  prompt.id = 'interaction-prompt';
  prompt.style.position = 'fixed';
  prompt.style.bottom = '20%';
  prompt.style.left = '50%';
  prompt.style.transform = 'translateX(-50%)';
  prompt.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  prompt.style.color = 'white';
  prompt.style.padding = '15px 25px';
  prompt.style.borderRadius = '5px';
  prompt.style.fontFamily = 'sans-serif';
  prompt.style.fontSize = '18px';
  prompt.style.zIndex = '1000';
  prompt.innerHTML = '<kbd>F</kbd> Press to Interact';
  
  document.body.appendChild(prompt);
  fishingGameState.interactionPromptVisible = true;
}

// Hide the interaction prompt
export function hideInteractionPrompt() {
  const prompt = document.getElementById('interaction-prompt');
  if (prompt) {
    document.body.removeChild(prompt);
    fishingGameState.interactionPromptVisible = false;
  }
}

// Open the fishing game
export function openFishingGame(movementState, switchBirdModel) {
  // Prevent player movement while fishing
  fishingGameState.previousMovementState = { ...movementState.bird };
  movementState.bird.forward = false;
  movementState.bird.backward = false;
  movementState.bird.left = false;
  movementState.bird.right = false;
  movementState.bird.isMoving = false;
  
  // Switch to still model
  switchBirdModel(false);
  
  // Create fishing game UI
  const fishingGameUI = document.createElement('div');
  fishingGameUI.id = 'fishing-game';
  fishingGameUI.style.position = 'fixed';
  fishingGameUI.style.top = '50%';
  fishingGameUI.style.left = '50%';
  fishingGameUI.style.transform = 'translate(-50%, -50%)';
  fishingGameUI.style.width = '700px';
  fishingGameUI.style.height = '500px';
  fishingGameUI.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  fishingGameUI.style.borderRadius = '10px';
  fishingGameUI.style.padding = '20px';
  fishingGameUI.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.7)';
  fishingGameUI.style.color = 'white';
  fishingGameUI.style.fontFamily = 'sans-serif';
  fishingGameUI.style.zIndex = '10000';
  fishingGameUI.style.display = 'flex';
  fishingGameUI.style.flexDirection = 'column';
  
  // Add header with title and close button
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '20px';
  
  const title = document.createElement('h2');
  title.textContent = 'Lake Placida Fishing';
  title.style.margin = '0';
  title.style.fontSize = '24px';
  
  const closeButton = document.createElement('button');
  closeButton.textContent = 'X';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.color = 'white';
  closeButton.style.fontSize = '24px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.padding = '5px 10px';
  closeButton.onclick = () => closeFishingGame(movementState);
  
  header.appendChild(title);
  header.appendChild(closeButton);
  
  // Add fishing spot information
  const infoSection = document.createElement('div');
  infoSection.style.marginBottom = '20px';
  infoSection.style.padding = '15px';
  infoSection.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  infoSection.style.borderRadius = '5px';
  
  const infoTitle = document.createElement('h3');
  infoTitle.textContent = 'Fish Species & Catch Rates';
  infoTitle.style.marginTop = '0';
  infoTitle.style.marginBottom = '10px';
  
  const fishList = document.createElement('ul');
  fishList.style.listStyleType = 'none';
  fishList.style.padding = '0';
  
  Object.entries(fishTypes).forEach(([name, data]) => {
    const listItem = document.createElement('li');
    listItem.style.display = 'flex';
    listItem.style.justifyContent = 'space-between';
    listItem.style.marginBottom = '5px';
    
    const fishName = document.createElement('span');
    fishName.textContent = name;
    
    const catchRate = document.createElement('span');
    catchRate.textContent = `${(data.probability * 100).toFixed(0)}%`;
    
    listItem.appendChild(fishName);
    listItem.appendChild(catchRate);
    fishList.appendChild(listItem);
  });
  
  infoSection.appendChild(infoTitle);
  infoSection.appendChild(fishList);
  
  // Add fishing game area
  const gameArea = document.createElement('div');
  gameArea.style.flex = '1';
  gameArea.style.position = 'relative';
  gameArea.style.backgroundColor = 'rgba(0, 120, 190, 0.3)';
  gameArea.style.borderRadius = '5px';
  gameArea.style.overflow = 'hidden';
  gameArea.style.display = 'flex';
  gameArea.style.flexDirection = 'column';
  gameArea.style.justifyContent = 'flex-end';
  gameArea.id = 'fishing-game-area';
  
  // Add water surface
  const waterSurface = document.createElement('div');
  waterSurface.style.width = '100%';
  waterSurface.style.height = '70%';
  waterSurface.style.background = 'linear-gradient(to bottom, rgba(0, 150, 255, 0.4), rgba(0, 50, 150, 0.6))';
  waterSurface.style.position = 'absolute';
  waterSurface.style.bottom = '0';
  gameArea.appendChild(waterSurface);
  
  // Add 3D view container for fishing visualization
  const fishingView = document.createElement('div');
  fishingView.id = 'fishing-view';
  fishingView.style.width = '100%';
  fishingView.style.height = '100%';
  fishingView.style.position = 'absolute';
  gameArea.appendChild(fishingView);
  
  // Add controls section
  const controlsSection = document.createElement('div');
  controlsSection.style.marginTop = '20px';
  controlsSection.style.display = 'flex';
  controlsSection.style.justifyContent = 'space-between';
  controlsSection.style.alignItems = 'center';
  
  const controlsInfo = document.createElement('div');
  controlsInfo.innerHTML = '<strong>Controls:</strong> Press <kbd>F</kbd> to cast your line | <kbd>ESC</kbd> to exit';
  controlsInfo.style.fontSize = '14px';
  
  const castButton = document.createElement('button');
  castButton.textContent = 'Cast Line';
  castButton.style.padding = '10px 20px';
  castButton.style.backgroundColor = '#4CAF50';
  castButton.style.color = 'white';
  castButton.style.border = 'none';
  castButton.style.borderRadius = '5px';
  castButton.style.cursor = 'pointer';
  castButton.style.fontSize = '16px';
  castButton.onclick = castFishingLine;
  
  controlsSection.appendChild(controlsInfo);
  controlsSection.appendChild(castButton);
  
  // Assemble the UI
  fishingGameUI.appendChild(header);
  fishingGameUI.appendChild(infoSection);
  fishingGameUI.appendChild(gameArea);
  fishingGameUI.appendChild(controlsSection);
  
  document.body.appendChild(fishingGameUI);
  
  // Initialize the 3D fishing scene
  initializeFishingScene();
  
  // Update game state
  fishingGameState.isFishing = true;
  
  // Hide the interaction prompt
  hideInteractionPrompt();
}

// Close the fishing game
export function closeFishingGame(movementState) {
  // Clear any active timeouts
  if (fishingGameState.castingTimeout) {
    clearTimeout(fishingGameState.castingTimeout);
    fishingGameState.castingTimeout = null;
  }
  
  // Remove fishing game UI
  const fishingGameUI = document.getElementById('fishing-game');
  if (fishingGameUI) {
    document.body.removeChild(fishingGameUI);
  }
  
  // Clean up fishing scene
  cleanupFishingScene();
  
  // Restore movement state
  if (fishingGameState.previousMovementState) {
    movementState.bird = { ...fishingGameState.previousMovementState };
  }
  
  // Update game state
  fishingGameState.isFishing = false;
  
  // Show interaction prompt if still near
  if (fishingGameState.isNearFishingSpot) {
    showInteractionPrompt();
  }
}

// Cast the fishing line
export function castFishingLine() {
  if (!fishingGameState.isFishing || fishingGameState.isCasting) return;
  
  console.log('Casting fishing line');
  
  // Set casting state
  fishingGameState.isCasting = true;
  fishingGameState.castingPhase = 'start';
  fishingGameState.castingTime = 0;
  fishingGameState.castingDuration = 3; // seconds for waiting phase
  
  // Add a safety timeout in case something gets stuck
  fishingGameState.castingTimeout = setTimeout(() => {
    if (fishingGameState.isCasting && fishingGameState.castingPhase !== 'caught') {
      console.log('Casting timed out - forcing fish catch');
      catchFish();
    }
  }, 10000); // 10 seconds timeout
  
  // Disable cast button during casting
  const castButton = document.querySelector('#fishing-game button');
  if (castButton) {
    castButton.disabled = true;
    castButton.style.backgroundColor = '#999';
  }
  
  // Show casting message
  const gameArea = document.getElementById('fishing-game-area');
  const castingMessage = document.createElement('div');
  castingMessage.id = 'casting-message';
  castingMessage.textContent = 'Casting...';
  castingMessage.style.position = 'absolute';
  castingMessage.style.top = '20px';
  castingMessage.style.left = '50%';
  castingMessage.style.transform = 'translateX(-50%)';
  castingMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  castingMessage.style.color = 'white';
  castingMessage.style.padding = '10px 20px';
  castingMessage.style.borderRadius = '5px';
  castingMessage.style.zIndex = '10';
  
  if (gameArea) {
    gameArea.appendChild(castingMessage);
  }
  
  // Start casting animation
  startCastingAnimation();
}

// Start the casting animation
function startCastingAnimation() {
  // Reset rod position
  if (fishingGameState.fishingRod) {
    fishingGameState.fishingRod.rotation.x = -Math.PI / 4;
  }
}

// Initialize the 3D fishing scene
function initializeFishingScene() {
  const container = document.getElementById('fishing-view');
  if (!container) return;
  
  // Create new scene
  fishingGameState.fishingScene = new THREE.Scene();
  
  // Create camera
  fishingGameState.fishingCamera = new THREE.PerspectiveCamera(
    60, container.clientWidth / container.clientHeight, 0.1, 1000
  );
  fishingGameState.fishingCamera.position.set(0, 2, 5);
  fishingGameState.fishingCamera.lookAt(0, 0, 0);
  
  // Create renderer
  fishingGameState.fishingRenderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true 
  });
  fishingGameState.fishingRenderer.setSize(container.clientWidth, container.clientHeight);
  fishingGameState.fishingRenderer.setClearColor(0x000000, 0);
  container.appendChild(fishingGameState.fishingRenderer.domElement);
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  fishingGameState.fishingScene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7);
  fishingGameState.fishingScene.add(directionalLight);
  
  // Load fishing rod model
  loadFishingRod();
  
  // Start animation loop
  animateFishingScene();
}

// Load fishing rod model
function loadFishingRod() {
  // Create a simple fishing rod for now
  const rodGroup = new THREE.Group();
  
  // Create rod pole
  const rodGeometry = new THREE.CylinderGeometry(0.05, 0.03, 4, 8);
  const rodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const rod = new THREE.Mesh(rodGeometry, rodMaterial);
  rod.rotation.x = Math.PI / 2;
  rod.position.z = -2;
  rodGroup.add(rod);
  
  // Create fishing line
  fishingGameState.fishingLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -3, 0)
    ]),
    new THREE.LineBasicMaterial({ color: 0xFFFFFF })
  );
  fishingGameState.fishingLine.position.set(0, 0, 2);
  rodGroup.add(fishingGameState.fishingLine);
  
  // Create hook
  const hookGeometry = new THREE.TorusGeometry(0.1, 0.02, 8, 12, Math.PI);
  const hookMaterial = new THREE.MeshStandardMaterial({ color: 0xCCCCCC });
  fishingGameState.fishingHook = new THREE.Mesh(hookGeometry, hookMaterial);
  fishingGameState.fishingHook.position.set(0, -3, 0);
  fishingGameState.fishingHook.rotation.x = Math.PI / 2;
  fishingGameState.fishingLine.add(fishingGameState.fishingHook);
  
  // Position the rod
  rodGroup.position.set(0, 1, 0);
  rodGroup.rotation.x = -Math.PI / 4;
  
  // Add to scene
  fishingGameState.fishingRod = rodGroup;
  fishingGameState.fishingScene.add(rodGroup);
}

// Animate the fishing scene
function animateFishingScene() {
  if (!fishingGameState.isFishing) return;
  
  requestAnimationFrame(animateFishingScene);
  
  // Handle rod animations if any
  if (fishingGameState.isCasting) {
    handleCastingAnimation();
  }
  
  // Render scene
  if (fishingGameState.fishingRenderer && fishingGameState.fishingScene && fishingGameState.fishingCamera) {
    fishingGameState.fishingRenderer.render(fishingGameState.fishingScene, fishingGameState.fishingCamera);
  }
}

// Clean up the fishing scene
function cleanupFishingScene() {
  if (fishingGameState.fishingRenderer) {
    const container = document.getElementById('fishing-view');
    if (container && container.contains(fishingGameState.fishingRenderer.domElement)) {
      container.removeChild(fishingGameState.fishingRenderer.domElement);
    }
    
    fishingGameState.fishingRenderer.dispose();
    fishingGameState.fishingRenderer = null;
  }
  
  fishingGameState.fishingScene = null;
  fishingGameState.fishingCamera = null;
  fishingGameState.fishingRod = null;
  fishingGameState.fishingLine = null;
  fishingGameState.fishingHook = null;
  fishingGameState.isCasting = false;
}

// Handle the casting animation
function handleCastingAnimation() {
  if (!fishingGameState.isCasting) return;
  
  fishingGameState.castingTime += 1/60; // Assuming 60fps
  
  console.log(`Casting phase: ${fishingGameState.castingPhase}, Time: ${fishingGameState.castingTime.toFixed(2)}`);
  
  // Update casting animation based on phase
  if (fishingGameState.castingPhase === 'start' && fishingGameState.castingTime < 0.5) {
    // Starting phase - pull back rod
    if (fishingGameState.fishingRod) {
      fishingGameState.fishingRod.rotation.x = -Math.PI/4 - (fishingGameState.castingTime * Math.PI/4);
    }
  }
  else if (fishingGameState.castingPhase === 'start' && fishingGameState.castingTime >= 0.5) {
    // Cast forward
    console.log("Transitioning to CAST phase");
    fishingGameState.castingPhase = 'cast';
    fishingGameState.castingTime = 0;
  }
  else if (fishingGameState.castingPhase === 'cast' && fishingGameState.castingTime < 0.3) {
    // Fast forward motion
    if (fishingGameState.fishingRod) {
      fishingGameState.fishingRod.rotation.x = -Math.PI/2 + (fishingGameState.castingTime * Math.PI/2);
    }
  }
  else if (fishingGameState.castingPhase === 'cast' && fishingGameState.castingTime >= 0.3) {
    // Line in water phase
    console.log("Transitioning to WAIT phase");
    fishingGameState.castingPhase = 'wait';
    fishingGameState.castingTime = 0;
    
    // Update the message
    const castingMessage = document.getElementById('casting-message');
    if (castingMessage) {
      castingMessage.textContent = 'Waiting for fish...';
    }
  }
  else if (fishingGameState.castingPhase === 'wait' && fishingGameState.castingTime >= fishingGameState.castingDuration) {
    // Fish caught!
    console.log("Transitioning to CAUGHT phase");
    fishingGameState.castingPhase = 'caught';
    catchFish();
  }
}

// Catch a fish based on probabilities
function catchFish() {
  // Clear the safety timeout
  if (fishingGameState.castingTimeout) {
    clearTimeout(fishingGameState.castingTimeout);
    fishingGameState.castingTimeout = null;
  }
  
  // Determine which fish is caught
  const random = Math.random();
  let cumulativeProbability = 0;
  let caughtFish = null;
  
  for (const [fishName, fishData] of Object.entries(fishTypes)) {
    cumulativeProbability += fishData.probability;
    
    if (random <= cumulativeProbability) {
      caughtFish = { name: fishName, ...fishData };
      break;
    }
  }
  
  if (!caughtFish) {
    caughtFish = { 
      name: "Fathead Minnow", 
      ...fishTypes["Fathead Minnow"] 
    }; // Fallback just in case
  }
  
  console.log('Caught fish:', caughtFish.name);
  
  // Update casting message
  const castingMessage = document.getElementById('casting-message');
  if (castingMessage) {
    castingMessage.textContent = `You caught a ${caughtFish.name}!`;
    castingMessage.style.backgroundColor = 'rgba(76, 175, 80, 0.8)'; // Green background
  }
  
  // Add to inventory
  addToInventory(caughtFish.name);
  
  // Show caught fish
  showCaughtFish(caughtFish);
  
  // Reset casting after a delay
  setTimeout(() => {
    fishingGameState.isCasting = false;
    
    // Remove casting message
    if (castingMessage) {
      castingMessage.parentNode.removeChild(castingMessage);
    }
    
    // Re-enable cast button
    const castButton = document.querySelector('#fishing-game button');
    if (castButton) {
      castButton.disabled = false;
      castButton.style.backgroundColor = '#4CAF50';
    }
  }, 3000);
}

// Add to player's inventory
function addToInventory(fishName) {
  console.log('Adding to inventory:', fishName);
  
  // Initialize the fish count if it doesn't exist
  if (!fishingGameState.playerInventory[fishName]) {
    fishingGameState.playerInventory[fishName] = 0;
  }
  
  // Increment the count
  fishingGameState.playerInventory[fishName]++;
  
  console.log('Updated inventory:', fishingGameState.playerInventory);
}

// Show the caught fish in the scene
function showCaughtFish(fish) {
  // Remove any existing fish
  const existingFish = fishingGameState.fishingScene.getObjectByName('caught-fish');
  if (existingFish) {
    fishingGameState.fishingScene.remove(existingFish);
  }
  
  // Create a simple fish model based on the fish type
  const fishGroup = new THREE.Group();
  fishGroup.name = 'caught-fish';
  
  // Create fish body
  const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.1, 1, 8);
  bodyGeometry.rotateZ(Math.PI / 2);
  
  // Choose color based on fish type
  let fishColor;
  switch(fish.name) {
    case 'Fathead Minnow':
      fishColor = 0xC0C0C0; // Silver
      break;
    case 'Bluegill':
      fishColor = 0x4169E1; // Blue
      break;
    case 'Largemouth Bass':
      fishColor = 0x556B2F; // Dark olive green
      break;
    case 'Channel Catfish':
      fishColor = 0x696969; // Dark gray
      break;
    default:
      fishColor = 0xAAAAAA;
  }
  
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: fishColor });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  fishGroup.add(body);
  
  // Create tail
  const tailGeometry = new THREE.ConeGeometry(0.3, 0.5, 8);
  tailGeometry.rotateZ(-Math.PI / 2);
  const tailMaterial = new THREE.MeshStandardMaterial({ color: fishColor });
  const tail = new THREE.Mesh(tailGeometry, tailMaterial);
  tail.position.x = -0.7;
  fishGroup.add(tail);
  
  // Create eyes
  const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  
  // Left eye
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(0.4, 0.15, 0.15);
  fishGroup.add(leftEye);
  
  const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), pupilMaterial);
  leftPupil.position.set(0.43, 0.15, 0.15);
  fishGroup.add(leftPupil);
  
  // Right eye
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.4, 0.15, -0.15);
  fishGroup.add(rightEye);
  
  const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), pupilMaterial);
  rightPupil.position.set(0.43, 0.15, -0.15);
  fishGroup.add(rightPupil);
  
  // Scale fish based on type (bigger fish are rarer)
  let scale = 1;
  switch(fish.name) {
    case 'Fathead Minnow':
      scale = 0.8;
      break;
    case 'Bluegill':
      scale = 1.0;
      break;
    case 'Largemouth Bass':
      scale = 1.3;
      break;
    case 'Channel Catfish':
      scale = 1.6;
      break;
  }
  
  fishGroup.scale.set(scale, scale, scale);
  
  // Position the fish near the hook
  fishGroup.position.set(0, -3, 0);
  
  // Add fish to the scene
  fishingGameState.fishingScene.add(fishGroup);
  
  // Create a simple animation to make the fish appear to wiggle
  animateCaughtFish(fishGroup);
}

// Animate the caught fish
function animateCaughtFish(fishGroup) {
  let wiggleTime = 0;
  
  function wiggle() {
    if (!fishingGameState.isFishing || !fishGroup.parent) return;
    
    wiggleTime += 0.1;
    
    // Simple wiggle animation
    fishGroup.rotation.y = Math.sin(wiggleTime * 5) * 0.2;
    
    requestAnimationFrame(wiggle);
  }
  
  wiggle();
}

// That's all for the first file section
// We'll continue with more functions in further steps 