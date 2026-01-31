import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data) => {
        setMessage(data.message)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="container">
      <h1>Vibe GTM</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="error">Error: {error}</p>}
      {message && <p className="message">{message}</p>}
    </div>
  )
}

export default App
