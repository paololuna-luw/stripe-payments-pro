

# Stripe Payments Pro (Next.js + Stripe + Prisma)

Mini sistema real para **pagos con Stripe Checkout** que soporta:

* 💳 Pago **único (lifetime)**
* 🔁 **Suscripción mensual**
* 🔐 Acceso a **dashboard premium** según estado de pago
* 🧾 Registro de órdenes, usuarios y suscripciones con **Prisma + SQLite**
* 🔔 **Webhooks** para sincronizar pagos automáticamente

Ideal como **MVP** y como proyecto de **portafolio/CV**.

---

## Tabla de contenidos

- [Stripe Payments Pro (Next.js + Stripe + Prisma)](#stripe-payments-pro-nextjs--stripe--prisma)
  - [Tabla de contenidos](#tabla-de-contenidos)
  - [🧱 Tecnologías](#-tecnologías)
  - [📂 Estructura del proyecto](#-estructura-del-proyecto)
  - [✅ Requisitos](#-requisitos)
  - [🧰 Instalación](#-instalación)
    - [0) Clonar](#0-clonar)
    - [1) Habilitar pnpm (una vez)](#1-habilitar-pnpm-una-vez)
    - [2) Instalar dependencias](#2-instalar-dependencias)
  - [🔐 Variables de entorno](#-variables-de-entorno)
    - [`.env` (Base de datos SQLite)](#env-base-de-datos-sqlite)
    - [`.env.local` (Stripe + URLs)](#envlocal-stripe--urls)
  - [🗄️ Prisma — Base de datos](#️-prisma--base-de-datos)
  - [🔔 Stripe CLI — Webhooks en desarrollo](#-stripe-cli--webhooks-en-desarrollo)
  - [🚀 Levantar la aplicación](#-levantar-la-aplicación)
  - [🧪 Testear pagos (modo TEST)](#-testear-pagos-modo-test)
  - [📄 Licencia](#-licencia)

---

## 🧱 Tecnologías

* **Next.js 15** (App Router, TypeScript)
* **Stripe** (Checkout Sessions + Webhooks)
* **Prisma ORM** + **SQLite**
* **Tailwind CSS**
* **pnpm**

---

## 📂 Estructura del proyecto

```text
src/
└─ app/
   ├─ api/
   │  ├─ checkout/route.ts          # Crear checkout (pago único / suscripción)
   │  ├─ me/route.ts                # Estado de acceso del usuario
   │  └─ webhooks/stripe/route.ts   # Webhook seguro
   ├─ dashboard/page.tsx            # Dashboard premium
   └─ page.tsx                      # Landing + verificación rápida
lib/
├─ stripe.ts                        # Instancia de Stripe
└─ db.ts                            # Prisma Client

prisma/
└─ schema.prisma                    # User, Order, Subscription, StripeEvent
```

---

## ✅ Requisitos

* Node.js **18+** (ideal **20**)
* **pnpm**
* **Stripe CLI** instalado
* Cuenta de **Stripe** en modo **TEST**
* **Git**

---

## 🧰 Instalación

### 0) Clonar

```bash
git clone https://github.com/paololuna-luw/stripe-payments-pro
cd stripe-payments-pro
```

### 1) Habilitar pnpm (una vez)

```bash
node -v
corepack enable
corepack prepare pnpm@10.18.3 --activate
pnpm -v
```

### 2) Instalar dependencias

```bash
pnpm install
```

---

## 🔐 Variables de entorno

Este proyecto usa **dos** archivos: `.env` y `.env.local`.

### `.env` (Base de datos SQLite)

**Windows PowerShell**:

```ps1
@'
DATABASE_URL="file:./dev.db"
'@ | Out-File -Encoding utf8 .env
```

**Manual** (cualquier SO):

```env
DATABASE_URL="file:./dev.db"
```

### `.env.local` (Stripe + URLs)

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxx

STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxx
STRIPE_PRICE_ONE_TIME=price_xxxxxxxxxxxxxx
STRIPE_PRICE_SUB_MONTHLY=price_xxxxxxxxxxxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🗄️ Prisma — Base de datos

Generar cliente:

```bash
pnpm prisma generate
```

Aplicar migraciones:

```bash
pnpm prisma migrate dev --name init
```

(Opcional) Prisma Studio:

```bash
pnpm prisma studio
```

---

## 🔔 Stripe CLI — Webhooks en desarrollo

1. Iniciar sesión:

```bash
stripe login
```

2. Escuchar webhooks:

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

La CLI mostrará algo como:

```
Ready! Your webhook signing secret is whsec_XXXXXXXXXXXX
```

Copia ese valor en `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX
```

---

## 🚀 Levantar la aplicación

```bash
pnpm dev
```

Rutas locales:

* **[http://localhost:3000](http://localhost:3000)** → Landing + verificar email
* **[http://localhost:3000/dashboard](http://localhost:3000/dashboard)** → Dashboard premium

---

## 🧪 Testear pagos (modo TEST)

1. Abre `http://localhost:3000`
2. Ingresa un email (ej: `alguien@test.com`)
3. Elige:

   * **Pago único**, o
   * **Suscripción mensual**
4. Stripe abrirá el **Checkout** en modo test

Tarjeta de prueba:

```
4242 4242 4242 4242
CVC: 123
Fecha: 12/34
```

Después del pago:

* El webhook registra **User**, **Order** y **Subscription**
* En `/dashboard`, escribe el email para ver:

  * Si tiene acceso
  * Historial de pagos
  * (Opcional) Debug JSON

---

## 📄 Licencia

Uso libre para aprendizaje y como base para otros proyectos/MVPs.

