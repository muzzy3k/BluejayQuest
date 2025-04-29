import { signInWithGoogle, getCurrentUser } from './auth.js'
import { initializeLocalInventory } from './api/fishLocalStorage.js'

export function createLoginScreen() {
  // Create the login screen container
  const loginScreen = document.createElement('div')
  loginScreen.id = 'login-screen'
  loginScreen.style.position = 'fixed'
  loginScreen.style.top = '0'
  loginScreen.style.left = '0'
  loginScreen.style.width = '100%'
  loginScreen.style.height = '100%'
  loginScreen.style.backgroundColor = '#333'
  loginScreen.style.display = 'flex'
  loginScreen.style.flexDirection = 'column'
  loginScreen.style.justifyContent = 'center'
  loginScreen.style.alignItems = 'center'
  loginScreen.style.zIndex = '20000'
  
  // Create a header
  const header = document.createElement('h1')
  header.textContent = 'BluejayQuest'
  header.style.color = 'white'
  header.style.fontFamily = 'sans-serif'
  header.style.marginBottom = '40px'
  
  // Create welcome text
  const welcomeText = document.createElement('p')
  welcomeText.textContent = 'Welcome to BluejayQuest! Sign in to save your progress or play as a guest.'
  welcomeText.style.color = 'white'
  welcomeText.style.fontFamily = 'sans-serif'
  welcomeText.style.marginBottom = '40px'
  welcomeText.style.fontSize = '18px'
  welcomeText.style.textAlign = 'center'
  welcomeText.style.maxWidth = '600px'
  
  // Create Google login button
  const googleButton = document.createElement('button')
  googleButton.innerHTML = '<img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" style="width: 20px; margin-right: 10px; vertical-align: middle;"> Sign in with Google'
  googleButton.style.padding = '12px 24px'
  googleButton.style.backgroundColor = 'white'
  googleButton.style.color = '#444'
  googleButton.style.border = 'none'
  googleButton.style.borderRadius = '4px'
  googleButton.style.fontSize = '16px'
  googleButton.style.cursor = 'pointer'
  googleButton.style.display = 'flex'
  googleButton.style.alignItems = 'center'
  googleButton.style.justifyContent = 'center'
  googleButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.25)'
  googleButton.style.marginBottom = '20px'
  
  // Add hover effect
  googleButton.addEventListener('mouseover', () => {
    googleButton.style.backgroundColor = '#f1f1f1'
  })
  
  googleButton.addEventListener('mouseout', () => {
    googleButton.style.backgroundColor = 'white'
  })
  
  // Add click handler
  googleButton.addEventListener('click', async () => {
    // Simply call sign in without additional checks or alerts
    await signInWithGoogle();
  })
  
  // Create a "Play without logging in" button
  const guestButton = document.createElement('button')
  guestButton.textContent = 'Play without logging in'
  guestButton.style.padding = '12px 24px'
  guestButton.style.backgroundColor = 'transparent'
  guestButton.style.color = '#fff'
  guestButton.style.border = '2px solid #555'
  guestButton.style.borderRadius = '4px'
  guestButton.style.fontSize = '16px'
  guestButton.style.cursor = 'pointer'
  guestButton.style.display = 'flex'
  guestButton.style.alignItems = 'center'
  guestButton.style.justifyContent = 'center'
  
  // Add hover effect
  guestButton.addEventListener('mouseover', () => {
    guestButton.style.backgroundColor = 'rgba(255,255,255,0.1)'
  })
  
  guestButton.addEventListener('mouseout', () => {
    guestButton.style.backgroundColor = 'transparent'
  })
  
  // Add click handler for guest mode
  guestButton.addEventListener('click', () => {
    // Initialize local storage for guest mode
    initializeLocalInventory()
    
    // Set a flag in localStorage to indicate guest mode
    localStorage.setItem('bluejayquest_guest_mode', 'true')
    
    // Remove login screen
    if (loginScreen.parentNode) {
      loginScreen.parentNode.removeChild(loginScreen)
    }
    
    // Dispatch a custom event that the game can listen for
    const guestModeEvent = new CustomEvent('guestModeActivated')
    document.dispatchEvent(guestModeEvent)
  })
  
  // Add a note about guest mode limitations
  const guestNote = document.createElement('p')
  guestNote.textContent = 'Note: In guest mode, your progress is saved to your browser only and may be lost if you clear browser data.'
  guestNote.style.color = '#aaa'
  guestNote.style.fontFamily = 'sans-serif'
  guestNote.style.fontSize = '14px'
  guestNote.style.marginTop = '20px'
  guestNote.style.maxWidth = '500px'
  guestNote.style.textAlign = 'center'
  
  // Add elements to login screen
  loginScreen.appendChild(header)
  loginScreen.appendChild(welcomeText)
  loginScreen.appendChild(googleButton)
  loginScreen.appendChild(guestButton)
  loginScreen.appendChild(guestNote)
  
  return loginScreen
}

// Check if user is logged in (but NOT including guest mode)
export async function checkUserLoggedIn() {
  // Only check for actual user login, NOT guest mode
  const user = await getCurrentUser()
  return user !== null
}

// Add a separate function for checking guest mode
export function isGuestMode() {
  return localStorage.getItem('bluejayquest_guest_mode') === 'true'
}