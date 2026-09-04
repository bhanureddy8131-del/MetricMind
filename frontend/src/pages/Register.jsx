import { useState } from 'react'
import { ArrowRight, BrainCircuit } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Register() {
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirm: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    
    if (Object.values(form).some((value) => !value)) {
      setError('Complete every field to continue.')
      return
    }
    
    if (form.password.length < 8) {
      setError('Use at least 8 characters for your password.')
      return
    }
    
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    
    if (form.username.length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }

    setLoading(true)
    setError('')

    const result = await register(
      form.full_name,
      form.username,
      form.email,
      form.password
    )

    if (result.success) {
      navigate('/')
    } else {
      setError(result.error || 'Registration failed')
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
            <p className="eyebrow">A CLEARER WAY TO WORK</p>
            <h1>Make every<br /><em>metric count.</em></h1>
            <p>Bring your business questions and your data into one calm workspace.</p>
          </div>
        </div>
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <p className="eyebrow">GET STARTED</p>
          <h2>Create your account</h2>
          <p className="muted">Join MetricMind and unlock your data's potential.</p>

          {error && <div className="error-box">{error}</div>}

          <label>
            Full name
            <input
              value={form.full_name}
              onChange={update('full_name')}
              placeholder="Alex Morgan"
              disabled={loading}
            />
          </label>

          <label>
            Username
            <input
              value={form.username}
              onChange={update('username')}
              placeholder="alex_morgan"
              disabled={loading}
            />
          </label>

          <label>
            Email address
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@company.com"
              disabled={loading}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              placeholder="8+ characters"
              disabled={loading}
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              value={form.confirm}
              onChange={update('confirm')}
              placeholder="Repeat your password"
              disabled={loading}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="primary-button full"
          >
            {loading ? 'Creating account...' : (
              <>
                Create workspace
                <ArrowRight size={17} />
              </>
            )}
          </button>

          <p className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Sign in instead</Link>
          </p>
        </form>
      </div>
    </main>
  )
}
