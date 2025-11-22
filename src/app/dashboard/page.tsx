"use client";
import { useSearchParams } from "next/navigation";

export default function Dashboard() {
  const sp = useSearchParams();
  const ok = sp.get("success") === "1";
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2">{ok ? "✅ Pago recibido (TEST)." : "Sin pagos recientes."}</p>
      </div>
    </main>
  );
}
