// ------------------------------------------------
// File: main.js (entry point for Vite + Three.js + Mapbox)
// ------------------------------------------------
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from './config.js';
import * as turf from '@turf/turf';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


// Mapbox access token
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

// Elizabethtown College coordinates (center of campus)
const elizabethtownCoordinates = {
  lng: -76.589503,
  lat: 40.149641,
  zoom: 18, // Higher zoom level for more detail
  pitch: 75, // Higher pitch for street view
  bearing: 0
};

// Campus boundaries using the exact coordinates provided
const campusBounds = [
  [-76.596720, 40.143198], // Southwest coordinates
  [-76.581853, 40.153440]  // Northeast coordinates
];

// Custom campus building data
const campusBuildingData = {
  // Key buildings on campus with detailed information
  "buildings": [
    {
      "id": "brossman-commons",
      "name": "Brossman Commons",
      "coordinates": [-76.5924, 40.1532],
      "description": "Student center with dining facilities, bookstore, and meeting spaces.",
      "height": 15,
      "yearBuilt": 2002,
      "type": "Student Center"
    },
    {
      "id": "high-library",
      "name": "High Library",
      "coordinates": [-76.5935, 40.1535],
      "description": "The main campus library with study spaces, computer labs, and extensive collections.",
      "height": 20,
      "yearBuilt": 1990,
      "type": "Academic"
    },
    {
      "id": "nicarry-hall",
      "name": "Nicarry Hall",
      "coordinates": [-76.5915, 40.1525],
      "description": "Home to many academic departments including Business, Education, and Social Sciences.",
      "height": 12,
      "yearBuilt": 1972,
      "type": "Academic"
    },
    {
      "id": "leffler-chapel",
      "name": "Leffler Chapel and Performance Center",
      "coordinates": [-76.5905, 40.1540],
      "description": "Venue for concerts, lectures, and campus events with a beautiful auditorium.",
      "height": 18,
      "yearBuilt": 1995,
      "type": "Performance"
    },
    {
      "id": "hackman-apartments",
      "name": "Hackman Apartments",
      "coordinates": [-76.5945, 40.1520],
      "description": "Student apartment-style housing for upperclassmen.",
      "height": 12,
      "yearBuilt": 1988,
      "type": "Residential"
    },
    {
      "id": "zug-hall",
      "name": "Zug Memorial Hall",
      "coordinates": [-76.5918, 40.1528],
      "description": "Houses the Music Department with practice rooms and performance spaces.",
      "height": 14,
      "yearBuilt": 1957,
      "type": "Academic"
    },
    {
      "id": "hoover-center",
      "name": "Hoover Center for Business",
      "coordinates": [-76.5930, 40.1526],
      "description": "Modern facility for business education with technology-enhanced classrooms.",
      "height": 16,
      "yearBuilt": 2006,
      "type": "Academic"
    }
  ]
};

// Add campus paths and walkways
const campusPaths = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Main Walkway",
        "type": "primary"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-76.5924, 40.1532], // Brossman Commons
          [-76.5935, 40.1535], // High Library
          [-76.5915, 40.1525]  // Nicarry Hall
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Library Path",
        "type": "secondary"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-76.5935, 40.1535], // High Library
          [-76.5905, 40.1540]  // Leffler Chapel
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Residential Path",
        "type": "secondary"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-76.5924, 40.1532], // Brossman Commons
          [-76.5945, 40.1520]  // Hackman Apartments
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Academic Path",
        "type": "primary"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-76.5915, 40.1525], // Nicarry Hall
          [-76.5918, 40.1528], // Zug Hall
          [-76.5930, 40.1526]  // Hoover Center
        ]
      }
    }
  ]
};

// Add collectible items
const collectibleItems = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "item1",
        "name": "Blue Jay Feather",
        "points": 10,
        "collected": false
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-76.5920, 40.1535]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "item2",
        "name": "Campus Map",
        "points": 5,
        "collected": false
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-76.5930, 40.1525]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "item3",
        "name": "College Pennant",
        "points": 15,
        "collected": false
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-76.5910, 40.1530]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "item4",
        "name": "Library Book",
        "points": 20,
        "collected": false
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-76.5935, 40.1535]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "item5",
        "name": "Science Beaker",
        "points": 25,
        "collected": false
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-76.5918, 40.1528]
      }
    }
  ]
};

// Initialize Mapbox
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12', // Street style with building labels
  center: [elizabethtownCoordinates.lng, elizabethtownCoordinates.lat],
  zoom: elizabethtownCoordinates.zoom,
  pitch: elizabethtownCoordinates.pitch,
  bearing: elizabethtownCoordinates.bearing,
  antialias: true,
  maxBounds: campusBounds, // Restrict map panning to campus area
  maxPitch: 85, // Allow more vertical view for 3D perspective
  minZoom: 17, // Don't allow zooming out too far
  renderWorldCopies: false // Don't render multiple copies of the world
});

// Add map style controls
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

// Initialize Three.js for future player character and game elements
const threeContainer = document.getElementById('three-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75, // Wider FOV for more immersive view
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);

const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  alpha: true // Transparent background to show Mapbox underneath
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
threeContainer.appendChild(renderer.domElement);

// Lighting for Three.js objects
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(100, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

/* ----------------------------------------------------------
   BEGIN BIRD MODEL INTEGRATION
   ---------------------------------------------------------- */

// Create a GLTFLoader instance
const gltfLoader = new GLTFLoader();
let bird = null; // Global variable to hold the bird model

// Add movement state tracking for smooth motion
const movementState = {
  bird: {
    forward: false,
    backward: false,
    left: false,
    right: false,
    speed: 0.1, // Significantly increased speed for bird movement
    rotationSpeed: 0.05
  },
  camera: {
    forward: false,
    backward: false,
    left: false,
    right: false,
    speed: 0.1
  }
};

// Load the bird model (scene.gltf) from the assets folder
gltfLoader.load('/assets/scene.gltf', (gltf) => {
  bird = gltf.scene;
  // Adjust the scale as needed
  bird.scale.set(3, 3, 3);
  // Set initial position slightly above ground
  bird.position.set(0, 2, 0);
  scene.add(bird);
  console.log('Bird model loaded and added to the scene.');
}, undefined, (error) => {
  console.error('An error occurred while loading the bird model:', error);
});

// Update keyboard event listeners for separate controls
window.addEventListener('keydown', (event) => {
  switch(event.key) {
    // Camera controls (WASD)
    case 'w': movementState.camera.forward = true; break;
    case 's': movementState.camera.backward = true; break;
    case 'a': movementState.camera.left = true; break;
    case 'd': movementState.camera.right = true; break;
    
    // Bird controls (Arrow keys)
    case 'ArrowUp': movementState.bird.forward = true; break;
    case 'ArrowDown': movementState.bird.backward = true; break;
    case 'ArrowLeft': movementState.bird.left = true; break;
    case 'ArrowRight': movementState.bird.right = true; break;
  }
});

window.addEventListener('keyup', (event) => {
  switch(event.key) {
    // Camera controls (WASD)
    case 'w': movementState.camera.forward = false; break;
    case 's': movementState.camera.backward = false; break;
    case 'a': movementState.camera.left = false; break;
    case 'd': movementState.camera.right = false; break;
    
    // Bird controls (Arrow keys)
    case 'ArrowUp': movementState.bird.forward = false; break;
    case 'ArrowDown': movementState.bird.backward = false; break;
    case 'ArrowLeft': movementState.bird.left = false; break;
    case 'ArrowRight': movementState.bird.right = false; break;
  }
});

// Function to convert Mapbox coordinates to Three.js coordinates
function mapboxToThreeCoordinates(lng, lat, altitude = 0) {
  // Get the map's center point in mercator coordinates
  const center = mapboxgl.MercatorCoordinate.fromLngLat(
    [elizabethtownCoordinates.lng, elizabethtownCoordinates.lat],
    0 // Altitude at ground level
  );
  
  // Get the point we want to convert
  const point = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], altitude);
  
  // Calculate the offset from center (scaled to reasonable Three.js units)
  const scale = 5000;
  const x = (point.x - center.x) * scale;
  const y = (point.z - center.z) * scale; // Use z from Mapbox as y in Three.js
  const z = (point.y - center.y) * scale;
  
  return { x, y, z };
}

// Player position and height
let playerPosition = {
  lng: elizabethtownCoordinates.lng,
  lat: elizabethtownCoordinates.lat
};
const playerHeight = 1.8; // Height in meters (average human height)

// Add a popup for building information
const popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  maxWidth: '300px'
});

// Function to find a campus building by coordinates
function findNearestCampusBuilding(lngLat) {
  // Convert click coordinates to a point
  const clickPoint = turf.point([lngLat.lng, lngLat.lat]);
  
  let nearestBuilding = null;
  let minDistance = Infinity;
  
  // Check each campus building
  campusBuildingData.buildings.forEach(building => {
    const buildingPoint = turf.point(building.coordinates);
    const distance = turf.distance(clickPoint, buildingPoint, {units: 'kilometers'});
    
    // If this building is closer than the current nearest
    if (distance < minDistance && distance < 0.05) { // Within 50 meters
      minDistance = distance;
      nearestBuilding = building;
    }
  });
  
  return nearestBuilding;
}

// Add player score tracking
let playerScore = 0;
const scoreDisplay = document.createElement('div');
scoreDisplay.className = 'score-display';
scoreDisplay.innerHTML = `Score: ${playerScore}`;
document.body.appendChild(scoreDisplay);

// Add progress tracking
const progressDisplay = document.createElement('div');
progressDisplay.className = 'progress-display';
progressDisplay.innerHTML = `
  <div class="progress-text">Items: 0/${collectibleItems.features.length}</div>
  <div class="progress-bar">
    <div class="progress-fill" style="width: 0%"></div>
  </div>
`;
document.body.appendChild(progressDisplay);

// Function to update progress display
function updateProgressDisplay() {
  const collectedCount = collectibleItems.features.filter(item => item.properties.collected).length;
  const totalCount = collectibleItems.features.length;
  const progressPercent = (collectedCount / totalCount) * 100;
  
  const progressText = progressDisplay.querySelector('.progress-text');
  const progressFill = progressDisplay.querySelector('.progress-fill');
  
  progressText.textContent = `Items: ${collectedCount}/${totalCount}`;
  progressFill.style.width = `${progressPercent}%`;
}

// Load saved progress from local storage
function loadSavedProgress() {
  const savedScore = localStorage.getItem('bluejayquest_score');
  const savedCollectibles = localStorage.getItem('bluejayquest_collectibles');
  
  if (savedScore && savedCollectibles) {
    playerScore = parseInt(savedScore);
    scoreDisplay.innerHTML = `Score: ${playerScore}`;
    
    const savedItems = JSON.parse(savedCollectibles);
    collectibleItems.features.forEach((item, index) => {
      if (savedItems[index]) {
        item.properties.collected = savedItems[index].collected;
      }
    });
    
    updateProgressDisplay();
  }
}

// Save progress to local storage
function saveProgress() {
  localStorage.setItem('bluejayquest_score', playerScore);
  
  const collectibleStatus = collectibleItems.features.map(item => ({
    id: item.properties.id,
    collected: item.properties.collected
  }));
  
  localStorage.setItem('bluejayquest_collectibles', JSON.stringify(collectibleStatus));
}

// Load saved progress when the page loads
loadSavedProgress();

// Wait for map to load before adding 3D elements
map.on('load', () => {
  console.log('Map loaded');
  
  // Add 3D terrain
  map.addSource('mapbox-dem', {
    'type': 'raster-dem',
    'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
    'tileSize': 512,
    'maxzoom': 14
  });
  
  map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
  
  // Add 3D buildings layer from Mapbox with enhanced height
  map.addLayer({
    'id': '3d-buildings',
    'source': 'composite',
    'source-layer': 'building',
    'type': 'fill-extrusion',
    'minzoom': 15,
    'paint': {
      'fill-extrusion-color': [
        'match',
        ['get', 'type'],
        'education', '#FF8C00', // Orange for educational buildings
        'commercial', '#4682B4', // Steel blue for commercial
        'residential', '#CD5C5C', // Indian red for residential
        '#BEBEBE' // Default gray
      ],
      'fill-extrusion-height': [
        'interpolate', ['linear'], ['zoom'],
        15, 0,
        15.05, ['*', ['get', 'height'], 1.2] // Multiply height by 1.2 for better visibility
      ],
      'fill-extrusion-base': [
        'interpolate', ['linear'], ['zoom'],
        15, 0,
        15.05, ['get', 'min_height']
      ],
      'fill-extrusion-opacity': 0.8
    }
  });
  
  // Add campus boundary polygon
  map.addSource('campus-boundary', {
    'type': 'geojson',
    'data': {
      'type': 'Feature',
      'geometry': {
        'type': 'Polygon',
        'coordinates': [[
          [-76.596720, 40.149641], // Left corner
          [-76.589503, 40.153440], // Top corner
          [-76.581853, 40.150569], // Right corner
          [-76.591676, 40.143198], // Bottom corner
          [-76.596720, 40.149641]  // Close the polygon
        ]]
      }
    }
  });
  
  map.addLayer({
    'id': 'campus-boundary-line',
    'type': 'line',
    'source': 'campus-boundary',
    'layout': {},
    'paint': {
      'line-color': '#0066cc',
      'line-width': 4,
      'line-opacity': 0.8
    }
  });
  
  // Add custom campus buildings data source
  map.addSource('campus-buildings', {
    'type': 'geojson',
    'data': {
      'type': 'FeatureCollection',
      'features': campusBuildingData.buildings.map(building => ({
        'type': 'Feature',
        'geometry': {
          'type': 'Point',
          'coordinates': building.coordinates
        },
        'properties': {
          'id': building.id,
          'name': building.name,
          'description': building.description,
          'height': building.height,
          'yearBuilt': building.yearBuilt,
          'type': building.type
        }
      }))
    }
  });
  
  // Add campus buildings as markers
  map.addLayer({
    'id': 'campus-buildings-markers',
    'type': 'circle',
    'source': 'campus-buildings',
    'paint': {
      'circle-radius': 0, // Make invisible, we just want the data for clicking
      'circle-opacity': 0
    }
  });
  
  // Add labels for campus buildings
  map.addLayer({
    'id': 'campus-buildings-labels',
    'type': 'symbol',
    'source': 'campus-buildings',
    'layout': {
      'text-field': ['get', 'name'],
      'text-size': 12,
      'text-offset': [0, -2],
      'text-anchor': 'center'
    },
    'paint': {
      'text-color': '#ffffff',
      'text-halo-color': '#000000',
      'text-halo-width': 1
    }
  });
  
  // Add click event to show building info from Mapbox data
  map.on('click', '3d-buildings', (e) => {
    if (e.features.length > 0) {
      const feature = e.features[0];
      
      // Check if this is a known campus building
      const campusBuilding = findNearestCampusBuilding(e.lngLat);
      
      if (campusBuilding) {
        // Use our custom data for known campus buildings
        popup
          .setLngLat(e.lngLat)
          .setHTML(`
            <h3>${campusBuilding.name}</h3>
            <p>${campusBuilding.description}</p>
            <p><strong>Type:</strong> ${campusBuilding.type}</p>
            <p><strong>Year Built:</strong> ${campusBuilding.yearBuilt}</p>
            <p><strong>Height:</strong> ${campusBuilding.height}m</p>
          `)
          .addTo(map);
      } else {
        // Use Mapbox data for other buildings
        const buildingName = feature.properties.name || 'Building';
        const buildingHeight = feature.properties.height || 'Unknown';
        const buildingType = feature.properties.type || 'Unknown';
        
        popup
          .setLngLat(e.lngLat)
          .setHTML(`
            <h3>${buildingName}</h3>
            <p><strong>Type:</strong> ${buildingType}</p>
            <p><strong>Height:</strong> ${buildingHeight}m</p>
          `)
          .addTo(map);
      }
    }
  });
  
  // Also allow clicking directly on our custom campus building markers
  map.on('click', 'campus-buildings-markers', (e) => {
    if (e.features.length > 0) {
      const feature = e.features[0];
      
      popup
        .setLngLat(feature.geometry.coordinates)
        .setHTML(`
          <h3>${feature.properties.name}</h3>
          <p>${feature.properties.description}</p>
          <p><strong>Type:</strong> ${feature.properties.type}</p>
          <p><strong>Year Built:</strong> ${feature.properties.yearBuilt}</p>
          <p><strong>Height:</strong> ${feature.properties.height}m</p>
        `)
        .addTo(map);
    }
  });
  
  // Change cursor when hovering over buildings
  map.on('mouseenter', '3d-buildings', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  
  map.on('mouseleave', '3d-buildings', () => {
    map.getCanvas().style.cursor = '';
  });
  
  // Set initial camera to first-person view
  setFirstPersonView();
  
  // Start animation loop
  animate();
  
  // Ensure 3D buildings are preserved when style changes
  map.on('style.load', () => {
    // Re-add terrain and 3D buildings after style changes
    if (map.getSource('mapbox-dem') === undefined) {
      map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
      });
      
      map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
    }
    
    if (!map.getLayer('3d-buildings')) {
      map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
          'fill-extrusion-color': [
            'match',
            ['get', 'type'],
            'education', '#FF8C00', // Orange for educational buildings
            'commercial', '#4682B4', // Steel blue for commercial
            'residential', '#CD5C5C', // Indian red for residential
            '#BEBEBE' // Default gray
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
    }
    
    // Re-add campus boundary
    if (map.getSource('campus-boundary') === undefined) {
      map.addSource('campus-boundary', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'geometry': {
            'type': 'Polygon',
            'coordinates': [[
              [-76.596720, 40.149641], // Left corner
              [-76.589503, 40.153440], // Top corner
              [-76.581853, 40.150569], // Right corner
              [-76.591676, 40.143198], // Bottom corner
              [-76.596720, 40.149641]  // Close the polygon
            ]]
          }
        }
      });
      
      map.addLayer({
        'id': 'campus-boundary-line',
        'type': 'line',
        'source': 'campus-boundary',
        'layout': {},
        'paint': {
          'line-color': '#0066cc',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
    }
    
    // Re-add campus buildings data
    if (map.getSource('campus-buildings') === undefined) {
      map.addSource('campus-buildings', {
        'type': 'geojson',
        'data': {
          'type': 'FeatureCollection',
          'features': campusBuildingData.buildings.map(building => ({
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': building.coordinates
            },
            'properties': {
              'id': building.id,
              'name': building.name,
              'description': building.description,
              'height': building.height,
              'yearBuilt': building.yearBuilt,
              'type': building.type
            }
          }))
        }
      });
      
      map.addLayer({
        'id': 'campus-buildings-markers',
        'type': 'circle',
        'source': 'campus-buildings',
        'paint': {
          'circle-radius': 0,
          'circle-opacity': 0
        }
      });
      
      map.addLayer({
        'id': 'campus-buildings-labels',
        'type': 'symbol',
        'source': 'campus-buildings',
        'layout': {
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-offset': [0, -2],
          'text-anchor': 'center'
        },
        'paint': {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });
    }
    
    // Re-add click handlers
    map.on('click', '3d-buildings', (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        
        // Check if this is a known campus building
        const campusBuilding = findNearestCampusBuilding(e.lngLat);
        
        if (campusBuilding) {
          // Use our custom data for known campus buildings
          popup
            .setLngLat(e.lngLat)
            .setHTML(`
              <h3>${campusBuilding.name}</h3>
              <p>${campusBuilding.description}</p>
              <p><strong>Type:</strong> ${campusBuilding.type}</p>
              <p><strong>Year Built:</strong> ${campusBuilding.yearBuilt}</p>
              <p><strong>Height:</strong> ${campusBuilding.height}m</p>
            `)
            .addTo(map);
        } else {
          // Use Mapbox data for other buildings
          const buildingName = feature.properties.name || 'Building';
          const buildingHeight = feature.properties.height || 'Unknown';
          const buildingType = feature.properties.type || 'Unknown';
          
          popup
            .setLngLat(e.lngLat)
            .setHTML(`
              <h3>${buildingName}</h3>
              <p><strong>Type:</strong> ${buildingType}</p>
              <p><strong>Height:</strong> ${buildingHeight}m</p>
            `)
            .addTo(map);
        }
      }
    });
    
    map.on('click', 'campus-buildings-markers', (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        
        popup
          .setLngLat(feature.geometry.coordinates)
          .setHTML(`
            <h3>${feature.properties.name}</h3>
            <p>${feature.properties.description}</p>
            <p><strong>Type:</strong> ${feature.properties.type}</p>
            <p><strong>Year Built:</strong> ${feature.properties.yearBuilt}</p>
            <p><strong>Height:</strong> ${feature.properties.height}m</p>
          `)
          .addTo(map);
      }
    });
  });
  
  // Add first-person controls instructions
  const instructionsElement = document.createElement('div');
  instructionsElement.className = 'instructions';
  instructionsElement.innerHTML = `
    <h3>Controls:</h3>
    <p>W/S - Move forward/backward</p>
    <p>A/D - Turn left/right</p>
    <p>Q/E - Look up/down</p>
    <p>Z/X - Zoom in/out</p>
    <p>R - Reset to first-person view</p>
    <p>Click on buildings for info</p>
  `;
  document.body.appendChild(instructionsElement);
  
  // Add campus paths layer
  map.addSource('campus-paths', {
    type: 'geojson',
    data: campusPaths
  });
  
  // Add primary paths
  map.addLayer({
    id: 'primary-paths',
    type: 'line',
    source: 'campus-paths',
    filter: ['==', ['get', 'type'], 'primary'],
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#3887be',
      'line-width': 5,
      'line-opacity': 0.8
    }
  });
  
  // Add secondary paths
  map.addLayer({
    id: 'secondary-paths',
    type: 'line',
    source: 'campus-paths',
    filter: ['==', ['get', 'type'], 'secondary'],
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#f9c448',
      'line-width': 3,
      'line-opacity': 0.7
    }
  });
  
  // Add path labels
  map.addLayer({
    id: 'path-labels',
    type: 'symbol',
    source: 'campus-paths',
    layout: {
      'text-field': ['get', 'name'],
      'text-size': 12,
      'text-offset': [0, 1],
      'text-anchor': 'top',
      'symbol-placement': 'line-center'
    },
    paint: {
      'text-color': '#404040',
      'text-halo-color': 'rgba(255, 255, 255, 0.8)',
      'text-halo-width': 2
    }
  });
  
  // Add POIs to the map
  map.addSource('campus-pois', {
    type: 'geojson',
    data: campusPOIs
  });
  
  // Add POI markers
  map.addLayer({
    id: 'poi-markers',
    type: 'circle',
    source: 'campus-pois',
    paint: {
      'circle-radius': 8,
      'circle-color': [
        'match',
        ['get', 'type'],
        'landmark', '#FF5733',
        'nature', '#33FF57',
        'service', '#3357FF',
        'recreation', '#F3FF33',
        '#FF33F3' // default color
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  });
  
  // Add POI labels
  map.addLayer({
    id: 'poi-labels',
    type: 'symbol',
    source: 'campus-pois',
    layout: {
      'text-field': ['get', 'name'],
      'text-size': 12,
      'text-offset': [0, 1.5],
      'text-anchor': 'top'
    },
    paint: {
      'text-color': '#404040',
      'text-halo-color': 'rgba(255, 255, 255, 0.8)',
      'text-halo-width': 2
    }
  });
  
  // Add POI click interaction
  map.on('click', 'poi-markers', (e) => {
    const feature = e.features[0];
    const coordinates = feature.geometry.coordinates.slice();
    const { name, description, type } = feature.properties;
    
    // Create popup content
    const popupContent = `
      <h3>${name}</h3>
      <p>${description}</p>
      <p><em>Type: ${type}</em></p>
    `;
    
    // Create and display popup
    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(map);
  });
  
  // Change cursor on hover
  map.on('mouseenter', 'poi-markers', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  
  map.on('mouseleave', 'poi-markers', () => {
    map.getCanvas().style.cursor = '';
  });
  
  // Add collectible items to the map
  map.addSource('collectible-items', {
    type: 'geojson',
    data: collectibleItems
  });
  
  // Add collectible item markers
  map.addLayer({
    id: 'collectible-markers',
    type: 'symbol',
    source: 'collectible-items',
    layout: {
      'icon-image': 'star-15',
      'icon-size': 1.5,
      'icon-allow-overlap': true
    },
    filter: ['==', ['get', 'collected'], false]
  });
  
  // Add collectible item interaction
  map.on('click', 'collectible-markers', (e) => {
    const feature = e.features[0];
    const coordinates = feature.geometry.coordinates.slice();
    const { id, name, points } = feature.properties;
    
    // Update the item as collected
    collectibleItems.features.forEach(item => {
      if (item.properties.id === id) {
        item.properties.collected = true;
      }
    });
    
    // Update the source data
    map.getSource('collectible-items').setData(collectibleItems);
    
    // Update player score and progress
    playerScore += points;
    scoreDisplay.innerHTML = `Score: ${playerScore}`;
    updateProgressDisplay();
    saveProgress();
    
    // Show collection message
    const popupContent = `
      <h3>Item Collected!</h3>
      <p>You found: ${name}</p>
      <p>+${points} points</p>
    `;
    
    // Create and display popup
    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(map);
    
    // Check if all items are collected
    const allCollected = collectibleItems.features.every(item => item.properties.collected);
    if (allCollected) {
      // Show completion message
      const completionMessage = document.createElement('div');
      completionMessage.className = 'completion-message';
      completionMessage.innerHTML = `
        <h2>Congratulations!</h2>
        <p>You've collected all items on campus!</p>
        <p>Final Score: ${playerScore}</p>
        <button class="close-button">Continue Exploring</button>
      `;
      document.body.appendChild(completionMessage);
      
      // Add event listener to close button
      completionMessage.querySelector('.close-button').addEventListener('click', () => {
        document.body.removeChild(completionMessage);
      });
    }
  });
  
  // Change cursor on hover
  map.on('mouseenter', 'collectible-markers', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  
  map.on('mouseleave', 'collectible-markers', () => {
    map.getCanvas().style.cursor = '';
  });
});

// Set camera to first-person view
function setFirstPersonView() {
  // Get the ground elevation at the player's position
  const elevation = 0; // We'll use a default for now
  
  map.easeTo({
    center: [playerPosition.lng, playerPosition.lat],
    zoom: 19,
    pitch: 75,
    bearing: 0,
    duration: 1000
  });
}

// Update the animate function to handle smooth movement
function animate() {
  requestAnimationFrame(animate);
  
  if (bird) {
    // Handle bird movement with arrow keys
    if (movementState.bird.forward) {
      bird.translateZ(-movementState.bird.speed);
      // Update map position to follow bird
      const birdPos = bird.position;
      map.setCenter([
        elizabethtownCoordinates.lng + (birdPos.x / 5000),
        elizabethtownCoordinates.lat + (birdPos.z / 5000)
      ]);
    }
    if (movementState.bird.backward) {
      bird.translateZ(movementState.bird.speed);
      // Update map position to follow bird
      const birdPos = bird.position;
      map.setCenter([
        elizabethtownCoordinates.lng + (birdPos.x / 5000),
        elizabethtownCoordinates.lat + (birdPos.z / 5000)
      ]);
    }
    if (movementState.bird.left) {
      bird.rotation.y += movementState.bird.rotationSpeed;
    }
    if (movementState.bird.right) {
      bird.rotation.y -= movementState.bird.rotationSpeed;
    }
    
    // Handle camera movement with WASD
    if (movementState.camera.forward) {
      const forward = map.getBearing() * Math.PI / 180;
      map.panBy([
        Math.sin(forward) * 10,
        -Math.cos(forward) * 10
      ]);
    }
    if (movementState.camera.backward) {
      const backward = map.getBearing() * Math.PI / 180;
      map.panBy([
        -Math.sin(backward) * 10,
        Math.cos(backward) * 10
      ]);
    }
    if (movementState.camera.left) {
      map.easeTo({ bearing: map.getBearing() - 2 });
    }
    if (movementState.camera.right) {
      map.easeTo({ bearing: map.getBearing() + 2 });
    }
    
    // Update camera to follow bird
    const followOffset = new THREE.Vector3(
      -Math.sin(bird.rotation.y) * 10,
      5,
      -Math.cos(bird.rotation.y) * 10
    );
    
    const desiredCameraPos = bird.position.clone().add(followOffset);
    camera.position.lerp(desiredCameraPos, 0.1);
    camera.lookAt(bird.position);
  }
  
  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Add navigation controls to Mapbox
map.addControl(new mapboxgl.NavigationControl());

// Add keyboard controls for first-person-like movement
const keyboardControls = {
  moveSpeed: 0.0001,
  rotateSpeed: 3
};

window.addEventListener('keydown', (event) => {
  switch(event.key) {
    case 'w': // Forward
      const forward = map.getBearing() * Math.PI / 180;
      map.panBy([
        Math.sin(forward) * 10,
        -Math.cos(forward) * 10
      ]);
      playerPosition = map.getCenter();
      break;
    case 's': // Backward
      const backward = map.getBearing() * Math.PI / 180;
      map.panBy([
        -Math.sin(backward) * 10,
        Math.cos(backward) * 10
      ]);
      playerPosition = map.getCenter();
      break;
    case 'a': // Left
      map.easeTo({ bearing: map.getBearing() - keyboardControls.rotateSpeed });
      break;
    case 'd': // Right
      map.easeTo({ bearing: map.getBearing() + keyboardControls.rotateSpeed });
      break;
    case 'q': // Look up
      map.easeTo({ pitch: Math.min(map.getPitch() + 5, 85) });
      break;
    case 'e': // Look down
      map.easeTo({ pitch: Math.max(map.getPitch() - 5, 0) });
      break;
    case 'z': // Zoom in
      map.easeTo({ zoom: map.getZoom() + 0.5 });
      break;
    case 'x': // Zoom out
      map.easeTo({ zoom: Math.max(map.getZoom() - 0.5, 17) });
      break;
    case 'r': // Reset to first-person view
      setFirstPersonView();
      break;
  }
});

// Add view mode toggle
let isFirstPersonView = false;
const viewModeToggle = document.createElement('div');
viewModeToggle.className = 'view-mode-toggle';
viewModeToggle.innerHTML = 'Switch to First Person';
viewModeToggle.addEventListener('click', () => {
  isFirstPersonView = !isFirstPersonView;
  
  if (isFirstPersonView) {
    // Switch to first person view
    map.setPitch(75); // High pitch for first-person perspective
    map.setBearing(0); // Reset bearing
    map.setZoom(19); // Zoom in for street level
    viewModeToggle.innerHTML = 'Switch to Map View';
    
    // Disable rotation and tilt controls in first person mode
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    
    // Enable keyboard navigation for first person mode
    document.addEventListener('keydown', handleFirstPersonNavigation);
    controlsHelp.style.display = 'block';
    
    // Initialize mini-map if not already done
    if (!miniMap) {
      initMiniMap();
    }
    
    // Show mini-map
    miniMapContainer.style.display = 'block';
  } else {
    // Switch back to map view
    map.setPitch(45); // Default pitch
    map.setZoom(16.5); // Default zoom
    viewModeToggle.innerHTML = 'Switch to First Person';
    
    // Re-enable rotation controls
    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();
    
    // Disable keyboard navigation
    document.removeEventListener('keydown', handleFirstPersonNavigation);
    controlsHelp.style.display = 'none';
    
    // Hide mini-map
    miniMapContainer.style.display = 'none';
  }
});
document.body.appendChild(viewModeToggle);

// Handle first person navigation with keyboard
function handleFirstPersonNavigation(e) {
  const speed = 0.0003; // Movement speed
  const currentCenter = map.getCenter();
  const bearing = map.getBearing();
  
  // Calculate movement direction based on current bearing
  const moveForward = [
    Math.sin(bearing * Math.PI / 180) * speed,
    Math.cos(bearing * Math.PI / 180) * speed
  ];
  
  switch (e.key) {
    case 'w': // Move forward
      map.panTo([
        currentCenter.lng + moveForward[0],
        currentCenter.lat + moveForward[1]
      ]);
      break;
    case 's': // Move backward
      map.panTo([
        currentCenter.lng - moveForward[0],
        currentCenter.lat - moveForward[1]
      ]);
      break;
    case 'a': // Strafe left (90 degrees to bearing)
      map.panTo([
        currentCenter.lng + moveForward[1] * 0.5,
        currentCenter.lat - moveForward[0] * 0.5
      ]);
      break;
    case 'd': // Strafe right (90 degrees to bearing)
      map.panTo([
        currentCenter.lng - moveForward[1] * 0.5,
        currentCenter.lat + moveForward[0] * 0.5
      ]);
      break;
    case 'q': // Rotate left
      map.setBearing(bearing - 10);
      break;
    case 'e': // Rotate right
      map.setBearing(bearing + 10);
      break;
  }
}

// Add first person controls help
const controlsHelp = document.createElement('div');
controlsHelp.className = 'controls-help';
controlsHelp.innerHTML = `
  <h3>First Person Controls</h3>
  <ul>
    <li><strong>W</strong> - Move forward</li>
    <li><strong>S</strong> - Move backward</li>
    <li><strong>A</strong> - Strafe left</li>
    <li><strong>D</strong> - Strafe right</li>
    <li><strong>Q</strong> - Rotate left</li>
    <li><strong>E</strong> - Rotate right</li>
  </ul>
`;
document.body.appendChild(controlsHelp);

// Enforce map boundaries more strictly
map.on('moveend', () => {
  const currentBounds = map.getBounds();
  const maxBounds = map.getMaxBounds();
  
  // Check if current bounds exceed max bounds
  if (maxBounds && 
      (currentBounds.getNorth() > maxBounds.getNorth() ||
       currentBounds.getSouth() < maxBounds.getSouth() ||
       currentBounds.getEast() > maxBounds.getEast() ||
       currentBounds.getWest() < maxBounds.getWest())) {
    
    // Calculate the center point that's within bounds
    const center = map.getCenter();
    const newLng = Math.min(Math.max(center.lng, maxBounds.getWest()), maxBounds.getEast());
    const newLat = Math.min(Math.max(center.lat, maxBounds.getSouth()), maxBounds.getNorth());
    
    // Only pan if we need to adjust
    if (newLng !== center.lng || newLat !== center.lat) {
      map.panTo([newLng, newLat], { duration: 100 });
    }
  }
});



// Add legend toggle button
const legendToggle = document.createElement('div');
legendToggle.className = 'legend-toggle';
legendToggle.innerHTML = 'Toggle Legend';
legendToggle.addEventListener('click', () => {
  if (legend.style.display === 'none') {
    legend.style.display = 'block';
  } else {
    legend.style.display = 'none';
  }
});
document.body.appendChild(legendToggle);

// Add hint display
const hintDisplay = document.createElement('div');
hintDisplay.className = 'hint-display';
hintDisplay.style.display = 'none';
document.body.appendChild(hintDisplay);

// Check for nearby items
function checkNearbyItems() {
  if (!map.loaded()) return;
  
  const currentCenter = map.getCenter();
  const playerPosition = [currentCenter.lng, currentCenter.lat];
  
  // Find uncollected items
  const uncollectedItems = collectibleItems.features.filter(item => !item.properties.collected);
  
  // Find the nearest uncollected item
  let nearestItem = null;
  let nearestDistance = Infinity;
  
  uncollectedItems.forEach(item => {
    const itemPosition = item.geometry.coordinates;
    const distance = turf.distance(
      turf.point(playerPosition),
      turf.point(itemPosition),
      { units: 'kilometers' }
    );
    
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestItem = item;
    }
  });
  
  // Show hint if an item is nearby (within 50 meters)
  if (nearestItem && nearestDistance < 0.05) {
    const distanceInMeters = Math.round(nearestDistance * 1000);
    hintDisplay.innerHTML = `
      <div class="hint-icon">💡</div>
      <div class="hint-text">
        <strong>Item nearby!</strong><br>
        ${nearestItem.properties.name} is about ${distanceInMeters} meters away
      </div>
    `;
    hintDisplay.style.display = 'flex';
  } else {
    hintDisplay.style.display = 'none';
  }
}

// Check for nearby items periodically
setInterval(checkNearbyItems, 2000);

// Also check when the map moves
map.on('moveend', checkNearbyItems);

// Add mini-map container
const miniMapContainer = document.createElement('div');
miniMapContainer.id = 'mini-map';
miniMapContainer.style.display = 'none';
document.body.appendChild(miniMapContainer);

// Initialize mini-map
let miniMap = null;
let playerMarker = null;

function initMiniMap() {
  miniMap = new mapboxgl.Map({
    container: 'mini-map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: map.getCenter(),
    zoom: 16,
    interactive: false
  });
  
  // Add player marker to mini-map
  playerMarker = new mapboxgl.Marker({
    color: '#3887be',
    scale: 0.8
  })
    .setLngLat(map.getCenter())
    .addTo(miniMap);
  
  // Add direction indicator
  const directionIndicator = document.createElement('div');
  directionIndicator.className = 'direction-indicator';
  miniMapContainer.appendChild(directionIndicator);
  
  // Update direction indicator based on main map bearing
  function updateDirectionIndicator() {
    const bearing = map.getBearing();
    directionIndicator.style.transform = `translate(-50%, -50%) rotate(${bearing}deg)`;
  }
  
  // Update mini-map when main map moves
  map.on('move', () => {
    miniMap.setCenter(map.getCenter());
    playerMarker.setLngLat(map.getCenter());
    updateDirectionIndicator();
  });
  
  // Initial update
  updateDirectionIndicator();
}

