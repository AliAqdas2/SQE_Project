import Stripe from "stripe";
import { resolveStripeSecretKey, isStripeApiConfigured } from "./stripeConfig";
import { storage } from "./storage";

const stripe = new Stripe(resolveStripeSecretKey(), {
  apiVersion: "2024-12-18.acacia" as any,
});

interface SubscriptionTier {
  tierCode: string;
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  currency: string;
}

export class StripeSubscriptionService {
  async createOrUpdateProductsAndPrices(): Promise<void> {
    if (!isStripeApiConfigured()) {
      console.warn(
        "[StripeSubscription] Skipping createOrUpdateProductsAndPrices — STRIPE_SECRET_KEY not set.",
      );
      return;
    }

    const plans = await storage.listSubscriptionPlans(true);

    for (const plan of plans) {
      console.log(`Processing Stripe product for tier: ${plan.tierCode}`);

      let product: Stripe.Product;
      const expectedProductMetadata = {
        tierCode: plan.tierCode,
        minMembers: plan.minMembers.toString(),
        maxMembers: plan.maxMembers?.toString() || "unlimited",
      };
      const expectedProductName = `${plan.name} Plan`;
      const expectedProductDescription = plan.description;

      if (plan.stripeProductId) {
        product = await stripe.products.retrieve(plan.stripeProductId);
        
        const needsUpdate = 
          product.name !== expectedProductName ||
          product.description !== expectedProductDescription ||
          JSON.stringify(product.metadata) !== JSON.stringify(expectedProductMetadata);

        if (needsUpdate) {
          product = await stripe.products.update(plan.stripeProductId, {
            name: expectedProductName,
            description: expectedProductDescription,
            metadata: expectedProductMetadata,
          });
          console.log(`Updated product metadata: ${product.id}`);
        } else {
          console.log(`Product metadata is current: ${product.id}`);
        }
      } else {
        product = await stripe.products.create({
          name: expectedProductName,
          description: expectedProductDescription,
          metadata: expectedProductMetadata,
        });
        console.log(`Created new product: ${product.id}`);
      }

      let monthlyPrice: Stripe.Price;
      const expectedMonthlyAmount = Math.round(parseFloat(plan.baseMonthlyPrice) * 100);
      const expectedCurrency = plan.currency.toLowerCase();
      
      if (plan.stripeMonthlyPriceId) {
        const existingMonthlyPrice = await stripe.prices.retrieve(plan.stripeMonthlyPriceId);
        
        const needsPriceUpdate = 
          existingMonthlyPrice.unit_amount !== expectedMonthlyAmount ||
          existingMonthlyPrice.currency !== expectedCurrency ||
          existingMonthlyPrice.recurring?.interval !== "month";
        
        if (needsPriceUpdate) {
          await stripe.prices.update(plan.stripeMonthlyPriceId, { active: false });
          console.log(`Deactivated outdated monthly price: ${plan.stripeMonthlyPriceId} (amount: ${existingMonthlyPrice.unit_amount}, currency: ${existingMonthlyPrice.currency})`);
          
          monthlyPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: expectedMonthlyAmount,
            currency: expectedCurrency,
            recurring: { interval: "month" },
            metadata: {
              tierCode: plan.tierCode,
              billingCycle: "monthly",
            },
          });
          console.log(`Created new monthly price with updated config: ${monthlyPrice.id} (amount: ${expectedMonthlyAmount}, currency: ${expectedCurrency})`);
        } else {
          monthlyPrice = existingMonthlyPrice;
          console.log(`Existing monthly price is current: ${monthlyPrice.id}`);
        }
      } else {
        monthlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: expectedMonthlyAmount,
          currency: plan.currency.toLowerCase(),
          recurring: { interval: "month" },
          metadata: {
            tierCode: plan.tierCode,
            billingCycle: "monthly",
          },
        });
        console.log(`Created monthly price: ${monthlyPrice.id}`);
      }

      let yearlyPrice: Stripe.Price;
      const expectedYearlyAmount = Math.round(parseFloat(plan.baseYearlyPrice) * 100);
      
      if (plan.stripeYearlyPriceId) {
        const existingYearlyPrice = await stripe.prices.retrieve(plan.stripeYearlyPriceId);
        
        const needsPriceUpdate = 
          existingYearlyPrice.unit_amount !== expectedYearlyAmount ||
          existingYearlyPrice.currency !== expectedCurrency ||
          existingYearlyPrice.recurring?.interval !== "year";
        
        if (needsPriceUpdate) {
          await stripe.prices.update(plan.stripeYearlyPriceId, { active: false });
          console.log(`Deactivated outdated yearly price: ${plan.stripeYearlyPriceId} (amount: ${existingYearlyPrice.unit_amount}, currency: ${existingYearlyPrice.currency})`);
          
          yearlyPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: expectedYearlyAmount,
            currency: expectedCurrency,
            recurring: { interval: "year" },
            metadata: {
              tierCode: plan.tierCode,
              billingCycle: "yearly",
            },
          });
          console.log(`Created new yearly price with updated config: ${yearlyPrice.id} (amount: ${expectedYearlyAmount}, currency: ${expectedCurrency})`);
        } else {
          yearlyPrice = existingYearlyPrice;
          console.log(`Existing yearly price is current: ${yearlyPrice.id}`);
        }
      } else {
        yearlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: expectedYearlyAmount,
          currency: plan.currency.toLowerCase(),
          recurring: { interval: "year" },
          metadata: {
            tierCode: plan.tierCode,
            billingCycle: "yearly",
          },
        });
        console.log(`Created yearly price: ${yearlyPrice.id}`);
      }

      await storage.updateSubscriptionPlan(plan.id, {
        stripeProductId: product.id,
        stripeMonthlyPriceId: monthlyPrice.id,
        stripeYearlyPriceId: yearlyPrice.id,
      });

      console.log(`Updated plan ${plan.tierCode} with Stripe IDs`);
    }

    console.log("Stripe products and prices sync complete!");
  }

  async createCountryPrices(countryCode: string, tierCode: string): Promise<void> {
    if (!isStripeApiConfigured()) {
      console.warn(
        `[StripeSubscription] Skipping createCountryPrices(${countryCode}, ${tierCode}) — STRIPE_SECRET_KEY not set.`,
      );
      return;
    }

    const countryPricing = await storage.getCountryPricingByCountryAndTier(countryCode, tierCode);
    if (!countryPricing) {
      throw new Error(`Country pricing not found for ${countryCode} - ${tierCode}`);
    }

    const plan = await storage.listSubscriptionPlans(true).then((plans) =>
      plans.find((p) => p.tierCode === tierCode)
    );
    if (!plan || !plan.stripeProductId) {
      throw new Error(`Plan not found or missing Stripe product ID for tier: ${tierCode}`);
    }

    if (countryPricing.stripeMonthlyPriceId) {
      const monthlyPrice = await stripe.prices.retrieve(countryPricing.stripeMonthlyPriceId);
      console.log(`Found existing monthly price: ${monthlyPrice.id}`);
    } else {
      const monthlyPrice = await stripe.prices.create({
        product: plan.stripeProductId,
        unit_amount: Math.round(parseFloat(countryPricing.monthlyPrice) * 100),
        currency: countryPricing.currency.toLowerCase(),
        recurring: {
          interval: "month",
        },
        metadata: {
          tierCode,
          countryCode,
          billingCycle: "monthly",
        },
      });

      await storage.updateCountryPricing(countryPricing.id, {
        stripeMonthlyPriceId: monthlyPrice.id,
      });
      console.log(`Created monthly price for ${countryCode}: ${monthlyPrice.id}`);
    }

    if (countryPricing.stripeYearlyPriceId) {
      const yearlyPrice = await stripe.prices.retrieve(countryPricing.stripeYearlyPriceId);
      console.log(`Found existing yearly price: ${yearlyPrice.id}`);
    } else {
      const yearlyPrice = await stripe.prices.create({
        product: plan.stripeProductId,
        unit_amount: Math.round(parseFloat(countryPricing.yearlyPrice) * 100),
        currency: countryPricing.currency.toLowerCase(),
        recurring: {
          interval: "year",
        },
        metadata: {
          tierCode,
          countryCode,
          billingCycle: "yearly",
        },
      });

      await storage.updateCountryPricing(countryPricing.id, {
        stripeYearlyPriceId: yearlyPrice.id,
      });
      console.log(`Created yearly price for ${countryCode}: ${yearlyPrice.id}`);
    }
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Subscription> {
    if (!isStripeApiConfigured()) {
      throw new Error("Stripe subscription API is disabled: set STRIPE_SECRET_KEY.");
    }
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata,
    });

    return subscription;
  }

  async getOrCreateCustomer(email: string, orgId: string, orgName: string): Promise<Stripe.Customer> {
    if (!isStripeApiConfigured()) {
      throw new Error("Stripe customer API is disabled: set STRIPE_SECRET_KEY.");
    }
    const org = await storage.getOrganization(orgId);
    if (org?.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(org.stripeCustomerId);
        if (!customer.deleted) {
          return customer as Stripe.Customer;
        }
      } catch (error) {
        console.error(`Error retrieving Stripe customer: ${error}`);
      }
    }

    const customer = await stripe.customers.create({
      email,
      name: orgName,
      metadata: {
        orgId,
      },
    });

    await storage.updateOrganization(orgId, {
      stripeCustomerId: customer.id,
    });

    return customer;
  }

  async updateSubscription(subscriptionId: string, priceId: string): Promise<Stripe.Subscription> {
    if (!isStripeApiConfigured()) {
      throw new Error("Stripe subscription API is disabled: set STRIPE_SECRET_KEY.");
    }
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const currentItem = subscription.items.data[0];

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: currentItem.id,
          price: priceId,
        },
      ],
      proration_behavior: "create_prorations",
    });

    return updatedSubscription;
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    if (!isStripeApiConfigured()) {
      throw new Error("Stripe subscription API is disabled: set STRIPE_SECRET_KEY.");
    }
    return await stripe.subscriptions.cancel(subscriptionId);
  }

  getStripe(): Stripe {
    return stripe;
  }
}

export const stripeSubscriptionService = new StripeSubscriptionService();
