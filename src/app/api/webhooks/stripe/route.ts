import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = (await headers()).get("stripe-signature");

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("STRIPE_WEBHOOK_SECRET missing", { status: 500 });
  }

  if (!sig) {
    return new NextResponse("Missing stripe-signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("Webhook signature error:", err?.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log("Webhook in:", event.type, "id:", event.id);

  // Guardar evento crudo
  try {
    await supabaseAdmin.from("stripe_events").insert({
      id: event.id,
      type: event.type,
      payload: event,
    });
  } catch (e: any) {
    console.warn("No se pudo guardar stripe_events:", e?.message);
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;

    const email =
      (s.metadata?.appUserEmail as string | undefined) ??
      s.customer_details?.email ??
      s.customer_email ??
      "";

    const customerId =
      typeof s.customer === "string" ? s.customer : s.customer?.id;

    const mode = (s.metadata?.appMode as string | undefined) ?? "payment";

    // Crear/actualizar app_users
    if (email) {
      await supabaseAdmin
        .from("app_users")
        .upsert(
          [
            {
              id: (s.metadata?.appUserId as string) || undefined,
              email,
              stripe_customer_id: customerId ?? null,
            },
          ],
          { onConflict: "email" }
        );
    }

    const paymentIntentId =
      typeof s.payment_intent === "string"
        ? s.payment_intent
        : s.payment_intent?.id;

    const amount = s.amount_total ?? 0;
    const currency = (s.currency ?? "usd").toLowerCase();

    if (paymentIntentId) {
      await supabaseAdmin.from("orders").upsert(
        {
          amount,
          currency,
          status: "succeeded",
          mode,
          stripe_payment_intent_id: paymentIntentId,
          user_id: (s.metadata?.appUserId as string) || null,
        },
        { onConflict: "stripe_payment_intent_id" }
      );
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const sub = event.data.object as Stripe.Subscription;
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

    if (!customerId) {
      console.warn("Subscription sin customerId");
      return NextResponse.json({ received: true });
    }

    const { data: user } = await supabaseAdmin
      .from("app_users")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (!user) {
      console.warn("No se encontro app_user para customerId", customerId);
      return NextResponse.json({ received: true });
    }

    const rawCurrent = (sub as any).current_period_end as number | undefined;
    const currentPeriodEnd = rawCurrent
      ? new Date(rawCurrent * 1000).toISOString()
      : new Date().toISOString();

    const status =
      event.type === "customer.subscription.deleted"
        ? "canceled"
        : sub.status ?? "incomplete";

    await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: user.id,
        stripe_subscription_id: sub.id,
        status,
        current_period_end: currentPeriodEnd,
      },
      { onConflict: "stripe_subscription_id" }
    );
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const inv = event.data.object as Stripe.Invoice;
    const customerId =
      typeof inv.customer === "string" ? inv.customer : inv.customer?.id;

    const paymentIntentId =
      typeof inv.payment_intent === "string"
        ? inv.payment_intent
        : inv.payment_intent?.id;

    const amount = inv.amount_paid ?? inv.amount_due ?? 0;
    const currency = (inv.currency ?? "usd").toLowerCase();

    if (!customerId || !paymentIntentId) {
      console.warn("invoice sin customerId o payment_intent");
      return NextResponse.json({ received: true });
    }

    const { data: user } = await supabaseAdmin
      .from("app_users")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (!user) {
      console.warn("No user para invoice", customerId);
      return NextResponse.json({ received: true });
    }

    await supabaseAdmin.from("orders").upsert(
      {
        amount,
        currency,
        status: event.type === "invoice.paid" ? "succeeded" : "failed",
        mode: "subscription",
        stripe_payment_intent_id: paymentIntentId,
        user_id: user.id,
      },
      { onConflict: "stripe_payment_intent_id" }
    );

    if (event.type === "invoice.payment_failed") {
      await supabaseAdmin
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("stripe_subscription_id", inv.subscription as string);
    }
  }

  return NextResponse.json({ received: true });
}
