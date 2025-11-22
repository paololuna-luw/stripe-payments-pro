import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { PrismaClient } from "@prisma/client";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = new PrismaClient();

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

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;

    // Para PAGO ÚNICO viene payment_intent; para suscripciones no.
    const pi =
      typeof s.payment_intent === "string"
        ? s.payment_intent
        : s.payment_intent?.id;

    const amount = s.amount_total ?? 0;
    const currency = (s.currency ?? "usd").toLowerCase();

    console.log("→ session:", { id: s.id, pi, amount, currency });

    if (pi) {
      try {
        await db.order.create({
          data: {
            amount,
            currency,
            status: "succeeded",
            stripePaymentIntentId: pi,
          },
        });
        console.log("✅ Order insertada para PI:", pi);
      } catch (e: any) {
        console.warn("⚠️ Posible duplicado, no se insertó PI:", pi, e?.message);
      }
    } else {
      console.warn("⚠️ Sin payment_intent (probable suscripción).");
      // Nota: para suscripción, escucha invoice.paid y crea Order allí.
    }

    console.log("Pago TEST OK:", s.id);
  }

  return NextResponse.json({ received: true });
}
