import { signInWithGoogle, getCurrentUser } from './auth.js'

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
  welcomeText.textContent = 'Welcome to BluejayQuest! Sign in to continue.'
  welcomeText.style.color = 'white'
  welcomeText.style.fontFamily = 'sans-serif'
  welcomeText.style.marginBottom = '40px'
  welcomeText.style.fontSize = '18px'
  
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
  
  // Add hover effect
  googleButton.addEventListener('mouseover', () => {
    googleButton.style.backgroundColor = '#f1f1f1'
  })
  
  googleButton.addEventListener('mouseout', () => {
    googleButton.style.backgroundColor = 'white'
  })
  
  // Add click handler
  googleButton.addEventListener('click', async () => {
    await signInWithGoogle()
  })
  
  // Add elements to login screen
  loginScreen.appendChild(header)
  loginScreen.appendChild(welcomeText)
  loginScreen.appendChild(googleButton)
  
  return loginScreen
}

// Check if user is logged in
export async function checkUserLoggedIn() {
  const user = await getCurrentUser()
  return user !== null
}