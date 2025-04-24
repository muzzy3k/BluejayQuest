// src/api/fishInventoryUI.js - To be created
import { getCurrentUser } from '../auth.js';
import * as fishAPI from './fishInventory.js';
import { fishTypes } from '../fishingGame.js';

/**
 * Create and display the inventory UI
 */
export async function showInventoryUI() {
  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    console.error('Cannot show inventory: User not logged in');
    alert('Please log in to view your inventory');
    return;
  }
  
  // Fetch user's fish inventory from database
  const { success, inventory, error } = await fishAPI.getUserFishInventory(user.id);
  
  if (!success) {
    console.error('Error fetching inventory:', error);
    alert('Failed to load inventory. Please try again.');
    return;
  }
  
  // Create inventory UI
  const inventoryUI = document.createElement('div');
  inventoryUI.id = 'inventory-ui';
  inventoryUI.style.position = 'fixed';
  inventoryUI.style.top = '50%';
  inventoryUI.style.left = '50%';
  inventoryUI.style.transform = 'translate(-50%, -50%)';
  inventoryUI.style.width = '800px';
  inventoryUI.style.maxHeight = '80vh';
  inventoryUI.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  inventoryUI.style.borderRadius = '10px';
  inventoryUI.style.padding = '20px';
  inventoryUI.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.7)';
  inventoryUI.style.color = 'white';
  inventoryUI.style.fontFamily = 'sans-serif';
  inventoryUI.style.zIndex = '10000';
  inventoryUI.style.display = 'flex';
  inventoryUI.style.flexDirection = 'column';
  inventoryUI.style.overflowY = 'auto';
  
  // Add header with title and close button
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '20px';
  
  const title = document.createElement('h2');
  title.textContent = 'Fish Inventory';
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
  closeButton.onclick = () => {
    document.body.removeChild(inventoryUI);
  };
  
  header.appendChild(title);
  header.appendChild(closeButton);
  inventoryUI.appendChild(header);
  
  // Create grid container for fish cards
  const fishGrid = document.createElement('div');
  fishGrid.style.display = 'grid';
  fishGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
  fishGrid.style.gap = '15px';
  fishGrid.style.marginTop = '10px';
  
  // Display each fish type in inventory
  let hasAnyFish = false;
  
  for (const [fishName, data] of Object.entries(inventory)) {
    hasAnyFish = true;
    
    // Create fish card
    const fishCard = document.createElement('div');
    fishCard.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    fishCard.style.borderRadius = '8px';
    fishCard.style.padding = '15px';
    fishCard.style.cursor = 'pointer';
    fishCard.style.transition = 'background-color 0.2s';
    
    // Add hover effect
    fishCard.addEventListener('mouseover', () => {
      fishCard.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    });
    
    fishCard.addEventListener('mouseout', () => {
      fishCard.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    });
    
    // Fish image (if available in fishTypes)
    if (fishTypes[fishName] && fishTypes[fishName].image) {
      const imgContainer = document.createElement('div');
      imgContainer.style.width = '100%';
      imgContainer.style.height = '100px';
      imgContainer.style.display = 'flex';
      imgContainer.style.justifyContent = 'center';
      imgContainer.style.alignItems = 'center';
      imgContainer.style.marginBottom = '10px';
      
      const img = document.createElement('img');
      img.src = fishTypes[fishName].image;
      img.alt = fishName;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'contain';
      
      imgContainer.appendChild(img);
      fishCard.appendChild(imgContainer);
    }
    
    // Fish name
    const nameElement = document.createElement('h3');
    nameElement.textContent = fishName;
    nameElement.style.margin = '0 0 5px 0';
    nameElement.style.fontSize = '16px';
    fishCard.appendChild(nameElement);
    
    // Fish count
    const countElement = document.createElement('p');
    countElement.textContent = `Quantity: ${data.count}`;
    countElement.style.margin = '0 0 5px 0';
    countElement.style.fontSize = '14px';
    fishCard.appendChild(countElement);
    
    // Find best catch
    let bestCatch = 0;
    if (data.catches && data.catches.length > 0) {
      bestCatch = Math.max(...data.catches.map(c => c.length));
    }
    
    // Best catch
    const bestElement = document.createElement('p');
    bestElement.textContent = `Best: ${bestCatch}cm`;
    bestElement.style.margin = '0';
    bestElement.style.fontSize = '14px';
    bestElement.style.color = '#4CAF50';
    fishCard.appendChild(bestElement);
    
    // Add click handler to show detailed view
    fishCard.addEventListener('click', () => {
      showFishDetails(fishName, data, user.id);
    });
    
    // Add to grid
    fishGrid.appendChild(fishCard);
  }
  
  // If no fish, show a message
  if (!hasAnyFish) {
    const noFishMessage = document.createElement('p');
    noFishMessage.textContent = 'You haven\'t caught any fish yet. Try fishing at Lake Placida!';
    noFishMessage.style.textAlign = 'center';
    noFishMessage.style.padding = '40px 0';
    noFishMessage.style.color = '#999';
    fishGrid.appendChild(noFishMessage);
  }
  
  inventoryUI.appendChild(fishGrid);
  document.body.appendChild(inventoryUI);
}

/**
 * Show detailed view of a specific fish type
 */
function showFishDetails(fishName, fishData, userId) {
  // Create detailed view UI
  const detailView = document.createElement('div');
  detailView.id = 'fish-detail-view';
  detailView.style.position = 'fixed';
  detailView.style.top = '50%';
  detailView.style.left = '50%';
  detailView.style.transform = 'translate(-50%, -50%)';
  detailView.style.width = '700px';
  detailView.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  detailView.style.borderRadius = '10px';
  detailView.style.padding = '20px';
  detailView.style.boxShadow = '0 0 30px rgba(0, 0, 0, 0.8)';
  detailView.style.color = 'white';
  detailView.style.fontFamily = 'sans-serif';
  detailView.style.zIndex = '20000';
  
  // Add header with title and close button
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '20px';
  
  const title = document.createElement('h2');
  title.textContent = fishName;
  title.style.margin = '0';
  title.style.fontSize = '28px';
  
  const closeButton = document.createElement('button');
  closeButton.textContent = 'X';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.color = 'white';
  closeButton.style.fontSize = '24px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.padding = '5px 10px';
  closeButton.onclick = () => {
    document.body.removeChild(detailView);
  };
  
  header.appendChild(title);
  header.appendChild(closeButton);
  
  // Create content container
  const content = document.createElement('div');
  content.style.display = 'flex';
  
  // Left side - image
  const imageContainer = document.createElement('div');
  imageContainer.style.flex = '1';
  imageContainer.style.padding = '10px';
  imageContainer.style.display = 'flex';
  imageContainer.style.justifyContent = 'center';
  imageContainer.style.alignItems = 'center';
  
  if (fishTypes[fishName] && fishTypes[fishName].image) {
    const img = document.createElement('img');
    img.src = fishTypes[fishName].image;
    img.alt = fishName;
    img.style.maxWidth = '250px';
    img.style.maxHeight = '200px';
    img.style.border = '3px solid #4CAF50';
    img.style.borderRadius = '5px';
    
    imageContainer.appendChild(img);
  }
  
  // Right side - stats
  const statsContainer = document.createElement('div');
  statsContainer.style.flex = '1';
  statsContainer.style.padding = '10px';
  
  // Fish count
  const countElement = document.createElement('p');
  countElement.innerHTML = `<strong>Total Caught:</strong> ${fishData.count}`;
  countElement.style.fontSize = '16px';
  countElement.style.marginBottom = '10px';
  statsContainer.appendChild(countElement);
  
  // Size range from fishTypes
  if (fishTypes[fishName]) {
    const sizeRange = document.createElement('p');
    sizeRange.innerHTML = `<strong>Typical Size Range:</strong> ${fishTypes[fishName].size.min} - ${fishTypes[fishName].size.max}`;
    sizeRange.style.fontSize = '16px';
    sizeRange.style.marginBottom = '10px';
    statsContainer.appendChild(sizeRange);
    
    // Rarity
    const rarity = document.createElement('p');
    rarity.innerHTML = `<strong>Rarity:</strong> ${(fishTypes[fishName].probability * 100).toFixed(0)}% chance`;
    rarity.style.fontSize = '16px';
    rarity.style.marginBottom = '20px';
    statsContainer.appendChild(rarity);
  }
  
  // Calculate stats
  let bestCatch = 0;
  if (fishData.catches && fishData.catches.length > 0) {
    bestCatch = Math.max(...fishData.catches.map(c => c.length));
  }
  
  // Personal best
  const bestElement = document.createElement('h3');
  bestElement.innerHTML = `<strong>Personal Best:</strong> ${bestCatch}cm`;
  bestElement.style.color = '#4CAF50';
  bestElement.style.fontSize = '20px';
  bestElement.style.marginBottom = '20px';
  statsContainer.appendChild(bestElement);
  
  // Add to content
  content.appendChild(imageContainer);
  content.appendChild(statsContainer);
  
  // Recent catches section
  const recentTitle = document.createElement('h3');
  recentTitle.textContent = 'Recent Catches';
  recentTitle.style.marginTop = '20px';
  recentTitle.style.borderBottom = '1px solid rgba(255, 255, 255, 0.3)';
  recentTitle.style.paddingBottom = '5px';
  
  // Create table for recent catches
  const catchesTable = document.createElement('table');
  catchesTable.style.width = '100%';
  catchesTable.style.borderCollapse = 'collapse';
  catchesTable.style.marginTop = '10px';
  
  // Table header
  const tableHeader = document.createElement('thead');
  tableHeader.innerHTML = `
    <tr>
      <th style="text-align: left; padding: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">Date</th>
      <th style="text-align: center; padding: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">Length</th>
      <th style="text-align: right; padding: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">Actions</th>
    </tr>
  `;
  catchesTable.appendChild(tableHeader);
  
  // Table body
  const tableBody = document.createElement('tbody');
  
  // Sort catches by timestamp (newest first)
  const sortedCatches = [...fishData.catches].sort((a, b) => {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  
  // Show up to 10 most recent catches
  const recentCatches = sortedCatches.slice(0, 10);
  
  recentCatches.forEach(catch_ => {
    const row = document.createElement('tr');
    
    // Format date
    const catchDate = new Date(catch_.timestamp);
    const formattedDate = catchDate.toLocaleDateString() + ' ' + 
                         catchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Date cell
    const dateCell = document.createElement('td');
    dateCell.textContent = formattedDate;
    dateCell.style.padding = '8px';
    dateCell.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
    row.appendChild(dateCell);
    
    // Length cell
    const lengthCell = document.createElement('td');
    lengthCell.textContent = `${catch_.length}cm`;
    lengthCell.style.textAlign = 'center';
    lengthCell.style.padding = '8px';
    lengthCell.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
    
    // Highlight if this is the best catch
    if (catch_.length === bestCatch) {
      lengthCell.style.color = 'gold';
      lengthCell.style.fontWeight = 'bold';
    }
    
    row.appendChild(lengthCell);
    
    // Actions cell
    const actionsCell = document.createElement('td');
    actionsCell.style.textAlign = 'right';
    actionsCell.style.padding = '8px';
    actionsCell.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '🗑️';
    deleteButton.title = 'Delete this catch';
    deleteButton.style.background = 'none';
    deleteButton.style.border = 'none';
    deleteButton.style.color = '#ff6b6b';
    deleteButton.style.cursor = 'pointer';
    deleteButton.style.fontSize = '16px';
    
    deleteButton.onclick = async (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this catch?')) {
        const result = await fishAPI.deleteFishFromInventory(userId, catch_.id);
        if (result.success) {
          // Remove row from table
          row.remove();
          
          // Update count and potentially best catch
          fishData.count--;
          countElement.innerHTML = `<strong>Total Caught:</strong> ${fishData.count}`;
          
          // Remove from catches array
          const index = fishData.catches.findIndex(c => c.id === catch_.id);
          if (index !== -1) {
            fishData.catches.splice(index, 1);
          }
          
          // Recalculate best catch if needed
          if (catch_.length === bestCatch && fishData.catches.length > 0) {
            bestCatch = Math.max(...fishData.catches.map(c => c.length));
            bestElement.innerHTML = `<strong>Personal Best:</strong> ${bestCatch}cm`;
          }
          
          // If no more catches, close the detail view
          if (fishData.count === 0) {
            document.body.removeChild(detailView);
            
            // Also refresh inventory UI to remove this fish type
            const inventoryUI = document.getElementById('inventory-ui');
            if (inventoryUI) {
              document.body.removeChild(inventoryUI);
              showInventoryUI();
            }
          }
        } else {
          alert('Failed to delete catch. Please try again.');
        }
      }
    };
    
    actionsCell.appendChild(deleteButton);
    row.appendChild(actionsCell);
    
    tableBody.appendChild(row);
  });
  
  catchesTable.appendChild(tableBody);
  
  // Assemble UI
  detailView.appendChild(header);
  detailView.appendChild(content);
  detailView.appendChild(recentTitle);
  detailView.appendChild(catchesTable);
  
  document.body.appendChild(detailView);
}

// Function to create inventory button
// export function createInventoryButton() {
//     const button = document.createElement('button');
//     button.id = 'inventory-button';
//     button.innerHTML = '🎒';
//     button.title = 'Open Inventory';
//     button.style.position = 'fixed';
//     button.style.top = '15px'; // Changed from bottom to top
//     button.style.left = '250px'; // Changed from right to left, positioned to the right of controls panel
//     button.style.width = '45px';
//     button.style.height = '45px';
//     button.style.borderRadius = '8px'; // Changed from circle to rounded square
//     button.style.backgroundColor = '#4CAF50';
//     button.style.color = 'white';
//     button.style.border = 'none';
//     button.style.fontSize = '20px';
//     button.style.cursor = 'pointer';
//     button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
//     button.style.zIndex = '1000';
    
//     // Add hover effects
//     button.addEventListener('mouseover', () => {
//       button.style.backgroundColor = '#45a049';
//       button.style.transform = 'scale(1.05)';
//     });
    
//     button.addEventListener('mouseout', () => {
//       button.style.backgroundColor = '#4CAF50';
//       button.style.transform = 'scale(1)';
//     });
    
//     // Add click handler
//     button.addEventListener('click', showInventoryUI);
    
//     // Add to document
//     document.body.appendChild(button);
    
//     return button;
//   }