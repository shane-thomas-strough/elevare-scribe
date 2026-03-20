import { NextRequest, NextResponse } from "next/server";

/** Map tier names to env var keys for Stripe Price IDs */
const TIER_PRICE_MAP: Record<string, string | undefined> = {
  "founding-artist": process.env.STRIPE_FOUNDING_ARTIST_PRICE_ID,
  "pro-monthly": process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  "pro-annual": process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier, email } = body as { tier?: string; email?: string };

    if (!tier || !TIER_PRICE_MAP[tier]) {
      return NextResponse.json({ error: "Invalid tier selected." }, { status: 400 });
    }

    const priceId = TIER_PRICE_MAP[tier];
    if (!priceId) {
      return NextResponse.json(
        { error: "This plan is not yet available. Please try again later." },
        { status: 503 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payment system is not configured. Please try again later." },
        { status: 503 }
      );
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const isOneTime = tier === "founding-artist";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://elevare-scribe.vercel.app";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionConfig: any = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isOneTime ? "payment" : "subscription",
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/#pricing`,
      metadata: { productType: isOneTime ? "founding-artist" : "pro" },
    };

    if (email) sessionConfig.customer_email = email;

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
