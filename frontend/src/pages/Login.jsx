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
    
    if (!email || !password) {
      setError('Enter your email and password to continue.')
      return
    }
    
    setLoading(true)
    setError('')
    
    const result = await login(email, password)
    
    if (result.success) {
      navigate('/')
    } else {
      setError(result.error || 'Login failed')
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
            <span>Metric<span>Mind</span></span>
          </div>
          <div className="art-copy">
            <p className="eyebrow">AI-POWERED BUSINESS INTELLIGENCE</p>
            <h1>Find the signal<br /><em>inside your data.</em></h1>
            <p>Ask sharper questions. Make decisions with evidence.</p>
          </div>
          <div className="signal-card">
            <ShieldCheck size={18} />
            <span>Private workspace analytics</span>
            <b>Live</b>
          </div>
        </div>
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to your workspace</h2>
          <p className="muted">Your next clear decision starts here.</p>

          {error && <div className="error-box">{error}</div>}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              disabled={loading}
            />
          </label>

          <label>
            Password
            <div className="password-input">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                disabled={loading}
                aria-label="Toggle password visibility"
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          <div className="form-row">
            <label className="checkbox">
              <input type="checkbox" disabled={loading} />
              Remember me
            </label>
            <a href="#forgot">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="primary-button"
          >
            {loading ? 'Signing in...' : (
              <>
                Sign in to MetricMind
                <ArrowRight size={17} />
              </>
            )}
          </button>

          <p className="auth-footer">
            Don't have an account?{' '}
            <Link to="/register">Create one now</Link>
          </p>
        </form>
      </div>
    </main>
  )
}
