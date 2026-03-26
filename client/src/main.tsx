import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './styles/main.scss'
import './core/i18n'   // Inicializar i18n antes de renderizar
import { config } from './core/config'
import App from './App.tsx'

// ── Sentry — solo inicializar si hay DSN configurado ──────────────────────────
if (config.sentryDsn) {
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.isDev ? 'development' : 'production',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: config.isDev ? 1.0 : 0.1,
    // No enviar errores en desarrollo para no contaminar el proyecto de Sentry
    enabled: config.isProd,
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
