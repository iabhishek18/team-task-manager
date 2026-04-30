import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const loader = document.getElementById('app-loader');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

setTimeout(() => { if (loader) loader.classList.add('hide'); }, 800);
