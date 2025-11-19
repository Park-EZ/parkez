import { createContext, useContext, useState, useEffect } from "react"

const UserPreferencesContext = createContext(null)

export function UserPreferencesProvider({ children }) {
  const [preferADA, setPreferADA] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("ezpark_prefer_ada")
      return saved === 'true'
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("ezpark_prefer_ada", preferADA.toString())
    }
  }, [preferADA])

  return (
    <UserPreferencesContext.Provider value={{ preferADA, setPreferADA }}>
      {children}
    </UserPreferencesContext.Provider>
  )
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext)
  if (!context) {
    throw new Error("useUserPreferences must be used within UserPreferencesProvider")
  }
  return context
}

