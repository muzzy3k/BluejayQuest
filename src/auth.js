import { createClient } from '@supabase/supabase-js'
import { supabaseUrl, supabaseAnonKey } from './config.js'

// Replace with your Supabase URL and anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Google Sign In function
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })
  
  if (error) {
    console.error('Error signing in with Google:', error.message)
    return { success: false, error }
  }
  
  return { success: true, data }
}

// Get current user
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}

// Sign out function
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Error signing out:', error.message)
    return { success: false, error }
  }
  
  return { success: true }
}