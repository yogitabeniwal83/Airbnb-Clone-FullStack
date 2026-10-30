import { useState } from 'react'
import api from '../../api/axios'
import './auth.css'

const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = []

    if (!formData.email.trim()) {
      nextErrors.push('Email is required')
    }

    if (!formData.password.trim()) {
      nextErrors.push('Password is required')
    }

    setErrors(nextErrors)

    if (nextErrors.length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await api.post('/login', formData)
      onLogin?.(response.data.user)

      const requestedPath = new URLSearchParams(window.location.search).get('returnTo')
      const returnTo = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : '/homes'

      window.location.assign(returnTo)
    } catch (error) {
      setErrors([error.response?.data?.message || 'Unable to sign in. Please try again.'])
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <nav className="login-nav">
        <div className="login-brand-wrap">
          <div className="login-brand-icon">A</div>
          <span className="login-brand-text">airbnb</span>
        </div>
      </nav>

      <main className="login-main">
        <div className="login-card">
          <div className="login-header-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="login-user-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to continue to Airbnb</p>

          {errors.length > 0 && (
            <div className="login-error-box">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Signing In…' : 'Sign In'}
            </button>
          </form>

          <div className="login-divider">
            <span className="login-divider-line" />
            <span className="login-divider-text">OR</span>
            <span className="login-divider-line" />
          </div>

          <p className="login-signup-link">
            Don&apos;t have an account?
            <a href="/signup">Create Account</a>
          </p>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
