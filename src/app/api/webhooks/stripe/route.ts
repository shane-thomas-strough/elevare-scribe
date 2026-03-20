import { NextRequest, NextResponse } from "next/server";

/**
 * Stripe webhook listener. Verifies webhook signature using raw body bytes,
 * then processes three event types:
 *
 * - checkout.session.completed — activates user account, stores customer ID
 * - customer.subscription.updated — syncs subscription_status changes
 * - customer.subscription.deleted — marks subscription as canceled
 *
 * CRITICAL: This route reads the raw request body for signature verification.
 * Stripe requires the exact bytes that were sent — parsed JSON will NOT work.
 */

/** Helper: create a Supabase service-role client, or null if not configured */
async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

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

    const supabase = await getSupabase();

    // ── checkout.session.completed ──────────────────────────────────
    // Fired when a customer completes Stripe Checkout (one-time or subscription).
    // Creates/updates the user record with tier, customer ID, and subscription ID.
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.customer_details?.email;
      const productType = session.metadata?.productType || "pro";
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (email && supabase) {
        await supabase.from("users").upsert(
          {
            email,
            tier: productType,
            stripe_session_id: session.id,
            stripe_customer_id: customerId ?? null,
            stripe_subscription_id: subscriptionId ?? null,
            subscription_status: subscriptionId ? "active" : null,
            activated_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );
      }
    }

    // ── customer.subscription.updated ──────────────────────────────
    // Fired when a subscription changes (renewal, payment failure, plan change).
    // Syncs the subscription_status column to match Stripe's current state.
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;

      if (customerId && supabase) {
        await supabase
          .from("users")
          .update({
            subscription_status: subscription.status,
            stripe_subscription_id: subscription.id,
          })
          .eq("stripe_customer_id", customerId);
      }
    }

    // ── customer.subscription.deleted ──────────────────────────────
    // Fired when a subscription is fully canceled (end of billing period or immediate).
    // Marks the user's subscription as canceled so access can be revoked.
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;

      if (customerId && supabase) {
        await supabase
          .from("users")
          .update({ subscription_status: "canceled" })
          .eq("stripe_customer_id", customerId);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
}
