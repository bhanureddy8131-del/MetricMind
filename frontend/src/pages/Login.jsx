import { useState } from 'react'
import {
  ArrowRight,
  BrainCircuit,
  Eye,
  EyeOff,
  ShieldCheck,
  BarChart3,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('demo@metricmind.com')
  const [password, setPassword] = useState('demo1234')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()

    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await login(email, password)

      if (result.success) {
        navigate('/', { replace: true })
      } else {
        setError(result.error || 'Invalid email or password.')
      }
    } catch (err) {
      console.error(err)
      setError('Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">

      {/* LEFT BRAND PANEL */}
      <section className="login-visual">

        <div className="visual-glow glow-one" />
        <div className="visual-glow glow-two" />

        <div className="visual-content">

          {/* LOGO */}
          <Link to="/" className="login-logo">
            <div className="logo-emblem">
              <BrainCircuit size={30} strokeWidth={2.2} />
            </div>

            <div>
              <strong>Metric</strong>
              <span>Mind</span>
            </div>
          </Link>

          {/* MAIN MESSAGE */}
          <div className="visual-message">
            <div className="small-label">
              <Sparkles size={15} />
              AI-POWERED BUSINESS INTELLIGENCE
            </div>

            <h1>
              Turn your data
              <br />
              into <em>better decisions.</em>
            </h1>

            <p>
              Ask questions about your business data,
              discover hidden patterns and make confident
              decisions with MetricMind.
            </p>
          </div>

          {/* MINI ANALYTICS CARD */}
          <div className="analytics-preview">

            <div className="preview-header">
              <div>
                <span>REVENUE OVERVIEW</span>
                <strong>$284,392</strong>
              </div>

              <div className="preview-icon">
                <BarChart3 size={20} />
              </div>
            </div>

            <div className="fake-chart">
              <div className="chart-line line-one" />
              <div className="chart-line line-two" />
              <div className="chart-line line-three" />
              <div className="chart-line line-four" />
              <div className="chart-line line-five" />
            </div>

            <div className="preview-footer">
              <span>↗ 18.6% this month</span>
              <span>Live analytics</span>
            </div>

          </div>

          {/* FEATURES */}
          <div className="feature-list">

            <div>
              <CheckCircle2 size={17} />
              <span>Real-time business analytics</span>
            </div>

            <div>
              <CheckCircle2 size={17} />
              <span>Natural language data queries</span>
            </div>

            <div>
              <CheckCircle2 size={17} />
              <span>Secure private workspace</span>
            </div>

          </div>

        </div>
      </section>

      {/* RIGHT LOGIN PANEL */}
      <section className="login-panel">

        <div className="login-card">

          <div className="mobile-logo">
            <div className="logo-emblem">
              <BrainCircuit size={24} />
            </div>
            <strong>
              Metric<span>Mind</span>
            </strong>
          </div>

          <div className="login-heading">
            <div className="welcome-icon">
              <ShieldCheck size={21} />
            </div>

            <div>
              <p className="login-eyebrow">WELCOME BACK</p>
              <h2>Sign in to MetricMind</h2>
            </div>
          </div>

          <p className="login-description">
            Continue to your analytics workspace and
            keep turning data into decisions.
          </p>

          {error && (
            <div className="login-error">
              <span>!</span>
              <div>
                <strong>Sign in unsuccessful</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={submit}>

            {/* EMAIL */}
            <div className="field">

              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@company.com"
                disabled={loading}
              />

            </div>

            {/* PASSWORD */}
            <div className="field">

              <div className="password-label-row">
                <label htmlFor="password">
                  Password
                </label>

                <a href="#forgot">
                  Forgot password?
                </a>
              </div>

              <div className="password-wrapper">

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>
            </div>

            {/* REMEMBER */}
            <label className="remember-row">

              <input
                type="checkbox"
                name="remember"
                disabled={loading}
              />

              <span>Remember me on this device</span>

            </label>

            {/* SUBMIT */}
            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to workspace
                  <ArrowRight size={18} />
                </>
              )}

            </button>

          </form>

          {/* DIVIDER */}
          <div className="login-divider">
            <span>NEW TO METRICMIND?</span>
          </div>

          {/* REGISTER */}
          <Link
            to="/register"
            className="create-account"
          >
            Create your account
            <ArrowRight size={17} />
          </Link>

          {/* SECURITY */}
          <div className="security-note">
            <ShieldCheck size={16} />
            <span>
              Your workspace data is protected and private.
            </span>
          </div>

        </div>

        <p className="login-copyright">
          © 2026 MetricMind · AI-powered analytics
        </p>

      </section>

    </main>
  )
}