# MiPrimerIssue

Plataforma para developers junior que conecta tareas reales de open source con un flujo guiado de solicitud, asignación, contribución en GitHub y progreso público.

## Requisitos

- Node.js `>= 20.9.0` (Next.js 16)
- npm `>= 10`

## Variables de entorno

Crea `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
PLATFORM_BASE_URL=

GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=
```

Notas:

- `NEXT_PUBLIC_APP_URL` y `PLATFORM_BASE_URL` deben apuntar al dominio final en producción.
- `GITHUB_APP_PRIVATE_KEY` debe pegarse completa (incluyendo `-----BEGIN PRIVATE KEY-----` y saltos de línea).

## Desarrollo

```bash
npm install
npm run dev
```

## Checks previos a deploy

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Deploy (Cloudflare / Vercel)

Antes de desplegar:

1. Configura Node 20+ en el proveedor.
2. Añade todas las variables de entorno.
3. Verifica callbacks OAuth con dominio real (`/auth/callback`).
4. Ejecuta los checks locales de arriba.

## Estructura principal

- `src/app`: rutas App Router
- `src/components`: UI y bloques reutilizables
- `src/lib`: integraciones (Supabase, GitHub, i18n, métricas)
- `supabase`: SQL de seeds y utilidades de datos
