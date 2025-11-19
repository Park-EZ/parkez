// API utility functions for making authenticated requests

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function getToken() {
  return localStorage.getItem('ezpark_token')
}

export function setToken(token) {
  localStorage.setItem('ezpark_token', token)
}

export function removeToken() {
  localStorage.removeItem('ezpark_token')
}

export async function apiRequest(url, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Extract body if provided (don't include it in spread)
  const { body, ...fetchOptions } = options
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...fetchOptions,
    headers,
    body: body || options.body // Handle body properly
  })

  // If token is invalid/expired, remove it
  if (response.status === 401 && token) {
    removeToken()
    // Optionally redirect to login or trigger logout
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  return response
}

