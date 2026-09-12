import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

const THEMES = {
  cobalt: {
    name: 'Bold Cobalt',
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    primaryLight: '#dbeafe',
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceAlt: '#f1f5f9',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
  },

  dark: {
    name: 'Dark Cobalt',
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#1e3a8a',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceAlt: '#334155',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#334155',
  },
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('metricmind_theme_mode') || 'light'
  })

  const [themeName, setThemeName] = useState(() => {
    return localStorage.getItem('metricmind_theme_name') || 'cobalt'
  })

  const isDark = mode === 'dark'
  const theme = isDark ? THEMES.dark : THEMES[themeName] || THEMES.cobalt

  useEffect(() => {
    localStorage.setItem('metricmind_theme_mode', mode)
    localStorage.setItem('metricmind_theme_name', themeName)

    document.documentElement.setAttribute(
      'data-theme',
      isDark ? 'dark' : themeName
    )

    document.documentElement.style.setProperty(
      '--color-primary',
      theme.primary
    )

    document.documentElement.style.setProperty(
      '--color-primary-dark',
      theme.primaryDark
    )

    document.documentElement.style.setProperty(
      '--color-primary-light',
      theme.primaryLight
    )

    document.documentElement.style.setProperty(
      '--color-background',
      theme.background
    )

    document.documentElement.style.setProperty(
      '--color-surface',
      theme.surface
    )

    document.documentElement.style.setProperty(
      '--color-surface-alt',
      theme.surfaceAlt
    )

    document.documentElement.style.setProperty(
      '--color-text',
      theme.text
    )

    document.documentElement.style.setProperty(
      '--color-text-muted',
      theme.textMuted
    )

    document.documentElement.style.setProperty(
      '--color-border',
      theme.border
    )
  }, [mode, themeName, isDark, theme])

  const toggleTheme = () => {
    setMode((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  const setCobaltTheme = () => {
    setThemeName('cobalt')
    setMode('light')
  }

  return (
    <ThemeContext.Provider
      value={{
        mode,
        themeName,
        theme,
        isDark,
        toggleTheme,
        setThemeName,
        setCobaltTheme,
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

export { ThemeContext }