import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { getColorScheme, applyTheme } from '@/theme'
import { getBase } from '@/utils'
import App from '@/App'
import '@/index.css'

// Apply theme on startup
applyTheme(getColorScheme())

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  applyTheme(getColorScheme())
})

// Listen for localStorage theme changes from other tabs
window.addEventListener('storage', (e) => {
  if (e.key === 'theme') {
    applyTheme(getColorScheme())
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={getBase().replace(/\/$/, '') || '/'}>
      <Routes>
        <Route path="/" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
