import { useState } from 'react'
import { ArrowRight, BrainCircuit, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Login() {
  const [email, setEmail] = useState('demo@metricmind.com')
  const [password, setPassword] = useState('demo1234')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()

    setError('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)

    try {
      const result = await login(email.trim(), password)

      if (result && result.success) {
        navigate('/')
        return
      }

      if (result && result.error) {
        setError(result.error)
      } else {
        setError('Invalid email or password.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Unable to login. Please check that the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-art">
        <div className="auth-art-inner">

          <div className="brand auth-brand">
            <div className="brand-mark">
              <BrainCircuit size={20} />
            </div>

            <span>
              Metric<span>Mind</span>
            </span>
          </div>

          <div className="art-copy">
            <p className="eyebrow">
              AI-POWERED BUSINESS INTELLIGENCE
            </p>

            <h1>
              Find the signal
              <br />
              <em>inside your data.</em>
            </h1>

            <p>
              Ask sharper questions. Make decisions with evidence.
            </p>
          </div>

          <div className="signal-card">
            <ShieldCheck size={18} />

            <span>
              Private workspace analytics
            </span>

            <b>
              Live
            </b>
          </div>

        </div>
      </div>

      <div className="auth-form-wrap">
        <form
          className="auth-form"
          onSubmit={submit}
        >

          <p className="eyebrow">
            WELCOME BACK
          </p>

          <h2>
            Sign in to your workspace
          </h2>

          <p className="muted">
            Your next clear decision starts here.
          </p>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <label htmlFor="login-email">
            Email address

            <input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              disabled={loading}
            />
          </label>

          <label htmlFor="login-password">
            Password

            <div className="password-input">
              <input
                id="login-password"
                name="password"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => setShow(!show)}
                disabled={loading}
                aria-label={
                  show
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {show ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>
          </label>

          <div className="form-row">

            <label className="checkbox">
              <input
                type="checkbox"
                name="remember"
                disabled={loading}
              />

              Remember me
            </label>

            <a href="#forgot">
              Forgot password?
            </a>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="primary-button"
          >
            {loading ? (
              'Signing in...'
            ) : (
              <>
                Sign in to MetricMind
                <ArrowRight size={17} />
              </>
            )}
          </button>

          <p className="auth-footer">
            Don't have an account?{' '}

            <Link to="/register">
              Create one now
            </Link>
          </p>

        </form>
      </div>
    </main>
  )
}