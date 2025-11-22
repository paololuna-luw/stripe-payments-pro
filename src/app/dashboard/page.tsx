"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

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

export default function Dashboard() {
  const sp = useSearchParams();
  const justPaid = sp.get("success") === "1";

  const [email, setEmail] = useState("");
  const [info, setInfo] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      if (!email) {
        alert("Ingresa el email que usaste para pagar.");
        return;
      }
      setLoading(true);
      const res = await fetch(`/api/me?email=${encodeURIComponent(email)}`);
      const data = (await res.json()) as MeResponse;
      setInfo(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const hasAccess =
    info?.hasLifetimeAccess || info?.hasActiveSubscription;

  return (
    <main className="min-h-dvh bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-xs font-bold">
              SS
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Dashboard · Stripe Payments Pro
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Pagos y suscripciones (TEST)
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Estado de tu cuenta
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Consulta tus pagos y acceso usando el email de checkout.
              </p>
            </div>

            {justPaid && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-[11px] font-medium text-green-300">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Pago recibido en Stripe (TEST)
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center">
            <div className="flex-1">
              <input
                type="email"
                value={email}
                placeholder="Email usado en el pago"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
              />
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-xs font-medium text-slate-950 shadow-sm transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60 md:mt-0"
            >
              {loading ? "Cargando..." : "Ver estado"}
            </button>
          </div>

          {info && (
            <div className="mt-4 space-y-4">
              {/* Estado de acceso */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-300">
                  Acceso actual:
                </span>
                {hasAccess ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    Tienes acceso al contenido premium.
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                    No se encontraron pagos activos para este email.
                  </span>
                )}

                {info.hasLifetimeAccess && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/5 px-3 py-1 text-[11px] text-slate-200">
                    Lifetime
                  </span>
                )}
                {info.hasActiveSubscription && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-3 py-1 text-[11px] text-sky-200">
                    Suscripción activa
                  </span>
                )}
              </div>

              {/* Lista de órdenes */}
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-slate-200">
                  Últimos pagos
                </h2>
                {info.orders.length === 0 && (
                  <p className="text-xs text-slate-400">
                    No hay órdenes registradas para este email.
                  </p>
                )}

                {info.orders.length > 0 && (
                  <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/40">
                    {info.orders.map((o) => (
                      <div
                        key={o.id}
                        className="flex flex-col gap-2 px-4 py-3 text-xs md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-medium text-slate-100">
                            {o.mode === "subscription"
                              ? "Suscripción"
                              : "Pago único"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Intento: {o.stripePaymentIntentId}
                          </p>
                        </div>
                        <div className="flex flex-col items-start gap-1 text-right md:items-end">
                          <span className="text-sm font-semibold">
                            {(o.amount / 100).toFixed(2)} {o.currency.toUpperCase()}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(o.createdAt).toLocaleString()}
                          </span>
                          <span className="text-[11px] uppercase tracking-wide text-emerald-300">
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Debug para ti (queda profesional porque lo marcas como sección dev) */}
              <details className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-[11px] text-slate-400">
                <summary className="cursor-pointer text-xs font-medium text-slate-200">
                  Detalles técnicos (debug)
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-[10px]">
                  {JSON.stringify(info, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
