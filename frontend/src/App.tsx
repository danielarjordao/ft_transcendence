import { useEffect, useState } from 'react';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'


function App() {
  const [count, setCount] = useState(0)

  const [message, setMessage] = useState('Trying to connect to the backend...');

  useEffect(() => {
    // Make a request to the URL configured in docker-compose
    fetch(import.meta.env.VITE_API_URL)
      .then((response) => response.text())
      .then((data) => setMessage(data))
      .catch(() => setMessage('Error: The backend did not respond.'));
  }, []);

  return (
    <>
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h2>Integration Test: Frontend ↔ Backend</h2>
        <div style={{ padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
          <strong>Server response:</strong> {message}
        </div>
      </div>

      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
