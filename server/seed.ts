import { storage } from "./storage";
import bcrypt from "bcryptjs";

// Use paths that will be accessible from the frontend
const educationImage = "/attached_assets/generated_images/Education_campaign_impact_photo_8d1f19fe.png";
const foodImage = "/attached_assets/generated_images/Food_relief_campaign_photo_c3a323f5.png";
const housingImage = "/attached_assets/generated_images/Housing_campaign_construction_photo_51f8402d.png";
const heroImage = "/attached_assets/generated_images/Community_faith_gathering_hero_1955183e.png";

// Ensure default platform admin user exists
export async function ensureDefaultPlatformAdmin() {
  const adminEmail = "Nadeem.mohammed@deffinity.com";
  const adminPassword = "Nadeem123#!";
  
  try {
    // Check if admin user already exists
    const existingUser = await storage.getUserByEmail(adminEmail);
    
    if (existingUser) {
      // User exists, ensure they have eco_admin role and password is set
      if (existingUser.role !== "eco_admin" || !existingUser.passwordHash) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await storage.updateUser(existingUser.id, {
          role: "eco_admin",
          passwordHash: passwordHash,
          orgId: null, // Eco admins don't belong to organizations
        });
        console.log(`✅ Updated existing user ${adminEmail} to eco_admin with password`);
      } else {
        console.log(`✅ Admin user ${adminEmail} already exists with correct role`);
      }
      return;
    }
    
    // Create new admin user
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await storage.createUser({
      email: adminEmail,
      firstName: "Nadeem",
      lastName: "Mohammed",
      role: "eco_admin",
      passwordHash: passwordHash,
      orgId: null, // Eco admins don't belong to organizations
      emailOptedOut: false,
    });
    
    console.log(`✅ Created default platform admin user: ${adminEmail}`);
  } catch (error) {
    console.error("❌ Failed to ensure default platform admin:", error);
    throw error;
  }
}

export async function seedData() {
  console.log("Seeding initial data...");

  // Check if organization already exists
  let demoOrg = await storage.getOrganizationBySlug("hope-community");
  
  if (!demoOrg) {
    // Create demo organization
    demoOrg = await storage.createOrganization({
      name: "Hope Community Church",
      slug: "hope-community",
      email: "contact@hopecommunitychurch.org",
      phone: "+1 (555) 123-4567",
      primaryColor: "#00BCD4",
      settings: {},
    });
    console.log("Created organization:", demoOrg.name);
  } else {
    console.log("Organization already exists:", demoOrg.name);
  }

  // Check if campaigns already exist
  const existingCampaigns = await storage.listCampaigns(demoOrg.id);
  let campaigns;
  
  if (existingCampaigns.length === 0) {
    // Create campaigns
    campaigns = await Promise.all([
      storage.createCampaign({
      orgId: demoOrg.id,
      title: "Education for All Children",
      description: "Help us provide quality education and school supplies to children in underserved communities. Your donation makes a lasting impact on young lives.",
      imageUrl: educationImage,
      goalAmount: "75000",
      category: "Education",
      status: "active",
    }),
    storage.createCampaign({
      orgId: demoOrg.id,
      title: "Food Relief Program",
      description: "Support families in need with nutritious meals and grocery assistance. Together, we can ensure no one in our community goes hungry.",
      imageUrl: foodImage,
      goalAmount: "50000",
      category: "Relief",
      status: "active",
    }),
    storage.createCampaign({
      orgId: demoOrg.id,
      title: "Build Homes for Families",
      description: "Partner with us to construct safe, affordable housing for families experiencing homelessness. Every contribution brings us closer to providing shelter and hope.",
      imageUrl: housingImage,
      goalAmount: "100000",
      category: "Housing",
      status: "active",
      }),
    ]);
    console.log(`Created ${campaigns.length} campaigns`);
  } else {
    campaigns = existingCampaigns;
    console.log(`Campaigns already exist: ${campaigns.length} campaigns`);
  }

  // Check if donors already exist
  const existingDonors = await storage.listDonors(demoOrg.id);
  let donors;
  
  if (existingDonors.length === 0) {
    // Create some sample donors
    donors = await Promise.all([
      storage.createDonor({
      orgId: demoOrg.id,
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.j@email.com",
      phone: "+1 (555) 234-5678",
      tier: "gold",
    }),
    storage.createDonor({
      orgId: demoOrg.id,
      firstName: "Michael",
      lastName: "Chen",
      email: "m.chen@email.com",
      tier: "silver",
    }),
    storage.createDonor({
      orgId: demoOrg.id,
      firstName: "Emily",
      lastName: "Rodriguez",
      email: "emily.r@email.com",
      phone: "+1 (555) 345-6789",
      tier: "bronze",
      }),
    ]);
    console.log(`Created ${donors.length} donors`);
  } else {
    donors = existingDonors;
    console.log(`Donors already exist: ${donors.length} donors`);
  }

  // Check if donations already exist
  const existingDonations = await storage.listDonations(demoOrg.id);
  
  if (existingDonations.length === 0) {
    // Create sample donations
    await storage.createDonation({
      orgId: demoOrg.id,
      campaignId: campaigns[0].id,
      donorId: donors[0].id,
      amount: "500",
      status: "completed",
      donorEmail: donors[0].email,
      donorName: `${donors[0].firstName} ${donors[0].lastName}`,
    });

    await storage.createDonation({
      orgId: demoOrg.id,
      campaignId: campaigns[1].id,
      donorId: donors[1].id,
      amount: "250",
      status: "completed",
      donorEmail: donors[1].email,
      donorName: `${donors[1].firstName} ${donors[1].lastName}`,
    });

    await storage.createDonation({
      orgId: demoOrg.id,
      campaignId: campaigns[0].id,
      donorId: donors[2].id,
      amount: "100",
      status: "completed",
      donorEmail: donors[2].email,
      donorName: `${donors[2].firstName} ${donors[2].lastName}`,
    });
    console.log("Created sample donations");
  } else {
    console.log(`Donations already exist: ${existingDonations.length} donations`);
  }

  // Check if events already exist
  const existingEvents = await storage.listEvents(demoOrg.id);
  
  if (existingEvents.length === 0) {
    // Create sample event
    await storage.createEvent({
      orgId: demoOrg.id,
      title: "Community Thanksgiving Dinner",
      description: "Join us for a community thanksgiving dinner featuring a traditional meal, fellowship, and celebration.",
      imageUrl: heroImage,
      date: new Date("2025-11-23"),
      time: "6:00 PM - 9:00 PM",
      location: "Hope Community Church, 123 Main St",
      capacity: 200,
      price: "0",
      status: "upcoming",
    });
    console.log("Created sample event");
  } else {
    console.log(`Events already exist: ${existingEvents.length} events`);
  }

  // Seed marketplace modules (idempotent - checks for each module individually)
  const modulesToSeed = [
    {
      moduleKey: "events",
      title: "Events & Ticketing",
      description: "Manage events, sell tickets, and track attendees with integrated payments",
      isDefault: false,
    },
    {
      moduleKey: "livestream",
      title: "Livestream Overlays",
      description: "Display real-time donation overlays during livestreams with customizable alerts",
      isDefault: false,
    },
    {
      moduleKey: "volunteer_management",
      title: "Volunteer Management",
      description: "Comprehensive volunteer tracking and management system. Track volunteer profiles, skills, availability, assignments, hours, certifications, and communication.",
      isDefault: false,
    },
    {
      moduleKey: "beneficiaries",
      title: "Beneficiary Management",
      description: "Comprehensive system to track individuals and organizations receiving support. Maintain detailed profiles including personal information, health records, needs assessment, and communication history.",
      isDefault: false,
    },
    {
      moduleKey: "activities",
      title: "Activities & Classes",
      description: "Manage educational programs, workshops, and recurring classes with scheduling, capacity limits, and attendance tracking",
      isDefault: false,
    },
    {
      moduleKey: "prayer_timetable",
      title: "Muslim Prayer Timetable",
      description: "Display accurate Islamic prayer times on your dashboard based on your organization's location. Supports multiple calculation methods and automatic daily updates.",
      isDefault: false,
    },
    {
      moduleKey: "sermon_library",
      title: "Sermon Library",
      description: "Build a searchable library of sermons with YouTube/Vimeo/Facebook integration, categories, tags, AI-powered descriptions, and view tracking.",
      isDefault: false,
    },
    {
      moduleKey: "contacts",
      title: "CRM & Contacts",
      description: "Manage relationships with contact profiles, tagging, activity tracking, and advanced filtering for better engagement.",
      isDefault: true,
    },
    {
      moduleKey: "donors",
      title: "Donor Management",
      description: "Track and manage your donor relationships, contact information, and giving history with comprehensive profiles and analytics.",
      isDefault: true,
    },
    {
      moduleKey: "fundraising",
      title: "Fundraising",
      description: "Create and manage fundraising campaigns with QR codes and online donations",
      isDefault: false,
    },
    {
      moduleKey: "prayer_wall",
      title: "Prayer Wall",
      description: "Enable a public prayer wall where community members can submit prayer requests and pray for each other. Features AI-powered content moderation to ensure appropriate content.",
      isDefault: false,
    },
    {
      moduleKey: "email_builder",
      title: "Email Builder & Campaigns",
      description: "Create professional email campaigns with a drag-and-drop builder, schedule sends, track opens and clicks, and manage subscribers with GDPR-compliant tools.",
      isDefault: false,
    },
    {
      moduleKey: "p2p",
      title: "Peer-to-Peer Fundraising",
      description: "Enable supporters to create personal fundraising pages for your campaigns. Includes participant management, invitations, milestone emails, chat room, leaderboard, gamification badges, and document library.",
      isDefault: false,
    },
    {
      moduleKey: "landing_page",
      title: "Landing Page",
      description: "Customize your public-facing landing page with banners, content sections, and module ordering to showcase your organization.",
      isDefault: true,
    },
    {
      moduleKey: "donations",
      title: "Donations",
      description: "Process and manage all donations with automated receipts, thank-you emails, journal tracking, and comprehensive donor communication.",
      isDefault: true,
    },
  ];

  let modulesCreated = 0;
  let modulesSkipped = 0;

  for (const moduleData of modulesToSeed) {
    const existingModule = await storage.getMarketplaceModuleByKey(moduleData.moduleKey);
    if (!existingModule) {
      await storage.createMarketplaceModule({
        moduleKey: moduleData.moduleKey,
        title: moduleData.title,
        description: moduleData.description,
        imageUrl: null,
        isDefault: moduleData.isDefault,
        isActive: true,
      });
      modulesCreated++;
    } else {
      modulesSkipped++;
    }
  }

  if (modulesCreated > 0) {
    console.log(`Created ${modulesCreated} marketplace modules`);
  }
  if (modulesSkipped > 0) {
    console.log(`Skipped ${modulesSkipped} existing marketplace modules`);
  }

  // Seed subscription plans (5 tiers - all modules included)
  const subscriptionPlans = [
    {
      tierCode: "starter",
      name: "Starter",
      description: "Perfect for small organizations just getting started with up to 100 members. All modules included.",
      minMembers: 1,
      maxMembers: 100,
      baseMonthlyPrice: "39.00",
      baseYearlyPrice: "390.00", // 10% discount: 39 * 12 * 0.9
      currency: "GBP",
      stripeMonthlyPriceId: null,
      stripeYearlyPriceId: null,
      stripeProductId: null,
      isActive: true,
    },
    {
      tierCode: "core",
      name: "Core",
      description: "Great for growing faith communities with up to 500 members. All modules included.",
      minMembers: 101,
      maxMembers: 500,
      baseMonthlyPrice: "79.00",
      baseYearlyPrice: "790.00", // 10% discount: 79 * 12 * 0.9
      currency: "GBP",
      stripeMonthlyPriceId: null,
      stripeYearlyPriceId: null,
      stripeProductId: null,
      isActive: true,
    },
    {
      tierCode: "growth",
      name: "Growth",
      description: "Built for established organizations with up to 1,000 members. All modules included.",
      minMembers: 501,
      maxMembers: 1000,
      baseMonthlyPrice: "129.00",
      baseYearlyPrice: "1290.00", // 10% discount: 129 * 12 * 0.9
      currency: "GBP",
      stripeMonthlyPriceId: null,
      stripeYearlyPriceId: null,
      stripeProductId: null,
      isActive: true,
    },
    {
      tierCode: "scale",
      name: "Scale",
      description: "Designed for large faith-based organizations with 1,001-3,000 members. All modules included.",
      minMembers: 1001,
      maxMembers: 3000,
      baseMonthlyPrice: "199.00",
      baseYearlyPrice: "1990.00", // 10% discount: 199 * 12 * 0.9
      currency: "GBP",
      stripeMonthlyPriceId: null,
      stripeYearlyPriceId: null,
      stripeProductId: null,
      isActive: true,
    },
    {
      tierCode: "enterprise",
      name: "Enterprise",
      description: "For the largest organizations with 3,001+ members and unlimited support. All modules included.",
      minMembers: 3001,
      maxMembers: null, // Unlimited
      baseMonthlyPrice: "299.00",
      baseYearlyPrice: "2990.00", // 10% discount: 299 * 12 * 0.9
      currency: "GBP",
      stripeMonthlyPriceId: null,
      stripeYearlyPriceId: null,
      stripeProductId: null,
      isActive: true,
    },
  ];

  let plansCreated = 0;
  let plansSkipped = 0;

  const existingPlans = await storage.listSubscriptionPlans(false);
  
  for (const plan of subscriptionPlans) {
    const existing = existingPlans.find(p => p.tierCode === plan.tierCode);
    if (!existing) {
      await storage.createSubscriptionPlan(plan);
      plansCreated++;
    } else {
      plansSkipped++;
    }
  }

  if (plansCreated > 0) {
    console.log(`Created ${plansCreated} subscription plans`);
  }
  if (plansSkipped > 0) {
    console.log(`Skipped ${plansSkipped} existing subscription plans`);
  }

  // Seed default UK country pricing (optional - Eco Admins can customize per country)
  const ukCountryPricing = [
    {
      countryCode: "GB",
      currency: "GBP",
      tierCode: "starter",
      monthlyPrice: "39.00",
      yearlyPrice: "390.00",
      vatRate: "20.00",
      roundingRule: "none",
      stripeMonthlyPriceId: null,
      stripeYearlyPriceId: null,
      createdByAdminId: null,
    },
    {
      countryCode: "GB",
      currency: "GBP",
      tierCode: "core",
      monthlyPrice: "79.00",
      yearlyPrice: "790.00",
      vatRate: "20.00",
      roundingRule: "none",
      stripeMonthlyPriceId: null,
      stripeYearlyPriceId: null,
      createdByAdminId: null,
    },
    {
      countryCode: "GB",
      currency: "GBP",
      tierCode: "growth",
      monthlyPrice: "129.00",
      yearlyPrice: "1290.00",
      vatRate: "20.00",
      roundingRule: "none",
      stripeMonthlyPriceId: null,
      stripeYearlyPriceId: null,
      createdByAdminId: null,
    },
    {
      countryCode: "GB",
      currency: "GBP",
      tierCode: "scale",
      monthlyPrice: "199.00",
      yearlyPrice: "1990.00",
      vatRate: "20.00",
      roundingRule: "none",
      stripeMonthlyPriceId: null,
      stripeYearlyPriceId: null,
      createdByAdminId: null,
    },
    {
      countryCode: "GB",
      currency: "GBP",
      tierCode: "enterprise",
      monthlyPrice: "299.00",
      yearlyPrice: "2990.00",
      vatRate: "20.00",
      roundingRule: "none",
      stripeMonthlyPriceId: null,
      stripeYearlyPriceId: null,
      createdByAdminId: null,
    },
  ];

  let countryPricingCreated = 0;
  let countryPricingSkipped = 0;

  for (const pricing of ukCountryPricing) {
    const existing = await storage.getCountryPricingByCountryAndTier(pricing.countryCode, pricing.tierCode);
    if (!existing) {
      await storage.createCountryPricing(pricing);
      countryPricingCreated++;
    } else {
      countryPricingSkipped++;
    }
  }

  if (countryPricingCreated > 0) {
    console.log(`Created ${countryPricingCreated} UK country pricing records`);
  }
  if (countryPricingSkipped > 0) {
    console.log(`Skipped ${countryPricingSkipped} existing UK country pricing records`);
  }

  console.log("Seed data complete!");
  return demoOrg;
}
