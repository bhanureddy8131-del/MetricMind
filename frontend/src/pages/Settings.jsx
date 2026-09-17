import { useState } from 'react'
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

import { useTheme } from '../context/ThemeContext'
import './Settings.css'

function Settings() {
  const { dark, toggleDarkMode } = useTheme()

  const [activeSection, setActiveSection] = useState('profile')

  const [name, setName] = useState('MetricMind User')
  const [email, setEmail] = useState('user@metricmind.com')

  const [notifications, setNotifications] = useState({
    email: true,
    insights: true,
    alerts: false,
    weekly: true,
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)

    setTimeout(() => {
      setSaved(false)
    }, 2500)
  }

  const toggleNotification = (key) => {
    setNotifications((previous) => ({
      ...previous,
      [key]: !previous[key],
    }))
  }

  const sections = [
    {
      id: 'profile',
      title: 'Profile',
      description: 'Manage your personal information',
      icon: User,
      color: 'blue',
    },
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Customize your MetricMind experience',
      icon: Palette,
      color: 'purple',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Control alerts and updates',
      icon: Bell,
      color: 'orange',
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Protect your account',
      icon: Shield,
      color: 'green',
    },
    {
      id: 'data',
      title: 'Data & Dataset',
      description: 'Manage your business data',
      icon: Database,
      color: 'cyan',
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
      {/* Sidebar */}
      <aside className="settings-sidebar">
        <div className="settings-brand">
          <div className="settings-logo">
            <Sparkles size={22} />
          </div>

          <div>
            <h2>MetricMind</h2>
            <span>Business Intelligence</span>
          </div>
        </div>

        <nav className="settings-main-nav">
          <a href="/" className="settings-nav-link">
            <Monitor size={19} />
            <span>Dashboard</span>
          </a>

          <a href="/dataset" className="settings-nav-link">
            <Database size={19} />
            <span>Dataset</span>
          </a>

          <a href="/ai-query" className="settings-nav-link">
            <Sparkles size={19} />
            <span>AI Query</span>
          </a>

          <a href="/reports" className="settings-nav-link">
            <CheckCircle size={19} />
            <span>Reports</span>
          </a>

          <a
            href="/settings"
            className="settings-nav-link settings-nav-active"
          >
            <Shield size={19} />
            <span>Settings</span>
          </a>
        </nav>

        <div className="settings-sidebar-bottom">
          <div className="settings-user-mini">
            <div className="settings-user-avatar">B</div>

            <div className="settings-user-info">
              <strong>MetricMind User</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button className="settings-logout">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="settings-main">
        {/* Topbar */}
        <header className="settings-topbar">
          <div>
            <span className="settings-breadcrumb">Workspace</span>
            <h1>Settings</h1>
          </div>

          <div className="settings-top-actions">
            <button
              className="settings-theme-button"
              onClick={toggleDarkMode}
              title="Toggle theme"
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            <button className="settings-profile-button">
              <div className="settings-profile-avatar">B</div>

              <div>
                <strong>Bhanu</strong>
                <span>Admin</span>
              </div>

              <ChevronRight size={16} />
            </button>
          </div>
        </header>

        {/* Page heading */}
        <section className="settings-heading">
          <div>
            <div className="settings-title-row">
              <div className="settings-title-icon">
                <Palette size={24} />
              </div>

              <div>
                <h2>Personalize your workspace</h2>
                <p>
                  Configure your profile, appearance, notifications and data
                  preferences.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="settings-layout">
          {/* Settings menu */}
          <aside className="settings-menu-card">
            <div className="settings-menu-title">Settings</div>

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
                    onClick={() => setActiveSection(section.id)}
                  >
                    <div
                      className={`settings-menu-icon settings-color-${section.color}`}
                    >
                      <Icon size={19} />
                    </div>

                    <div className="settings-menu-text">
                      <strong>{section.title}</strong>
                      <span>{section.description}</span>
                    </div>

                    <ChevronRight size={17} />
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Content */}
          <section className="settings-content">
            {/* Profile */}
            {activeSection === 'profile' && (
              <div className="settings-panel">
                <div className="settings-panel-header settings-blue-header">
                  <div className="settings-panel-icon">
                    <User size={22} />
                  </div>

                  <div>
                    <h3>Profile Information</h3>
                    <p>Update your account information.</p>
                  </div>
                </div>

                <div className="settings-profile-cover">
                  <div className="settings-large-avatar">B</div>

                  <div>
                    <h3>MetricMind User</h3>
                    <p>Business Intelligence Administrator</p>
                  </div>

                  <button className="settings-outline-button">
                    Change Photo
                  </button>
                </div>

                <div className="settings-form-grid">
                  <div className="settings-field">
                    <label>Full Name</label>

                    <div className="settings-input-wrap">
                      <User size={18} />
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        type="text"
                      />
                    </div>
                  </div>

                  <div className="settings-field">
                    <label>Email Address</label>

                    <div className="settings-input-wrap">
                      <Mail size={18} />
                      <input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        type="email"
                      />
                    </div>
                  </div>
                </div>

                <div className="settings-save-row">
                  <button className="settings-save-button" onClick={handleSave}>
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

            {/* Appearance */}
            {activeSection === 'appearance' && (
              <div className="settings-panel">
                <div className="settings-panel-header settings-purple-header">
                  <div className="settings-panel-icon">
                    <Palette size={22} />
                  </div>

                  <div>
                    <h3>Appearance</h3>
                    <p>Choose how MetricMind looks on your device.</p>
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
                      if (dark) toggleDarkMode()
                    }}
                  >
                    <div className="settings-theme-preview light-preview">
                      <Sun size={32} />
                    </div>

                    <div>
                      <strong>Light Mode</strong>
                      <span>Clean and bright workspace</span>
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
                      if (!dark) toggleDarkMode()
                    }}
                  >
                    <div className="settings-theme-preview dark-preview">
                      <Moon size={32} />
                    </div>

                    <div>
                      <strong>Dark Mode</strong>
                      <span>Comfortable for low-light environments</span>
                    </div>

                    {dark && (
                      <CheckCircle
                        className="settings-selected-check"
                        size={20}
                      />
                    )}
                  </button>
                </div>

                <div className="settings-color-section">
                  <div className="settings-section-heading">
                    <h4>Accent Colors</h4>
                    <span>MetricMind color system</span>
                  </div>

                  <div className="settings-color-grid">
                    <div className="settings-color-option color-cobalt">
                      <span></span>
                      Cobalt
                    </div>

                    <div className="settings-color-option color-purple">
                      <span></span>
                      Purple
                    </div>

                    <div className="settings-color-option color-green">
                      <span></span>
                      Emerald
                    </div>

                    <div className="settings-color-option color-orange">
                      <span></span>
                      Orange
                    </div>

                    <div className="settings-color-option color-cyan">
                      <span></span>
                      Cyan
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <div className="settings-panel">
                <div className="settings-panel-header settings-orange-header">
                  <div className="settings-panel-icon">
                    <Bell size={22} />
                  </div>

                  <div>
                    <h3>Notifications</h3>
                    <p>Choose which updates you want to receive.</p>
                  </div>
                </div>

                <div className="settings-toggle-list">
                  <NotificationToggle
                    icon={Mail}
                    title="Email Notifications"
                    description="Receive important MetricMind updates by email."
                    enabled={notifications.email}
                    onClick={() => toggleNotification('email')}
                    color="orange"
                  />

                  <NotificationToggle
                    icon={Sparkles}
                    title="AI Insights"
                    description="Get notified when new AI insights are available."
                    enabled={notifications.insights}
                    onClick={() => toggleNotification('insights')}
                    color="purple"
                  />

                  <NotificationToggle
                    icon={Bell}
                    title="Business Alerts"
                    description="Receive alerts for unusual business activity."
                    enabled={notifications.alerts}
                    onClick={() => toggleNotification('alerts')}
                    color="red"
                  />

                  <NotificationToggle
                    icon={Database}
                    title="Weekly Reports"
                    description="Receive a weekly summary of your business data."
                    enabled={notifications.weekly}
                    onClick={() => toggleNotification('weekly')}
                    color="blue"
                  />
                </div>
              </div>
            )}

            {/* Security */}
            {activeSection === 'security' && (
              <div className="settings-panel">
                <div className="settings-panel-header settings-green-header">
                  <div className="settings-panel-icon">
                    <Shield size={22} />
                  </div>

                  <div>
                    <h3>Security</h3>
                    <p>Keep your MetricMind account secure.</p>
                  </div>
                </div>

                <div className="settings-security-card">
                  <div className="settings-security-icon">
                    <Lock size={22} />
                  </div>

                  <div className="settings-security-info">
                    <h4>Password</h4>
                    <p>Your password was last updated recently.</p>
                  </div>

                  <button className="settings-outline-button">
                    Change Password
                  </button>
                </div>

                <div className="settings-security-card">
                  <div className="settings-security-icon settings-cyan-icon">
                    <Smartphone size={22} />
                  </div>

                  <div className="settings-security-info">
                    <h4>Active Sessions</h4>
                    <p>1 active device is currently signed in.</p>
                  </div>

                  <button className="settings-outline-button">
                    Manage
                  </button>
                </div>
              </div>
            )}

            {/* Data */}
            {activeSection === 'data' && (
              <div className="settings-panel">
                <div className="settings-panel-header settings-cyan-header">
                  <div className="settings-panel-icon">
                    <Database size={22} />
                  </div>

                  <div>
                    <h3>Data & Dataset</h3>
                    <p>Manage your business intelligence data.</p>
                  </div>
                </div>

                <div className="settings-data-banner">
                  <div className="settings-data-icon">
                    <Database size={28} />
                  </div>

                  <div>
                    <h3>MetricMind Superstore Dataset</h3>
                    <p>
                      Your business dataset is connected and ready for
                      analytics.
                    </p>
                  </div>

                  <div className="settings-connected">
                    <CheckCircle size={17} />
                    Connected
                  </div>
                </div>

                <div className="settings-data-grid">
                  <div className="settings-data-stat blue-stat">
                    <span>Rows</span>
                    <strong>9,994</strong>
                  </div>

                  <div className="settings-data-stat purple-stat">
                    <span>Columns</span>
                    <strong>21</strong>
                  </div>

                  <div className="settings-data-stat green-stat">
                    <span>Status</span>
                    <strong>Ready</strong>
                  </div>
                </div>

                <a href="/dataset" className="settings-dataset-button">
                  <Database size={18} />
                  Open Dataset
                  <ChevronRight size={18} />
                </a>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

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
      <div className={`settings-notification-icon ${color}`}>
        <Icon size={20} />
      </div>

      <div className="settings-notification-info">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <button
        className={
          enabled
            ? 'settings-switch settings-switch-on'
            : 'settings-switch'
        }
        onClick={onClick}
        aria-label={`Toggle ${title}`}
      >
        <span></span>
      </button>
    </div>
  )
}

export default Settings