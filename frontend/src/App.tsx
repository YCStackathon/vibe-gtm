import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

function App() {
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mongoResult, setMongoResult] = useState<string | null>(null)
  const [mongoLoading, setMongoLoading] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/hello`)
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

  const storeTestDocument = async () => {
    setMongoLoading(true)
    setMongoResult(null)
    try {
      const res = await fetch(`${API_URL}/api/test-document`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to store document')
      const data = await res.json()
      setMongoResult(`Stored document with ID: ${data.inserted_id}`)
    } catch (err) {
      setMongoResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setMongoLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>Vibe GTM</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="error">Error: {error}</p>}
      {message && <p className="message">{message}</p>}

      <hr style={{ margin: '2rem 0' }} />

      <h2>MongoDB Test</h2>
      <button onClick={storeTestDocument} disabled={mongoLoading}>
        {mongoLoading ? 'Storing...' : 'Store Test Document'}
      </button>
      {mongoResult && <p style={{ marginTop: '1rem' }}>{mongoResult}</p>}
    </div>
  )
}

export default App
