import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'  // ← Deve importar SEU App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />  {/* ← Deve renderizar SEU App */}
  </StrictMode>,
)