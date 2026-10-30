import NavBar from './partials/NavBar'

const NotFoundPage = ({ user }) => {
  return (
    <div className="not-found-shell">
      <NavBar
        isLoggedIn={Boolean(user)}
        user={user}
        currentPage="Home"
      />

      <main className="not-found-main">
        <div className="not-found-card">
          <h1 className="not-found-code">404</h1>
          <p className="not-found-message">Your page is not found on Airbnb</p>
          <a href="/" className="not-found-link">
            Go Back Home
          </a>
        </div>
      </main>
    </div>
  )
}

export default NotFoundPage
