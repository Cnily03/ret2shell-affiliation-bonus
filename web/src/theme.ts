// Resolve current color scheme from localStorage or system preference
export type ColorScheme = 'light' | 'dark'

export function getColorScheme(): ColorScheme {
  try {
    const raw = localStorage.getItem('theme')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.colorScheme === 'light' || parsed.colorScheme === 'dark') {
        return parsed.colorScheme
      }
    }
  } catch {
    // ignore
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// CSS variable tokens for Discord-like theme
export function getThemeVars(scheme: ColorScheme): Record<string, string> {
  if (scheme === 'dark') {
    return {
      '--bg-primary': '#313338',
      '--bg-secondary': '#2b2d31',
      '--bg-tertiary': '#1e1f22',
      '--bg-accent': '#404249',
      '--text-primary': '#f2f3f5',
      '--text-secondary': '#b5bac1',
      '--text-muted': '#949ba4',
      '--text-link': '#00a8fc',
      '--brand': '#5865f2',
      '--brand-hover': '#4752c4',
      '--green': '#23a559',
      '--yellow': '#f0b232',
      '--red': '#f23f43',
      '--border': '#3f4147',
      '--card-bg': '#2b2d31',
      '--input-bg': '#1e1f22',
      '--shadow': 'rgba(0,0,0,0.4)',
    }
  }
  return {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f2f3f5',
    '--bg-tertiary': '#e3e5e8',
    '--bg-accent': '#ebedef',
    '--text-primary': '#060607',
    '--text-secondary': '#4e5058',
    '--text-muted': '#80848e',
    '--text-link': '#006ce7',
    '--brand': '#5865f2',
    '--brand-hover': '#4752c4',
    '--green': '#23a559',
    '--yellow': '#f0b232',
    '--red': '#f23f43',
    '--border': '#e1e1e4',
    '--card-bg': '#ffffff',
    '--input-bg': '#e3e5e8',
    '--shadow': 'rgba(0,0,0,0.08)',
  }
}

export function applyTheme(scheme: ColorScheme) {
  const vars = getThemeVars(scheme)
  const root = document.documentElement
  for (const [key, val] of Object.entries(vars)) {
    root.style.setProperty(key, val)
  }
  root.setAttribute('data-theme', scheme)
}
