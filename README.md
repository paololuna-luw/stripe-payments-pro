# ArtBoard Pro (Next.js + Stripe + Supabase)

MVP de pagos y suscripciones con Stripe Checkout, webhooks seguros y control de acceso sobre Supabase. Incluye landing con contenido bloqueado, planes de pago (lifetime y mensual) y dashboard de estado.

## Caracteristicas
- Checkout Stripe para pago unico y suscripcion mensual.
- Webhooks que sincronizan users, orders y subscriptions en Supabase.
- Control de acceso: lifetime por compra unica, suscripcion activa por estado y current_period_end.
- UI de ejemplo con contenido bloqueado/desbloqueado y modal de planes.
- Auth con Supabase (email/password) y mensajes de confirmacion de correo.

## Stack
- Next.js 16 (App Router, TypeScript)
- Stripe (Checkout + Webhooks)
- Supabase (Auth + tablas app_users, orders, subscriptions, stripe_events)
- pnpm

## Estructura relevante
```
src/
  app/
    api/
      checkout/route.ts        # Crear sesion de checkout
      me/route.ts              # Estado de acceso por email
      webhooks/stripe/route.ts # Webhook seguro Stripe
    page.tsx                   # Landing + gating
    dashboard/page.tsx         # Dashboard de estado
  lib/
    stripe.ts                  # Instancia Stripe
    supabaseAdmin.ts           # Client service role
    supabaseClient.ts          # Client publico
```

## Variables de entorno (Vercel / .env.local)
```
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ONE_TIME=price_xxx
STRIPE_PRICE_SUB_MONTHLY=price_xxx

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Tablas Supabase (resumen)
- app_users: id (uuid refs auth.users), email, stripe_customer_id.
- orders: id, user_id, amount, currency, status, mode, stripe_payment_intent_id, created_at.
- subscriptions: id, user_id, stripe_subscription_id, status, current_period_end, created_at.
- stripe_events: id, type, payload, created_at.

## Endpoints clave
- POST `/api/checkout`: valida mode/email, upsert app_users, crea Checkout Session con metadata.
- GET `/api/me?email=`: devuelve hasLifetimeAccess, hasActiveSubscription, orders, subscriptions.
- POST `/api/webhooks/stripe`: valida firma, guarda evento, maneja:
  - checkout.session.completed -> usuario + order
  - customer.subscription.created/updated/deleted -> sync subscriptions
  - invoice.paid -> order de suscripcion
  - invoice.payment_failed -> subscription past_due

## Desarrollo
```bash
pnpm install
pnpm dev
```
Stripe CLI (desarrollo):
```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
# copia el whsec en STRIPE_WEBHOOK_SECRET
```

## Test de pagos (modo test)
Tarjeta: 4242 4242 4242 4242 — CVC 123 — Fecha 12/34
Flujo: iniciar sesion, elegir plan, pagar; tras el webhook el acceso se desbloquea segun compra/suscripcion.

## Despliegue en Vercel
- Configura todas las env vars anteriores en Project Settings.
- Deploy (repo GitHub conectado o `vercel --prod`).
- En Stripe, apunta el webhook a `https://tuapp.vercel.app/api/webhooks/stripe` y usa el nuevo `whsec`.
