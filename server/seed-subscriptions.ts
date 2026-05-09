import { db } from "./db";
import { subscriptionPlans, marketplaceModules, modulePricing } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedSubscriptionData() {
  console.log("Seeding subscription plans...");

  // Define subscription tiers according to spec
  const tiers = [
    {
      tierCode: "free",
      name: "Free",
      description: "Perfect for getting started with up to 100 members. Includes Donor CRM, Contacts, and Landing Page.",
      minMembers: 0,
      maxMembers: 100,
      baseMonthlyPrice: "0.00",
      baseYearlyPrice: "0.00",
      currency: "GBP",
      isActive: true,
    },
    {
      tierCode: "core",
      name: "Core",
      description: "Essential features for growing organizations with up to 500 members.",
      minMembers: 101,
      maxMembers: 500,
      baseMonthlyPrice: "49.00",
      baseYearlyPrice: "528.00", // 10% discount (12 * 49 * 0.9)
      currency: "GBP",
      isActive: true,
    },
    {
      tierCode: "growth",
      name: "Growth",
      description: "Advanced capabilities for expanding organizations with up to 1,000 members.",
      minMembers: 501,
      maxMembers: 1000,
      baseMonthlyPrice: "99.00",
      baseYearlyPrice: "1069.00", // 10% discount
      currency: "GBP",
      isActive: true,
    },
    {
      tierCode: "scale",
      name: "Scale",
      description: "Comprehensive features for large organizations with up to 3,000 members.",
      minMembers: 1001,
      maxMembers: 3000,
      baseMonthlyPrice: "199.00",
      baseYearlyPrice: "2149.00", // 10% discount
      currency: "GBP",
      isActive: true,
    },
    {
      tierCode: "enterprise",
      name: "Enterprise",
      description: "Full-featured solution for established organizations with up to 5,000 members.",
      minMembers: 3001,
      maxMembers: 5000,
      baseMonthlyPrice: "399.00",
      baseYearlyPrice: "4309.00", // 10% discount
      currency: "GBP",
      isActive: true,
    },
    {
      tierCode: "enterprise_plus",
      name: "Enterprise+",
      description: "Unlimited capacity with premium support for the largest organizations.",
      minMembers: 5001,
      maxMembers: null, // Unlimited
      baseMonthlyPrice: "799.00",
      baseYearlyPrice: "8629.00", // 10% discount
      currency: "GBP",
      isActive: true,
    },
  ];

  // Insert or update tiers
  for (const tier of tiers) {
    const existing = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.tierCode, tier.tierCode)).limit(1);
    
    if (existing.length === 0) {
      await db.insert(subscriptionPlans).values(tier);
      console.log(`Created tier: ${tier.name}`);
    } else {
      await db.update(subscriptionPlans)
        .set({
          name: tier.name,
          description: tier.description,
          minMembers: tier.minMembers,
          maxMembers: tier.maxMembers,
          baseMonthlyPrice: tier.baseMonthlyPrice,
          baseYearlyPrice: tier.baseYearlyPrice,
        })
        .where(eq(subscriptionPlans.tierCode, tier.tierCode));
      console.log(`Updated tier: ${tier.name}`);
    }
  }

  console.log("Subscription plans seeded successfully!");

  // Seed module pricing for marketplace modules
  console.log("Seeding module pricing...");

  const modules = await db.select().from(marketplaceModules);

  // Define default pricing for modules (GBP monthly)
  const modulePrices: Record<string, string> = {
    "events": "25.00",
    "livestream": "25.00",
    "activities": "20.00",
    "volunteer": "15.00",
    "beneficiaries": "15.00",
    "sermons": "20.00",
    "p2p": "25.00",
    "email": "15.00",
    "analytics": "20.00",
    "qr_donations": "10.00",
    "prayer_wall": "0.00", // Free community module
    "prayer_timetable": "0.00", // Free community module
  };

  for (const module of modules) {
    const price = modulePrices[module.moduleKey] || "15.00";
    
    // Check if pricing already exists for this module (GB, monthly)
    const existing = await db.select()
      .from(modulePricing)
      .where(eq(modulePricing.moduleId, module.id))
      .limit(1);
    
    if (existing.length === 0) {
      // Add GBP monthly pricing
      await db.insert(modulePricing).values({
        moduleId: module.id,
        country: "GB",
        currency: "GBP",
        price: price,
        billingPeriod: "monthly",
      });

      // Add GBP yearly pricing (10% discount)
      const yearlyPrice = (parseFloat(price) * 12 * 0.9).toFixed(2);
      await db.insert(modulePricing).values({
        moduleId: module.id,
        country: "GB",
        currency: "GBP",
        price: yearlyPrice,
        billingPeriod: "yearly",
      });

      console.log(`Added pricing for module: ${module.title} (£${price}/mo, £${yearlyPrice}/yr)`);
    }
  }

  console.log("Module pricing seeded successfully!");
}
