import React, { useState } from 'react'
import { Moon, Sun, Palette, Check } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeControls() {
  const {
    mode,
    theme,
    themes,
    toggleMode,
    changeTheme,
  } = useTheme()

  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        position: 'relative',
      }}
    >
      {/* Dark / Light Toggle */}

      <button
        onClick={toggleMode}
        title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        {mode === 'light' ? (
          <Moon size={19} />
        ) : (
          <Sun size={19} />
        )}
      </button>

      {/* Theme Selector */}

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(!open)}
          title="Change theme"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Palette size={19} />
        </button>

        {open && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '50px',
              width: '220px',
              padding: '10px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                padding: '6px 8px 10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Dashboard Theme
            </div>

            {Object.entries(themes).map(([key, item]) => (
              <button
                key={key}
                onClick={() => {
                  changeTheme(key)
                  setOpen(false)
                }}
                style={{
                  width: '100%',
                  border: 'none',
                  background:
                    theme === key
                      ? 'var(--surface-hover)'
                      : 'transparent',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: item.primary,
                    display: 'block',
                    flexShrink: 0,
                  }}
                />

                <span
                  style={{
                    flex: 1,
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  {item.name}
                </span>

                {theme === key && (
                  <Check
                    size={17}
                    color={item.primary}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}