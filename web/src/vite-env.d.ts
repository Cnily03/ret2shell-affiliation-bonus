/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD_BASE?: string
  readonly VITE_API_BASE?: string
  readonly VITE_LOGIN_URL_TMPL?: string
  readonly VITE_GAME_URL_TMPL?: string
  readonly VITE_TEAM_URL_TMPL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
