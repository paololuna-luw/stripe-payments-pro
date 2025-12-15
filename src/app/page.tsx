"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

type MeResponse = {
  hasLifetimeAccess: boolean;
  hasActiveSubscription: boolean;
  orders: any[];
  subscriptions: any[];
  error?: string;
};

const gallery = [
  { title: "Neon city", url: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=900", locked: false },
  { title: "Analog mood", url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900", locked: false },
  { title: "Geometry light", url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900", locked: true },
  { title: "Glass art", url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=900", locked: true },
  { title: "Sculpted vibes", url: "https://images.unsplash.com/photo-1503602642458-232111445657?w=900", locked: true },
  { title: "Chromatic", url: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=900", locked: true },
  { title: "Night walk", url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900", locked: true },
  { title: "Digital bloom", url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900", locked: true },
  { title: "Studio light", url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900", locked: false },
  { title: "Future grid", url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900", locked: true },
  { title: "Minimal tone", url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900", locked: true },
  { title: "Soft shapes", url: "https://images.unsplash.com/photo-1433838552652-f9a46b332c40?w=900", locked: true },
];

const proExtras = [
  { title: "Anime night 1", url: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200" },
  { title: "Anime night 2", url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200" },
  { title: "Anime neon", url: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200" },
  { title: "Anime city", url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200" },
  { title: "Cyber alley", url: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200" },
  { title: "Cherry lights", url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200" },
  { title: "Blade streets", url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200" },
  { title: "Neon shrine", url: "https://images.unsplash.com/photo-1511765224389-37f0e77cf0eb?w=1200" },
  { title: "Rain synth", url: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200" },
  { title: "Violet city", url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200" },
  { title: "Hologram", url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200" },
  { title: "Sakura neon", url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200" },
  { title: "Sky rails", url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200" },
  { title: "Retro grid", url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200" },
  { title: "Moonlight", url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200" },
  { title: "Blue dusk", url: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=1200" },
  { title: "Anime bridge", url: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=1200" },
  { title: "Pink cyber", url: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=1200" },
  { title: "City glow", url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200" },
  { title: "Night alley", url: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=1200" },
];

const benefits = [
  { title: "Vista previa curada", desc: "Tableros inspirados en Pinterest con foto y arte digital." },
  { title: "Modo Pro", desc: "Acceso completo a colecciones, descargas y futuras funciones." },
  { title: "Uploads", desc: "Sube tus PNG/JPG y crea boards privados (próximo)." },
];

export default function Home() {
  const [sessionEmail, setSessionEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [info, setInfo] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState<"pay" | "sub" | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [modeAuth, setModeAuth] = useState<"login" | "signup">("login");
  const [showPlans, setShowPlans] = useState(false);

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionEmail(data.session.user.email ?? "");
        setUserId(data.session.user.id);
      }
    });
    const { data: listener } = supabaseBrowser.auth.onAuthStateChange(
      (_event, session) => {
        setSessionEmail(session?.user.email ?? "");
        setUserId(session?.user.id ?? null);
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!sessionEmail) return;
      try {
        await fetchAccess(sessionEmail);
      } catch (err) {
        console.error(err);
      }
    };
    void run();
  }, [sessionEmail]);

  const hasAccess = useMemo(
    () => info?.hasLifetimeAccess || info?.hasActiveSubscription,
    [info]
  );

  async function fetchAccess(email: string) {
    const res = await fetch(`/api/me?email=${encodeURIComponent(email)}`);
    const data = (await res.json()) as MeResponse;
    setInfo(data);
    return data;
  }

  async function signup(email: string, password: string) {
    setAuthLoading(true);
    const { error } = await supabaseBrowser.auth.signUp({ email, password });
    if (error) alert(error.message);
    setAuthLoading(false);
  }

  async function login(email: string, password: string) {
    setAuthLoading(true);
    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
    setAuthLoading(false);
  }

  async function logout() {
    await supabaseBrowser.auth.signOut();
    setSessionEmail("");
    setUserId(null);
    setInfo(null);
  }

  async function go(mode: "payment" | "subscription") {
    try {
      if (!sessionEmail) {
        alert("Crea una cuenta o inicia sesion primero.");
        return;
      }
      setLoading(mode === "payment" ? "pay" : "sub");
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, email: sessionEmail, userId }),
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
    if (!sessionEmail) {
      alert("Necesitas estar logueado para consultar acceso.");
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(
        `/api/me?email=${encodeURIComponent(sessionEmail)}`
      );
      const data = (await res.json()) as MeResponse;
      setInfo(data);
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  }

  const heroBg =
    "bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.2),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(129,140,248,0.2),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.12),transparent_25%)]";

  const visibleGallery = gallery.map((item, i) => ({
    ...item,
    locked: hasAccess ? false : item.locked,
    idx: i,
  }));
  const proGallery = hasAccess
    ? Array.from({ length: 30 }, (_, i) => {
        if (i < proExtras.length) {
          return { ...proExtras[i], locked: false, idx: i };
        }
        const base = gallery[i % gallery.length];
        return { ...base, locked: false, idx: i, title: `${base.title} ${i + 1}` };
      })
    : visibleGallery;

  const loggedIn = !!sessionEmail;

  return (
    <main className={`min-h-dvh ${heroBg} bg-slate-950 text-slate-50`}>
      <header className="border-b border-slate-800/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 via-cyan-500 to-indigo-500 text-sm font-bold">
              AR
            </div>
            <div>
              <p className="text-sm font-semibold">ArtBoard Pro</p>
              <p className="text-[11px] text-slate-400">
                Inspo feed · Stripe · Supabase
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {hasAccess ? (
              <span className="rounded-full bg-emerald-500/15 px-4 py-2 text-[11px] font-semibold text-emerald-200">
                Cuenta Pro activa
              </span>
            ) : (
              <button
                onClick={() => {
                  if (!loggedIn) {
                    alert("Inicia sesion para ver y comprar planes.");
                    return;
                  }
                  setShowPlans(true);
                }}
                className="rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 font-semibold text-slate-950 shadow-sm transition hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-60"
                disabled={!!loading}
              >
                Upgrade a Pro
              </button>
            )}
            {loggedIn ? (
              <>
                <span className="hidden rounded-full bg-slate-100/10 px-3 py-1 font-mono text-slate-100 sm:inline-block">
                  {sessionEmail}
                </span>
                <button
                  onClick={logout}
                  className="rounded-lg border border-slate-700 px-3 py-1 text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
                >
                  Salir
                </button>
              </>
            ) : (
              <span className="text-slate-400">Invitado</span>
            )}
          </div>
        </div>
      </header>

      {!loggedIn && (
        <section className="relative isolate flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
          <div className="absolute inset-0 opacity-30">
            <div className="mx-auto grid h-full max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {gallery.slice(0, 15).map((item) => (
                <div
                  key={item.title}
                  className="aspect-[2/3] overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/40"
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 w-full max-w-xl rounded-3xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900">
                <span className="text-lg font-semibold text-rose-400">A</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-50">
                Inicia sesion para entrar
              </h2>
              <p className="text-center text-sm text-slate-400">
                Accede al feed visual. Luego podrás mejorar a Pro para desbloquear todo el contenido y pagos.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <input
                type="email"
                placeholder="Correo"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/30"
              />
              <input
                type="password"
                placeholder="Contrasena"
                value={authPass}
                onChange={(e) => setAuthPass(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/30"
              />

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    modeAuth === "login"
                      ? login(authEmail, authPass)
                      : signup(authEmail, authPass)
                  }
                  disabled={authLoading}
                  className="w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-rose-400 hover:shadow-lg hover:shadow-rose-500/20 active:translate-y-0 disabled:opacity-60"
                >
                  {authLoading
                    ? "Procesando..."
                    : modeAuth === "login"
                      ? "Iniciar sesion"
                      : "Crear cuenta"}
                </button>
                <button
                  onClick={() =>
                    setModeAuth((prev) => (prev === "login" ? "signup" : "login"))
                  }
                  className="rounded-2xl border border-slate-800 px-4 py-3 text-xs font-semibold text-slate-200 transition hover:border-rose-400 hover:-translate-y-[1px] active:translate-y-0"
                >
                  {modeAuth === "login" ? "Registrarme" : "Tengo cuenta"}
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {benefits.map((b) => (
                <div
                  key={b.title}
                  className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-3 text-left shadow-lg shadow-black/30"
                >
                  <p className="text-xs font-semibold text-slate-100">
                    {b.title}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {loggedIn && (
        <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 lg:flex-row">
          <div className="flex-1 space-y-4">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {hasAccess ? "Feed completo" : "Preview limitada"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {hasAccess
                      ? "Disfruta todo el arte y subidas."
                      : "Algunos items se mantienen bloqueados hasta que pases a Pro."}
                  </p>
                </div>
                {!hasAccess && (
                  <button
                    onClick={() => setShowPlans(true)}
                    className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-400"
                  >
                    Ver planes
                  </button>
                )}
                {hasAccess && (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                    Pro activado
                  </span>
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {(hasAccess ? proGallery : visibleGallery).map((item) => (
                  <div
                    key={item.title + item.idx}
                    className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 shadow-md shadow-black/30"
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                    {!hasAccess && item.locked && (
                      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
                        <p className="text-sm font-semibold text-white">
                          {item.title}
                        </p>
                        <button
                          onClick={() => setShowPlans(true)}
                          className="mt-2 w-full rounded-xl bg-white/90 px-3 py-2 text-[11px] font-semibold text-slate-900 transition hover:bg-white"
                        >
                          Desbloquear con Pro
                        </button>
                      </div>
                    )}
                    {hasAccess && (
                      <div className="absolute bottom-2 left-2 rounded-full bg-slate-900/80 px-2 py-1 text-[11px] text-slate-100">
                        {item.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {hasAccess ? (
                  <>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                      Acceso Pro activo
                    </span>
                    <button
                      disabled
                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400"
                    >
                      Subir contenido (próximo)
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-slate-400">
                    Pasa a Pro para desbloquear todo y subir tus PNGs pronto.
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">Estado de acceso</p>
                <span className="rounded-full bg-slate-100/10 px-3 py-1 text-[11px] font-mono text-slate-100">
                  {sessionEmail}
                </span>
                <button
                  onClick={checkAccess}
                  disabled={checking || !sessionEmail}
                  className="ml-auto rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-100 transition hover:border-rose-400 hover:text-rose-200 disabled:opacity-60"
                >
                  {checking ? "Verificando..." : "Verificar acceso"}
                </button>
              </div>

              {info && (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-300">Acceso:</span>
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
                  <p className="text-xs text-slate-400">
                    Ordenes: {info.orders.length} · Subs: {info.subscriptions.length}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div id="plans" className="w-full space-y-4 lg:w-80">
            {hasAccess ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-lg shadow-black/30">
                <p className="text-sm font-semibold text-emerald-200">
                  Pro activo
                </p>
                <p className="mt-1 text-xs text-emerald-100">
                  Tu cuenta ya tiene acceso completo. Disfruta todo el contenido y futuras funciones.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4 shadow-lg shadow-black/30">
                  <p className="text-xs font-semibold text-rose-200">Planes</p>
                  <div className="mt-3 space-y-3">
                    <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                      <h3 className="text-sm font-semibold text-slate-100">
                        Pago unico
                      </h3>
                      <p className="text-xs text-slate-400">
                        Acceso de por vida al feed completo y futuras features.
                      </p>
                      <button
                        className="mt-3 w-full rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-white disabled:opacity-60"
                        onClick={() => setShowPlans(true)}
                        disabled={!!loading}
                      >
                        Ver opciones
                      </button>
                    </article>
                    <article className="rounded-xl border border-rose-500/40 bg-gradient-to-br from-slate-900 to-rose-950/40 p-3 shadow-[0_0_0_1px_rgba(244,63,94,0.25)]">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-100">
                          Pro mensual
                        </h3>
                        <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-200">
                          Mejor opcion
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Acceso completo + subir tus PNGs y boards privados.
                      </p>
                      <button
                        className="mt-3 w-full rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-400 disabled:opacity-60"
                        onClick={() => setShowPlans(true)}
                        disabled={!!loading}
                      >
                        Ver opciones
                      </button>
                    </article>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
                  <p className="text-sm font-semibold text-slate-100">
                    Proximamente
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-slate-400">
                    <li>· Subir PNG/JPG y crear boards privados</li>
                    <li>· Guardar favoritos y compartir enlaces</li>
                    <li>· Stats de vistas y descargas</li>
                  </ul>
                  <button
                    disabled
                    className="mt-3 w-full rounded-lg border border-slate-800 px-3 py-2 text-[11px] text-slate-500"
                  >
                    Upload PNG (proximo)
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {showPlans && loggedIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-rose-200">
                  Planes ArtBoard
                </p>
                <h2 className="text-xl font-semibold text-slate-50">
                  Elige como desbloquear todo
                </h2>
                <p className="text-sm text-slate-400">
                  Compra una vez para acceso de por vida o suscribete para updates recurrentes.
                </p>
              </div>
              <button
                onClick={() => setShowPlans(false)}
                className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 transition hover:border-rose-400 hover:text-rose-200"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-lg shadow-black/30">
                <p className="text-sm font-semibold text-slate-100">
                  Pago unico
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Acceso de por vida al feed completo y futuras funciones.
                </p>
                <ul className="mt-3 space-y-1 text-[11px] text-slate-300">
                  <li>· Colecciones curadas mensuales</li>
                  <li>· Descargas sin limite</li>
                  <li>· Acceso anticipado a nuevas series</li>
                </ul>
                <button
                  className="mt-4 w-full rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-white disabled:opacity-60"
                  onClick={() => {
                    go("payment");
                    setShowPlans(false);
                  }}
                  disabled={!!loading || hasAccess}
                >
                  {hasAccess ? "Ya tienes acceso" : loading === "pay" ? "Redirigiendo..." : "Comprar lifetime"}
                </button>
              </article>

              <article className="rounded-2xl border border-rose-500/40 bg-gradient-to-br from-slate-900 to-rose-950/30 p-4 shadow-[0_0_0_1px_rgba(244,63,94,0.25)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-100">
                    Pro mensual
                  </p>
                  <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-200">
                    Recomendado
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  Acceso completo + uploads futuros y boards privados.
                </p>
                <ul className="mt-3 space-y-1 text-[11px] text-slate-200">
                  <li>· Todo lo del plan de pago unico</li>
                  <li>· Subir tus PNG/JPG y boards privados</li>
                  <li>· Compartir enlaces y ver stats</li>
                </ul>
                <button
                  className="mt-4 w-full rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-400 disabled:opacity-60"
                  onClick={() => {
                    go("subscription");
                    setShowPlans(false);
                  }}
                  disabled={!!loading || hasAccess}
                >
                  {hasAccess ? "Ya eres Pro" : loading === "sub" ? "Redirigiendo..." : "Suscribirme"}
                </button>
              </article>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
