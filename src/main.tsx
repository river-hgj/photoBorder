import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './registerServiceWorker.ts'
import { initializeSystemBarTheme } from './lib/systemBarTheme.ts'
import { disableViewportZoom } from './lib/viewportZoom.ts'

disableViewportZoom()
initializeSystemBarTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerServiceWorker()
