import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export const themes = {
  cobalt: {
    name: 'Bold Cobalt',
    primary: '#4f46e5',
    primaryDark: '#3730a3',
    secondary: '#7c3aed',
  },
  violet: {
    name: 'Violet',
    primary: '#7c3aed',
    primaryDark: '#5b21b6',
    secondary: '#a855f7',
  },
  blue: {
    name: 'Ocean Blue',
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    secondary: '#06b6d4',
  },
  emerald: {
    name: 'Emerald',
    primary: '#059669',
    primaryDark: '#047857',
    secondary: '#10b981',
  },
  rose: {
    name: 'Rose',
    primary: '#e11d48',
    primaryDark: '#be123c',
    secondary: '#f43f5e',
  },
}

function setMode(themeName, darkMode) {
  const root = document.documentElement
  const body = document.body
  const selected = themes[themeName] || themes.cobalt

  root.setAttribute('data-mode', darkMode ? 'dark' : 'light')

  root.style.setProperty('--primary', selected.primary)
  root.style.setProperty('--primary-dark', selected.primaryDark)
  root.style.setProperty('--secondary', selected.secondary)

  if (darkMode) {
    root.style.setProperty('--background', '#000000')
    root.style.setProperty('--surface', '#0a0a0a')
    root.style.setProperty('--surface-2', '#171717')
    root.style.setProperty('--text', '#ffffff')
    root.style.setProperty('--muted', '#a3a3a3')
    root.style.setProperty('--border', '#303030')

    body.style.background = '#000000'
    body.style.color = '#ffffff'
  } else {
    root.style.setProperty('--background', '#f6f8ff')
    root.style.setProperty('--surface', '#ffffff')
    root.style.setProperty('--surface-2', '#f1f5f9')
    root.style.setProperty('--text', '#111827')
    root.style.setProperty('--muted', '#64748b')
    root.style.setProperty('--border', '#e2e8f0')

    body.style.background = '#f6f8ff'
    body.style.color = '#111827'
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('metricmind_theme') || 'cobalt'
  )

  const [dark, setDark] = useState(
    () => localStorage.getItem('metricmind_dark') === 'true'
  )

  useEffect(() => {
    setMode(theme, dark)

    localStorage.setItem('metricmind_theme', theme)
    localStorage.setItem('metricmind_dark', String(dark))
  }, [theme, dark])

  function toggleDarkMode() {
    setDark((previous) => !previous)
  }

  function changeTheme(themeName) {
    if (!themes[themeName]) return
    setTheme(themeName)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themes,
        dark,
        toggleDarkMode,
        changeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }

  return context
}