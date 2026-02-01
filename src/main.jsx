import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ConversationProvider } from '../src/context/ConversationContext.jsx' // <-- Import
import { GoogleOAuthProvider } from '@react-oauth/google'
import { initPostHog } from './services/posthog'

// Initialize PostHog
initPostHog();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
     <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <ErrorBoundary>
      <HashRouter>
       
          <ConversationProvider>
            <App />
          </ConversationProvider>
        
      </HashRouter>
    </ErrorBoundary>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)