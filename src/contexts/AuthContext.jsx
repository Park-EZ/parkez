import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("ezpark_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem("ezpark_user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    // TODO: Replace with actual API call
    const userData = { id: "user_" + Date.now(), email, name: email.split("@")[0] }
    localStorage.setItem("ezpark_user", JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const register = async (email, password, name) => {
    // TODO: Replace with actual API call
    const userData = { id: "user_" + Date.now(), email, name }
    localStorage.setItem("ezpark_user", JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem("ezpark_user")
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

