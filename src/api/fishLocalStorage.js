/**
 * Local storage implementation of fish inventory functions for users playing without login
 */

// Constants
const STORAGE_KEY = 'bluejayquest_fish_inventory';
const GUEST_USER_ID = 'guest_user';

/**
 * Initialize the local fish inventory if it doesn't exist
 */
export function initializeLocalInventory() {
  console.log('Checking local inventory...');
  
  // Check if inventory exists in localStorage
  const existingInventory = localStorage.getItem(STORAGE_KEY);
  
  if (!existingInventory) {
    // Create empty inventory
    const emptyInventory = { [GUEST_USER_ID]: {} };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyInventory));
    console.log('Created new local fish inventory');
  } else {
    console.log('Local fish inventory exists');
  }
  
  return true;
}

/**
 * Add a caught fish to the local inventory
 */
export function addFishToLocalStorage(fishName, fishLength, timeStamp = new Date().toISOString()) {
  // Get the current inventory
  const storage = localStorage.getItem(STORAGE_KEY);
  const inventory = storage ? JSON.parse(storage) : { [GUEST_USER_ID]: {} };
  
  // Ensure guest user inventory exists
  if (!inventory[GUEST_USER_ID]) {
    inventory[GUEST_USER_ID] = {};
  }
  
  // Ensure fish type exists in inventory
  if (!inventory[GUEST_USER_ID][fishName]) {
    inventory[GUEST_USER_ID][fishName] = {
      count: 0,
      catches: []
    };
  }
  
  // Generate a unique ID for the fish catch
  const fishId = `local_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // Add fish to inventory
  inventory[GUEST_USER_ID][fishName].count++;
  inventory[GUEST_USER_ID][fishName].catches.push({
    id: fishId,
    length: fishLength,
    timestamp: timeStamp
  });
  
  // Save back to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
  
  return { success: true, data: { id: fishId } };
}

/**
 * Get the user's entire fish inventory from local storage
 */
export function getLocalFishInventory() {
  const storage = localStorage.getItem(STORAGE_KEY);
  
  if (!storage) {
    return { success: false, error: 'No local inventory found' };
  }
  
  const inventory = JSON.parse(storage);
  
  if (!inventory[GUEST_USER_ID]) {
    return { success: true, inventory: {} };
  }
  
  return { success: true, inventory: inventory[GUEST_USER_ID] };
}

/**
 * Get a summary of the user's fish inventory from local storage
 */
export function getLocalFishSummary() {
  const { success, inventory, error } = getLocalFishInventory();
  
  if (!success) {
    return { success: false, error };
  }
  
  // Calculate summary statistics
  const summary = {};
  
  Object.entries(inventory).forEach(([fishName, fishData]) => {
    summary[fishName] = {
      count: fishData.count,
      bestLength: Math.max(...fishData.catches.map(catch_ => catch_.length), 0)
    };
  });
  
  return { success: true, summary };
}

/**
 * Delete a fish from the local inventory
 */
export function deleteFishFromLocalStorage(fishId) {
  const storage = localStorage.getItem(STORAGE_KEY);
  
  if (!storage) {
    return { success: false, error: 'No local inventory found' };
  }
  
  const inventory = JSON.parse(storage);
  
  if (!inventory[GUEST_USER_ID]) {
    return { success: false, error: 'Guest inventory not found' };
  }
  
  // Find the fish across all fish types
  let fishFound = false;
  
  Object.entries(inventory[GUEST_USER_ID]).forEach(([fishName, fishData]) => {
    const catchIndex = fishData.catches.findIndex(catch_ => catch_.id === fishId);
    
    if (catchIndex !== -1) {
      // Remove the catch
      fishData.catches.splice(catchIndex, 1);
      
      // Update count
      fishData.count--;
      
      // If no more catches, remove the fish type
      if (fishData.count === 0) {
        delete inventory[GUEST_USER_ID][fishName];
      }
      
      fishFound = true;
    }
  });
  
  if (!fishFound) {
    return { success: false, error: 'Fish not found in inventory' };
  }
  
  // Save back to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
  
  return { success: true };
}
