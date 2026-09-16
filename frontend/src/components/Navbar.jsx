import {
    Bell,
    Menu,
    Search,
  } from 'lucide-react'
  
  import { useAuth } from '../context/useAuth'
  
  export default function Navbar({ onMenu }) {
    const { user } = useAuth()
  
    const displayName =
      user?.full_name ||
      user?.username ||
      'Analyst'
  
    const initial =
      displayName
        .trim()
        .charAt(0)
        .toUpperCase() || 'M'
  
    return (
      <header className="navbar">
        <button
          type="button"
          className="icon-button mobile-menu"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
  
        <div className="search-box">
          <Search size={17} />
  
          <input
            placeholder="Search MetricMind..."
            aria-label="Search workspace"
          />
        </div>
  
        <div className="nav-actions">
          <button
            type="button"
            className="icon-button"
            aria-label="Notifications"
          >
            <Bell size={19} />
          </button>
  
          <div
            className="avatar"
            title={displayName}
          >
            {initial}
          </div>
  
          <div className="profile">
            <strong>
              {displayName}
            </strong>
  
            <span>
              {user?.email ||
                'Workspace member'}
            </span>
          </div>
        </div>
      </header>
    )
  }