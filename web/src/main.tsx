import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { getColorScheme, applyTheme } from '@/theme'
import { getBase } from '@/utils'
import App from '@/App'
import '@/index.css'

applyTheme(getColorScheme())

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  applyTheme(getColorScheme())
})

window.addEventListener('storage', (e) => {
  if (e.key === 'theme') applyTheme(getColorScheme())
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
