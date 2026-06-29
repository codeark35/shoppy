# Ecommerce Monorepo

Monorepo con client (frontend React) y server (backend NestJS).

## Estructura

```
client/  → React 18 + Vite 6 + TypeScript
server/  → NestJS 11 + Fastify + Prisma + PostgreSQL
```

## Comandos rápidos

```bash
# Client
cd client && npm run dev    # Dev en :5173 (proxy /api → :3070)
cd client && npm run build  # Type-check + build
cd client && npm run lint   # ESLint
cd client && npm test       # Vitest

# Server
cd server && npm run start:dev  # Dev en :3070
cd server && npm run lint       # ESLint
cd server && npx prisma migrate dev  # Migraciones
```

## Convenciones globales

- Feature-First (client) / Modular (server)
- TypeScript estricto, sin `any`
- Prefer flat commits, mensajes en español
