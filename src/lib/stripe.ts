import Stripe from "stripe";

/**
 * Server-side Stripe client. Only import this in API routes — never in
 * client components. STRIPE_SECRET_KEY must be set in environment.
 *
 * @remarks This module throws at import time if STRIPE_SECRET_KEY is missing,
 * but API routes dynamically import Stripe to avoid this during build.
 */
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "STRIPE_SECRET_KEY is not set. Add it to .env.local — see .env.example for details."
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
