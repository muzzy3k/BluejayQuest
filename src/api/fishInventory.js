// src/api/fishInventory.js - To be created
import { supabase } from '../auth.js';

/**
 * Initialize the fish inventory tables in Supabase if they don't exist
 */
export async function initializeInventoryDatabase() {
  // This function would typically be run once during app setup
  console.log('Checking database tables...');
  
  // In a real app, you'd use Supabase's dashboard to create tables
  // Then use this function to verify connections
  const { data, error } = await supabase
    .from('fish_inventory')
    .select('count')
    .limit(1);
    
  if (error) {
    console.error('Error connecting to fish inventory table:', error.message);
    return false;
  }
  
  console.log('Successfully connected to fish inventory table!');
  return true;
}

/**
 * Add a caught fish to the user's inventory in the database
 */
export async function addFishToDatabase(userId, fishName, fishLength, timeStamp = new Date().toISOString()) {
  if (!userId) {
    console.error('Cannot add fish to inventory: User not logged in');
    return { success: false, error: 'User not logged in' };
  }
  
  const { data, error } = await supabase
    .from('fish_inventory')
    .insert([
      { 
        user_id: userId,
        fish_name: fishName,
        length: fishLength,
        caught_at: timeStamp
      }
    ]);
  
  if (error) {
    console.error('Error adding fish to inventory:', error.message);
    return { success: false, error };
  }
  
  return { success: true, data };
}

/**
 * Get the user's entire fish inventory from the database
 */
export async function getUserFishInventory(userId) {
  if (!userId) {
    console.error('Cannot get fish inventory: User not logged in');
    return { success: false, error: 'User not logged in' };
  }
  
  const { data, error } = await supabase
    .from('fish_inventory')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error retrieving fish inventory:', error.message);
    return { success: false, error };
  }
  
  // Transform the data into a more useful format organized by fish type
  const inventory = {};
  
  data.forEach(fish => {
    if (!inventory[fish.fish_name]) {
      inventory[fish.fish_name] = {
        count: 0,
        catches: []
      };
    }
    
    inventory[fish.fish_name].count++;
    inventory[fish.fish_name].catches.push({
      id: fish.id,
      length: fish.length,
      timestamp: fish.caught_at
    });
  });
  
  return { success: true, inventory };
}

/**
 * Get a summary of the user's fish inventory (counts by fish type)
 */
export async function getUserFishSummary(userId) {
  if (!userId) {
    console.error('Cannot get fish summary: User not logged in');
    return { success: false, error: 'User not logged in' };
  }
  
  const { data, error } = await supabase
    .from('fish_inventory')
    .select('fish_name, length')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error retrieving fish summary:', error.message);
    return { success: false, error };
  }
  
  // Calculate summary statistics
  const summary = {};
  
  data.forEach(fish => {
    if (!summary[fish.fish_name]) {
      summary[fish.fish_name] = {
        count: 0,
        bestLength: 0
      };
    }
    
    summary[fish.fish_name].count++;
    summary[fish.fish_name].bestLength = Math.max(
      summary[fish.fish_name].bestLength, 
      fish.length
    );
  });
  
  return { success: true, summary };
}

/**
 * Delete a fish from the user's inventory
 */
export async function deleteFishFromInventory(userId, fishId) {
  if (!userId) {
    console.error('Cannot delete fish: User not logged in');
    return { success: false, error: 'User not logged in' };
  }
  
  const { data, error } = await supabase
    .from('fish_inventory')
    .delete()
    .eq('id', fishId)
    .eq('user_id', userId); // Double-check user owns this fish
  
  if (error) {
    console.error('Error deleting fish:', error.message);
    return { success: false, error };
  }
  
  return { success: true };
}