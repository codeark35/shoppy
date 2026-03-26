// Centraliza el acceso a todas las variables de entorno del cliente.
// Nunca acceder a import.meta.env directamente fuera de este archivo.

export const config = {
  // API
  apiBaseUrl: import.meta.env.VITE_API_URL ?? '/api',
  apiVersion: import.meta.env.VITE_API_VERSION ?? 'v1',

  // App
  appName: import.meta.env.VITE_APP_NAME ?? 'Mi Tienda',
  appVersion: import.meta.env.VITE_APP_VERSION ?? '1.0.0',

  // Firebase
  firebase: {
    apiKey:     import.meta.env.VITE_FIREBASE_API_KEY     as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID  as string,
    appId:      import.meta.env.VITE_FIREBASE_APP_ID      as string,
  },

  // Monitoring (Fase 4)
  sentryDsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,

  // Environment flags
  isDev:  import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
