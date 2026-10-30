import { useState } from 'react'
import api from '../../api/axios'
import './auth.css'

const SignupPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  })

  const [errors, setErrors] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = []

    if (formData.firstName.trim().length < 2) {
      nextErrors.push('First Name must be at least 2 characters long')
    }

    if (formData.lastName && !/^[A-Za-z]+$/.test(formData.lastName)) {
      nextErrors.push('Last Name must contain only letters')
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.push('Please enter a valid email address')
    }

    if (formData.password.length < 8) {
      nextErrors.push('Password must be at least 8 characters long')
    }

    if (formData.password !== formData.confirmPassword) {
      nextErrors.push('Passwords do not match')
    }

    if (!formData.terms) {
      nextErrors.push('You must accept the terms and conditions')
    }

    setErrors(nextErrors)

    if (nextErrors.length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      await api.post('/signup', {
        ...formData,
        terms: formData.terms ? 'on' : '',
      })
      window.location.assign('/login')
    } catch (error) {
      const responseErrors = error.response?.data?.errors?.map((item) => item.msg)
      setErrors(responseErrors?.length
        ? responseErrors
        : [error.response?.data?.message || 'Unable to create your account.'])
      setIsSubmitting(false)
    }
  }

  return (
    <div className="signup-page">
      <main className="signup-main">
        <div className="signup-card">
          <div className="signup-header">
            <h1>Create Your Account</h1>
            <p>Join Airbnb and start your journey today.</p>
          </div>

          {errors.length > 0 && (
            <div className="signup-error-box">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="signup-form" noValidate>
            <div className="signup-grid two-cols">
              <div className="signup-field">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  required
                  autoFocus
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>

              <div className="signup-field">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="signup-field">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="john@example.com"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="signup-grid two-cols">
              <div className="signup-field">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="********"
                  required
                  minLength="8"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="signup-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="********"
                  required
                  minLength="8"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="signup-terms">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  required
                />
                <span>I agree to the Terms &amp; Conditions</span>
              </label>
            </div>

            <button type="submit" className="signup-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default SignupPage
