import { createContext, useContext, useState, useEffect } from "react"
import { getToken, setToken, removeToken, apiRequest } from "@/utils/api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const token = getToken()
    if (token) {
      verifyToken()
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async () => {
    try {
      const response = await apiRequest('/api/auth/verify')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        // Token is invalid, remove it
        removeToken()
        setUser(null)
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      removeToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      console.log("Logging in via API...")
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        let msg = 'Login failed'
        try {
          const body = await response.json()
          msg = body.error || body.message || msg
        } catch (e) {
          msg = response.statusText || msg
        }
        throw new Error(msg)
      }

      const data = await response.json()
      
      // Store token and user
      setToken(data.token)
      setUser(data.user)
      
      return data.user
    } catch (err) {
      if (err instanceof Error) throw err
      throw new Error('Failed to login')
    }
  }

  const register = async (email, password, name) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })

      if (!response.ok) {
        let msg = 'Registration failed'
        try {
          const body = await response.json()
          msg = body.error || body.message || msg
        } catch (e) {
          msg = response.statusText || msg
        }
        throw new Error(msg)
      }

      const data = await response.json()
      
      // Store token and user
      setToken(data.token)
      setUser(data.user)
      
      return data.user
    } catch (err) {
      if (err instanceof Error) throw err
      throw new Error('Failed to register')
    }
  }

  const logout = () => {
    removeToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
