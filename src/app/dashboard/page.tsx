"use client";

import { useEffect, useMemo, useState } from "react";
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
    stripe_payment_intent_id: string;
    created_at: string;
  }[];
  subscriptions: {
    id: string;
    status: string;
    stripe_subscription_id: string;
    current_period_end: string;
    created_at: string;
  }[];
  error?: string;
};

export default function Dashboard() {
  const sp = useSearchParams();
  const justPaid = sp.get("success") === "1";

  const [email, setEmail] = useState("");
  const [info, setInfo] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const hasAccess = useMemo(
    () => info?.hasLifetimeAccess || info?.hasActiveSubscription,
    [info]
  );

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

  useEffect(() => {
    const fromHome = sp.get("email");
    if (fromHome) setEmail(fromHome);
  }, [sp]);

  return (
    <main className="min-h-dvh bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <header className="border-b border-slate-800/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-sm font-bold">
              DB
            </div>
            <div>
              <p className="text-sm font-semibold">Dashboard Premium</p>
              <p className="text-[11px] text-slate-400">
                Estado de pagos y suscripciones
              </p>
            </div>
          </div>
          {justPaid && (
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
              Pago recibido (TEST)
            </span>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-8 space-y-5">
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5 shadow-lg shadow-cyan-500/5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Revisa tu acceso</h1>
              <p className="text-xs text-slate-400">
                Usa el email asociado a tu pago o suscripcion.
              </p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email usado en Stripe"
                className="w-64 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
              />
              <button
                onClick={load}
                disabled={loading}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-cyan-400 disabled:opacity-60"
              >
                {loading ? "Cargando..." : "Ver estado"}
              </button>
            </div>
          </div>

          {info && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">
                  Acceso:
                </span>
                {hasAccess ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
                    Bloqueado
                  </span>
                )}
                {info.hasLifetimeAccess && (
                  <span className="rounded-full bg-slate-100/10 px-3 py-1 text-[11px] text-slate-100">
                    Lifetime
                  </span>
                )}
                {info.hasActiveSubscription && (
                  <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[11px] text-cyan-200">
                    Suscripcion activa
                  </span>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold text-slate-300">
                    Ordenes
                  </p>
                  {info.orders.length === 0 && (
                    <p className="text-xs text-slate-500">
                      No hay ordenes registradas.
                    </p>
                  )}
                  {info.orders.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {info.orders.map((o) => (
                        <div
                          key={o.id}
                          className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-100">
                              {o.mode === "subscription"
                                ? "Suscripcion"
                                : "Pago unico"}
                            </span>
                            <span className="text-[11px] uppercase text-emerald-300">
                              {o.status}
                            </span>
                          </div>
                          <p className="text-slate-300">
                            {(o.amount / 100).toFixed(2)}{" "}
                            {o.currency?.toUpperCase()}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(o.created_at).toLocaleString()}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            PI: {o.stripe_payment_intent_id}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold text-slate-300">
                    Suscripciones
                  </p>
                  {info.subscriptions.length === 0 && (
                    <p className="text-xs text-slate-500">
                      No hay suscripciones registradas.
                    </p>
                  )}
                  {info.subscriptions.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {info.subscriptions.map((s) => (
                        <div
                          key={s.id}
                          className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-100">
                              {s.stripe_subscription_id}
                            </span>
                            <span className="text-[11px] uppercase text-cyan-200">
                              {s.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Periodo hasta:{" "}
                            {new Date(s.current_period_end).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <details className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-[11px] text-slate-300">
                <summary className="cursor-pointer text-xs font-semibold text-slate-200">
                  Debug JSON
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3">
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
