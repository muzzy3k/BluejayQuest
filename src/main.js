import * as THREE from 'three';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from './config.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Optionally disable telemetry to avoid POST errors
if (mapboxgl.setTelemetryEnabled) {
  mapboxgl.setTelemetryEnabled(false);
}

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
const gltfLoader = new GLTFLoader();
let bird = null;
// Our movement state now uses a speed for translation and a rotationSpeed for map rotation.
const movementState = {
  bird: {
    forward: false,
    backward: false,
    left: false,   // will rotate the map (and thus the camera) slowly
    right: false,
    speed: 0.1,
    rotationSpeed: 0.05 // in radians per frame; will be halved for smoother map rotation
  }
};

let birdForwardDirection = new THREE.Vector3(0, 0, 1); // Initial forward direction (beak direction)

gltfLoader.load('/assets/scene.gltf', (gltf) => {
  bird = gltf.scene;
  bird.scale.set(3, 3, 3);
  bird.position.set(0, 2, 0);
  
  // Debug texture loading
  console.log('Bird model structure:', gltf);
  
  // Apply a specific blue jay color since textures aren't loading
  bird.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      
      if (child.material) {
        // Apply blue jay colors directly instead of relying on textures
        child.material.color = new THREE.Color(0x4169E1);    // Royal blue
        child.material.emissive = new THREE.Color(0x111133); // Dark blue tint
        child.material.needsUpdate = true;
        
        console.log('Applied blue color to mesh:', child.name);
      }
    }
  });
  
  // Add a spotlight to follow the bird
  const spotlight = new THREE.SpotLight(0xffffff, 1.5);
  spotlight.position.set(0, 20, 0);
  spotlight.target = bird;
  scene.add(spotlight);
  
  scene.add(bird);
  updateCameraPosition();
  
  console.log('Bird model loaded.');
}, undefined, (error) => {
  console.error('Error loading bird model:', error);
});

// Update the updateCameraPosition function to always call updateBirdDirection first
function updateCameraPosition() {
if (!bird) return;

updateBirdDirection(); // Always update bird direction first

const bearingDeg = map.getBearing(); 
const bearingRad = bearingDeg * Math.PI / 180;

// "Behind" direction based on current map bearing
const behindVector = new THREE.Vector3(Math.sin(bearingRad), 0, -Math.cos(bearingRad));
behindVector.normalize();

// Position camera behind and slightly above at current distance
const cameraOffset = behindVector.clone().multiplyScalar(cameraSettings.distance).add(new THREE.Vector3(0, 5, 0));
const desiredCameraPos = bird.position.clone().sub(cameraOffset);

// Smooth camera movement
camera.position.lerp(desiredCameraPos, 0.1);
camera.lookAt(bird.position);
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
      break;
    case 'ArrowDown':
      movementState.bird.backward = true;
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
});

// Replace your existing updateBirdDirection function with this:
function updateBirdDirection() {
  // Get the map bearing in radians
  const bearingRad = map.getBearing() * Math.PI / 180;
  
  // Update the forward direction vector
  birdForwardDirection.x = Math.sin(bearingRad);
  birdForwardDirection.z = Math.cos(bearingRad);
  birdForwardDirection.normalize();
  
  // Update bird rotation to face forward
  if (bird && bird.rotation) {
    // Always face forward relative to the camera view
    // This makes the bird face the direction of the up arrow
    bird.rotation.y = bearingRad;
  }
}

// -----------------------------
// Animation Loop: Update Bird, Map & Camera
// -----------------------------
function animate() {
  requestAnimationFrame(animate);

  if (bird) {
    // Update bird direction (which now handles rotation)
    updateBirdDirection();
    
    // Handle rotation first
    if (movementState.bird.left) {
      map.setBearing(map.getBearing() - (movementState.bird.rotationSpeed * 180/Math.PI / 2));
    }
    if (movementState.bird.right) {
      map.setBearing(map.getBearing() + (movementState.bird.rotationSpeed * 180/Math.PI / 2));
    }
    
    // Then handle movement using the updated direction
    if (movementState.bird.forward) {
      bird.position.addScaledVector(birdForwardDirection, movementState.bird.speed);
    }
    if (movementState.bird.backward) {
      bird.position.addScaledVector(birdForwardDirection, -movementState.bird.speed);
    }
    
    // Update map and camera
    const birdPos = bird.position;
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