import { NextRequest, NextResponse } from "next/server";

/**
 * Stripe webhook listener. Verifies webhook signature using raw body bytes,
 * then processes checkout.session.completed events to activate user accounts.
 *
 * CRITICAL: This route reads the raw request body for signature verification.
 * Stripe requires the exact bytes that were sent — parsed JSON will NOT work.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe environment variables not configured for webhooks");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await request.text();

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.customer_details?.email;
      const productType = session.metadata?.productType || "pro";
      const sessionId = session.id;

      if (email) {
        // Upsert user in Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });

          await supabase.from("users").upsert(
            {
              email,
              tier: productType,
              stripe_session_id: sessionId,
              activated_at: new Date().toISOString(),
            },
            { onConflict: "email" }
          );
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
}
