import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const loadRuntimeConfig = async () => {
  try {
    const response = await fetch('/.netlify/functions/runtime-config')
    if (!response.ok) return

    const runtimeConfig = await response.json()
    if (runtimeConfig?.firebaseConfig) {
      globalThis.__firebase_config = JSON.stringify(runtimeConfig.firebaseConfig)
    }
    if (runtimeConfig?.appId) {
      globalThis.__app_id = runtimeConfig.appId
    }
  } catch (error) {
    console.warn('Runtime config endpoint unavailable, using bundled env fallback.', error)
  }
}

const bootstrap = async () => {
  await loadRuntimeConfig()
  const { default: App } = await import('./App.jsx')

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

bootstrap()
