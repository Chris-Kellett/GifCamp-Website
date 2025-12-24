import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Check if logging is enabled
const isDev = import.meta.env.VITE_ISDEV === 'true';
if (isDev) {
  console.log('='.repeat(60));
  console.log('GifCamp - Development Mode');
  console.log('Logging enabled via VITE_ISDEV=true');
  console.log('='.repeat(60));
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
