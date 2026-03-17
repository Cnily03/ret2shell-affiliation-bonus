// Replace {key} placeholders in a URI template with values from context
export function renderUriTmpl(tmpl: string, context: Record<string, string | number>): string {
  return tmpl.replace(/\{(\w+)\}/g, (_, key) => String(context[key] ?? ''))
}

// Get the vite base path (from vite's built-in BASE_URL)
export function getBase(): string {
  return import.meta.env.BASE_URL
}

// Get the configured API base URL (e.g. "/api")
export function getApiBase(): string {
  const raw = import.meta.env.VITE_API_BASE || '/api'
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

// Get a token from localStorage
export function getToken(): string | null {
  try {
    const raw = localStorage.getItem('account')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.token || null
  } catch {
    return null
  }
}

// Redirect to login page
export function redirectToLogin(): void {
  const tmpl = import.meta.env.VITE_LOGIN_URL_TMPL || '/account/login?redirect={redirect}'
  const url = renderUriTmpl(tmpl, { redirect: encodeURIComponent(location.href) })
  location.replace(url)
}

// Format a unix timestamp (seconds) to a readable date string
export function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
