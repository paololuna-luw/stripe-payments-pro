import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = (await headers()).get("stripe-signature")!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Webhook signature error:", err?.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log("⚡ Webhook in:", event.type, "id:", event.id);

  // Guardar el evento crudo por seguridad/auditoría
  try {
    await db.stripeEvent.create({
      data: {
        id: event.id,
        type: event.type,
        payload: JSON.stringify(event),
      },
    });
  } catch (e: any) {
    console.warn("⚠️ No se pudo guardar StripeEvent:", e?.message);
  }

  // -------------------------------
  // 1) checkout.session.completed
  // -------------------------------
  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;

    const email =
      (s.metadata?.appUserEmail as string | undefined) ??
      s.customer_details?.email ??
      s.customer_email ??
      "";

    const customerId =
      typeof s.customer === "string" ? s.customer : undefined;

    const mode = s.metadata?.appMode as
      | "payment"
      | "subscription"
      | undefined;

    const amount = s.amount_total ?? 0;
    const currency = (s.currency ?? "usd").toLowerCase();

    console.log("→ session:", {
      id: s.id,
      email,
      customerId,
      amount,
      currency,
      mode,
    });

    // 1) User
    let user = null;
    if (email) {
      try {
        user = await db.user.upsert({
          where: { email },
          create: {
            email,
            stripeCustomerId: customerId,
          },
          update: customerId
            ? { stripeCustomerId: customerId }
            : {},
        });
      } catch (e: any) {
        console.error("❌ Error upsert User:", e?.message);
      }
    } else {
      console.warn("⚠️ checkout.session.completed sin email.");
    }

    // 2) Order (solo si existe payment_intent → pago único normalmente)
    const pi =
      typeof s.payment_intent === "string"
        ? s.payment_intent
        : s.payment_intent?.id;

    if (pi) {
      try {
        await db.order.create({
          data: {
            amount,
            currency,
            status: "succeeded",
            stripePaymentIntentId: pi,
            mode: mode ?? "payment",
            userId: user?.id,
          },
        });
        console.log("✅ Order insertada para PI:", pi);
      } catch (e: any) {
        console.warn(
          "⚠️ Posible duplicado, no se insertó PI:",
          pi,
          e?.message
        );
      }
    } else {
      console.warn("⚠️ Sin payment_intent (probable suscripción). El cobro vendrá en invoice.paid.");
    }

    console.log("Pago TEST OK:", s.id);
  }

  // ----------------------------------------------
  // 2) customer.subscription.created / updated
  //    → mantener tabla Subscription sincronizada
  // ----------------------------------------------
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const sub = event.data.object as Stripe.Subscription;

    const customerId =
      typeof sub.customer === "string"
        ? sub.customer
        : sub.customer?.id;

    if (!customerId) {
      console.warn("⚠️ Subscription sin customerId.");
      return NextResponse.json({ received: true });
    }

    const user = await db.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.warn(
        "⚠️ No se encontró User para stripeCustomerId:",
        customerId
      );
      return NextResponse.json({ received: true });
    }

    const currentPeriodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : new Date();

    try {
      await db.subscription.upsert({
        where: { stripeSubscriptionId: sub.id },
        create: {
          userId: user.id,
          stripeSubscriptionId: sub.id,
          status: sub.status ?? "incomplete",
          currentPeriodEnd,
        },
        update: {
          status: sub.status ?? "incomplete",
          currentPeriodEnd,
        },
      });

      console.log(
        "✅ Subscription sync:",
        sub.id,
        "status:",
        sub.status,
        "user:",
        user.email
      );
    } catch (e: any) {
      console.error("❌ Error upsert Subscription:", e?.message);
    }
  }

  // --------------------------------
  // 3) invoice.paid
  //    → registrar cobros de la suscripción como Order
  // --------------------------------
  if (event.type === "invoice.paid") {
    const inv = event.data.object as Stripe.Invoice;

    const customerId =
      typeof inv.customer === "string"
        ? inv.customer
        : inv.customer?.id;

    const paymentIntentId =
      typeof inv.payment_intent === "string"
        ? inv.payment_intent
        : inv.payment_intent?.id;

    const amount = inv.amount_paid ?? inv.amount_due ?? 0;
    const currency = (inv.currency ?? "usd").toLowerCase();

    if (!customerId || !paymentIntentId) {
      console.warn(
        "⚠️ invoice.paid sin customerId o payment_intent:",
        customerId,
        paymentIntentId
      );
      return NextResponse.json({ received: true });
    }

    const user = await db.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.warn(
        "⚠️ invoice.paid: no se encontró User para stripeCustomerId:",
        customerId
      );
      return NextResponse.json({ received: true });
    }

    try {
      await db.order.create({
        data: {
          amount,
          currency,
          status: "succeeded",
          stripePaymentIntentId: paymentIntentId,
          mode: "subscription",
          userId: user.id,
        },
      });

      console.log(
        "✅ Order de suscripción creada desde invoice.paid:",
        paymentIntentId,
        "user:",
        user.email
      );
    } catch (e: any) {
      console.warn(
        "⚠️ Posible duplicado Order (invoice.paid):",
        paymentIntentId,
        e?.message
      );
    }
  }

  return NextResponse.json({ received: true });
}
