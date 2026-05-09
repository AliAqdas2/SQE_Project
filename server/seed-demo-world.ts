/**
 * Rich demo dataset for local / QA testing: organizations with admins, fundraisers,
 * donors, donations, events (tickets/registrations/sponsors/speakers), contacts,
 * volunteers, beneficiaries, activities, livestreams, P2P, sermon library, landing
 * page, prayer wall entries, CRM tags, subscription row, campaign strategy stub, etc.
 *
 * Prerequisites:
 *   - DATABASE_URL in .env (Postgres reachable)
 *   - Schema applied (`npm run db:push`)
 *   - Marketplace modules + subscription plans (run once: `npm run db:seed` or start app after db:seed)
 *
 * Usage:
 *   npm run db:seed-demo
 *   npm run db:seed-demo -- --force       # Deletes existing demo orgs by slug then recreates them
 *
 * Login (unless overridden with DEMO_ORG_ADMIN_PASSWORD env):
 *   Org 1 → admin+demo-alpha@plegit.demo / DemoSeed2026!
 *   Org 2 → admin+demo-beta@plegit.demo  / DemoSeed2026!
 *
 * Public-ish references:
 *   /p/demo-alpha-hub   (landing slug)
 *   /p/demo-beta-hub
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import type { Organization } from "@shared/schema";
import {
  organizations,
  prayerRequests,
  sermonTagAssignments,
  memberTagAssignments,
} from "@shared/schema";
import { db, pool } from "./db";
import { defaultFundraisingStrategyJson } from "./openai";
import { seedData } from "./seed";
import { storage } from "./storage";

const ARGS = process.argv.slice(2);
const FORCE_RESET = ARGS.includes("--force");

const ADMIN_PASSWORD =
  process.env.DEMO_ORG_ADMIN_PASSWORD ?? "DemoSeed2026!";

const IMG_EDU = "/attached_assets/generated_images/Education_campaign_impact_photo_8d1f19fe.png";
const IMG_FOOD = "/attached_assets/generated_images/Food_relief_campaign_photo_c3a323f5.png";
const IMG_HOUSE = "/attached_assets/generated_images/Housing_campaign_construction_photo_51f8402d.png";
const IMG_HERO = "/attached_assets/generated_images/Community_faith_gathering_hero_1955183e.png";

const DEMO_ALPHA_SLUG = "demo-alpha-faith";
const DEMO_BETA_SLUG = "demo-beta-charity";

const MODULE_KEYS = [
  "events",
  "livestream",
  "volunteer_management",
  "beneficiaries",
  "activities",
  "prayer_timetable",
  "sermon_library",
  "contacts",
  "donors",
  "fundraising",
  "prayer_wall",
  "email_builder",
  "p2p",
  "landing_page",
  "donations",
] as const;

function qrCode(): string {
  return `QR-${randomBytes(12).toString("hex")}`;
}

async function resetDemoOrganization(slug: string): Promise<void> {
  const org = await storage.getOrganizationBySlug(slug);
  if (!org) return;
  await db.delete(organizations).where(eq(organizations.id, org.id));
  console.log(`  Removed existing org (cascade): ${slug}`);
}

async function ensureMarketplaceBaseline(): Promise<void> {
  const mod = await storage.getMarketplaceModuleByKey("fundraising");
  if (!mod) {
    console.log("📦 Marketplace modules missing — running seedData()…");
    await seedData();
  }
  const plan = await storage.getSubscriptionPlanByTierCode("starter");
  if (!plan) {
    console.log("📦 Subscription plans missing — running seedData()…");
    await seedData();
  }
}

async function subscribeOrg(org: Organization): Promise<void> {
  const existing = await storage.getOrganizationSubscription(org.id);
  if (existing) return;
  const plan = await storage.getSubscriptionPlanByTierCode("growth");
  const fallback = await storage.getSubscriptionPlanByTierCode("starter");
  const chosen = plan ?? fallback;
  if (!chosen) {
    console.warn("  No subscription plan found; skipping organization_subscriptions row.");
    return;
  }
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  await storage.createOrganizationSubscription({
    orgId: org.id,
    planId: chosen.id,
    billingCycle: "monthly",
    memberCount: 48,
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    canceledAt: null,
    trialStart: null,
    trialEnd: null,
    autoUpgradeQueued: false,
    lastRenewalReminderSentAt: null,
    lastRenewalReminderForPeriodEnd: null,
  });
}

async function enableModulesForOrg(orgId: string, adminUserId: string): Promise<void> {
  for (const key of MODULE_KEYS) {
    const mod = await storage.getMarketplaceModuleByKey(key);
    if (!mod) {
      console.warn(`  Module key "${key}" not in DB — run db:seed`);
      continue;
    }
    const existing = await storage.getOrganizationModule(orgId, mod.id);
    if (existing) continue;
    await storage.enableOrganizationModule({
      orgId,
      moduleId: mod.id,
      enabledBy: adminUserId,
      status: "active",
      billingPeriod: "monthly",
      nextBillingDate: null,
    });
  }
}

type OrgSeedSpec = {
  slug: string;
  name: string;
  adminEmail: string;
  landingSlug: string;
  email: string;
  phone: string;
  religion: string;
  country: "GB" | "US";
  currency: "GBP" | "USD";
  city: string;
  street: string;
};

async function seedOneOrg(spec: OrgSeedSpec): Promise<void> {
  if (!FORCE_RESET) {
    const exists = await storage.getOrganizationBySlug(spec.slug);
    if (exists) {
      console.log(`⏭  Skipping ${spec.slug}: already exists (use --force to recreate)`);
      return;
    }
  } else {
    await resetDemoOrganization(spec.slug);
  }

  console.log(`\n▶ Creating org: ${spec.name} (${spec.slug})`);

  const org = await storage.createOrganization({
    name: spec.name,
    slug: spec.slug,
    email: spec.email,
    phone: spec.phone,
    primaryColor: spec.slug === DEMO_ALPHA_SLUG ? "#0284c7" : "#047857",
    religion: spec.religion,
    street: spec.street,
    city: spec.city,
    state: spec.country === "US" ? "CA" : undefined,
    zip: spec.country === "US" ? "94102" : "SW1A 1AA",
    country: spec.country,
    currency: spec.currency,
    timezone: spec.country === "US" ? "America/Los_Angeles" : "Europe/London",
    status: "approved",
    settings: {
      giftAidPercentage: 25,
      demoSeed: true,
    },
  });

  await subscribeOrg(org);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await storage.createUser({
    email: spec.adminEmail,
    firstName: "Demo",
    lastName: "Admin",
    passwordHash,
    role: "org_admin",
    orgId: org.id,
    emailOptedOut: false,
  });

  await enableModulesForOrg(org.id, admin.id);

  const donorTagTotals = new Map<string, { total: number; count: number }>();
  const bumpDonorStats = (donorId: string, amt: number) => {
    const prev = donorTagTotals.get(donorId) ?? { total: 0, count: 0 };
    donorTagTotals.set(donorId, { total: prev.total + amt, count: prev.count + 1 });
  };
  const campaignRaised = new Map<string, number>();

  const donorA = await storage.createDonor({
    orgId: org.id,
    firstName: "Jordan",
    lastName: "Smith",
    email: `donor-jordan.${spec.slug.replace(/-/g, "")}@plegit.demo`,
    phone: "+1 415 555 0101",
    tier: "gold",
  });
  const donorB = await storage.createDonor({
    orgId: org.id,
    firstName: "Priya",
    lastName: "Narasimhan",
    email: `donor-priya.${spec.slug.replace(/-/g, "")}@plegit.demo`,
    tier: "silver",
  });
  const donorC = await storage.createDonor({
    orgId: org.id,
    firstName: "Mateo",
    lastName: "Rossi",
    email: `donor-mateo.${spec.slug.replace(/-/g, "")}@plegit.demo`,
    tier: "bronze",
  });
  const donorD = await storage.createDonor({
    orgId: org.id,
    firstName: "Taylor",
    lastName: "Kim",
    email: `donor-anon-${spec.slug}@plegit.demo`,
    tier: "bronze",
  });

  const campYouth = await storage.createCampaign({
    orgId: org.id,
    title: "Youth Summer Programs",
    description:
      "Scholarships, meals, and safe spaces for young people — seeded for dashboard testing.",
    imageUrl: IMG_EDU,
    goalAmount: "85000",
    category: "Youth",
    status: "active",
    currency: spec.currency,
    quickDonationButtons: [
      { amount: 25, description: "Snack week" },
      { amount: 50, description: "Field trip" },
      { amount: 120, description: "Sponsor-a-week" },
    ],
  });

  const campRelief = await storage.createCampaign({
    orgId: org.id,
    title: "Neighborhood Relief Fund",
    description: "Groceries, rent assistance, and warm clothing referrals.",
    imageUrl: IMG_FOOD,
    goalAmount: "42000",
    category: "Relief",
    status: "active",
    currency: spec.currency,
  });

  const campBuild = await storage.createCampaign({
    orgId: org.id,
    title: "Facility Refresh",
    description: "Kitchen upgrade and accessibility ramps.",
    imageUrl: IMG_HOUSE,
    goalAmount: "120000",
    category: "Capital",
    status: "paused",
    currency: spec.currency,
  });

  await storage.createP2PCampaignSettings({
    campaignId: campYouth.id,
    orgId: org.id,
    isEnabled: true,
    requireApproval: false,
    defaultParticipantGoal: "750",
    welcomeMessage: "Thanks for fundraising with us!",
    participantInstructions: "Share your page after saving.",
  });

  await storage.createCampaignStrategy({
    campaignId: campYouth.id,
    orgId: org.id,
    content: defaultFundraisingStrategyJson() as Record<string, unknown>,
    summary: "Stub strategy JSON for UI testing.",
    insights: { demo: true },
    model: "stub",
    generatedBy: admin.id,
  });

  const p2pslug = `${spec.slug}-p2p-jordan`;
  await storage.createP2PParticipant({
    campaignId: campYouth.id,
    orgId: org.id,
    donorId: donorA.id,
    firstName: donorA.firstName,
    lastName: donorA.lastName,
    email: donorA.email,
    slug: p2pslug,
    goalAmount: "2000",
    bio: "Running a birthday fundraiser for the youth program.",
    status: "active",
    role: "participant",
  });

  /** Donations linked to fundraisers */
  const donationRows: Array<{
    campaignId: string | null;
    donorId: string | null;
    amount: string;
    donorEmail?: string;
    donorName?: string;
    message?: string;
    category?: string;
    stripePaymentId?: string;
    giftAidOptIn?: boolean;
  }> = [
    {
      campaignId: campYouth.id,
      donorId: donorA.id,
      amount: "500",
      donorEmail: donorA.email,
      donorName: `${donorA.firstName} ${donorA.lastName}`,
      message: "In memory of mom — glad to help!",
      category: "general",
      stripePaymentId: `stub_pi_${randomBytes(8).toString("hex")}`,
      giftAidOptIn: spec.country === "GB",
    },
    {
      campaignId: campYouth.id,
      donorId: donorB.id,
      amount: "120",
      donorEmail: donorB.email,
      donorName: `${donorB.firstName} ${donorB.lastName}`,
      category: "general",
      stripePaymentId: `stub_pi_${randomBytes(8).toString("hex")}`,
    },
    {
      campaignId: campRelief.id,
      donorId: donorC.id,
      amount: "75.5",
      donorEmail: donorC.email,
      donorName: `${donorC.firstName} ${donorC.lastName}`,
      category: "sadaqa",
      stripePaymentId: `stub_pi_${randomBytes(8).toString("hex")}`,
    },
    {
      campaignId: campRelief.id,
      donorId: donorD.id,
      amount: "1000",
      donorEmail: donorD.email,
      donorName: `${donorD.firstName} ${donorD.lastName}`,
      stripePaymentId: `stub_pi_${randomBytes(8).toString("hex")}`,
    },
    {
      campaignId: campBuild.id,
      donorId: donorA.id,
      amount: "250",
      donorEmail: donorA.email,
      donorName: `${donorA.firstName} ${donorA.lastName}`,
      stripePaymentId: `stub_pi_${randomBytes(8).toString("hex")}`,
    },
    {
      campaignId: campYouth.id,
      donorId: null,
      amount: "35",
      donorEmail: `visitor-${spec.slug}@plegit.demo`,
      donorName: "Anonymous Friend",
      message: "Keep up the great work!",
    },
  ];

  for (const d of donationRows) {
    await storage.createDonation({
      orgId: org.id,
      campaignId: d.campaignId,
      amount: d.amount,
      currency: spec.currency,
      donationType: "online",
      status: "completed",
      donorId: d.donorId,
      donorEmail: d.donorEmail ?? undefined,
      donorName: d.donorName ?? undefined,
      message: d.message,
      category: d.category,
      stripePaymentId: d.stripePaymentId,
      giftAidOptIn: d.giftAidOptIn ?? false,
      coverFees: false,
      recurring: false,
    });
    if (d.donorId) bumpDonorStats(d.donorId, parseFloat(d.amount));
    if (d.campaignId) campaignRaised.set(d.campaignId, (campaignRaised.get(d.campaignId) ?? 0) + parseFloat(d.amount));
  }

  const gala = await storage.createEvent({
    orgId: org.id,
    title: "Annual Community Gala",
    description: "Dinner, program, and fundraiser — seeded ticket tiers and registrations.",
    imageUrl: IMG_HERO,
    category: "fundraiser",
    tags: ["gala", "annual", "dinner"],
    eventType: "in-person",
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    time: "6:30 PM",
    endTime: "10:00 PM",
    location: `${spec.city} Community Center`,
    capacity: 180,
    price: "0",
    currency: spec.currency,
    allowDonations: true,
    status: "published",
    enableWaitlist: true,
    isRecurring: false,
  });

  const ticketGa = await storage.createEventTicketType({
    eventId: gala.id,
    name: "General Admission",
    description: "Dinner seat",
    price: "95",
    currency: spec.currency,
    quantity: 120,
    minPerOrder: 1,
    maxPerOrder: 6,
    isActive: true,
    sortOrder: 0,
  });
  await storage.createEventTicketType({
    eventId: gala.id,
    name: "VIP",
    description: "Meet & greet",
    price: "250",
    currency: spec.currency,
    quantity: 30,
    minPerOrder: 1,
    maxPerOrder: 2,
    isActive: true,
    sortOrder: 1,
  });

  await storage.createEventPromoCode({
    eventId: gala.id,
    code: `GALA10-${spec.slug.split("-")[2]?.toUpperCase() ?? "DEMO"}`,
    discountType: "percentage",
    discountValue: "10",
    maxUses: 200,
    isActive: true,
  });

  await storage.createEventSpeaker({
    eventId: gala.id,
    name: "Rev. Avery Cole",
    title: "Keynote Speaker",
    bio: "Community organizer and chaplain.",
  });
  await storage.createEventSponsor({
    eventId: gala.id,
    name: "Local Bakery Co-op",
    tier: "silver",
    description: "Desserts sponsor",
  });

  const regPaid = async () => {
    const tk = ticketGa.id;
    const count = 2;
    await storage.incrementEventAttendeeCount(gala.id, count);
    await storage.incrementTicketTypeSold(ticketGa.id, count);
    await storage.createEventRegistration({
      eventId: gala.id,
      ticketTypeId: tk,
      firstName: "Casey",
      lastName: "Nguyen",
      email: `gala.casey.${spec.slug.replace(/-/g, "")}@plegit.demo`,
      phone: "+1 415 555 0199",
      ticketCount: count,
      totalPaid: String(95 * 2),
      donationAmount: "20",
      donationCategory: "general",
      qrCode: qrCode(),
      status: "confirmed",
    });
  };
  await regPaid();

  const freeEvent = await storage.createEvent({
    orgId: org.id,
    title: "Open House & Volunteer Fair",
    description: "Tour the campus and sign up for teams.",
    imageUrl: IMG_HERO,
    category: "social",
    eventType: "in-person",
    date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    time: "1:00 PM",
    endTime: "4:00 PM",
    location: `${org.name}, Main hall`,
    capacity: 300,
    price: "0",
    currency: spec.currency,
    status: "published",
  });
  await storage.incrementEventAttendeeCount(freeEvent.id, 1);
  await storage.createEventRegistration({
    eventId: freeEvent.id,
    ticketTypeId: null,
    firstName: "Riley",
    lastName: "Patel",
    email: `openhouse.${spec.slug.replace(/-/g, "")}@plegit.demo`,
    phone: "",
    ticketCount: 1,
    totalPaid: "0",
    qrCode: qrCode(),
    status: "confirmed",
  });

  /** Extra published event visible on public calendars / dashboards */
  await storage.createEvent({
    orgId: org.id,
    title: "Virtual Info Session — Giving & Impact",
    description: "Zoom link will be emailed to registrants.",
    category: "education",
    eventType: "virtual",
    livestreamUrl: "https://example.invalid/demo-zoom",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    time: "7:00 PM",
    endTime: "8:00 PM",
    location: "Online",
    capacity: 500,
    price: "0",
    currency: spec.currency,
    status: "published",
  });

  /** Donation attributed to gala event */
  await storage.createDonation({
    orgId: org.id,
    campaignId: null,
    eventId: gala.id,
    donorId: donorB.id,
    amount: "50",
    currency: spec.currency,
    donationType: "event",
    status: "completed",
    donorEmail: donorB.email,
    donorName: `${donorB.firstName} ${donorB.lastName}`,
    message: "Add-on gift at checkout",
    stripePaymentId: `stub_pi_${randomBytes(8).toString("hex")}`,
  });
  bumpDonorStats(donorB.id, 50);

  const ls = await storage.createLivestream({
    orgId: org.id,
    campaignId: campRelief.id,
    title: "Sunday Impact Stream (demo)",
    description: "Test overlay donations and replay flag.",
    platform: "youtube",
    videoId: "dQw4w9WgXcQ",
    scheduledStart: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    scheduledEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 3600000),
    status: "scheduled",
    isPaid: false,
    replayAvailable: true,
    currency: spec.currency,
  });

  await storage.createLivestreamDonation({
    orgId: org.id,
    livestreamId: ls.id,
    donorId: donorA.id,
    donorName: `${donorA.firstName} ${donorA.lastName}`,
    donorEmail: donorA.email,
    amount: "25",
    currency: spec.currency,
    category: "offering",
    message: "Shout-out: youth team!",
    showName: true,
    showAmount: true,
    highlighted: false,
    stripePaymentId: `stub_pi_${randomBytes(8).toString("hex")}`,
  });

  await storage.createLivestreamChatMessage({
    livestreamId: ls.id,
    donorId: donorC.id,
    donorName: "Mateo R.",
    message: "So glad you’re fundraising for relief!",
    isDonor: true,
    donorBadge: "silver",
  });

  const tagVIP = await storage.createContactTag({
    orgId: org.id,
    name: "VIP Donor Prospect",
    color: "#eab308",
  });
  const tagVol = await storage.createContactTag({
    orgId: org.id,
    name: "Volunteer Lead",
    color: "#22c55e",
  });

  const contact1 = await storage.createContact({
    orgId: org.id,
    firstName: "Morgan",
    lastName: "Lee",
    email: `crm.morgan.${spec.slug.replace(/-/g, "")}@plegit.demo`,
    phone: "+1 415 555 0142",
    types: ["donor", "lead"],
    leadSource: "event",
    leadStatus: "qualified",
    leadScore: 72,
    donorTier: "silver",
    status: "active",
    notes: "Met at gala steering committee.",
    emailOptIn: true,
  } as never);
  await storage.addTagToContact(contact1.id, tagVIP.id);
  await storage.createContactActivity({
    contactId: contact1.id,
    orgId: org.id,
    type: "note",
    subject: "Introduction",
    description: "Asked about recurring giving options.",
    userId: admin.id,
    outcome: "pending",
  });

  const volunteer = await storage.createVolunteer({
    orgId: org.id,
    firstName: "Sam",
    lastName: "Okonkwo",
    email: `volunteer.sam.${spec.slug.replace(/-/g, "")}@plegit.demo`,
    skills: ["Usher", "Parking", "Coffee station"],
    status: "active",
    bio: "Available most Sundays.",
  });

  const contactVol = await storage.createContact({
    orgId: org.id,
    firstName: volunteer.firstName,
    lastName: volunteer.lastName,
    email: volunteer.email,
    phone: "+1 415 555 0161",
    types: ["volunteer", "lead"],
    volunteerStatus: "active",
    leadSource: "website",
    leadStatus: "new",
    status: "active",
    emailOptIn: true,
  } as never);
  await storage.addTagToContact(contactVol.id, tagVol.id);

  await storage.createVolunteerShift({
    orgId: org.id,
    volunteerId: volunteer.id,
    eventId: freeEvent.id,
    title: "Welcome desk",
    location: `${org.name} lobby`,
    shiftDate: freeEvent.date,
    startTime: "12:30",
    endTime: "16:30",
    role: "Greeter",
    status: "scheduled",
  });

  await storage.createVolunteerHour({
    orgId: org.id,
    volunteerId: volunteer.id,
    shiftId: null,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    hoursWorked: "3",
    activity: "Food pantry restock",
  });

  const beneficiary = await storage.createBeneficiary({
    orgId: org.id,
    type: "individual",
    firstName: "Elena",
    lastName: "Vásquez",
    email: `beneficiary.elena.${spec.slug.replace(/-/g, "")}@plegit.demo`,
    phone: "+1 415 555 0177",
    city: spec.city,
    country: spec.country === "GB" ? "United Kingdom" : "United States",
    status: "active",
    urgencyLevel: "medium",
    primaryNeeds: ["food", "transport"],
    verificationStatus: "verified",
    biography: "Recently displaced; working with caseworker on housing.",
  } as never);

  await storage.createBeneficiaryCommunication({
    orgId: org.id,
    beneficiaryId: beneficiary.id,
    type: "note",
    subject: "Welcome call",
    content: "Confirmed preferred language and best call times.",
    direction: "outbound",
    staffMember: `${admin.firstName} ${admin.lastName}`,
    communicationDate: new Date(),
    priority: "normal",
    requiresFollowUp: true,
    followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  });

  const benGift = await storage.createBeneficiaryDonation({
    orgId: org.id,
    beneficiaryId: beneficiary.id,
    donationType: "food",
    amount: "85",
    currency: spec.currency,
    description: "Two weeks of staples + toiletries",
    sourceOfFunds: "fundraiser",
    campaignId: campRelief.id,
    deliveryDate: new Date(),
    deliveryMethod: "in_person",
    deliveredBy: "Jordan Smith (volunteer)",
    impactNotes: "Family reported high gratitude.",
    status: "completed",
  } as never);

  const activity = await storage.createActivity({
    orgId: org.id,
    title: "Financial Peace — Spring Cohort",
    description: "Six-week stewardship course.",
    category: "Classes",
    isFree: false,
    price: "40",
    currency: spec.currency,
    maxStudents: 24,
    scheduleType: "weekly",
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 52 * 24 * 60 * 60 * 1000),
    startTime: "19:00",
    endTime: "20:30",
    teacherName: "Chris Morgan",
    requiresApproval: false,
    tags: ["adults", "finance"],
    settings: {},
  } as never);

  await storage.updateActivity(activity.id, {
    status: "active",
    isPublished: true,
    currentStudents: 1,
  } as never);

  const actSession = await storage.createActivitySession({
    activityId: activity.id,
    orgId: org.id,
    sessionDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
    startTime: "19:00",
    endTime: "20:30",
    location: "Room B / Zoom hybrid",
  } as never);

  const actReg = await storage.createActivityRegistration({
    activityId: activity.id,
    orgId: org.id,
    studentName: "Jamie Alvarez",
    studentEmail: `class.jamie.${spec.slug.replace(/-/g, "")}@plegit.demo`,
    status: "confirmed",
  } as never);

  await storage.createActivityAttendance({
    activityId: activity.id,
    orgId: org.id,
    registrationId: actReg.id,
    sessionDate: actSession.sessionDate,
    attended: true,
    notes: "Seeded attendance row",
  } as never);

  const sermonCat = await storage.createSermonCategory({
    orgId: org.id,
    name: "Teaching",
    slug: `teaching-${spec.slug}`,
  });
  const sermonTag = await storage.createSermonTag({
    orgId: org.id,
    name: "Faithfulness",
    slug: `faithfulness-${spec.slug}`,
  });
  const sermon = await storage.createSermon({
    orgId: org.id,
    title: "Generosity as a Rhythm",
    description: "Teaching on stewardship and community care.",
    speaker: "Pastor Jamie",
    sermonDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    categoryId: sermonCat.id,
    platform: "youtube",
    platformVideoId: "dQw4w9WgXcQ",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    status: "published",
    scripture: ["2 Corinthians 9:7"],
    aiSummary: "Stub summary — replace when AI is enabled.",
  });
  await db.insert(sermonTagAssignments).values({ sermonId: sermon.id, tagId: sermonTag.id });

  await storage.createPrayerSettings({
    orgId: org.id,
    city: spec.city,
    country: spec.country === "GB" ? "UK" : "US",
    calculationMethod: 2,
    timezone: org.timezone ?? "UTC",
    latitude: null,
    longitude: null,
  });

  await storage.createLandingPage({
    orgId: org.id,
    slug: spec.landingSlug,
    title: `${org.name} — Hub`,
    description: "Demo landing content for QA.",
    heroImageUrl: IMG_HERO,
    isPublished: true,
    pageComponents: [
      {
        id: randomUUID(),
        type: "header",
        content: org.name,
      },
    ],
  });

  await storage.createEmailTemplate({
    orgId: org.id,
    name: "Donation receipt (demo)",
    templateType: "donation_thank_you",
    subject: `Thanks from ${org.name}`,
    htmlBody: "<p>You’re amazing — demo template.</p>",
    textBody: "Thanks — demo.",
    priority: 0,
    isDefault: true,
    isActive: true,
  });

  const memberCircle = await storage.createMemberTag({
    orgId: org.id,
    name: "Stewards Circle",
    color: "#6366f1",
  });
  await db.insert(memberTagAssignments).values({
    orgId: org.id,
    memberId: admin.id,
    tagId: memberCircle.id,
  });

  await db.insert(prayerRequests).values([
    {
      orgId: org.id,
      submitterName: "Alex R.",
      submitterEmail: `prayer1.${spec.slug.replace(/-/g, "")}@plegit.demo`,
      isAnonymous: false,
      requestText: "Pray for healing after surgery scheduled next Tuesday.",
      category: "health",
      status: "approved",
      moderationStatus: "approved",
      moderationNotes: "Seed data",
      isPublic: true,
      isPinned: true,
      prayerCount: 12,
    },
    {
      orgId: org.id,
      isAnonymous: true,
      requestText: "Pray for unity in our outreach team.",
      category: "guidance",
      status: "approved",
      moderationStatus: "approved",
      isPublic: true,
      isPinned: false,
      prayerCount: 5,
    },
  ]);

  for (const [cid, amt] of Array.from(campaignRaised.entries())) {
    await storage.updateCampaign(cid, {
      currentAmount: amt.toFixed(2),
    } as never);
  }

  for (const [did, stats] of Array.from(donorTagTotals.entries())) {
    await storage.updateDonor(did, {
      totalDonated: stats.total.toFixed(2),
      donationCount: stats.count,
    } as never);
  }

  console.log(`  ✅ Created org "${org.name}"`);
  console.log(`     Org admin login: ${spec.adminEmail} / ${ADMIN_PASSWORD}`);
  console.log(`     Landing: /p/${spec.landingSlug}`);
  console.log(`     P2P page slug: ${p2pslug}`);
  console.log(`     Beneficiary donation id: ${benGift.id}`);
}

export async function seedDemoWorld(): Promise<void> {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Plegit — demo dataset seed                                   ║
║  FORCE_RESET=${FORCE_RESET}                                       ║
╚══════════════════════════════════════════════════════════════╝`);

  await ensureMarketplaceBaseline();

  await seedOneOrg({
    slug: DEMO_ALPHA_SLUG,
    name: "Demo Alpha Faith Collective",
    adminEmail: "admin+demo-alpha@plegit.demo",
    landingSlug: "demo-alpha-hub",
    email: "hello@demo-alpha-faith.plegit.demo",
    phone: "+1 (415) 555-0190",
    religion: "christian",
    country: "US",
    currency: "USD",
    city: "San Francisco",
    street: "200 Mission Street",
  });

  await seedOneOrg({
    slug: DEMO_BETA_SLUG,
    name: "Demo Beta Charity Trust",
    adminEmail: "admin+demo-beta@plegit.demo",
    landingSlug: "demo-beta-hub",
    email: "hello@demo-beta-charity.plegit.demo",
    phone: "+44 20 7946 0555",
    religion: "other",
    country: "GB",
    currency: "GBP",
    city: "London",
    street: "10 Downing Street",
  });
}

async function main(): Promise<void> {
  try {
    await seedDemoWorld();
    console.log("\n✓ Demo seed finished.\n");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  pool.end().finally(() => process.exit(1));
});
