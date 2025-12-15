import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const mode = body?.mode as "payment" | "subscription" | undefined;
    const email = body?.email as string | undefined;
    const userId = body?.userId as string | undefined;

    if (!mode || !["payment", "subscription"].includes(mode)) {
      return NextResponse.json({ error: "mode invalido" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "email requerido" }, { status: 400 });
    }

    const price =
      mode === "subscription"
        ? process.env.STRIPE_PRICE_SUB_MONTHLY
        : process.env.STRIPE_PRICE_ONE_TIME;

    if (!price) {
      return NextResponse.json(
        { error: "PRICE no configurado" },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json(
        { error: "APP_URL no configurado" },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("app_users")
      .upsert(
        [
          {
            id: userId ?? undefined,
            email,
          },
        ],
        { onConflict: "email" }
      );

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=1`,
      customer_email: email,
      metadata: {
        appUserEmail: email,
        appUserId: userId ?? "",
        appMode: mode,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "No se genero URL de Checkout" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (e: any) {
    console.error("Checkout error:", e);
    return NextResponse.json(
        { error: e?.message ?? "Error inesperado" },
        { status: 500 }
      );
  }
}
