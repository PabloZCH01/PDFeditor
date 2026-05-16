import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  // Omitting StrictMode for PDF.js as it causes double rendering of the canvas
  <App />
)
