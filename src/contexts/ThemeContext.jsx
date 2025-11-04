import { createContext, useContext, useState, useEffect, useLayoutEffect } from "react"

const ThemeContext = createContext(null)

const THEMES = {
  light: {
    blue: {
      name: "Light Blue",
      colors: {
        background: "0 0% 100%",
        foreground: "222.2 84% 4.9%",
        card: "0 0% 100%",
        "card-foreground": "222.2 84% 4.9%",
        popover: "0 0% 100%",
        "popover-foreground": "222.2 84% 4.9%",
        primary: "221.2 83.2% 53.3%",
        "primary-foreground": "210 40% 98%",
        secondary: "210 40% 96.1%",
        "secondary-foreground": "222.2 47.4% 11.2%",
        muted: "210 40% 96.1%",
        "muted-foreground": "215.4 16.3% 46.9%",
        accent: "217.2 32.6% 17.5%",
        "accent-foreground": "210 40% 98%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "210 40% 98%",
        border: "214.3 31.8% 91.4%",
        input: "214.3 31.8% 91.4%",
        ring: "221.2 83.2% 53.3%",
        radius: "0.5rem",
      },
    },
    green: {
      name: "Light Green",
      colors: {
        background: "0 0% 100%",
        foreground: "222.2 84% 4.9%",
        card: "0 0% 100%",
        "card-foreground": "222.2 84% 4.9%",
        popover: "0 0% 100%",
        "popover-foreground": "222.2 84% 4.9%",
        primary: "142.1 76.2% 36.3%",
        "primary-foreground": "210 40% 98%",
        secondary: "210 40% 96.1%",
        "secondary-foreground": "222.2 47.4% 11.2%",
        muted: "210 40% 96.1%",
        "muted-foreground": "215.4 16.3% 46.9%",
        accent: "142.1 70.6% 45.3%",
        "accent-foreground": "144.9 80.4% 10%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "210 40% 98%",
        border: "214.3 31.8% 91.4%",
        input: "214.3 31.8% 91.4%",
        ring: "142.1 76.2% 36.3%",
        radius: "0.5rem",
      },
    },
    purple: {
      name: "Light Purple",
      colors: {
        background: "0 0% 100%",
        foreground: "222.2 84% 4.9%",
        card: "0 0% 100%",
        "card-foreground": "222.2 84% 4.9%",
        popover: "0 0% 100%",
        "popover-foreground": "222.2 84% 4.9%",
        primary: "262.1 83.3% 57.8%",
        "primary-foreground": "210 40% 98%",
        secondary: "210 40% 96.1%",
        "secondary-foreground": "222.2 47.4% 11.2%",
        muted: "210 40% 96.1%",
        "muted-foreground": "215.4 16.3% 46.9%",
        accent: "262.1 52.8% 47.6%",
        "accent-foreground": "210 40% 98%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "210 40% 98%",
        border: "214.3 31.8% 91.4%",
        input: "214.3 31.8% 91.4%",
        ring: "262.1 83.3% 57.8%",
        radius: "0.5rem",
      },
    },
    orange: {
      name: "Light Orange",
      colors: {
        background: "0 0% 100%",
        foreground: "222.2 84% 4.9%",
        card: "0 0% 100%",
        "card-foreground": "222.2 84% 4.9%",
        popover: "0 0% 100%",
        "popover-foreground": "222.2 84% 4.9%",
        primary: "24.6 95% 53.1%",
        "primary-foreground": "210 40% 98%",
        secondary: "210 40% 96.1%",
        "secondary-foreground": "222.2 47.4% 11.2%",
        muted: "210 40% 96.1%",
        "muted-foreground": "215.4 16.3% 46.9%",
        accent: "24.6 95% 53.1%",
        "accent-foreground": "210 40% 98%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "210 40% 98%",
        border: "214.3 31.8% 91.4%",
        input: "214.3 31.8% 91.4%",
        ring: "24.6 95% 53.1%",
        radius: "0.5rem",
      },
    },
  },
  dark: {
    blue: {
      name: "Dark Blue",
      colors: {
        background: "222.2 84% 4.9%",
        foreground: "210 40% 98%",
        card: "222.2 84% 4.9%",
        "card-foreground": "210 40% 98%",
        popover: "222.2 84% 4.9%",
        "popover-foreground": "210 40% 98%",
        primary: "217.2 91.2% 59.8%",
        "primary-foreground": "222.2 47.4% 11.2%",
        secondary: "217.2 32.6% 17.5%",
        "secondary-foreground": "210 40% 98%",
        muted: "217.2 32.6% 17.5%",
        "muted-foreground": "215 20.2% 65.1%",
        accent: "217.2 32.6% 17.5%",
        "accent-foreground": "210 40% 98%",
        destructive: "0 62.8% 30.6%",
        "destructive-foreground": "210 40% 98%",
        border: "217.2 32.6% 17.5%",
        input: "217.2 32.6% 17.5%",
        ring: "217.2 91.2% 59.8%",
        radius: "0.5rem",
      },
    },
    green: {
      name: "Dark Green",
      colors: {
        background: "222.2 84% 4.9%",
        foreground: "210 40% 98%",
        card: "222.2 84% 4.9%",
        "card-foreground": "210 40% 98%",
        popover: "222.2 84% 4.9%",
        "popover-foreground": "210 40% 98%",
        primary: "142.1 70.6% 45.3%",
        "primary-foreground": "144.9 80.4% 10%",
        secondary: "217.2 32.6% 17.5%",
        "secondary-foreground": "210 40% 98%",
        muted: "217.2 32.6% 17.5%",
        "muted-foreground": "215 20.2% 65.1%",
        accent: "142.1 70.6% 45.3%",
        "accent-foreground": "210 40% 98%",
        destructive: "0 62.8% 30.6%",
        "destructive-foreground": "210 40% 98%",
        border: "217.2 32.6% 17.5%",
        input: "217.2 32.6% 17.5%",
        ring: "142.1 70.6% 45.3%",
        radius: "0.5rem",
      },
    },
    purple: {
      name: "Dark Purple",
      colors: {
        background: "222.2 84% 4.9%",
        foreground: "210 40% 98%",
        card: "222.2 84% 4.9%",
        "card-foreground": "210 40% 98%",
        popover: "222.2 84% 4.9%",
        "popover-foreground": "210 40% 98%",
        primary: "262.1 83.3% 57.8%",
        "primary-foreground": "210 40% 98%",
        secondary: "217.2 32.6% 17.5%",
        "secondary-foreground": "210 40% 98%",
        muted: "217.2 32.6% 17.5%",
        "muted-foreground": "215 20.2% 65.1%",
        accent: "262.1 52.8% 47.6%",
        "accent-foreground": "210 40% 98%",
        destructive: "0 62.8% 30.6%",
        "destructive-foreground": "210 40% 98%",
        border: "217.2 32.6% 17.5%",
        input: "217.2 32.6% 17.5%",
        ring: "262.1 83.3% 57.8%",
        radius: "0.5rem",
      },
    },
    orange: {
      name: "Dark Orange",
      colors: {
        background: "222.2 84% 4.9%",
        foreground: "210 40% 98%",
        card: "222.2 84% 4.9%",
        "card-foreground": "210 40% 98%",
        popover: "222.2 84% 4.9%",
        "popover-foreground": "210 40% 98%",
        primary: "24.6 95% 53.1%",
        "primary-foreground": "210 40% 98%",
        secondary: "217.2 32.6% 17.5%",
        "secondary-foreground": "210 40% 98%",
        muted: "217.2 32.6% 17.5%",
        "muted-foreground": "215 20.2% 65.1%",
        accent: "24.6 95% 53.1%",
        "accent-foreground": "210 40% 98%",
        destructive: "0 62.8% 30.6%",
        "destructive-foreground": "210 40% 98%",
        border: "217.2 32.6% 17.5%",
        input: "217.2 32.6% 17.5%",
        ring: "24.6 95% 53.1%",
        radius: "0.5rem",
      },
    },
  },
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem("ezpark_theme_mode")
    return saved || "light"
  })
  
  const [color, setColor] = useState(() => {
    const saved = localStorage.getItem("ezpark_theme_color")
    return saved || "blue"
  })

  const currentTheme = THEMES[mode]?.[color] || THEMES.light.blue

  const applyTheme = (colors, themeMode) => {
    const root = document.documentElement
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })
    root.classList.toggle("dark", themeMode === "dark")
  }

  // Apply theme immediately on mount (synchronously to prevent flash)
  useLayoutEffect(() => {
    const savedMode = localStorage.getItem("ezpark_theme_mode") || "light"
    const savedColor = localStorage.getItem("ezpark_theme_color") || "blue"
    const initialTheme = THEMES[savedMode]?.[savedColor] || THEMES.light.blue
    applyTheme(initialTheme.colors, savedMode)
  }, [])

  // Apply theme on mount and when theme changes
  useEffect(() => {
    localStorage.setItem("ezpark_theme_mode", mode)
    localStorage.setItem("ezpark_theme_color", color)
    applyTheme(currentTheme.colors, mode)
  }, [mode, color, currentTheme])

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"))
  }

  const setThemeColor = (newColor) => {
    setColor(newColor)
  }

  return (
    <ThemeContext.Provider
      value={{
        mode,
        color,
        theme: currentTheme,
        toggleMode,
        setThemeColor,
        availableColors: Object.keys(THEMES[mode] || {}),
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}

