import { Router, type IRouter, type Request } from "express";
import { getUncachableStripeClient } from "../stripeClient";
import { getUserId } from "../lib/auth";

const router: IRouter = Router();
const PREMIUM_LOOKUP_KEY = "ai_video_generation_premium_monthly";

async function getOrCreateCustomer(stripe: Awaited<ReturnType<typeof getUncachableStripeClient>>, userId: string) {
  const existing = await stripe.customers.search({
    query: `metadata['clerkUserId']:'${userId.replace(/'/g, "\\'")}'`,
    limit: 1,
  });

  if (existing.data[0]) return existing.data[0];

  return stripe.customers.create({
    metadata: { clerkUserId: userId },
  });
}

export async function getPremiumState(userId: string) {
  const stripe = await getUncachableStripeClient();
  const customers = await stripe.customers.search({
    query: `metadata['clerkUserId']:'${userId.replace(/'/g, "\\'")}'`,
    limit: 10,
  });

  for (const customer of customers.data) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 20,
    });
    const activeSubscription = subscriptions.data.find(
      (subscription) => subscription.status === "active" || subscription.status === "trialing",
    );

    if (activeSubscription) {
      return {
        active: true,
        customerId: customer.id,
        subscriptionId: activeSubscription.id,
        status: activeSubscription.status,
        currentPeriodEnd: activeSubscription.items.data[0]?.current_period_end ?? null,
      };
    }
  }

  return { active: false, customerId: customers.data[0]?.id ?? null };
}

router.get("/premium/access", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Sign in required" });

  try {
    res.json(await getPremiumState(userId));
  } catch (error) {
    req.log.error({ err: error }, "Failed to read premium access");
    res.status(502).json({ error: "Premium status unavailable" });
  }
});

router.post("/premium/checkout", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Sign in required" });

  try {
    const stripe = await getUncachableStripeClient();
    const prices = await stripe.prices.list({
      lookup_keys: [PREMIUM_LOOKUP_KEY],
      active: true,
      limit: 1,
    });
    const price = prices.data[0];
    if (!price) return res.status(503).json({ error: "Premium plan is not configured" });

    const customer = await getOrCreateCustomer(stripe, userId);
    const origin = `${req.protocol}://${req.get("host")}`;
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${origin}/studio?premium=success`,
      cancel_url: `${origin}/studio?premium=cancelled`,
      metadata: { clerkUserId: userId, feature: "ai_video_generation" },
      subscription_data: {
        metadata: { clerkUserId: userId, feature: "ai_video_generation" },
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    req.log.error({ err: error }, "Failed to create premium checkout");
    res.status(502).json({ error: "Checkout unavailable" });
  }
});

router.post("/premium/portal", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Sign in required" });

  try {
    const stripe = await getUncachableStripeClient();
    const state = await getPremiumState(userId);
    if (!state.customerId) return res.status(404).json({ error: "No billing account found" });

    const origin = `${req.protocol}://${req.get("host")}`;
    const session = await stripe.billingPortal.sessions.create({
      customer: state.customerId,
      return_url: `${origin}/studio`,
    });
    res.json({ url: session.url });
  } catch (error) {
    req.log.error({ err: error }, "Failed to create billing portal session");
    res.status(502).json({ error: "Billing portal unavailable" });
  }
});

export default router;
