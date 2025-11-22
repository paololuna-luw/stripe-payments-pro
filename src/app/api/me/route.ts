import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "email requerido" },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({
    where: { email },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
      },
      subscriptions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

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

  const hasLifetimeAccess = user.orders.some(
    (o) => o.status === "succeeded" && o.mode === "payment"
  );

  const hasActiveSubscription = user.subscriptions.some(
    (s) => s.status === "active"
  );

  return NextResponse.json(
    {
      hasLifetimeAccess,
      hasActiveSubscription,
      orders: user.orders,
      subscriptions: user.subscriptions,
    },
    { status: 200 }
  );
}
