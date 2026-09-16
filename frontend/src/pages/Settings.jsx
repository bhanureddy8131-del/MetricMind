import { Check, Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function Settings() {
  const {
    theme,
    themes,
    dark,
    changeTheme,
    toggleDarkMode,
  } = useTheme()

  return (
    <div className="settings-page">

      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Customize your MetricMind experience.</p>
        </div>
      </div>

      {/* ================================
          APPEARANCE
          ================================ */}

      <section className="settings-card">

        <div className="settings-card-header">

          <div className="settings-icon">
            {dark ? (
              <Moon size={24} />
            ) : (
              <Sun size={24} />
            )}
          </div>

          <div>
            <h2>Appearance</h2>

            <p>
              {dark
                ? 'Black mode is currently enabled.'
                : 'Light mode is currently enabled.'}
            </p>
          </div>

        </div>

        <div className="dark-mode-row">

          <div>
            <strong>Black Mode</strong>

            <span>
              {dark
                ? 'MetricMind is using black mode'
                : 'MetricMind is using light mode'}
            </span>
          </div>

          <button
            type="button"
            className={`dark-toggle ${dark ? 'active' : ''}`}
            onClick={toggleDarkMode}
            aria-label="Toggle black mode"
          >
            <span className="dark-toggle-circle">
              {dark ? (
                <Moon size={15} />
              ) : (
                <Sun size={15} />
              )}
            </span>
          </button>

        </div>

      </section>

      {/* ================================
          COLOR THEME
          ================================ */}

      <section className="settings-card">

        <div className="settings-card-header">

          <div>
            <h2>Color Theme</h2>

            <p>
              Select your preferred MetricMind accent color.
            </p>
          </div>

        </div>

        <div className="theme-grid">

          {Object.entries(themes).map(([key, item]) => (

            <button
              type="button"
              key={key}
              className={
                `theme-option ${
                  theme === key ? 'selected' : ''
                }`
              }
              onClick={() => changeTheme(key)}
            >

              <span
                className="theme-color"
                style={{
                  backgroundColor: item.primary,
                }}
              />

              <span>{item.name}</span>

              {theme === key && (
                <Check size={18} />
              )}

            </button>

          ))}

        </div>

      </section>

    </div>
  )
}