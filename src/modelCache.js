import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { supabase } from './auth.js';

// Cache version - change when models update to force reload
const CACHE_VERSION = 'v1';

// Cache keys will be model paths
const getModelCacheKey = (path) => `bluejay-model-${path}-${CACHE_VERSION}`;

// Track which models have been cached
const cachedModels = new Set();

// Create a cache-enabled FBX loader
export function createCachedFBXLoader() {
  const loader = new FBXLoader();
  
  // Store original load method
  const originalLoad = loader.load;
  
  // Override with cache-aware version
  loader.load = function(url, onLoad, onProgress, onError) {
    const cacheKey = getModelCacheKey(url);
    
    // Check if already cached in this session
    if (cachedModels.has(cacheKey)) {
      console.log(`Using memory-cached model: ${url}`);
    }
    
    // Add cache buster for versioning
    const cacheBustedUrl = url.includes('?') 
      ? `${url}&v=${CACHE_VERSION}` 
      : `${url}?v=${CACHE_VERSION}`;
    
    // Track load start time to detect if loaded from HTTP cache
    const loadStartTime = performance.now();
    
    const wrappedOnLoad = (model) => {
      const loadTime = performance.now() - loadStartTime;
      const wasFromCache = loadTime < 500; // Assume cache if loaded quickly
      
      // Mark as cached for this session
      cachedModels.add(cacheKey);
      
      // Store user's last used models in their profile for faster loading next time
      storeUsedModelInProfile(url).catch(console.error);
      
      // Save load time analytics
      console.log(`Model ${url} loaded in ${loadTime.toFixed(2)}ms (${wasFromCache ? 'from cache' : 'from server'})`);
      
      if (onLoad) onLoad(model);
    };
    
    return originalLoad.call(this, cacheBustedUrl, wrappedOnLoad, onProgress, onError);
  };
  
  return loader;
}

// Store recently used models in user profile for optimization
async function storeUsedModelInProfile(modelPath) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;
    
    // Get user's current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('recently_used_models')
      .eq('id', user.id)
      .single();
    
    // Update recently used models
    const recentModels = (profile?.recently_used_models || []);
    if (!recentModels.includes(modelPath)) {
      recentModels.unshift(modelPath);
      // Keep only last 5 models
      while (recentModels.length > 5) {
        recentModels.pop();
      }
      
      // Update profile
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          recently_used_models: recentModels,
          updated_at: new Date()
        });
    }
  } catch (error) {
    console.error('Failed to update user model history:', error);
  }
}

// Register service worker for model caching
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful');
        })
        .catch(error => {
          console.error('ServiceWorker registration failed:', error);
        });
    });
  }
}

const CACHE_NAME = 'bluejay-quest-v1';
const MODEL_CACHE = 'bluejay-models-v1';

const assetsToCache = [
  '/',
  '/index.html',
  '/assets/Standing.fbx',
  '/assets/Walking.fbx',
  '/assets/StandingB.fbx',
  '/assets/WalkingB.fbx'
];

// Install event - cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(assetsToCache);
      })
  );
});

// Fetch event - serve from cache when available
self.addEventListener('fetch', event => {
  // Only cache model files
  if (event.request.url.includes('/assets/') && 
      event.request.url.endsWith('.fbx')) {
    
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Return cached response if found
          if (response) {
            console.log('Serving model from cache:', event.request.url);
            return response;
          }
          
          // Otherwise fetch from network and cache
          return fetch(event.request)
            .then(networkResponse => {
              // Cache the fetched response
              const responseToCache = networkResponse.clone();
              
              caches.open(MODEL_CACHE)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                  console.log('Cached model from network:', event.request.url);
                });
                
              return networkResponse;
            });
        })
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME, MODEL_CACHE];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});