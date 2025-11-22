"use client";

import { useState } from "react";

type MeResponse = {
  hasLifetimeAccess: boolean;
  hasActiveSubscription: boolean;
  orders: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    mode: string;
    stripePaymentIntentId: string;
    createdAt: string;
  }[];
  subscriptions: {
    id: string;
    status: string;
    stripeSubscriptionId: string;
    currentPeriodEnd: string;
    createdAt: string;
  }[];
  error?: string;
};

export default function Home() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"pay" | "sub" | null>(null);

  const [checking, setChecking] = useState(false);
  const [info, setInfo] = useState<MeResponse | null>(null);

  async function go(mode: "payment" | "subscription") {
    try {
      if (!email) {
        alert("Pon tu email para asociar el pago.");
        return;
      }
      setLoading(mode === "payment" ? "pay" : "sub");
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, email }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`HTTP ${res.status}: ${msg}`);
      }

      const { url } = await res.json();
      if (!url) throw new Error("Sin URL de Checkout");
      window.location.href = url;
    } catch (err: any) {
      alert(`Error iniciando pago: ${err.message}`);
      setLoading(null);
      console.error(err);
    }
  }

  async function checkAccess() {
    try {
      if (!email) {
        alert("Ingresa un email para verificar.");
        return;
      }
      setChecking(true);
      const res = await fetch(`/api/me?email=${encodeURIComponent(email)}`);
      const data = (await res.json()) as MeResponse;
      setInfo(data);
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  }

  const hasAccess =
    info?.hasLifetimeAccess || info?.hasActiveSubscription;

  return (
    <main className="min-h-dvh bg-slate-950 text-slate-50">
      {/* Navbar sencilla */}
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-xs font-bold">
              SS
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Stripe Payments Pro
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Next.js · Stripe · Prisma
          </span>
        </div>
      </header>

      {/* Hero + planes */}
      <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-4xl flex-col gap-10 px-4 py-10 md:flex-row md:items-center">
        {/* Texto principal */}
        <div className="flex-1 space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Sistema de pagos con{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
              Stripe
            </span>{" "}
            listo para producción.
          </h1>
          <p className="text-sm leading-relaxed text-slate-300 md:text-base">
            MVP de suscripciones y pago único: integra Stripe Checkout, webhooks
            y control de acceso a un dashboard premium usando Next.js y Prisma.
            Ideal como base para un SaaS real.
          </p>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-medium text-slate-200">
              Email para asociar tus pagos
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-slate-400">
                Usa el mismo email luego para ver tu acceso en el dashboard.
              </p>
              <button
                type="button"
                onClick={checkAccess}
                disabled={checking || !email}
                className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-[11px] font-medium text-slate-100 transition hover:border-sky-400 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checking ? "Verificando..." : "Verificar acceso"}
              </button>
            </div>
          </div>

          {/* Resultado de verificación (ligero, a un ladito) */}
          {info && (
            <div className="mt-3 space-y-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-200">
                  Estado para:
                </span>
                <span className="rounded-full bg-slate-100/5 px-3 py-1 text-[11px] font-mono text-slate-100">
                  {email}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="text-slate-400">Acceso:</span>
                {hasAccess ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 font-medium text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    Tiene acceso al contenido premium
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 font-medium text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                    Sin pagos activos encontrados
                  </span>
                )}

                {info.hasLifetimeAccess && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/5 px-3 py-1 text-slate-200">
                    Lifetime
                  </span>
                )}
                {info.hasActiveSubscription && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-3 py-1 text-sky-200">
                    Suscripción activa
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400">
                Órdenes registradas:{" "}
                <span className="font-semibold text-slate-200">
                  {info.orders.length}
                </span>
                {info.orders.length > 0 && (
                  <>
                    {" "}
                    · Último pago:{" "}
                    <span className="font-mono">
                      {new Date(
                        info.orders[0].createdAt,
                      ).toLocaleString()}
                    </span>
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Tarjetas de planes */}
        <div className="flex-1 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Planes disponibles
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Plan pago único */}
            <article className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="space-y-2">
                <h2 className="text-sm font-semibold">Pago único</h2>
                <p className="text-xs text-slate-400">
                  Acceso de por vida al contenido premium. Ideal para compras
                  puntuales.
                </p>
                <p className="mt-1 text-lg font-semibold">
                  Lifetime
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    (precio en Stripe)
                  </span>
                </p>
              </div>
              <button
                className="mt-4 w-full rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-900 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => go("payment")}
                disabled={!!loading}
              >
                {loading === "pay" ? "Redirigiendo..." : "Elegir pago único"}
              </button>
            </article>

            {/* Plan suscripción */}
            <article className="flex flex-col justify-between rounded-2xl border border-sky-500/40 bg-slate-900 p-4 shadow-[0_0_0_1px_rgba(56,189,248,0.3)]">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Suscripción mensual</h2>
                  <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-300">
                    Recomendado
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Pagos recurrentes gestionados por Stripe. Perfecto para SaaS
                  y membresías.
                </p>
                <p className="mt-1 text-lg font-semibold">
                  Mensual
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    (precio en Stripe)
                  </span>
                </p>
              </div>
              <button
                className="mt-4 w-full rounded-xl bg-sky-500 px-3 py-2 text-xs font-medium text-slate-950 shadow-sm transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => go("subscription")}
                disabled={!!loading}
              >
                {loading === "sub" ? "Redirigiendo..." : "Elegir suscripción"}
              </button>
            </article>
          </div>

          <p className="text-[11px] text-slate-500">
            Modo TEST de Stripe: puedes usar tarjetas de prueba para validar todo
            el flujo sin pagar realmente.
          </p>
        </div>
      </section>
    </main>
  );
}
