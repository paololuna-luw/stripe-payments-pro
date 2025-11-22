"use client";
import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState<"pay" | "sub" | null>(null);

  async function go(mode: "payment" | "subscription") {
    try {
      setLoading(mode === "payment" ? "pay" : "sub");
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
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

  return (
    <main className="min-h-dvh grid place-items-center p-10">
      <div className="flex gap-4">
        <button className="rounded-xl px-4 py-2 shadow" onClick={() => go("payment")} disabled={!!loading}>
          Pago único
        </button>
        <button className="rounded-xl px-4 py-2 shadow" onClick={() => go("subscription")} disabled={!!loading}>
          Suscripción mensual
        </button>
      </div>
    </main>
  );
}
