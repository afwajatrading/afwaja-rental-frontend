import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const hasValidFirebaseConfig = (config) =>
  Boolean(
    config &&
      config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.storageBucket &&
      config.messagingSenderId &&
      config.appId,
  )

const renderBootstrapError = (message) => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #ecfeff 50%, #f8fafc 100%)',
          padding: '24px',
          fontFamily: 'Arial, sans-serif',
          color: '#0f172a',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '640px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.12)',
          }}
        >
          <p style={{ margin: 0, color: '#0f766e', fontWeight: 700, letterSpacing: '0.04em' }}>
            AFWAJA RENTAL
          </p>
          <h1 style={{ margin: '16px 0 12px', fontSize: '28px', lineHeight: 1.2 }}>
            App configuration is incomplete
          </h1>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>
            {message}
          </p>
        </div>
      </div>
    </React.StrictMode>,
  )
}

const loadRuntimeConfig = async () => {
  try {
    const response = await fetch('/.netlify/functions/runtime-config')
    if (!response.ok) return

    const runtimeConfig = await response.json()
    if (hasValidFirebaseConfig(runtimeConfig?.firebaseConfig)) {
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
  const envFallbackConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  }

  const runtimeConfig = globalThis.__firebase_config
    ? JSON.parse(globalThis.__firebase_config)
    : null

  if (!hasValidFirebaseConfig(runtimeConfig) && !hasValidFirebaseConfig(envFallbackConfig)) {
    renderBootstrapError(
      'Netlify runtime config was not found. Please verify the site environment variables and ensure the Netlify function "runtime-config" is deployed.',
    )
    return
  }

  const { default: App } = await import('./App.jsx')

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

bootstrap()
