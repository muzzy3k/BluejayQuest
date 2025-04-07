import * as THREE from 'three';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from './config.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

"use strict";

(function () {
  // Add a variable to track the selected character model
  let selectedCharacter = '';
  const modelSets = {
    'original': {
      standing: '/assets/Standing.fbx',
      walking: '/assets/Walking.fbx'
    },
    'b': {
      standing: '/assets/StandingB.fbx',
      walking: '/assets/WalkingB.fbx'
    }
  };
  
  // Create character selection screen
  const characterSelectionScreen = document.createElement('div');
  characterSelectionScreen.id = 'character-selection-screen';
  characterSelectionScreen.style.position = 'fixed';
  characterSelectionScreen.style.top = '0';
  characterSelectionScreen.style.left = '0';
  characterSelectionScreen.style.width = '100%';
  characterSelectionScreen.style.height = '100%';
  characterSelectionScreen.style.backgroundColor = '#333';
  characterSelectionScreen.style.display = 'flex';
  characterSelectionScreen.style.flexDirection = 'column';
  characterSelectionScreen.style.justifyContent = 'center';
  characterSelectionScreen.style.alignItems = 'center';
  characterSelectionScreen.style.zIndex = '10000';
  
  // Create a header
  const header = document.createElement('h1');
  header.textContent = 'Select Your Character';
  header.style.color = 'white';
  header.style.fontFamily = 'sans-serif';
  header.style.marginBottom = '40px';
  
  // Create container for characters
  const charactersContainer = document.createElement('div');
  charactersContainer.style.display = 'flex';
  charactersContainer.style.justifyContent = 'space-around';
  charactersContainer.style.width = '80%';
  charactersContainer.style.maxWidth = '800px';
  
  // Create character options with preview
  for (const [key, value] of Object.entries(modelSets)) {
    const characterOption = document.createElement('div');
    characterOption.classList.add('character-option');
    characterOption.style.display = 'flex';
    characterOption.style.flexDirection = 'column';
    characterOption.style.alignItems = 'center';
    characterOption.style.cursor = 'pointer';
    characterOption.style.padding = '20px';
    characterOption.style.borderRadius = '10px';
    characterOption.style.transition = 'background-color 0.3s';
    
    // Preview area (will be filled with THREE.js)
    const previewArea = document.createElement('div');
    previewArea.classList.add('preview-area');
    previewArea.style.width = '300px';
    previewArea.style.height = '300px';
    previewArea.style.backgroundColor = '#222';
    previewArea.style.borderRadius = '5px';
    previewArea.style.marginBottom = '15px';
    previewArea.dataset.character = key;
    
    // Character name
    const characterName = document.createElement('h2');
    characterName.textContent = key === 'original' ? 'Blue' : 'Pink';
    characterName.style.color = 'white';
    characterName.style.fontFamily = 'sans-serif';
    
    // Selection indicator
    const selectionIndicator = document.createElement('div');
    selectionIndicator.classList.add('selection-indicator');
    selectionIndicator.textContent = 'Select';
    selectionIndicator.style.backgroundColor = key === 'original' ? '#3498db' : '#e74c3c';
    selectionIndicator.style.color = 'white';
    selectionIndicator.style.padding = '8px 20px';
    selectionIndicator.style.borderRadius = '5px';
    selectionIndicator.style.marginTop = '10px';
    selectionIndicator.style.fontFamily = 'sans-serif';
    
    characterOption.appendChild(previewArea);
    characterOption.appendChild(characterName);
    characterOption.appendChild(selectionIndicator);
    
    // Handle click to select character
    characterOption.addEventListener('click', () => {
      // Remove highlight from all options
      document.querySelectorAll('.character-option').forEach(option => {
        option.style.backgroundColor = 'transparent';
      });
      
      // Highlight selected option
      characterOption.style.backgroundColor = 'rgba(255,255,255,0.1)';
      
      // Set the selected character
      selectedCharacter = key;
    });
    
    charactersContainer.appendChild(characterOption);
  }
  
  // Create start button
  const startButton = document.createElement('button');
  startButton.textContent = 'Start Game';
  startButton.style.marginTop = '40px';
  startButton.style.padding = '12px 30px';
  startButton.style.borderRadius = '5px';
  startButton.style.backgroundColor = '#4CAF50';
  startButton.style.color = 'white';
  startButton.style.border = 'none';
  startButton.style.fontSize = '18px';
  startButton.style.cursor = 'pointer';
  startButton.style.fontFamily = 'sans-serif';
  startButton.style.transition = 'background-color 0.3s';
  
  startButton.addEventListener('mouseover', () => {
    startButton.style.backgroundColor = '#45a049';
  });
  
  startButton.addEventListener('mouseout', () => {
    startButton.style.backgroundColor = '#4CAF50';
  });
  
  // Add components to selection screen
  characterSelectionScreen.appendChild(header);
  characterSelectionScreen.appendChild(charactersContainer);
  characterSelectionScreen.appendChild(startButton);
  
  // Add selection screen to the document body
  document.body.appendChild(characterSelectionScreen);
  
  // Initialize THREE.js for character previews
  const previewRenderers = {};
  const previewScenes = {};
  const previewCameras = {};
  
  // Set up preview scenes for each character
  function setupCharacterPreviews() {
    document.querySelectorAll('.preview-area').forEach(previewArea => {
      const character = previewArea.dataset.character;
      
      // Create scene
      const scene = new THREE.Scene();
      previewScenes[character] = scene;
      
      // Create camera
      const camera = new THREE.PerspectiveCamera(
        45, previewArea.clientWidth / previewArea.clientHeight, 0.1, 1000
      );
      camera.position.set(0, 2, 5);
      previewCameras[character] = camera;
      
      // Create renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(previewArea.clientWidth, previewArea.clientHeight);
      renderer.setClearColor(0x222222);
      previewArea.appendChild(renderer.domElement);
      previewRenderers[character] = renderer;
      
      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Increased from 0.5 to 0.8
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Increased from 0.8 to 1.0
      directionalLight.position.set(0, 10, 10);
      scene.add(directionalLight);
      
      // Add a secondary light from another angle for better model illumination
      const secondaryLight = new THREE.DirectionalLight(0xffffff, 0.6);
      secondaryLight.position.set(5, 5, -10); // Light from opposite side
      scene.add(secondaryLight);
      
      // Optional: Add a soft spotlight to highlight the model
      const spotLight = new THREE.SpotLight(0xffffff, 0.7);
      spotLight.position.set(0, 10, 2);
      spotLight.angle = Math.PI / 4;
      spotLight.penumbra = 0.6; // Soft edge
      spotLight.distance = 20;
      scene.add(spotLight);
      
      // Load character model for preview
      const fbxLoader = new FBXLoader();
      const modelPath = modelSets[character].standing;
      
      fbxLoader.load(modelPath, (fbx) => {
        // Scale and position model appropriately
        fbx.scale.set(0.01, 0.015, 0.01);
        
        // Set up rotation for nice preview
        fbx.rotation.y = Math.PI; // Facing forward
        
        // Add to scene
        scene.add(fbx);
        
        // Setup animation if available
        if (fbx.animations && fbx.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(fbx);
          const action = mixer.clipAction(fbx.animations[0]);
          action.play();
          
          // Store mixer for animation updates
          previewScenes[character].userData.mixer = mixer;
        }
      });
    });
  }
  
  // Animation loop for previews
  const previewClock = new THREE.Clock();
  
  function animatePreviews() {
    if (document.getElementById('character-selection-screen').style.display !== 'none') {
      requestAnimationFrame(animatePreviews);
      
      const delta = previewClock.getDelta();
      
      // Update all preview scenes
      for (const character in previewScenes) {
        if (previewScenes[character].userData.mixer) {
          previewScenes[character].userData.mixer.update(delta);
        }
        
        // Rotate the model slightly for showcase
        previewScenes[character].children.forEach(child => {
          if (child.type === 'Group') {
            child.rotation.y += 0.01;
          }
        });
        
        previewRenderers[character].render(previewScenes[character], previewCameras[character]);
      }
    }
  }
  
  // Initialize preview scenes when window is loaded
  window.addEventListener('load', () => {
    setupCharacterPreviews();
    animatePreviews();
  });
  
  // Handle start button click
  startButton.addEventListener('click', () => {
    if (!selectedCharacter) {
      alert('Please select a character first!');
      return;
    }
    
    // Hide character selection screen
    characterSelectionScreen.style.display = 'none';
    
    // Start loading the game with selected character
    initializeGame(selectedCharacter);
  });
  
// Create a controls info panel
function createControlsPanel() {
  const controlsPanel = document.createElement('div');
  controlsPanel.id = 'controls-panel';
  controlsPanel.style.position = 'fixed';
  controlsPanel.style.top = '15px';
  controlsPanel.style.left = '15px';
  controlsPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  controlsPanel.style.color = 'white';
  controlsPanel.style.padding = '15px';
  controlsPanel.style.borderRadius = '8px';
  controlsPanel.style.fontFamily = 'sans-serif';
  controlsPanel.style.fontSize = '14px';
  controlsPanel.style.zIndex = '1000';
  controlsPanel.style.maxWidth = '250px';
  controlsPanel.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  controlsPanel.style.cursor = 'move'; // Indicate panel is draggable
  controlsPanel.style.transition = 'height 0.3s ease';
  
  // Create a handle for dragging
  const dragHandle = document.createElement('div');
  dragHandle.style.padding = '5px 0';
  dragHandle.style.marginBottom = '10px';
  dragHandle.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
  dragHandle.style.cursor = 'move';
  dragHandle.style.display = 'flex';
  dragHandle.style.justifyContent = 'space-between';
  dragHandle.style.alignItems = 'center';
  
  // Panel header within the drag handle
  const header = document.createElement('h3');
  header.textContent = 'Game Controls';
  header.style.margin = '0';
  header.style.fontSize = '16px';
  header.style.fontWeight = 'bold';
  dragHandle.appendChild(header);
  
  // Create content container for easy hiding/showing
  const contentContainer = document.createElement('div');
  contentContainer.id = 'controls-content';
  
  // Control instructions
  const controlsList = document.createElement('ul');
  controlsList.style.listStyleType = 'none';
  controlsList.style.padding = '0';
  controlsList.style.margin = '0';
  
  // List of controls
  const controls = [
    { key: '↑/↓', action: 'Move forward/backward' },
    { key: '←/→', action: 'Turn left/right' },
    { key: 'Mouse Wheel', action: 'Zoom in/out' },
    { key: 'Q', action: 'Look up' },
    { key: 'E', action: 'Look down' }
  ];
  
  controls.forEach(control => {
    const item = document.createElement('li');
    item.style.margin = '5px 0';
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    
    const keySpan = document.createElement('span');
    keySpan.textContent = control.key;
    keySpan.style.backgroundColor = '#444';
    keySpan.style.padding = '3px 8px';
    keySpan.style.borderRadius = '4px';
    keySpan.style.marginRight = '10px';
    keySpan.style.fontFamily = 'monospace';
    keySpan.style.fontWeight = 'bold';
    keySpan.style.minWidth = '80px';
    keySpan.style.display = 'inline-block';
    keySpan.style.textAlign = 'center';
    
    const actionSpan = document.createElement('span');
    actionSpan.textContent = control.action;
    
    item.appendChild(keySpan);
    item.appendChild(actionSpan);
    controlsList.appendChild(item);
  });
  
  contentContainer.appendChild(controlsList);
  
  // Add minimize/maximize button (instead of close)
  const toggleButton = document.createElement('button');
  toggleButton.textContent = '−'; // Unicode minus sign
  toggleButton.style.backgroundColor = 'transparent';
  toggleButton.style.border = 'none';
  toggleButton.style.color = 'white';
  toggleButton.style.fontSize = '20px';
  toggleButton.style.cursor = 'pointer';
  toggleButton.style.padding = '0';
  toggleButton.style.lineHeight = '1';
  toggleButton.style.width = '24px';
  toggleButton.style.height = '24px';
  toggleButton.title = "Minimize";
  
  // Create a show controls button (initially hidden)
  const showControlsButton = document.createElement('span');
  showControlsButton.textContent = 'Show Controls';
  showControlsButton.style.display = 'none'; // Initially hidden
  showControlsButton.style.cursor = 'pointer';
  showControlsButton.style.fontWeight = 'bold';
  
  let minimized = false;
  
  toggleButton.addEventListener('click', () => {
    minimized = !minimized;
    
    if (minimized) {
      // Minimize panel
      contentContainer.style.display = 'none';
      showControlsButton.style.display = 'inline';
      toggleButton.textContent = '+';
      toggleButton.title = "Expand";
      controlsPanel.style.padding = '10px 15px';
    } else {
      // Expand panel
      contentContainer.style.display = 'block';
      showControlsButton.style.display = 'none';
      toggleButton.textContent = '−';
      toggleButton.title = "Minimize";
      controlsPanel.style.padding = '15px';
    }
  });
  
  showControlsButton.addEventListener('click', () => {
    minimized = false;
    contentContainer.style.display = 'block';
    showControlsButton.style.display = 'none';
    toggleButton.textContent = '−';
    toggleButton.title = "Minimize";
    controlsPanel.style.padding = '15px';
  });
  
  // Add the toggle button to drag handle
  dragHandle.appendChild(toggleButton);
  
  // Add elements to the panel
  controlsPanel.appendChild(dragHandle);
  dragHandle.appendChild(showControlsButton);
  controlsPanel.appendChild(contentContainer);
  
  document.body.appendChild(controlsPanel);
  
  // Make the panel draggable
  let isDragging = false;
  let offsetX, offsetY;
  
  dragHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - controlsPanel.getBoundingClientRect().left;
    offsetY = e.clientY - controlsPanel.getBoundingClientRect().top;
    controlsPanel.style.cursor = 'grabbing';
    
    // Prevent default text selection during drag
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const left = e.clientX - offsetX;
    const top = e.clientY - offsetY;
    
    // Keep panel within window bounds
    const maxX = window.innerWidth - controlsPanel.offsetWidth;
    const maxY = window.innerHeight - controlsPanel.offsetHeight;
    
    controlsPanel.style.left = `${Math.max(0, Math.min(left, maxX))}px`;
    controlsPanel.style.top = `${Math.max(0, Math.min(top, maxY))}px`;
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      controlsPanel.style.cursor = 'move';
    }
  });
}

  // Move existing map initialization and other setup into a function
  function initializeGame(characterType) {
    // Optionally disable telemetry to avoid POST errors
    if (mapboxgl.setTelemetryEnabled) {
      mapboxgl.setTelemetryEnabled(false);
    }
  
    // Create loading screen for model loading
    const loadingScreen = document.createElement('div');
    loadingScreen.style.position = 'fixed';
    loadingScreen.style.top = '0';
    loadingScreen.style.left = '0';
    loadingScreen.style.width = '100%';
    loadingScreen.style.height = '100%';
    loadingScreen.style.backgroundColor = '#333';
    loadingScreen.style.display = 'flex';
    loadingScreen.style.justifyContent = 'center';
    loadingScreen.style.alignItems = 'center';
    loadingScreen.style.zIndex = '9999';
    loadingScreen.innerHTML = '<h1 style="color: white; font-family: sans-serif;">Loading 3D Models...</h1>';
    document.body.appendChild(loadingScreen);
  
    // Keep track of loaded models
    let modelsLoaded = 0;
    const totalModelsToLoad = 2;
  
    // Add these variables at the top of your file
    let birdContainer = null; // Container to handle proper pivoting
    let previousPosition = new THREE.Vector3();
    let collisionDetected = false;
    const collisionCheckDistance = 1.0; // Distance to check ahead for collisions
  
    // Add pitch control variables
    const pitchSettings = {
      min: 0,
      max: 85,
      step: 5
    };

    const modelPaths = modelSets[characterType];
// -----------------------------
// Mapbox initialization
// -----------------------------
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
const initialCenter = { lng: -76.589503, lat: 40.149641 };
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/islamm22/cm8nf8jjo002r01qd0zj8dj4k', // Use your custom style
  center: [initialCenter.lng, initialCenter.lat],
  zoom: 35,
  pitch: 75,
  bearing: 0,
  antialias: true,
  renderWorldCopies: false 
});

// Add map style controls (unchanged)
const layerList = document.createElement('div');
layerList.className = 'map-style-list';
const styleOptions = [
  { id: 'streets-v12', title: 'Streets' },
  { id: 'satellite-streets-v12', title: 'Satellite Streets' }
];
styleOptions.forEach(style => {
  const link = document.createElement('a');
  link.href = '#';
  link.textContent = style.title;
  link.className = 'style-option';
  link.onclick = (e) => {
    e.preventDefault();
    map.setStyle('mapbox://styles/mapbox/' + style.id);
    
    // Listen for the style to finish loading, then re-add 3D features
    map.once('style.load', () => {
      setupTerrainAndBuildings();
    });
  };
  layerList.appendChild(link);
});
document.body.appendChild(layerList);

// -----------------------------
// Three.js scene setup
// -----------------------------
const threeContainer = document.getElementById('three-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
threeContainer.appendChild(renderer.domElement);

// Basic lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.75); // Increased from 0.5 to 0.75
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Increased from 0.8 to 1.0
directionalLight.position.set(100, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Add a secondary directional light to reduce harsh shadows
const secondaryLight = new THREE.DirectionalLight(0xffffff, 0.5);
secondaryLight.position.set(-50, 80, -50); // Light from another angle
scene.add(secondaryLight);

// Add a hemisphere light for more natural environmental lighting
const hemisphereLight = new THREE.HemisphereLight(
  0xffffff, // sky color
  0x444444, // ground color
  0.5       // intensity
);
scene.add(hemisphereLight);

// -----------------------------
// Camera and zoom settings
// -----------------------------
const cameraSettings = {
  distance: 10,  // Initial distance from bird
  minDistance: 5,  // Minimum zoom distance
  maxDistance: 30,  // Maximum zoom distance
  zoomSpeed: 1.0   // Zoom speed multiplier
};

// -----------------------------
// Bird Model Integration
// -----------------------------
const fbxLoader = new FBXLoader();
let stillBird = null;
let walkingBird = null;
let currentBird = null; // Reference to the currently active bird model
let walkingMixer = null; // Walking animation mixer
let stillMixer = null; // Standing animation mixer
let walkingAction = null; // Walking animation action
let standingAction = null; // Standing animation action

// Our movement state now uses a speed for translation and a rotationSpeed for map rotation.
const movementState = {
  bird: {
    forward: false,
    backward: false,
    left: false,   // will rotate the map (and thus the camera) slowly
    right: false,
    speed: 0.1,
    rotationSpeed: 0.05, // in radians per frame; will be halved for smoother map rotation
    isMoving: false // New flag to track if the bird is currently in motion
  }
};

// Clock for animation timing
const clock = new THREE.Clock();

let birdForwardDirection = new THREE.Vector3(0, 0, 1); // Initial forward direction (beak direction)

// Add this variable to track the bird's rotation independently
let birdYRotation = Math.PI; // Initialize to PI (180 degrees) to match initial orientation

// Load both models
// First, load the still model
fbxLoader.load(modelPaths.standing, (fbx) => {
  stillBird = fbx;
  stillBird.scale.set(0.0095, 0.0095, 0.0095); 
  
  // Create a container for the still bird
  const container = new THREE.Object3D();
  container.position.set(0, 2, 0); // Position the container where the bird should be
  
  // Reset the bird position to be relative to the container
  stillBird.position.set(0, 0, 0);
  
  // Fix orientation - only tilt, don't rotate Y
  stillBird.rotation.x = -Math.PI / 16;
  stillBird.rotation.y = 0;
  
  // Add the bird to the container
  container.add(stillBird);
  
  // Store the container
  birdContainer = container;
  
  // Apply shadows and weight handling as before
  stillBird.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      
      // Skinning weight handling
      if (child.geometry && child.geometry.attributes.skinWeight) {
        const skinWeightAttribute = child.geometry.attributes.skinWeight;
        for (let i = 0; i < skinWeightAttribute.count; i++) {
          let sum = 0;
          for (let j = 0; j < 4; j++) {
            const idx = i * 4 + j;
            if (idx < skinWeightAttribute.array.length) {
              sum += skinWeightAttribute.array[idx];
            }
          }
          if (sum > 0) {
            for (let j = 0; j < 4; j++) {
              const idx = i * 4 + j;
              if (idx < skinWeightAttribute.array.length) {
                skinWeightAttribute.array[idx] /= sum;
              }
            }
          }
        }
        skinWeightAttribute.needsUpdate = true;
      }
      
      // Add optimization for animation
      if (child.skeleton) {
        child.frustumCulled = false;
      }
      child.matrixAutoUpdate = true;
      child.matrixWorldNeedsUpdate = true;
    }
  });
  
  // Set up standing animation
  if (stillBird.animations && stillBird.animations.length > 0) {
    console.log('Standing animations found:', stillBird.animations.length);
    
    stillMixer = new THREE.AnimationMixer(stillBird);
    const standingClip = stillBird.animations[0];
    
    standingAction = stillMixer.clipAction(standingClip);
    standingAction.setEffectiveWeight(1.0);
    standingAction.setEffectiveTimeScale(0.8); // Slightly slower for idle animation
    standingAction.play();
    
    console.log('Standing animation set up');
  } else {
    console.warn('No animations found in standing model');
  }
  
  // Set initial bird model to standing
  currentBird = stillBird;
  scene.add(birdContainer); // Add the container to the scene instead of the bird directly
  updateCameraPosition();
  
  // Update loading tracker
  modelsLoaded++;
  if (modelsLoaded === totalModelsToLoad) {
    document.body.removeChild(loadingScreen);
    createControlsPanel();
  }
  
  console.log('Standing bird model loaded.');
}, 
(xhr) => {
  const percentComplete = (xhr.loaded / xhr.total) * 100;
  loadingScreen.innerHTML = `<h1 style="color: white; font-family: sans-serif;">Loading Standing Model: ${Math.round(percentComplete)}%</h1>`;
}, 
(error) => {
  console.error('Error loading standing bird model:', error);
  modelsLoaded++;
  if (modelsLoaded === totalModelsToLoad) {
    document.body.removeChild(loadingScreen);
  }
});

let distanceTraveled = 0;
let lastPosition = new THREE.Vector3();
let cycleDistance = 0; //

// Then, load the walking model
fbxLoader.load(modelPaths.walking, (fbx) => {
  walkingBird = fbx;
  walkingBird.scale.set(0.01, 0.01, 0.01);
  
  // Reset the bird position to be relative to the container when used
  walkingBird.position.set(0, 0, 0);
  
  // Fix orientation - only tilt, don't rotate Y
  walkingBird.rotation.x = -Math.PI / 16; 
  walkingBird.rotation.y = 0;
  
  // Apply shadows and improved skinning weights handling
  walkingBird.traverse((child) => {
        if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      
      // Improved skinning weight handling
      if (child.geometry && child.geometry.attributes.skinWeight) {
        const skinWeightAttribute = child.geometry.attributes.skinWeight;
        for (let i = 0; i < skinWeightAttribute.count; i++) {
          let sum = 0;
          for (let j = 0; j < 4; j++) {
            const idx = i * 4 + j;
            if (idx < skinWeightAttribute.array.length) {
              sum += skinWeightAttribute.array[idx];
            }
          }
          if (sum > 0) {
            for (let j = 0; j < 4; j++) {
              const idx = i * 4 + j;
              if (idx < skinWeightAttribute.array.length) {
                skinWeightAttribute.array[idx] /= sum;
              }
            }
          }
        }
        skinWeightAttribute.needsUpdate = true;
      }
      
      // Fix specific issues with animation distortion
      // Limit bone influence to prevent excessive deformation
      if (child.skeleton) {
        child.frustumCulled = false; // Prevents parts from disappearing
      }
      
      // Set optimizations for animation rendering
      child.matrixAutoUpdate = true;
      child.matrixWorldNeedsUpdate = true;
    }
  });
  
  // Set up animation with improved settings
  if (walkingBird.animations && walkingBird.animations.length > 0) {
    console.log('Walking animations found:', walkingBird.animations.length);
    
    walkingMixer = new THREE.AnimationMixer(walkingBird);
    const walkingClip = walkingBird.animations[0];
    
    // Fix animation loop behavior
    walkingAction = walkingMixer.clipAction(walkingClip);
    
    // Ensure smooth looping with proper settings
    walkingAction.setLoop(THREE.LoopRepeat);
    walkingAction.clampWhenFinished = false; // Don't clamp at end frame
    walkingAction.setEffectiveWeight(0.9);
    walkingAction.setEffectiveTimeScale(1.0);
    
    // Enable seamless looping between end and start of animation
    walkingAction.setDuration(walkingClip.duration);
    walkingAction.fadeIn(0.2); // Smooth start
    
    // Critical: Add zero time for loop synchronization
    walkingAction.zeroSlopeAtStart = true;
    walkingAction.zeroSlopeAtEnd = true;
    
    walkingAction.play();
    
    console.log('Walking animation set up with smooth looping');
  } else {
    console.warn('No animations found in walking model');
  }
  
  // Update loading tracker
  modelsLoaded++;
  if (modelsLoaded === totalModelsToLoad) {
    document.body.removeChild(loadingScreen);
    createControlsPanel();
  }
  
  console.log('Walking bird model loaded.');
}, 
// Add a loading progress handler
(xhr) => {
  const percentComplete = (xhr.loaded / xhr.total) * 100;
  loadingScreen.innerHTML = `<h1 style="color: white; font-family: sans-serif;">Loading Walking Model: ${Math.round(percentComplete)}%</h1>`;
}, 
(error) => {
  console.error('Error loading walking bird model:', error);
  // Still remove loading screen in case of error
  modelsLoaded++;
  if (modelsLoaded === totalModelsToLoad) {
    document.body.removeChild(loadingScreen);
  }
});

// Function to switch between bird models
function switchBirdModel(isMoving) {
  // If already showing the correct model, do nothing
  if ((isMoving && currentBird === walkingBird) || (!isMoving && currentBird === stillBird)) {
    return;
  }
  
  // Remove current bird from container
  if (currentBird && birdContainer) {
    birdContainer.remove(currentBird);
  }
  
  // Set the appropriate model
  if (isMoving && walkingBird) {
    currentBird = walkingBird;
    
    if (walkingMixer && walkingAction) {
      if (!walkingAction.isRunning()) {
        walkingAction.reset();
        walkingAction.play();
      }
    }
  } else if (stillBird) {
    currentBird = stillBird;
    
    if (stillMixer && standingAction && !standingAction.isRunning()) {
      standingAction.reset();
      standingAction.play();
    }
  } else {
    return; // No models available
  }
  
  // CRITICAL: Reset the bird model position and orientation
  currentBird.position.set(0, 0, 0);
  currentBird.rotation.set(-Math.PI/16, 0, 0); // Only tilt on X-axis, no Y rotation
  
  // Add to container
  birdContainer.add(currentBird);
}

// Update the updateCameraPosition function to always call updateBirdDirection first
function updateCameraPosition() {
  if (!birdContainer) return;

  updateBirdDirection(); // Always update bird direction first

  const bearingDeg = map.getBearing();
  const bearingRad = bearingDeg * Math.PI / 180;

  // "Behind" direction based on current map bearing
  const behindVector = new THREE.Vector3(Math.sin(bearingRad), 0, -Math.cos(bearingRad));
  behindVector.normalize();

  // Position camera behind and slightly above at current distance
  const cameraOffset = behindVector.clone().multiplyScalar(cameraSettings.distance).add(new THREE.Vector3(0, 5, 0));
  const desiredCameraPos = birdContainer.position.clone().sub(cameraOffset);

  // Smooth camera movement
  camera.position.lerp(desiredCameraPos, 0.1);
  camera.lookAt(birdContainer.position);
}

function syncWalkingAnimationWithMovement() {
  if (!walkingAction || !walkingMixer) return;
  
  const isMovingForward = movementState.bird.forward;
  const isMovingBackward = movementState.bird.backward;
  const isMoving = isMovingForward || isMovingBackward;
  
  if (isMoving) {
    const clip = walkingAction.getClip();
    
    // Instead of resetting, use modulo to wrap animation time
    // This avoids the hard reset while keeping animation in bounds
    if (walkingAction.time >= clip.duration) {
      walkingAction.time = walkingAction.time % clip.duration;
    }
    
    // Adjust animation speed based on movement direction
    if (isMovingBackward) {
      walkingAction.setEffectiveTimeScale(-1.0);
    } else {
      walkingAction.setEffectiveTimeScale(1.0);
    }
  }
}

// -----------------------------
// Mouse wheel zoom control
// -----------------------------
threeContainer.addEventListener('wheel', (event) => {
    event.preventDefault();
    
    // Determine zoom direction
    const zoomDirection = event.deltaY > 0 ? -1 : 1;
    
    // Change map zoom instead of camera distance
    const currentZoom = map.getZoom();
    map.setZoom(currentZoom + zoomDirection * 0.5); // Adjust the multiplier for zoom sensitivity
  });

// -----------------------------
// Arrow Key Controls
// -----------------------------
window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'ArrowUp':
      movementState.bird.forward = true;
      movementState.bird.isMoving = true;
      switchBirdModel(true); // Switch to walking model
      break;
    case 'ArrowDown':
      movementState.bird.backward = true;
      movementState.bird.isMoving = true;
      switchBirdModel(true); // Switch to walking model
      break;
    case 'ArrowLeft':
      movementState.bird.left = true;
      break;
    case 'ArrowRight':
      movementState.bird.right = true;
      break;
    // Add pitch control keys
    case 'q':
    case 'Q':
      // Increase pitch (look down)
      map.setPitch(Math.min(map.getPitch() + pitchSettings.step, pitchSettings.max));
      break;
    case 'e':
    case 'E':
      // Decrease pitch (look up)
      map.setPitch(Math.max(map.getPitch() - pitchSettings.step, pitchSettings.min));
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'ArrowUp':
      movementState.bird.forward = false;
      break;
    case 'ArrowDown':
      movementState.bird.backward = false;
      break;
    case 'ArrowLeft':
      movementState.bird.left = false;
      break;
    case 'ArrowRight':
      movementState.bird.right = false;
      break;
  }
  
  // Check if bird has stopped moving completely
  if (!movementState.bird.forward && !movementState.bird.backward) {
    movementState.bird.isMoving = false;
    switchBirdModel(false); // Switch to still model
  }
});

// Update the updateBirdDirection function
function updateBirdDirection() {
  // This function can be left empty now as the animation loop handles rotation
}


// -----------------------------
// Animation Loop: Update Bird, Map & Camera
// -----------------------------
function animate() {
  requestAnimationFrame(animate);
  
  // Update animation mixers
  const delta = clock.getDelta();
  if (walkingMixer) walkingMixer.update(delta);
  if (stillMixer) stillMixer.update(delta);

  if (birdContainer) {
    // Save previous position for collision restoration
    previousPosition.copy(birdContainer.position);
    
    // Step 1: Handle map rotation first
    if (movementState.bird.left) {
      map.setBearing((map.getBearing() - 1) % 360);
    }
    if (movementState.bird.right) {
      map.setBearing((map.getBearing() + 1) % 360);
    }
    
    // Step 2: Get current map bearing in radians
    const bearingRad = map.getBearing() * Math.PI / 180;
    
    // Step 3: Calculate forward direction based on map bearing
    birdForwardDirection.x = Math.sin(bearingRad);
    birdForwardDirection.z = Math.cos(bearingRad);
    birdForwardDirection.normalize();
    
    // Step 4: Always orient the container to match map bearing
    // This is critical - the container rotates to match the map
    // But the bird always faces forward relative to the container
    birdContainer.rotation.y = bearingRad;
    
    // Step 5: Move the container forward/backward
    if (movementState.bird.forward || movementState.bird.backward) {
      // Calculate potential new position
      const moveDirection = movementState.bird.forward ? 1 : -1;
      const potentialMove = birdForwardDirection.clone().multiplyScalar(moveDirection * movementState.bird.speed);
      const newPosition = birdContainer.position.clone().add(potentialMove);
      
      // Convert potential position to map coordinates
      const newMapCoords = [
        initialCenter.lng + (newPosition.x / 5000),
        initialCenter.lat + (newPosition.z / 5000)
      ];
      
      // Check for collision with buildings
      const point = map.project(newMapCoords);
      const features = map.queryRenderedFeatures(
        [point.x, point.y],
        { layers: ['3d-buildings'] }
      );
      
      // If no buildings found at the new position, allow movement
      if (features.length === 0) {
        collisionDetected = false;
        // Apply the movement
        if (movementState.bird.forward) {
          birdContainer.position.addScaledVector(birdForwardDirection, movementState.bird.speed);
        }
        if (movementState.bird.backward) {
          birdContainer.position.addScaledVector(birdForwardDirection, -movementState.bird.speed);
        }
      } else {
        // Collision detected - keep the previous position
        collisionDetected = true;
        birdContainer.position.copy(previousPosition);
        
        // Optional: Visual feedback for collision
        if (collisionDetected) {
          // You could change the bird color, add a sound effect, or show a message
          console.log("Collision with building detected!");
          
          // Example: Briefly show a collision message
          const collisionMessage = document.createElement('div');
          collisionMessage.style.position = 'fixed';
          collisionMessage.style.top = '20px';
          collisionMessage.style.left = '50%';
          collisionMessage.style.transform = 'translateX(-50%)';
          collisionMessage.style.padding = '10px';
          collisionMessage.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
          collisionMessage.style.color = 'white';
          collisionMessage.style.borderRadius = '5px';
          collisionMessage.style.fontFamily = 'sans-serif';
          collisionMessage.textContent = 'Ouch! Ran into a building!';
          document.body.appendChild(collisionMessage);
          
          // Remove after 1 second
          setTimeout(() => {
            document.body.removeChild(collisionMessage);
          }, 1000);
        }
      }
    }
    
    // Step 6: Update map center
    const containerPos = birdContainer.position;
    map.setCenter([
      initialCenter.lng + (containerPos.x / 5000),
      initialCenter.lat + (containerPos.z / 5000)
    ]);
    
    // Step 7: Synchronize walking animation
    syncWalkingAnimationWithMovement();
    
    // Step 8: Update camera to always be behind the bird
    // Use the negative of forward direction to position camera behind
    const cameraOffset = birdForwardDirection.clone().multiplyScalar(-cameraSettings.distance);
    cameraOffset.y = 5; // Add height
    
    const targetCameraPos = birdContainer.position.clone().add(cameraOffset);
    camera.position.lerp(targetCameraPos, 0.1);
    camera.lookAt(birdContainer.position);
  }

  renderer.render(scene, camera);
}
animate();

// -----------------------------
// Handle Window Resize
// -----------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function setupTerrainAndBuildings() {
  console.log('Setting up terrain and buildings');

  // Add 3D terrain if it doesn't exist
  if (!map.getSource('mapbox-dem')) {
    map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 16
    });
    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
  }

  // Find the first symbol layer for proper placement
  const layers = map.getStyle().layers;
  const labelLayerId = layers.find(
    (layer) => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
  )?.id;

  // Remove existing 3D buildings layer if it exists
  if (map.getLayer('3d-buildings')) {
    map.removeLayer('3d-buildings');
  }

  // Add enhanced 3D buildings layer
  map.addLayer({
    id: '3d-buildings',
    source: 'composite',
    'source-layer': 'building',
    'filter': ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: 15,
    paint: {
      'fill-extrusion-color': [
        'match',
        ['get', 'type'],
        'education', '#FF8C00',  // Keep your custom colors for different building types
        'commercial', '#4682B4',
        'residential', '#CD5C5C',
        '#BEBEBE'
      ],
      'fill-extrusion-height': [
        'interpolate', ['linear'], ['zoom'],
        15, 0,
        15.05, ['get', 'height'] // Use actual height from data
      ],
      'fill-extrusion-base': [
        'interpolate', ['linear'], ['zoom'],
        15, 0,
        15.05, ['get', 'min_height']
      ],
      'fill-extrusion-opacity': 0.7
    }
  }, labelLayerId); // Add before labels for better visibility
  
  // OPTION 1: Use dataset directly via GeoJSON
  if (!map.getSource('custom-building-data')) {
    // Get data directly from the dataset
    map.addSource('custom-building-data', {
      type: 'geojson',
      data: `https://api.mapbox.com/datasets/v1/islamm22/cm8oiqyhp5mne1omogra1iz8j/features?access_token=${mapboxgl.accessToken}`
    });
    
    // Add markers for each point
    map.addLayer({
      id: 'building-points',
      source: 'custom-building-data',
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#FF0000',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#FFFFFF'
      }
    });
    
    // Add labels - note we're using property "0" as shown in your GeoJSON
    map.addLayer({
      id: 'building-labels',
      source: 'custom-building-data',
      type: 'symbol',
      layout: {
        'text-field': ['get', '0'], // Use the property name "0" from your GeoJSON
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-offset': [0, 1.5], // Offset below the point
        'text-anchor': 'top',
        'text-allow-overlap': false,
        'text-max-width': 12
      },
      paint: {
        'text-color': '#FFFFFF',
        'text-halo-color': '#000000',
        'text-halo-width': 2
      }
    });
  }
  
  // Add a campus boundary polygon (if desired)
  if (!map.getSource('campus-boundary')) {
    map.addSource('campus-boundary', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-76.596720, 40.149641],
            [-76.589503, 40.153440],
            [-76.581853, 40.150569],
            [-76.591676, 40.143198],
            [-76.596720, 40.149641]
          ]]
        }
      }
    });
  }
}
  
// -----------------------------
// Add 3D Terrain & Buildings when Map Loads
// -----------------------------
map.on('load', () => {
  console.log('Map loaded');
  setupTerrainAndBuildings();
});

}
})();