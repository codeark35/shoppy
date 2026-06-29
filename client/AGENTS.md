# Frontend — Ecommerce Storefront + Admin

React 18.3, Vite 6, TypeScript, Bootstrap 5, React Router 6.

## Comandos

```bash
npm run dev     # Dev con proxy /api → localhost:3070
npm run build   # Type-check + build
npm run lint    # ESLint
npm test        # Vitest + @testing-library/react (sin E2E)
```

## Estructura

```
src/
├── app/           # router.tsx + providers.tsx
├── core/          # config.ts (env centralizado), constants/, types/ (api.ts, auth.ts)
├── features/      # auth, catalog, cart, checkout, orders, account, wishlist, search, reviews, admin, analytics, banners
│   └── [feature]/
│       ├── components/  # Solo presentación (props → UI)
│       ├── hooks/       # Lógica de negocio (React Query, mutaciones)
│       ├── pages/       # Orquestación (hooks + componentes)
│       ├── services/    # Llamadas API del feature
│       ├── store/       # Solo auth y cart (Zustand)
│       └── types/
├── shared/        # components/ (feedback, layout, ui, forms), hooks/ (useDebounce), lib/ (api.ts, firebase.ts, queryClient.ts), utils/
├── test/          # createQueryWrapper, setup.ts
└── styles/        # SCSS (Bootstrap → main.scss con partials)
```

## Estado

| Tipo | Herramienta | Dónde |
|---|---|---|
| Servidor | React Query | Todos los datos de API |
| Global cliente | Zustand | authStore, cartStore (un store por feature) |
| UI local | useState / useReducer | En componentes |

- Nunca crear nuevos React Context para estado de negocio
- React Query: staleTime 2min, gcTime 5min, refetchOnWindowFocus false

## API

- Axios en `shared/lib/api.ts` con interceptor refresh automático
- Token JWT en memoria (no localStorage)
- Firebase solo para Google Sign-In (VITE_FIREBASE_* env vars)

## Routing

| Tipo | Rutas |
|---|---|
| Públicas | `/`, `/productos`, `/productos/:slug`, `/carrito`, `/buscar`, `/login`, `/registro` |
| Protegidas (auth) | `/checkout`, `/checkout/result`, `/pedidos`, `/pedidos/:id`, `/cuenta`, `/favoritos` |
| Admin (ADMIN/WAREHOUSE) | `/admin/*` — lazy-loaded con Suspense |

## Reglas clave

- Feature NUNCA importa de otro feature directamente
- Pages no contiene lógica de negocio (solo orquestación)
- Componentes menos de 200 líneas, sin `any`
- Lucide-react para íconos, Tiptap para rich text, Chart.js en analytics admin, Swiper para carouseles
- PWA via vite-plugin-pwa
- Sin Tailwind — Bootstrap 5 + react-bootstrap
