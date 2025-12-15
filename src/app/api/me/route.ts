import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email requerido" }, { status: 400 });
  }

  const { data: user } = await supabaseAdmin
    .from("app_users")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (!user) {
    return NextResponse.json(
      {
        hasLifetimeAccess: false,
        hasActiveSubscription: false,
        orders: [],
        subscriptions: [],
      },
      { status: 200 }
    );
  }

  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: subscriptions } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const safeOrders = orders ?? [];
  const safeSubs = subscriptions ?? [];

  const now = new Date();
  const hasLifetimeAccess = safeOrders.some(
    (o) => o.status === "succeeded" && o.mode === "payment"
  );

  const hasActiveSubscription = safeSubs.some(
    (s) =>
      (s.status === "active" || s.status === "trialing") &&
      new Date(s.current_period_end) > now
  );

  return NextResponse.json(
    {
      hasLifetimeAccess,
      hasActiveSubscription,
      orders: safeOrders,
      subscriptions: safeSubs,
    },
    { status: 200 }
  );
}
