/**
 * Stripe SDK accepts any non-empty string at construction time; real API calls need a
 * valid key from the Dashboard. Do not put `sk_test_...` or `sk_live_...` literals here
 * — GitHub push protection treats those as secrets even when they are fake.
 */
const DEV_PLACEHOLDER_SECRET =
  "plegit_dev_no_stripe_key_set_add_STRIPE_SECRET_KEY_to_env";

let devPlaceholderWarned = false;

export function isStripeApiConfigured(): boolean {
  const raw = process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
  return typeof raw === "string" && raw.trim().length > 0;
}

export function resolveStripeSecretKey(): string {
  const trimmed =
    process.env.TESTING_STRIPE_SECRET_KEY?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim();
  if (trimmed) return trimmed;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing Stripe secret: set STRIPE_SECRET_KEY (or TESTING_STRIPE_SECRET_KEY for tests) before running in production.",
    );
  }

  if (!devPlaceholderWarned) {
    devPlaceholderWarned = true;
    console.warn(
      "[Plegit] STRIPE_SECRET_KEY is not set — using a development placeholder so the server can boot. Add a Stripe test secret to .env for real Checkout and webhooks.",
    );
  }

  return DEV_PLACEHOLDER_SECRET;
}
