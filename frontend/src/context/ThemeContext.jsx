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

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('metricmind_theme') || 'cobalt'
  )

  const [dark, setDark] = useState(
    () => localStorage.getItem('metricmind_dark') === 'true'
  )

  useEffect(() => {
    const root = document.documentElement
    const selected = themes[theme] || themes.cobalt

    root.style.setProperty('--primary', selected.primary)
    root.style.setProperty('--primary-dark', selected.primaryDark)
    root.style.setProperty('--secondary', selected.secondary)

    if (dark) {
      root.classList.add('dark')
      root.setAttribute('data-theme', theme)

      root.style.setProperty('--background', '#000000')
      root.style.setProperty('--surface', '#0a0a0a')
      root.style.setProperty('--surface-2', '#141414')
      root.style.setProperty('--text', '#ffffff')
      root.style.setProperty('--muted', '#a3a3a3')
      root.style.setProperty('--border', '#262626')

      document.body.style.backgroundColor = '#000000'
      document.body.style.color = '#ffffff'
    } else {
      root.classList.remove('dark')
      root.setAttribute('data-theme', theme)

      root.style.setProperty('--background', '#f6f8ff')
      root.style.setProperty('--surface', '#ffffff')
      root.style.setProperty('--surface-2', '#f1f5f9')
      root.style.setProperty('--text', '#111827')
      root.style.setProperty('--muted', '#64748b')
      root.style.setProperty('--border', '#e2e8f0')

      document.body.style.backgroundColor = '#f6f8ff'
      document.body.style.color = '#111827'
    }

    localStorage.setItem('metricmind_theme', theme)
    localStorage.setItem('metricmind_dark', String(dark))
  }, [theme, dark])

  function changeTheme(themeName) {
    if (themes[themeName]) {
      setTheme(themeName)
    }
  }

  function toggleDarkMode() {
    setDark((current) => !current)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themes,
        dark,
        changeTheme,
        toggleDarkMode,
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