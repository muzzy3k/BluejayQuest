import * as localAPI from './fishLocalStorage.js';
import { fishTypes } from '../fishingGame.js';

/**
 * Create and display the local inventory UI for guest users
 */
export function showLocalInventoryUI() {
  // Fetch local fish inventory
  const { success, inventory, error } = localAPI.getLocalFishInventory();
  
  if (!success) {
    console.error('Error fetching local inventory:', error);
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
  title.textContent = 'Fish Inventory (Guest Mode)';
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
    
    // Calculate and show best length
    if (data.catches.length > 0) {
      const bestLength = Math.max(...data.catches.map(catch_ => catch_.length));
      const bestElement = document.createElement('p');
      bestElement.textContent = `Best: ${bestLength}cm`;
      bestElement.style.margin = '0';
      bestElement.style.fontSize = '14px';
      bestElement.style.color = '#ffcc00';
      fishCard.appendChild(bestElement);
    }
    
    // Add click handler to show details
    fishCard.addEventListener('click', () => {
      showLocalFishDetails(fishName, data);
    });
    
    fishGrid.appendChild(fishCard);
  }
  
  // If no fish, show a message
  if (!hasAnyFish) {
    const noFishMsg = document.createElement('div');
    noFishMsg.style.textAlign = 'center';
    noFishMsg.style.padding = '40px 0';
    noFishMsg.style.color = '#aaa';
    
    const msgIcon = document.createElement('div');
    msgIcon.innerHTML = '🎣';
    msgIcon.style.fontSize = '48px';
    msgIcon.style.marginBottom = '20px';
    
    const msgText = document.createElement('p');
    msgText.textContent = 'Your inventory is empty. Go fishing to catch some fish!';
    msgText.style.fontSize = '18px';
    
    noFishMsg.appendChild(msgIcon);
    noFishMsg.appendChild(msgText);
    
    fishGrid.appendChild(noFishMsg);
  }
  
  inventoryUI.appendChild(fishGrid);
  document.body.appendChild(inventoryUI);
}

function showLocalFishDetails(fishName, fishData) {
  // Create detailed view UI
  const detailView = document.createElement('div');
  detailView.style.position = 'fixed';
  detailView.style.top = '50%';
  detailView.style.left = '50%';
  detailView.style.transform = 'translate(-50%, -50%)';
  detailView.style.width = '80%';
  detailView.style.maxWidth = '900px';
  detailView.style.height = '80vh';
  detailView.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  detailView.style.borderRadius = '10px';
  detailView.style.padding = '30px';
  detailView.style.boxShadow = '0 0 30px rgba(0, 0, 0, 0.8)';
  detailView.style.color = 'white';
  detailView.style.fontFamily = 'sans-serif';
  detailView.style.zIndex = '10001';
  detailView.style.display = 'flex';
  detailView.style.flexDirection = 'column';
  detailView.style.overflowY = 'auto';
  
  // Create header with back button
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.marginBottom = '30px';
  
  const backButton = document.createElement('button');
  backButton.innerHTML = '&larr;';
  backButton.style.background = 'none';
  backButton.style.border = 'none';
  backButton.style.color = 'white';
  backButton.style.fontSize = '24px';
  backButton.style.cursor = 'pointer';
  backButton.style.marginRight = '15px';
  backButton.onclick = () => {
    document.body.removeChild(detailView);
  };
  
  const title = document.createElement('h2');
  title.textContent = fishName;
  title.style.margin = '0';
  title.style.fontSize = '28px';
  
  header.appendChild(backButton);
  header.appendChild(title);
  
  // Create content section for fish details
  const content = document.createElement('div');
  content.style.display = 'flex';
  content.style.marginBottom = '30px';
  
  // Fish image (if available)
  const imageContainer = document.createElement('div');
  imageContainer.style.width = '200px';
  imageContainer.style.marginRight = '30px';
  imageContainer.style.display = 'flex';
  imageContainer.style.justifyContent = 'center';
  imageContainer.style.alignItems = 'flex-start';
  
  if (fishTypes[fishName] && fishTypes[fishName].image) {
    const img = document.createElement('img');
    img.src = fishTypes[fishName].image;
    img.alt = fishName;
    img.style.maxWidth = '100%';
    img.style.borderRadius = '5px';
    imageContainer.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.style.width = '200px';
    placeholder.style.height = '150px';
    placeholder.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    placeholder.style.borderRadius = '5px';
    placeholder.style.display = 'flex';
    placeholder.style.justifyContent = 'center';
    placeholder.style.alignItems = 'center';
    placeholder.innerHTML = '🐟';
    placeholder.style.fontSize = '48px';
    imageContainer.appendChild(placeholder);
  }
  
  content.appendChild(imageContainer);
  
  // Fish stats
  const statsContainer = document.createElement('div');
  statsContainer.style.flex = '1';
  
  // Total caught
  const countElement = document.createElement('p');
  countElement.innerHTML = `<strong>Total Caught:</strong> ${fishData.count}`;
  countElement.style.fontSize = '18px';
  countElement.style.marginBottom = '10px';
  statsContainer.appendChild(countElement);
  
  // Best catch
  const bestCatch = Math.max(...fishData.catches.map(catch_ => catch_.length));
  const bestElement = document.createElement('p');
  bestElement.innerHTML = `<strong>Personal Best:</strong> ${bestCatch}cm`;
  bestElement.style.fontSize = '18px';
  bestElement.style.marginBottom = '10px';
  bestElement.style.color = '#ffcc00';
  statsContainer.appendChild(bestElement);
  
  // Fish description
  if (fishTypes[fishName] && fishTypes[fishName].description) {
    const descElement = document.createElement('p');
    descElement.innerHTML = `<strong>About:</strong> ${fishTypes[fishName].description}`;
    descElement.style.fontSize = '16px';
    descElement.style.marginTop = '20px';
    descElement.style.color = '#aaa';
    descElement.style.lineHeight = '1.5';
    statsContainer.appendChild(descElement);
  }
  
  content.appendChild(statsContainer);
  
  // Create recent catches section
  const recentTitle = document.createElement('h3');
  recentTitle.textContent = 'Recent Catches';
  recentTitle.style.marginBottom = '15px';
  recentTitle.style.fontSize = '20px';
  
  // Create table for catches
  const catchesTable = document.createElement('table');
  catchesTable.style.width = '100%';
  catchesTable.style.borderCollapse = 'collapse';
  
  // Table header
  const tableHeader = document.createElement('thead');
  tableHeader.innerHTML = `
    <tr>
      <th style="text-align: left; padding: 10px; border-bottom: 1px solid #444;">Caught On</th>
      <th style="text-align: left; padding: 10px; border-bottom: 1px solid #444;">Length</th>
      <th style="text-align: right; padding: 10px; border-bottom: 1px solid #444;">Actions</th>
    </tr>
  `;
  catchesTable.appendChild(tableHeader);
  
  // Table body
  const tableBody = document.createElement('tbody');
  
  // Sort catches by timestamp (newest first)
  const recentCatches = [...fishData.catches].sort((a, b) => {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  
  recentCatches.forEach(catch_ => {
    const row = document.createElement('tr');
    
    // Format date
    const date = new Date(catch_.timestamp);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    
    // Date cell
    const dateCell = document.createElement('td');
    dateCell.textContent = formattedDate;
    dateCell.style.padding = '10px';
    dateCell.style.borderBottom = '1px solid #333';
    row.appendChild(dateCell);
    
    // Length cell
    const lengthCell = document.createElement('td');
    lengthCell.textContent = `${catch_.length}cm`;
    lengthCell.style.padding = '10px';
    lengthCell.style.borderBottom = '1px solid #333';
    
    // Highlight if this is the best catch
    if (catch_.length === bestCatch) {
      lengthCell.style.color = '#ffcc00';
      lengthCell.style.fontWeight = 'bold';
    }
    
    row.appendChild(lengthCell);
    
    // Actions cell
    const actionsCell = document.createElement('td');
    actionsCell.style.padding = '10px';
    actionsCell.style.borderBottom = '1px solid #333';
    actionsCell.style.textAlign = 'right';
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.style.backgroundColor = '#e74c3c';
    deleteButton.style.color = 'white';
    deleteButton.style.border = 'none';
    deleteButton.style.borderRadius = '4px';
    deleteButton.style.padding = '5px 10px';
    deleteButton.style.cursor = 'pointer';
    
    deleteButton.onclick = async (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this catch?')) {
        const result = localAPI.deleteFishFromLocalStorage(catch_.id);
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
              showLocalInventoryUI();
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
