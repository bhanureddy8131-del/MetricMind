import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

const themes = {
  cobalt: {
    name: 'Bold Cobalt',
    primary: '#4f46e5',
    primaryDark: '#3730a3',
    secondary: '#7c3aed',
    background: '#f6f8ff',
    surface: '#ffffff',
    text: '#111827',
    muted: '#64748b',
    border: '#e2e8f0',
  },

  violet: {
    name: 'Modern Violet',
    primary: '#7c3aed',
    primaryDark: '#5b21b6',
    secondary: '#a855f7',
    background: '#faf7ff',
    surface: '#ffffff',
    text: '#18181b',
    muted: '#71717a',
    border: '#e4e4e7',
  },

  blue: {
    name: 'Ocean Blue',
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    secondary: '#06b6d4',
    background: '#f4f8ff',
    surface: '#ffffff',
    text: '#0f172a',
    muted: '#64748b',
    border: '#dbeafe',
  },
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('metricmind_dark') === 'true'
  })

  const [themeName, setThemeName] = useState(() => {
    return localStorage.getItem('metricmind_theme') || 'cobalt'
  })

  const theme = themes[themeName] || themes.cobalt

  useEffect(() => {
    localStorage.setItem('metricmind_dark', String(dark))
    localStorage.setItem('metricmind_theme', themeName)

    const root = document.documentElement

    root.style.setProperty('--primary', theme.primary)
    root.style.setProperty('--primary-dark', theme.primaryDark)
    root.style.setProperty('--secondary', theme.secondary)

    if (dark) {
      root.style.setProperty('--background', '#0b1020')
      root.style.setProperty('--surface', '#111827')
      root.style.setProperty('--surface-2', '#182235')
      root.style.setProperty('--text', '#f8fafc')
      root.style.setProperty('--muted', '#94a3b8')
      root.style.setProperty('--border', '#273449')
      root.classList.add('dark')
    } else {
      root.style.setProperty('--background', theme.background)
      root.style.setProperty('--surface', theme.surface)
      root.style.setProperty('--surface-2', '#f8fafc')
      root.style.setProperty('--text', theme.text)
      root.style.setProperty('--muted', theme.muted)
      root.style.setProperty('--border', theme.border)
      root.classList.remove('dark')
    }
  }, [dark, themeName, theme])

  const toggleDarkMode = () => {
    setDark((value) => !value)
  }

  const changeTheme = (name) => {
    if (themes[name]) {
      setThemeName(name)
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        dark,
        themeName,
        theme,
        themes,
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