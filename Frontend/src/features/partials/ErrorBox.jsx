const ErrorBox = ({ errorMessage = [] }) => {
  if (!errorMessage || errorMessage.length === 0) {
    return null
  }

  return (
    <div className="error-box" role="alert">
      <strong className="error-title">Error!</strong>
      <span className="error-list">
        {errorMessage.map((msg) => (
          <li key={msg}>{msg}</li>
        ))}
      </span>
    </div>
  )
}

export default ErrorBox
