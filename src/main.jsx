import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Finance from './components/Finance'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Finance />
  </StrictMode>,
)
