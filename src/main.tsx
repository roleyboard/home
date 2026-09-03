import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <>
      <App />
      <nav className="fixed-tab-bar" aria-label="Musaic tools">
        <a className="fixed-tab is-active" href="/" aria-current="page">
          <span aria-hidden="true">📝</span>
          <span>Tabs</span>
        </a>
        <button className="fixed-tab" type="button">
          <span aria-hidden="true">🎸</span>
          <span>Chart</span>
        </button>
        <button className="fixed-tab" type="button">
          <span aria-hidden="true">⭕️</span>
          <span>CoF</span>
        </button>
        <button className="fixed-tab" type="button">
          <span aria-hidden="true">🎨</span>
          <span>Modes</span>
        </button>
        <button className="fixed-tab" type="button">
          <span aria-hidden="true">🎹</span>
          <span>Progs</span>
        </button>
      </nav>
    </>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error)
    })
  })
}
