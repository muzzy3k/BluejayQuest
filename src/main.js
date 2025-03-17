import * as THREE from 'three';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from './config.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'; 
import { AnimationMixer } from 'three';

// Optionally disable telemetry to avoid POST errors
if (mapboxgl.setTelemetryEnabled) {
  mapboxgl.setTelemetryEnabled(false);
}

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

// -----------------------------
// Mapbox initialization
// -----------------------------
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
const initialCenter = { lng: -76.589503, lat: 40.149641 };
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
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
  { id: 'light-v11', title: 'Light' },
  { id: 'dark-v11', title: 'Dark' },
  { id: 'satellite-v9', title: 'Satellite' },
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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(100, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

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

// Load both models
// First, load the still model
fbxLoader.load('/assets/Standing.fbx', (fbx) => {
  stillBird = fbx;
  stillBird.scale.set(0.01, 0.01, 0.01); 
  stillBird.position.set(0, 2, 0);
  
  // Fix orientation
  stillBird.rotation.x = Math.PI / 4;
  stillBird.rotation.y = Math.PI;
  
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
  scene.add(currentBird);
  updateCameraPosition();
  
  // Update loading tracker
  modelsLoaded++;
  if (modelsLoaded === totalModelsToLoad) {
    document.body.removeChild(loadingScreen);
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
fbxLoader.load('/assets/Walking.fbx', (fbx) => {
  walkingBird = fbx;
  walkingBird.scale.set(0.01, 0.01, 0.01);
  walkingBird.position.set(0, 2, 0);
  
  // Fix orientation - tilt the bird backwards and rotate 180 degrees
  walkingBird.rotation.x = Math.PI / 4; 
  walkingBird.rotation.y = Math.PI;
  
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
    walkingAction.fadeIn(0.5); // Smooth start
    
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
  
  // Save current position and rotation
  const currentPosition = currentBird ? currentBird.position.clone() : new THREE.Vector3(0, 2, 0);
  const currentRotation = currentBird ? new THREE.Euler().copy(currentBird.rotation) : new THREE.Euler(Math.PI/4, Math.PI, 0);
  
  // Remove current bird from scene
  if (currentBird) {
    scene.remove(currentBird);
  }
  
  // Set the appropriate model
  if (isMoving && walkingBird) {
    currentBird = walkingBird;
    
    // Make sure walking animation is playing with smooth transition
    if (walkingMixer && walkingAction) {
      if (!walkingAction.isRunning()) {
        // Reset and restart animation when starting to move
        walkingAction.reset();
        walkingAction.play();
      }
      
      // Ensure animation is synced with movement
      if (walkingAction.time === walkingAction.getClip().duration) {
        walkingAction.time = 0; // Restart if at the end
      }
    }
  } else if (stillBird) {
    currentBird = stillBird;
    
    // Make sure standing animation is playing
    if (stillMixer && standingAction && !standingAction.isRunning()) {
      standingAction.reset();
      standingAction.play();
    }
  } else {
    return; // If neither model is loaded yet, do nothing
  }
  
  // Add the new current bird to the scene
  scene.add(currentBird);
  
  // Apply saved position and rotation
  currentBird.position.copy(currentPosition);
  currentBird.rotation.copy(currentRotation);
  
  // But always maintain the fixed rotations
  currentBird.rotation.x = Math.PI / 4;
  const bearingRad = map.getBearing() * Math.PI / 180;
  currentBird.rotation.y = bearingRad + Math.PI;
}

// Update the updateCameraPosition function to always call updateBirdDirection first
function updateCameraPosition() {
  if (!currentBird) return;

  updateBirdDirection(); // Always update bird direction first

  const bearingDeg = map.getBearing(); 
  const bearingRad = bearingDeg * Math.PI / 180;

  // "Behind" direction based on current map bearing
  const behindVector = new THREE.Vector3(Math.sin(bearingRad), 0, -Math.cos(bearingRad));
  behindVector.normalize();

  // Position camera behind and slightly above at current distance
  const cameraOffset = behindVector.clone().multiplyScalar(cameraSettings.distance).add(new THREE.Vector3(0, 5, 0));
  const desiredCameraPos = currentBird.position.clone().sub(cameraOffset);

  // Smooth camera movement
  camera.position.lerp(desiredCameraPos, 0.1);
  camera.lookAt(currentBird.position);
}

function syncWalkingAnimationWithMovement() {
  if (!walkingAction || !walkingMixer) return;
  
  // If movement speed changes, adjust animation timeScale to match
  const isMovingForward = movementState.bird.forward;
  const isMovingBackward = movementState.bird.backward;
  const isMoving = isMovingForward || isMovingBackward;
  
  if (isMoving) {
    // Ensure animation doesn't get out of sync or jump
    const clip = walkingAction.getClip();
    if (walkingAction.time >= clip.duration - 0.1) {
      // When near the end of animation, smoothly transition to start
      // instead of jumping directly
      walkingAction.time = 0;
    }
    
    // Adjust animation speed based on movement direction
    if (isMovingBackward) {
      // Option 1: Play animation backward
      walkingAction.setEffectiveTimeScale(-1.0);
    } else {
      // Play animation forward
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
  // Get the map bearing in radians
  const bearingRad = map.getBearing() * Math.PI / 180;
  
  // Update the forward direction vector
  birdForwardDirection.x = Math.sin(bearingRad);
  birdForwardDirection.z = Math.cos(bearingRad);
  birdForwardDirection.normalize();
  
  // Update bird rotation to face forward, but maintain the 180 degree rotation
  if (currentBird && currentBird.rotation) {
    // Set Y rotation based on map bearing, but add PI (180 degrees) to face away
    currentBird.rotation.y = bearingRad + Math.PI;
    
    // Maintain the fixed x-rotation (tilt)
    currentBird.rotation.x = Math.PI / 4;
  }
}


// -----------------------------
// Animation Loop: Update Bird, Map & Camera
// -----------------------------
function animate() {
  requestAnimationFrame(animate);
  
  // Update animation mixers
  const delta = clock.getDelta();
  if (walkingMixer) {
    walkingMixer.update(delta);
  }
  if (stillMixer) {
    stillMixer.update(delta);
  }

  if (currentBird) {
    // Update bird direction
    updateBirdDirection();
    
    // Handle rotation
    if (movementState.bird.left) {
      map.setBearing(map.getBearing() - (movementState.bird.rotationSpeed * 180/Math.PI / 2));
    }
    if (movementState.bird.right) {
      map.setBearing(map.getBearing() + (movementState.bird.rotationSpeed * 180/Math.PI / 2));
    }
    
    // Handle movement
    if (movementState.bird.forward) {
      currentBird.position.addScaledVector(birdForwardDirection, movementState.bird.speed);
    }
    if (movementState.bird.backward) {
      currentBird.position.addScaledVector(birdForwardDirection, -movementState.bird.speed);
    }
    
    // Keep walking animation synchronized with movement
    syncWalkingAnimationWithMovement();
    
    // Update map and camera
    const birdPos = currentBird.position;
    map.setCenter([
      initialCenter.lng + (birdPos.x / 5000),
      initialCenter.lat + (birdPos.z / 5000)
    ]);
    
    updateCameraPosition();
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

// -----------------------------
// Add 3D Terrain & Buildings when Map Loads
// -----------------------------
map.on('load', () => {
  console.log('Map loaded');

  // Add 3D terrain
  map.addSource('mapbox-dem', {
    type: 'raster-dem',
    url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
    tileSize: 512,
    maxzoom: 14
  });
  map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

  // Add 3D buildings layer from Mapbox with enhanced height
  map.addLayer({
    id: '3d-buildings',
    source: 'composite',
    'source-layer': 'building',
    type: 'fill-extrusion',
    minzoom: 15,
    paint: {
      'fill-extrusion-color': [
        'match',
        ['get', 'type'],
        'education', '#FF8C00',
        'commercial', '#4682B4',
        'residential', '#CD5C5C',
        '#BEBEBE'
      ],
      'fill-extrusion-height': [
        'interpolate', ['linear'], ['zoom'],
        15, 0,
        15.05, ['*', ['get', 'height'], 1.2]
      ],
      'fill-extrusion-base': [
        'interpolate', ['linear'], ['zoom'],
        15, 0,
        15.05, ['get', 'min_height']
      ],
      'fill-extrusion-opacity': 0.8
    }
  });

  // Add a campus boundary polygon (if desired)
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
});