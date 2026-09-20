import { useState, useEffect } from 'react'
import {
  User,
  Palette,
  Bell,
  Shield,
  Database,
  Moon,
  Sun,
  Save,
  Lock,
  Mail,
  CheckCircle,
  ChevronRight,
  Sparkles,
  Monitor,
  Smartphone,
  LogOut,
} from 'lucide-react'

import { Link, useNavigate } from 'react-router-dom'

import { useTheme } from '../context/ThemeContext'
import './Settings.css'

function Settings() {
  const navigate = useNavigate()

  const { dark, toggleDarkMode } = useTheme()

  const [activeSection, setActiveSection] =
    useState('profile')

  const [name, setName] = useState(
    localStorage.getItem('metricmind_name') ||
      'MetricMind User'
  )

  const [email, setEmail] = useState(
    localStorage.getItem('metricmind_email') ||
      'user@metricmind.com'
  )

  const [accent, setAccent] = useState(
    localStorage.getItem('metricmind_accent') ||
      'cobalt'
  )

  const [notifications, setNotifications] =
    useState(() => {
      const saved =
        localStorage.getItem(
          'metricmind_notifications'
        )

      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // Use defaults below
        }
      }

      return {
        email: true,
        insights: true,
        alerts: false,
        weekly: true,
      }
    })

  const [saved, setSaved] = useState(false)

  /*
   * Apply accent color
   */
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-accent',
      accent
    )

    localStorage.setItem(
      'metricmind_accent',
      accent
    )
  }, [accent])

  /*
   * Save notification settings
   */
  useEffect(() => {
    localStorage.setItem(
      'metricmind_notifications',
      JSON.stringify(notifications)
    )
  }, [notifications])

  /*
   * Save profile
   */
  const handleSave = () => {
    localStorage.setItem(
      'metricmind_name',
      name
    )

    localStorage.setItem(
      'metricmind_email',
      email
    )

    setSaved(true)

    setTimeout(() => {
      setSaved(false)
    }, 2500)
  }

  /*
   * Toggle notifications
   */
  const toggleNotification = (key) => {
    setNotifications((previous) => ({
      ...previous,
      [key]: !previous[key],
    }))
  }

  /*
   * Logout
   */
  const handleLogout = () => {
    localStorage.removeItem(
      'metricmind_token'
    )

    navigate('/login')
  }

  const sections = [
    {
      id: 'profile',
      title: 'Profile',
      description:
        'Manage your personal information',
      icon: User,
      color: 'blue',
    },
    {
      id: 'appearance',
      title: 'Appearance',
      description:
        'Customize your MetricMind experience',
      icon: Palette,
      color: 'purple',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description:
        'Control alerts and updates',
      icon: Bell,
      color: 'orange',
    },
    {
      id: 'security',
      title: 'Security',
      description:
        'Protect your account',
      icon: Shield,
      color: 'green',
    },
    {
      id: 'data',
      title: 'Data & Dataset',
      description:
        'Manage your business data',
      icon: Database,
      color: 'cyan',
    },
  ]

  const accentColors = [
    {
      id: 'cobalt',
      name: 'Cobalt',
    },
    {
      id: 'purple',
      name: 'Purple',
    },
    {
      id: 'green',
      name: 'Emerald',
    },
    {
      id: 'orange',
      name: 'Orange',
    },
    {
      id: 'cyan',
      name: 'Cyan',
    },
  ]

  return (
    <div
      className={
        dark
          ? 'metric-settings metric-settings-dark'
          : 'metric-settings metric-settings-light'
      }
    >
      {/* ================= SIDEBAR ================= */}

      <aside className="settings-sidebar">
        <div className="settings-brand">
          <div className="settings-logo">
            <Sparkles size={22} />
          </div>

          <div>
            <h2>MetricMind</h2>

            <span>
              Business Intelligence
            </span>
          </div>
        </div>

        <nav className="settings-main-nav">

          <Link
            to="/"
            className="settings-nav-link"
          >
            <Monitor size={19} />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/dataset"
            className="settings-nav-link"
          >
            <Database size={19} />
            <span>Dataset</span>
          </Link>

          <Link
            to="/ai-query"
            className="settings-nav-link"
          >
            <Sparkles size={19} />
            <span>AI Query</span>
          </Link>

          <Link
            to="/reports"
            className="settings-nav-link"
          >
            <CheckCircle size={19} />
            <span>Reports</span>
          </Link>

          <Link
            to="/settings"
            className="settings-nav-link settings-nav-active"
          >
            <Shield size={19} />
            <span>Settings</span>
          </Link>

        </nav>

        <div className="settings-sidebar-bottom">

          <div className="settings-user-mini">

            <div className="settings-user-avatar">
              {name.charAt(0).toUpperCase()}
            </div>

            <div className="settings-user-info">

              <strong>
                {name}
              </strong>

              <span>
                Administrator
              </span>

            </div>

          </div>

          <button
            className="settings-logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="settings-main">

        {/* TOPBAR */}

        <header className="settings-topbar">

          <div>

            <span className="settings-breadcrumb">
              Workspace
            </span>

            <h1>
              Settings
            </h1>

          </div>

          <div className="settings-top-actions">

            <button
              className="settings-theme-button"
              onClick={toggleDarkMode}
              title="Toggle theme"
            >
              {dark ? (
                <Sun size={19} />
              ) : (
                <Moon size={19} />
              )}
            </button>

            <div className="settings-profile-button">

              <div className="settings-profile-avatar">
                {name.charAt(0).toUpperCase()}
              </div>

              <div>

                <strong>
                  {name}
                </strong>

                <span>
                  Admin
                </span>

              </div>

              <ChevronRight size={16} />

            </div>

          </div>

        </header>

        {/* PAGE HEADING */}

        <section className="settings-heading">

          <div className="settings-title-row">

            <div className="settings-title-icon">
              <Palette size={24} />
            </div>

            <div>

              <h2>
                Personalize your workspace
              </h2>

              <p>
                Configure your profile,
                appearance, notifications
                and data preferences.
              </p>

            </div>

          </div>

        </section>

        {/* ================= SETTINGS LAYOUT ================= */}

        <div className="settings-layout">

          {/* MENU */}

          <aside className="settings-menu-card">

            <div className="settings-menu-title">
              Settings
            </div>

            <div className="settings-menu-list">

              {sections.map((section) => {

                const Icon = section.icon

                return (
                  <button
                    key={section.id}
                    className={
                      activeSection === section.id
                        ? 'settings-menu-item settings-menu-item-active'
                        : 'settings-menu-item'
                    }
                    onClick={() =>
                      setActiveSection(
                        section.id
                      )
                    }
                  >

                    <div
                      className={`settings-menu-icon settings-color-${section.color}`}
                    >
                      <Icon size={19} />
                    </div>

                    <div className="settings-menu-text">

                      <strong>
                        {section.title}
                      </strong>

                      <span>
                        {section.description}
                      </span>

                    </div>

                    <ChevronRight size={17} />

                  </button>
                )
              })}

            </div>

          </aside>

          {/* CONTENT */}

          <section className="settings-content">

            {/* ================= PROFILE ================= */}

            {activeSection === 'profile' && (

              <div className="settings-panel">

                <div className="settings-panel-header settings-blue-header">

                  <div className="settings-panel-icon">
                    <User size={22} />
                  </div>

                  <div>

                    <h3>
                      Profile Information
                    </h3>

                    <p>
                      Update your account
                      information.
                    </p>

                  </div>

                </div>

                <div className="settings-profile-cover">

                  <div className="settings-large-avatar">
                    {name.charAt(0).toUpperCase()}
                  </div>

                  <div>

                    <h3>
                      {name}
                    </h3>

                    <p>
                      Business Intelligence
                      Administrator
                    </p>

                  </div>

                </div>

                <div className="settings-form-grid">

                  <div className="settings-field">

                    <label>
                      Full Name
                    </label>

                    <div className="settings-input-wrap">

                      <User size={18} />

                      <input
                        value={name}
                        onChange={(event) =>
                          setName(
                            event.target.value
                          )
                        }
                        type="text"
                      />

                    </div>

                  </div>

                  <div className="settings-field">

                    <label>
                      Email Address
                    </label>

                    <div className="settings-input-wrap">

                      <Mail size={18} />

                      <input
                        value={email}
                        onChange={(event) =>
                          setEmail(
                            event.target.value
                          )
                        }
                        type="email"
                      />

                    </div>

                  </div>

                </div>

                <div className="settings-save-row">

                  <button
                    className="settings-save-button"
                    onClick={handleSave}
                  >

                    {saved ? (
                      <>
                        <CheckCircle size={18} />
                        Saved Successfully
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}

                  </button>

                </div>

              </div>

            )}

            {/* ================= APPEARANCE ================= */}

            {activeSection === 'appearance' && (

              <div className="settings-panel">

                <div className="settings-panel-header settings-purple-header">

                  <div className="settings-panel-icon">
                    <Palette size={22} />
                  </div>

                  <div>

                    <h3>
                      Appearance
                    </h3>

                    <p>
                      Choose how MetricMind
                      looks on your device.
                    </p>

                  </div>

                </div>

                <div className="settings-theme-grid">

                  <button
                    className={
                      !dark
                        ? 'settings-theme-card settings-theme-selected'
                        : 'settings-theme-card'
                    }
                    onClick={() => {
                      if (dark) {
                        toggleDarkMode()
                      }
                    }}
                  >

                    <div className="settings-theme-preview light-preview">
                      <Sun size={32} />
                    </div>

                    <div>

                      <strong>
                        Light Mode
                      </strong>

                      <span>
                        Clean and bright
                        workspace
                      </span>

                    </div>

                    {!dark && (
                      <CheckCircle
                        className="settings-selected-check"
                        size={20}
                      />
                    )}

                  </button>

                  <button
                    className={
                      dark
                        ? 'settings-theme-card settings-theme-selected'
                        : 'settings-theme-card'
                    }
                    onClick={() => {
                      if (!dark) {
                        toggleDarkMode()
                      }
                    }}
                  >

                    <div className="settings-theme-preview dark-preview">
                      <Moon size={32} />
                    </div>

                    <div>

                      <strong>
                        Dark Mode
                      </strong>

                      <span>
                        Comfortable for
                        low-light environments
                      </span>

                    </div>

                    {dark && (
                      <CheckCircle
                        className="settings-selected-check"
                        size={20}
                      />
                    )}

                  </button>

                </div>

                {/* ACCENT COLORS */}

                <div className="settings-color-section">

                  <div className="settings-section-heading">

                    <h4>
                      Accent Colors
                    </h4>

                    <span>
                      Select your MetricMind
                      color system
                    </span>

                  </div>

                  <div className="settings-color-grid">

                    {accentColors.map((color) => (

                      <button
                        key={color.id}
                        type="button"
                        onClick={() =>
                          setAccent(color.id)
                        }
                        className={
                          accent === color.id
                            ? `settings-color-option color-${color.id} selected`
                            : `settings-color-option color-${color.id}`
                        }
                      >

                        <span />

                        {color.name}

                        {accent === color.id && (
                          <CheckCircle
                            size={17}
                          />
                        )}

                      </button>

                    ))}

                  </div>

                </div>

              </div>

            )}

            {/* ================= NOTIFICATIONS ================= */}

            {activeSection === 'notifications' && (

              <div className="settings-panel">

                <div className="settings-panel-header settings-orange-header">

                  <div className="settings-panel-icon">
                    <Bell size={22} />
                  </div>

                  <div>

                    <h3>
                      Notifications
                    </h3>

                    <p>
                      Choose which updates
                      you want to receive.
                    </p>

                  </div>

                </div>

                <div className="settings-toggle-list">

                  <NotificationToggle
                    icon={Mail}
                    title="Email Notifications"
                    description="Receive important MetricMind updates by email."
                    enabled={notifications.email}
                    onClick={() =>
                      toggleNotification(
                        'email'
                      )
                    }
                    color="orange"
                  />

                  <NotificationToggle
                    icon={Sparkles}
                    title="AI Insights"
                    description="Get notified when new AI insights are available."
                    enabled={
                      notifications.insights
                    }
                    onClick={() =>
                      toggleNotification(
                        'insights'
                      )
                    }
                    color="purple"
                  />

                  <NotificationToggle
                    icon={Bell}
                    title="Business Alerts"
                    description="Receive alerts for unusual business activity."
                    enabled={
                      notifications.alerts
                    }
                    onClick={() =>
                      toggleNotification(
                        'alerts'
                      )
                    }
                    color="red"
                  />

                  <NotificationToggle
                    icon={Database}
                    title="Weekly Reports"
                    description="Receive a weekly summary of your business data."
                    enabled={
                      notifications.weekly
                    }
                    onClick={() =>
                      toggleNotification(
                        'weekly'
                      )
                    }
                    color="blue"
                  />

                </div>

              </div>

            )}

            {/* ================= SECURITY ================= */}

            {activeSection === 'security' && (

              <div className="settings-panel">

                <div className="settings-panel-header settings-green-header">

                  <div className="settings-panel-icon">
                    <Shield size={22} />
                  </div>

                  <div>

                    <h3>
                      Security
                    </h3>

                    <p>
                      Keep your MetricMind
                      account secure.
                    </p>

                  </div>

                </div>

                <div className="settings-security-card">

                  <div className="settings-security-icon">
                    <Lock size={22} />
                  </div>

                  <div className="settings-security-info">

                    <h4>
                      Password
                    </h4>

                    <p>
                      Your password is
                      protected by your
                      MetricMind account.
                    </p>

                  </div>

                  <button
                    className="settings-outline-button"
                    type="button"
                  >
                    Change Password
                  </button>

                </div>

                <div className="settings-security-card">

                  <div className="settings-security-icon settings-cyan-icon">
                    <Smartphone size={22} />
                  </div>

                  <div className="settings-security-info">

                    <h4>
                      Active Sessions
                    </h4>

                    <p>
                      1 active device is
                      currently signed in.
                    </p>

                  </div>

                  <button
                    className="settings-outline-button"
                    type="button"
                  >
                    Manage
                  </button>

                </div>

              </div>

            )}

            {/* ================= DATA ================= */}

            {activeSection === 'data' && (

              <div className="settings-panel">

                <div className="settings-panel-header settings-cyan-header">

                  <div className="settings-panel-icon">
                    <Database size={22} />
                  </div>

                  <div>

                    <h3>
                      Data & Dataset
                    </h3>

                    <p>
                      Manage your business
                      intelligence data.
                    </p>

                  </div>

                </div>

                <div className="settings-data-banner">

                  <div className="settings-data-icon">
                    <Database size={28} />
                  </div>

                  <div>

                    <h3>
                      MetricMind Superstore
                      Dataset
                    </h3>

                    <p>
                      Your business dataset
                      is connected and ready
                      for analytics.
                    </p>

                  </div>

                  <div className="settings-connected">

                    <CheckCircle size={17} />

                    Connected

                  </div>

                </div>

                <div className="settings-data-grid">

                  <div className="settings-data-stat blue-stat">

                    <span>
                      Rows
                    </span>

                    <strong>
                      9,994
                    </strong>

                  </div>

                  <div className="settings-data-stat purple-stat">

                    <span>
                      Columns
                    </span>

                    <strong>
                      21
                    </strong>

                  </div>

                  <div className="settings-data-stat green-stat">

                    <span>
                      Status
                    </span>

                    <strong>
                      Ready
                    </strong>

                  </div>

                </div>

                <Link
                  to="/dataset"
                  className="settings-dataset-button"
                >

                  <Database size={18} />

                  Open Dataset

                  <ChevronRight size={18} />

                </Link>

              </div>

            )}

          </section>

        </div>

      </main>

    </div>
  )
}

/* ================= NOTIFICATION COMPONENT ================= */

function NotificationToggle({
  icon: Icon,
  title,
  description,
  enabled,
  onClick,
  color,
}) {
  return (
    <div className="settings-notification-item">

      <div
        className={`settings-notification-icon ${color}`}
      >
        <Icon size={20} />
      </div>

      <div className="settings-notification-info">

        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>

      </div>

      <button
        type="button"
        className={
          enabled
            ? 'settings-switch settings-switch-on'
            : 'settings-switch'
        }
        onClick={onClick}
        aria-label={`Toggle ${title}`}
      >
        <span />
      </button>

    </div>
  )
}

export default Settings