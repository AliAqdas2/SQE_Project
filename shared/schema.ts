import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, boolean, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Organizations table - multi-tenant
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  email: text("email").notNull(),
  phone: text("phone"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#00BCD4"),
  religion: text("religion"), // christian, muslim, jewish, hindu, buddhist, other
  // Address fields
  street: text("street"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country"),
  // Localization settings
  timezone: text("timezone").default("America/New_York"), // IANA timezone identifier
  currency: text("currency").default("USD"), // ISO currency code: USD, GBP, EUR, AED, ZAR, etc.
  dateFormat: text("date_format").default("MM/DD/YYYY"), // Date format based on country
  // Stripe integration (platform billing)
  stripeCustomerId: text("stripe_customer_id").unique(),
  // Stripe Connect (organization's own Stripe account for receiving donations)
  stripeAccountId: text("stripe_account_id").unique(),
  stripeAccessToken: text("stripe_access_token"),
  stripeRefreshToken: text("stripe_refresh_token"),
  stripeScope: text("stripe_scope"),
  stripeAccountStatus: text("stripe_account_status"), // pending, active, restricted, etc.
  // Registration and approval fields
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  reviewedAt: timestamp("reviewed_at"),
  approvedBy: varchar("approved_by"),
  incorporationDocUrl: text("incorporation_doc_url"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Supported country codes and currencies for marketplace module pricing
export const SUPPORTED_COUNTRIES = ["GB", "UK", "US", "AE", "ZA"] as const;
export const SUPPORTED_CURRENCIES = ["GBP", "USD", "AED", "ZAR"] as const;

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  approvedBy: true,
}).extend({
  country: z.enum(SUPPORTED_COUNTRIES).optional().nullable(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional().nullable(),
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  goalAmount: decimal("goal_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  category: text("category"),
  status: text("status").default("active").notNull(),
  country: text("country"),
  currency: text("currency").default("USD").notNull(), // ISO currency code: USD, GBP, EUR, AED, ZAR
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  quickDonationButtons: jsonb("quick_donation_buttons").default([]),
  pageComponents: jsonb("page_components").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  currentAmount: true,
  createdAt: true,
}).extend({
  goalAmount: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

// Donors table
export const donors = pgTable("donors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  totalDonated: decimal("total_donated", { precision: 12, scale: 2 }).default("0").notNull(),
  donationCount: integer("donation_count").default(0).notNull(),
  tier: text("tier").default("bronze"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDonorSchema = createInsertSchema(donors).omit({
  id: true,
  totalDonated: true,
  donationCount: true,
  createdAt: true,
});

export type InsertDonor = z.infer<typeof insertDonorSchema>;
export type Donor = typeof donors.$inferSelect;

// Donor Tags table
export const donorTags = pgTable("donor_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("#3B82F6"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDonorTagSchema = createInsertSchema(donorTags).omit({
  id: true,
  orgId: true,
  createdAt: true,
});

export type InsertDonorTag = z.infer<typeof insertDonorTagSchema>;
export type DonorTag = typeof donorTags.$inferSelect;

// Donor Tag Assignments table
export const donorTagAssignments = pgTable("donor_tag_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  donorId: varchar("donor_id").notNull().references(() => donors.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => donorTags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDonorTagAssignmentSchema = createInsertSchema(donorTagAssignments).omit({
  id: true,
  createdAt: true,
});

export type InsertDonorTagAssignment = z.infer<typeof insertDonorTagAssignmentSchema>;
export type DonorTagAssignment = typeof donorTagAssignments.$inferSelect;

// Donations table
export const donations = pgTable("donations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "set null" }),
  livestreamId: varchar("livestream_id").references(() => livestreams.id, { onDelete: "set null" }),
  donorId: varchar("donor_id").references(() => donors.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  donationType: text("donation_type").default("online").notNull(), // online, campaign, event, in-kind, cash, bank
  category: text("category"), // tithe, sadaqa, zakat, general, offering
  coverFees: boolean("cover_fees").default(false),
  feeAmount: decimal("fee_amount", { precision: 12, scale: 2 }).default("0"),
  recurring: boolean("recurring").default(false).notNull(),
  frequency: text("frequency"), // monthly, yearly, quarterly
  stripeSubscriptionId: text("stripe_subscription_id"),
  paymentMethod: text("payment_method"),
  stripePaymentId: text("stripe_payment_id"),
  status: text("status").default("completed").notNull(),
  donorEmail: text("donor_email"),
  donorName: text("donor_name"),
  message: text("message"),
  receiptUrl: text("receipt_url"), // URL to uploaded receipt document
  thankYouSent: boolean("thank_you_sent").default(false).notNull(),
  thankYouSentAt: timestamp("thank_you_sent_at"),
  notes: text("notes"), // Admin notes about the donation
  // Gift Aid / Tax Relief fields
  giftAidOptIn: boolean("gift_aid_opt_in").default(false).notNull(), // Donor opted in to Gift Aid/tax relief
  giftAidEligible: boolean("gift_aid_eligible").default(false).notNull(), // Admin verified eligibility
  donorAddress: text("donor_address"), // Required for Gift Aid claims
  donorCity: text("donor_city"),
  donorPostcode: text("donor_postcode"),
  donorCountry: text("donor_country"),
  taxReliefAmount: decimal("tax_relief_amount", { precision: 12, scale: 2 }), // Calculated tax relief value
  taxReliefClaimed: boolean("tax_relief_claimed").default(false).notNull(), // Has been included in a claim
  taxReliefClaimedAt: timestamp("tax_relief_claimed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDonationSchema = createInsertSchema(donations).omit({
  id: true,
  createdAt: true,
});

export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donations.$inferSelect;

// Donation with nested donor information (used by filterDonations)
export type DonationWithDonor = Donation & {
  donor?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

// Events table
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  category: text("category"), // worship, conference, fundraiser, social, education, etc
  tags: text("tags").array(), // Array of tags for filtering
  eventType: text("event_type").default("in-person").notNull(), // in-person, virtual, hybrid
  date: timestamp("date").notNull(),
  time: text("time").notNull(),
  endTime: text("end_time"), // Event end time
  location: text("location").notNull(),
  livestreamUrl: text("livestream_url"), // For virtual/hybrid events
  capacity: integer("capacity").notNull(),
  attendeeCount: integer("attendee_count").default(0).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).default("0").notNull(), // Base price (legacy, use ticket types instead)
  currency: text("currency").default("USD").notNull(), // ISO currency code
  allowDonations: boolean("allow_donations").default(false).notNull(), // Enable donations at checkout
  seatingMapUrl: text("seating_map_url"), // URL to uploaded seating map graphic
  enableWaitlist: boolean("enable_waitlist").default(true).notNull(), // Enable waitlist when sold out
  status: text("status").default("draft").notNull(), // draft, published, sold-out, cancelled, ended
  publishedAt: timestamp("published_at"),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurringPattern: text("recurring_pattern"), // JSON string with recurrence rules
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  attendeeCount: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
}).extend({
  date: z.coerce.date(),
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Event Registrations table
export const eventRegistrations = pgTable("event_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  ticketTypeId: varchar("ticket_type_id").references(() => eventTicketTypes.id, { onDelete: "set null" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  ticketCount: integer("ticket_count").default(1).notNull(),
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).notNull(),
  donationAmount: decimal("donation_amount", { precision: 10, scale: 2 }).default("0"), // Optional donation at checkout
  donationCategory: text("donation_category"), // tithe, sadaqa, zakat, general, offering
  promoCode: text("promo_code"),
  qrCode: text("qr_code").notNull(), // Unique QR code for check-in
  checkedIn: boolean("checked_in").default(false).notNull(),
  checkedInAt: timestamp("checked_in_at"),
  stripePaymentId: text("stripe_payment_id"),
  status: text("status").default("confirmed").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({
  id: true,
  createdAt: true,
});

export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;
export type EventRegistration = typeof eventRegistrations.$inferSelect;

// Event Ticket Types table - multiple ticket tiers per event
export const eventTicketTypes = pgTable("event_ticket_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // General Admission, VIP, Early Bird, etc
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(), // ISO currency code: USD, GBP, EUR, AED, ZAR
  quantity: integer("quantity").notNull(), // Total tickets of this type
  sold: integer("sold").default(0).notNull(), // Tickets sold
  minPerOrder: integer("min_per_order").default(1).notNull(),
  maxPerOrder: integer("max_per_order").default(10).notNull(),
  seatingPlanUrl: text("seating_plan_url"), // Optional seating plan image for this ticket type
  badgeColor: text("badge_color").default("#3B82F6"), // Auto-generated badge color for ticket type
  badgeIcon: text("badge_icon"), // Optional icon for the badge (lucide icon name)
  salesStart: timestamp("sales_start"),
  salesEnd: timestamp("sales_end"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEventTicketTypeSchema = createInsertSchema(eventTicketTypes).omit({
  id: true,
  sold: true,
  createdAt: true,
});

export type InsertEventTicketType = z.infer<typeof insertEventTicketTypeSchema>;
export type EventTicketType = typeof eventTicketTypes.$inferSelect;

// Event Promo Codes table
export const eventPromoCodes = pgTable("event_promo_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  code: text("code").notNull(), // The actual promo code (uppercase)
  discountType: text("discount_type").notNull(), // percentage or fixed
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  maxUses: integer("max_uses"), // null = unlimited
  usedCount: integer("used_count").default(0).notNull(),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEventPromoCodeSchema = createInsertSchema(eventPromoCodes).omit({
  id: true,
  usedCount: true,
  createdAt: true,
});

export type InsertEventPromoCode = z.infer<typeof insertEventPromoCodeSchema>;
export type EventPromoCode = typeof eventPromoCodes.$inferSelect;

// Event Waitlist table
export const eventWaitlist = pgTable("event_waitlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  ticketsRequested: integer("tickets_requested").default(1).notNull(),
  notified: boolean("notified").default(false).notNull(),
  notifiedAt: timestamp("notified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEventWaitlistSchema = createInsertSchema(eventWaitlist).omit({
  id: true,
  notified: true,
  notifiedAt: true,
  createdAt: true,
});

export type InsertEventWaitlist = z.infer<typeof insertEventWaitlistSchema>;
export type EventWaitlist = typeof eventWaitlist.$inferSelect;

// Event Speakers table
export const eventSpeakers = pgTable("event_speakers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  title: text("title"), // Job title or role
  bio: text("bio"),
  photoUrl: text("photo_url"),
  company: text("company"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  websiteUrl: text("website_url"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEventSpeakerSchema = createInsertSchema(eventSpeakers).omit({
  id: true,
  createdAt: true,
});

export type InsertEventSpeaker = z.infer<typeof insertEventSpeakerSchema>;
export type EventSpeaker = typeof eventSpeakers.$inferSelect;

// Event Sponsors table
export const eventSponsors = pgTable("event_sponsors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tier: text("tier").default("bronze").notNull(), // platinum, gold, silver, bronze
  logoUrl: text("logo_url"),
  description: text("description"),
  websiteUrl: text("website_url"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEventSponsorSchema = createInsertSchema(eventSponsors).omit({
  id: true,
  createdAt: true,
});

export type InsertEventSponsor = z.infer<typeof insertEventSponsorSchema>;
export type EventSponsor = typeof eventSponsors.$inferSelect;

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // Nullable - set after approval via password setup link
  passwordSetAt: timestamp("password_set_at"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").default("org_admin").notNull(), // org_admin, eco_admin
  emailOptedOut: boolean("email_opted_out").default(false).notNull(), // GDPR compliant email opt-out
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  passwordSetAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Widget Layout interface for dashboard preferences
export interface WidgetLayout {
  enabled: string[];
  order: string[];
  sizes: Record<string, "small" | "medium" | "large">;
}

// Dashboard Preferences table - for customizable dashboard widgets
export const dashboardPreferences = pgTable("dashboard_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  widgetLayout: jsonb("widget_layout").$type<WidgetLayout>().default({
    enabled: ["donations", "campaigns", "events", "volunteers", "recent-activity"],
    order: ["donations", "campaigns", "events", "volunteers", "recent-activity"],
    sizes: {}
  }).notNull(),
  dateRangePreset: text("date_range_preset").default("last30days"), // last7days, last30days, last90days, thisMonth, lastMonth, custom
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserOrg: unique().on(table.userId, table.orgId),
}));

export const insertDashboardPreferencesSchema = createInsertSchema(dashboardPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDashboardPreferences = z.infer<typeof insertDashboardPreferencesSchema>;
export type DashboardPreferences = typeof dashboardPreferences.$inferSelect;

// AI Conversations table - for chatbot session persistence
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").default("New Conversation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;
export type AiConversation = typeof aiConversations.$inferSelect;

// AI Messages table - for individual chat messages
export const aiMessages = pgTable("ai_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => aiConversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAiMessageSchema = createInsertSchema(aiMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertAiMessage = z.infer<typeof insertAiMessageSchema>;
export type AiMessage = typeof aiMessages.$inferSelect;

// Organization Registrations table - for pending registrations before approval
export const organizationRegistrations = pgTable("organization_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Step 1: Charity name and basic info
  charityName: text("charity_name").notNull(),
  religion: text("religion"), // christian, muslim, jewish, hindu, buddhist, other
  // Step 2: Contact information
  contactFirstName: text("contact_first_name"),
  contactLastName: text("contact_last_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  // Step 3: Address
  street: text("street"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country"),
  timezone: text("timezone"),
  currency: text("currency"),
  dateFormat: text("date_format"),
  // Step 4: Incorporation document
  incorporationDocUrl: text("incorporation_doc_url"),
  // Progress tracking
  currentStep: integer("current_step").default(1).notNull(),
  status: text("status").default("draft").notNull(), // draft, submitted, approved, rejected
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrganizationRegistrationSchema = createInsertSchema(organizationRegistrations).omit({
  id: true,
  createdAt: true,
  submittedAt: true,
  reviewedAt: true,
});

export type InsertOrganizationRegistration = z.infer<typeof insertOrganizationRegistrationSchema>;
export type OrganizationRegistration = typeof organizationRegistrations.$inferSelect;

// Auth tokens table - for password setup and reset
export const authTokens = pgTable("auth_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  type: text("type").notNull(), // password_setup, password_reset
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuthTokenSchema = createInsertSchema(authTokens).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export type InsertAuthToken = z.infer<typeof insertAuthTokenSchema>;
export type AuthToken = typeof authTokens.$inferSelect;

// Marketplace Modules table - available modules that can be enabled
export const marketplaceModules = pgTable("marketplace_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleKey: text("module_key").notNull().unique(), // events, livestream, analytics, etc
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  isDefault: boolean("is_default").default(false).notNull(), // true for Fundraising and Donors
  isActive: boolean("is_active").default(true).notNull(), // eco admin can disable modules
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMarketplaceModuleSchema = createInsertSchema(marketplaceModules).omit({
  id: true,
  createdAt: true,
});

export type InsertMarketplaceModule = z.infer<typeof insertMarketplaceModuleSchema>;
export type MarketplaceModule = typeof marketplaceModules.$inferSelect;

// Module Pricing table - multi-currency pricing per module per country
export const modulePricing = pgTable("module_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull().references(() => marketplaceModules.id, { onDelete: "cascade" }),
  country: text("country").notNull(), // UK, US, AE, ZA, etc
  currency: text("currency").notNull(), // GBP, USD, AED, ZAR
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  billingPeriod: text("billing_period").default("monthly").notNull(), // monthly, yearly, one_time
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertModulePricingSchema = createInsertSchema(modulePricing).omit({
  id: true,
  createdAt: true,
});

export type InsertModulePricing = z.infer<typeof insertModulePricingSchema>;
export type ModulePricing = typeof modulePricing.$inferSelect;

// Organization Modules table - tracks which modules are enabled for each org
export const organizationModules = pgTable("organization_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  moduleId: varchar("module_id").notNull().references(() => marketplaceModules.id, { onDelete: "cascade" }),
  enabledAt: timestamp("enabled_at").defaultNow().notNull(),
  enabledBy: varchar("enabled_by").references(() => users.id), // user who enabled the module
  status: text("status").default("active").notNull(), // active, suspended
  billingPeriod: text("billing_period").default("monthly").notNull(), // monthly, yearly
  nextBillingDate: timestamp("next_billing_date"), // calculated based on enabledAt + billingPeriod
});

export const insertOrganizationModuleSchema = createInsertSchema(organizationModules).omit({
  id: true,
  enabledAt: true,
});

export type InsertOrganizationModule = z.infer<typeof insertOrganizationModuleSchema>;
export type OrganizationModule = typeof organizationModules.$inferSelect;

// Partners table - for referral partners
export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  country: text("country"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("10.00").notNull(), // percentage
  status: text("status").default("active").notNull(), // active, suspended, inactive
  totalReferrals: integer("total_referrals").default(0).notNull(),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  totalReferrals: true,
  totalRevenue: true,
  createdAt: true,
});

export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;

// Referral Codes table
export const referralCodes = pgTable("referral_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({
  id: true,
  usageCount: true,
  createdAt: true,
});

export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type ReferralCode = typeof referralCodes.$inferSelect;

// Subscriptions table - tracks organization module subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  moduleId: varchar("module_id").notNull().references(() => marketplaceModules.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  status: text("status").notNull(), // active, canceled, past_due, trialing
  billingPeriod: text("billing_period").notNull(), // monthly, yearly
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  canceledAt: timestamp("canceled_at"),
  referralCode: text("referral_code").references(() => referralCodes.code),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Subscription Plans table - defines the 5 subscription tiers (all modules included)
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tierCode: text("tier_code").notNull().unique(), // starter, core, growth, scale, enterprise
  name: text("name").notNull(), // Starter, Core, Growth, Scale, Enterprise
  description: text("description").notNull(),
  minMembers: integer("min_members").notNull(), // Minimum members for this tier
  maxMembers: integer("max_members"), // Maximum members (null for Enterprise = unlimited)
  baseMonthlyPrice: decimal("base_monthly_price", { precision: 10, scale: 2 }).notNull(), // Default UK pricing
  baseYearlyPrice: decimal("base_yearly_price", { precision: 10, scale: 2 }).notNull(), // Default UK pricing (10% discount)
  currency: text("currency").default("GBP").notNull(),
  stripeMonthlyPriceId: text("stripe_monthly_price_id"), // Stripe Monthly Price ID
  stripeYearlyPriceId: text("stripe_yearly_price_id"), // Stripe Yearly Price ID
  stripeProductId: text("stripe_product_id"), // Stripe Product ID
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// Country Pricing table - allows Eco Admins to customize pricing per country
export const countryPricing = pgTable("country_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  countryCode: text("country_code").notNull(), // GB, US, ZA, NG, AE, etc.
  currency: text("currency").notNull(), // GBP, USD, ZAR, NGN, AED, etc.
  tierCode: text("tier_code").notNull(), // starter, core, growth, scale, enterprise
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }).notNull(),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("0"), // VAT/tax percentage (e.g., 20.00 for 20%)
  roundingRule: text("rounding_rule").default("none"), // none, nearest_9, nearest_5, etc.
  stripeMonthlyPriceId: text("stripe_monthly_price_id"), // Country-specific Stripe Monthly Price ID
  stripeYearlyPriceId: text("stripe_yearly_price_id"), // Country-specific Stripe Yearly Price ID
  createdByAdminId: varchar("created_by_admin_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCountryTier: unique().on(table.countryCode, table.tierCode),
}));

export const insertCountryPricingSchema = createInsertSchema(countryPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCountryPricing = z.infer<typeof insertCountryPricingSchema>;
export type CountryPricing = typeof countryPricing.$inferSelect;

// Organization Subscriptions table - tracks the main subscription plan for each organization
export const organizationSubscriptions = pgTable("organization_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }).unique(),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  billingCycle: text("billing_cycle").notNull(), // monthly, yearly
  memberCount: integer("member_count").default(0).notNull(), // Current active member count
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  status: text("status").notNull(), // active, canceled, past_due, trialing, incomplete
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  canceledAt: timestamp("canceled_at"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  autoUpgradeQueued: boolean("auto_upgrade_queued").default(false).notNull(), // Flag for auto-upgrade at renewal
  lastRenewalReminderSentAt: timestamp("last_renewal_reminder_sent_at"), // When renewal reminder was last sent
  lastRenewalReminderForPeriodEnd: timestamp("last_renewal_reminder_for_period_end"), // Which period the last reminder was for
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrganizationSubscriptionSchema = createInsertSchema(organizationSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrganizationSubscription = z.infer<typeof insertOrganizationSubscriptionSchema>;
export type OrganizationSubscription = typeof organizationSubscriptions.$inferSelect;

// Subscription Items table - tracks individual items on a Stripe subscription (tier + modules)
export const subscriptionItems = pgTable("subscription_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  subscriptionId: varchar("subscription_id").notNull().references(() => organizationSubscriptions.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'tier' | 'module'
  tierCode: text("tier_code"), // Set if type is 'tier'
  moduleId: varchar("module_id").references(() => marketplaceModules.id, { onDelete: "cascade" }), // Set if type is 'module'
  stripePriceId: text("stripe_price_id").notNull(),
  stripeSubscriptionItemId: text("stripe_subscription_item_id").unique(),
  status: text("status").default("active").notNull(), // active, canceled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubscriptionItemSchema = createInsertSchema(subscriptionItems).omit({
  id: true,
  createdAt: true,
});

export type InsertSubscriptionItem = z.infer<typeof insertSubscriptionItemSchema>;
export type SubscriptionItem = typeof subscriptionItems.$inferSelect;

// Campaign Updates table - for timeline updates with images
export const campaignUpdates = pgTable("campaign_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  showOnPublicPage: boolean("show_on_public_page").default(false).notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCampaignUpdateSchema = createInsertSchema(campaignUpdates).omit({
  id: true,
  createdAt: true,
});

export type InsertCampaignUpdate = z.infer<typeof insertCampaignUpdateSchema>;
export type CampaignUpdate = typeof campaignUpdates.$inferSelect;

// Campaign Expenses table - for expense tracking
export const campaignExpenses = pgTable("campaign_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(), // Total amount
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }), // Price per unit (optional)
  quantity: integer("quantity"), // Quantity (optional)
  category: text("category").notNull(), // operations, marketing, events, supplies, etc
  date: timestamp("date").notNull(),
  receiptUrl: text("receipt_url"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCampaignExpenseSchema = createInsertSchema(campaignExpenses).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.coerce.date(),
});

export type InsertCampaignExpense = z.infer<typeof insertCampaignExpenseSchema>;
export type CampaignExpense = typeof campaignExpenses.$inferSelect;

// Campaign Chat Messages table - for AI Campaign Manager chat history
export const campaignChatMessages = pgTable("campaign_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCampaignChatMessageSchema = createInsertSchema(campaignChatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertCampaignChatMessage = z.infer<typeof insertCampaignChatMessageSchema>;
export type CampaignChatMessage = typeof campaignChatMessages.$inferSelect;

// Campaign Strategies table - AI-generated marketing strategies
export const campaignStrategies = pgTable("campaign_strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  content: jsonb("content").notNull(), // Structured sections: donorOutreach, socialMedia, messaging, events, onlineCommunities
  summary: text("summary"),
  insights: jsonb("insights"), // Metadata: donorCount, topDonorSegments, etc
  model: text("model").default("gpt-4o").notNull(), // AI model used
  generatedBy: varchar("generated_by").references(() => users.id),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const insertCampaignStrategySchema = createInsertSchema(campaignStrategies).omit({
  id: true,
  generatedAt: true,
});

export type InsertCampaignStrategy = z.infer<typeof insertCampaignStrategySchema>;
export type CampaignStrategy = typeof campaignStrategies.$inferSelect;

// ==============================
// PEER-TO-PEER FUNDRAISING TABLES
// ==============================

// P2P Campaign Settings - Campaign-level P2P configuration
export const p2pCampaignSettings = pgTable("p2p_campaign_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().unique().references(() => campaigns.id, { onDelete: "cascade" }),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  requireApproval: boolean("require_approval").default(false).notNull(), // Auto-approve participants or require admin approval
  defaultParticipantGoal: decimal("default_participant_goal", { precision: 12, scale: 2 }),
  welcomeMessage: text("welcome_message"),
  participantInstructions: text("participant_instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertP2PCampaignSettingsSchema = createInsertSchema(p2pCampaignSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertP2PCampaignSettings = z.infer<typeof insertP2PCampaignSettingsSchema>;
export type P2PCampaignSettings = typeof p2pCampaignSettings.$inferSelect;

// P2P Participants - Individual fundraisers
export const p2pParticipants = pgTable("p2p_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  donorId: varchar("donor_id").references(() => donors.id, { onDelete: "set null" }), // Links to donor if they exist
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // Links to user account if created
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  slug: text("slug").notNull().unique(), // URL-friendly identifier for participant page
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  goalAmount: decimal("goal_amount", { precision: 12, scale: 2 }).notNull(),
  raisedAmount: decimal("raised_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  donationCount: integer("donation_count").default(0).notNull(),
  role: text("role").default("participant").notNull(), // participant, team_captain
  status: text("status").default("pending").notNull(), // pending, active, inactive
  deletedAt: timestamp("deleted_at"), // Soft delete to preserve donation history
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastActive: timestamp("last_active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertP2PParticipantSchema = createInsertSchema(p2pParticipants).omit({
  id: true,
  raisedAmount: true,
  donationCount: true,
  deletedAt: true,
  joinedAt: true,
  lastActive: true,
  createdAt: true,
});

export type InsertP2PParticipant = z.infer<typeof insertP2PParticipantSchema>;
export type P2PParticipant = typeof p2pParticipants.$inferSelect;

// Extended type for leaderboard with aggregated stats
export type P2PParticipantWithStats = P2PParticipant & {
  percentOfGoal: number;
  rank: number;
  lastDonationAt: Date | null;
  milestonesCompleted: number;
  badgesUnlocked: number;
};

// P2P Invitations - Track sent invitations
export const p2pInvitations = pgTable("p2p_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  invitedBy: varchar("invited_by").references(() => users.id, { onDelete: "set null" }), // Admin or participant who sent invitation
  email: text("email").notNull(),
  token: text("token").notNull().unique(), // Unique token for accepting invitation
  status: text("status").default("pending").notNull(), // pending, accepted, expired
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  deletedAt: timestamp("deleted_at"), // Soft delete for audit trail
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Prevent duplicate invitations
  uniqueCampaignEmail: unique().on(table.campaignId, table.email),
}));

export const insertP2PInvitationSchema = createInsertSchema(p2pInvitations).omit({
  id: true,
  acceptedAt: true,
  deletedAt: true,
  createdAt: true,
});

export type InsertP2PInvitation = z.infer<typeof insertP2PInvitationSchema>;
export type P2PInvitation = typeof p2pInvitations.$inferSelect;

// P2P Milestones - Campaign-level milestone templates
export const p2pMilestones = pgTable("p2p_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull(), // amount_raised, donation_count, days_active
  triggerValue: decimal("trigger_value", { precision: 12, scale: 2 }).notNull(),
  emailSubject: text("email_subject"),
  emailBody: text("email_body"),
  badgeIcon: text("badge_icon"), // Emoji or icon identifier
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertP2PMilestoneSchema = createInsertSchema(p2pMilestones).omit({
  id: true,
  createdAt: true,
});

export type InsertP2PMilestone = z.infer<typeof insertP2PMilestoneSchema>;
export type P2PMilestone = typeof p2pMilestones.$inferSelect;

// P2P Participant Milestones - Track milestone completion per participant
export const p2pParticipantMilestones = pgTable("p2p_participant_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").notNull().references(() => p2pParticipants.id, { onDelete: "cascade" }),
  milestoneId: varchar("milestone_id").notNull().references(() => p2pMilestones.id, { onDelete: "cascade" }),
  progress: decimal("progress", { precision: 5, scale: 2 }).default("0").notNull(), // Percentage 0-100
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  emailSent: boolean("email_sent").default(false).notNull(),
  emailSentAt: timestamp("email_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertP2PParticipantMilestoneSchema = createInsertSchema(p2pParticipantMilestones).omit({
  id: true,
  completedAt: true,
  emailSentAt: true,
  createdAt: true,
});

export type InsertP2PParticipantMilestone = z.infer<typeof insertP2PParticipantMilestoneSchema>;
export type P2PParticipantMilestone = typeof p2pParticipantMilestones.$inferSelect;

// P2P Chat Messages - Participant chat room
export const p2pChatMessages = pgTable("p2p_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  participantId: varchar("participant_id").references(() => p2pParticipants.id, { onDelete: "set null" }), // null for org admins
  senderName: text("sender_name").notNull(),
  senderRole: text("sender_role").default("participant").notNull(), // participant, admin
  message: text("message").notNull(),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertP2PChatMessageSchema = createInsertSchema(p2pChatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertP2PChatMessage = z.infer<typeof insertP2PChatMessageSchema>;
export type P2PChatMessage = typeof p2pChatMessages.$inferSelect;

// P2P Gamification Badges - Achievement badge definitions
export const p2pGamificationBadges = pgTable("p2p_gamification_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }), // null for org-wide badges
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon").notNull(), // Emoji or icon identifier
  badgeType: text("badge_type").notNull(), // top_fundraiser, milestone, activity, special
  threshold: decimal("threshold", { precision: 12, scale: 2 }), // Amount threshold if applicable
  displayOrder: integer("display_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertP2PGamificationBadgeSchema = createInsertSchema(p2pGamificationBadges).omit({
  id: true,
  createdAt: true,
});

export type InsertP2PGamificationBadge = z.infer<typeof insertP2PGamificationBadgeSchema>;
export type P2PGamificationBadge = typeof p2pGamificationBadges.$inferSelect;

// P2P Participant Badges - Awarded badges to participants
export const p2pParticipantBadges = pgTable("p2p_participant_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").notNull().references(() => p2pParticipants.id, { onDelete: "cascade" }),
  badgeId: varchar("badge_id").notNull().references(() => p2pGamificationBadges.id, { onDelete: "cascade" }),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
});

export const insertP2PParticipantBadgeSchema = createInsertSchema(p2pParticipantBadges).omit({
  id: true,
  awardedAt: true,
});

export type InsertP2PParticipantBadge = z.infer<typeof insertP2PParticipantBadgeSchema>;
export type P2PParticipantBadge = typeof p2pParticipantBadges.$inferSelect;

// P2P Documents - Document library for participants
export const p2pDocuments = pgTable("p2p_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"), // In bytes
  fileType: text("file_type"), // pdf, image, document
  category: text("category"), // resources, templates, guides, etc
  accessScope: text("access_scope").default("all_participants").notNull(), // all_participants, team_captains, admins
  downloadCount: integer("download_count").default(0).notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete for version control and analytics
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertP2PDocumentSchema = createInsertSchema(p2pDocuments).omit({
  id: true,
  downloadCount: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertP2PDocument = z.infer<typeof insertP2PDocumentSchema>;
export type P2PDocument = typeof p2pDocuments.$inferSelect;

// ==============================
// END OF P2P TABLES
// ==============================

// Livestreams table - for live worship/event giving
export const livestreams = pgTable("livestreams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "set null" }), // Optional parent campaign
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  platform: text("platform").notNull(), // youtube, facebook, custom
  videoId: text("video_id"), // YouTube video ID or Facebook video ID
  embedUrl: text("embed_url"), // Custom embed URL if not YouTube/Facebook
  chatUrl: text("chat_url"), // Link to external chat (e.g., YouTube chat)
  scheduledStart: timestamp("scheduled_start").notNull(),
  scheduledEnd: timestamp("scheduled_end"),
  actualStart: timestamp("actual_start"),
  actualEnd: timestamp("actual_end"),
  status: text("status").default("scheduled").notNull(), // scheduled, live, ended, replay
  totalRaised: decimal("total_raised", { precision: 12, scale: 2 }).default("0").notNull(),
  donorCount: integer("donor_count").default(0).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  isPaid: boolean("is_paid").default(false).notNull(), // Ticketed livestream
  ticketPrice: decimal("ticket_price", { precision: 10, scale: 2 }).default("0"),
  currency: text("currency").default("USD").notNull(),
  replayAvailable: boolean("replay_available").default(true).notNull(), // Keep giving open after event
  aiInsights: jsonb("ai_insights").default({}), // Stores AI-generated insights, quotes, highlights
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLivestreamSchema = createInsertSchema(livestreams, {
  scheduledStart: z.coerce.date(),
  scheduledEnd: z.coerce.date().optional(),
  actualStart: z.coerce.date().optional(),
  actualEnd: z.coerce.date().optional(),
}).omit({
  id: true,
  totalRaised: true,
  donorCount: true,
  viewCount: true,
  createdAt: true,
});

export type InsertLivestream = z.infer<typeof insertLivestreamSchema>;
export type Livestream = typeof livestreams.$inferSelect;

// Livestream Donations table - donations made during livestreams
export const livestreamDonations = pgTable("livestream_donations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  livestreamId: varchar("livestream_id").notNull().references(() => livestreams.id, { onDelete: "cascade" }),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  donorId: varchar("donor_id").references(() => donors.id, { onDelete: "set null" }),
  donorName: text("donor_name").notNull(),
  donorEmail: text("donor_email").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  category: text("category"), // tithe, sadaqa, zakat, general, offering
  message: text("message"), // Optional message to display
  showName: boolean("show_name").default(true).notNull(), // Display name in shout-outs
  showAmount: boolean("show_amount").default(true).notNull(), // Display amount in shout-outs
  highlighted: boolean("highlighted").default(false).notNull(), // Featured in overlay
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLivestreamDonationSchema = createInsertSchema(livestreamDonations).omit({
  id: true,
  createdAt: true,
});

export type InsertLivestreamDonation = z.infer<typeof insertLivestreamDonationSchema>;
export type LivestreamDonation = typeof livestreamDonations.$inferSelect;

// Livestream Chat Messages table - for real-time chat feed
export const livestreamChatMessages = pgTable("livestream_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  livestreamId: varchar("livestream_id").notNull().references(() => livestreams.id, { onDelete: "cascade" }),
  donorId: varchar("donor_id").references(() => donors.id, { onDelete: "set null" }),
  donorName: text("donor_name").notNull(),
  message: text("message").notNull(),
  isDonor: boolean("is_donor").default(false).notNull(), // Has made a donation
  donorBadge: text("donor_badge"), // bronze, silver, gold, platinum based on tier
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLivestreamChatMessageSchema = createInsertSchema(livestreamChatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertLivestreamChatMessage = z.infer<typeof insertLivestreamChatMessageSchema>;
export type LivestreamChatMessage = typeof livestreamChatMessages.$inferSelect;

// Livestream Access table - for ticketed livestream access control
export const livestreamAccess = pgTable("livestream_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  livestreamId: varchar("livestream_id").notNull().references(() => livestreams.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  accessToken: text("access_token").notNull().unique(), // Unique token for access
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLivestreamAccessSchema = createInsertSchema(livestreamAccess).omit({
  id: true,
  createdAt: true,
});

export type InsertLivestreamAccess = z.infer<typeof insertLivestreamAccessSchema>;
export type LivestreamAccess = typeof livestreamAccess.$inferSelect;

// Contacts table - comprehensive contact management for charities
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Basic Information
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  
  // Address
  street: text("street"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country"),
  
  // Organization/Company (for sponsors, corporate donors, etc.)
  company: text("company"),
  jobTitle: text("job_title"),
  
  // Contact Types (can be multiple: donor, volunteer, sponsor, etc.)
  types: text("types").array().notNull().default(sql`'{}'`), // donor, volunteer, lead, sponsor, speaker, partner, vendor, beneficiary
  
  // Donor-specific fields
  totalDonated: decimal("total_donated", { precision: 12, scale: 2 }).default("0"),
  donationCount: integer("donation_count").default(0),
  lastDonationDate: timestamp("last_donation_date"),
  donorTier: text("donor_tier"), // bronze, silver, gold, platinum
  
  // Volunteer-specific fields
  skills: text("skills").array().default(sql`'{}'`), // Array of skills/interests
  availability: text("availability"), // Available days/times as text
  hoursContributed: integer("hours_contributed").default(0),
  volunteerStatus: text("volunteer_status"), // active, inactive, on_break
  
  // Sponsor-specific fields
  sponsorshipLevel: text("sponsorship_level"), // bronze, silver, gold, platinum, custom
  sponsorshipAmount: decimal("sponsorship_amount", { precision: 12, scale: 2 }),
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),
  
  // Lead-specific fields
  leadSource: text("lead_source"), // website, event, referral, social media, etc.
  leadStatus: text("lead_status"), // new, contacted, qualified, converted, closed
  leadScore: integer("lead_score"), // 0-100 scoring system
  
  // Communication preferences
  preferredContactMethod: text("preferred_contact_method"), // email, phone, sms, mail
  emailOptIn: boolean("email_opt_in").default(true),
  smsOptIn: boolean("sms_opt_in").default(false),
  
  // General fields
  notes: text("notes"), // General notes about the contact
  lastContactedDate: timestamp("last_contacted_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  
  // Social media
  linkedinUrl: text("linkedin_url"),
  twitterHandle: text("twitter_handle"),
  
  // Status
  status: text("status").default("active").notNull(), // active, inactive, archived
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  orgId: true,
  totalDonated: true,
  donationCount: true,
  hoursContributed: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

// Contact Tags table - flexible tagging system
export const contactTags = pgTable("contact_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("#3B82F6"), // Hex color for tag display
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContactTagSchema = createInsertSchema(contactTags).omit({
  id: true,
  createdAt: true,
});

export type InsertContactTag = z.infer<typeof insertContactTagSchema>;
export type ContactTag = typeof contactTags.$inferSelect;

// Contact Tags Junction table - many-to-many relationship between contacts and tags
export const contactTagAssignments = pgTable("contact_tag_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contactId: varchar("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => contactTags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContactTagAssignmentSchema = createInsertSchema(contactTagAssignments).omit({
  id: true,
  createdAt: true,
});

export type InsertContactTagAssignment = z.infer<typeof insertContactTagAssignmentSchema>;
export type ContactTagAssignment = typeof contactTagAssignments.$inferSelect;

// Contact Activities table - track interactions and history
export const contactActivities = pgTable("contact_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contactId: varchar("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // call, email, meeting, donation, volunteer_activity, note, etc.
  subject: text("subject"),
  description: text("description"),
  outcome: text("outcome"), // successful, failed, pending, etc.
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // Staff member who logged the activity
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContactActivitySchema = createInsertSchema(contactActivities).omit({
  id: true,
  createdAt: true,
});

export type InsertContactActivity = z.infer<typeof insertContactActivitySchema>;
export type ContactActivity = typeof contactActivities.$inferSelect;

// Prayer Settings table - for Muslim Prayer Timetable module
export const prayerSettings = pgTable("prayer_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }).unique(),
  city: text("city").notNull(), // e.g., "London", "Dubai"
  country: text("country").notNull(), // e.g., "UK", "UAE"
  latitude: decimal("latitude", { precision: 10, scale: 7 }), // Optional for more accuracy
  longitude: decimal("longitude", { precision: 10, scale: 7 }), // Optional for more accuracy
  calculationMethod: integer("calculation_method").default(2).notNull(), // AlAdhan method number (2 = ISNA by default)
  timezone: text("timezone").notNull(), // IANA timezone, e.g., "Europe/London"
  cachedPrayerTimes: jsonb("cached_prayer_times").default({}), // Store today's prayer times to reduce API calls
  lastFetched: timestamp("last_fetched"), // When prayer times were last fetched
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPrayerSettingsSchema = createInsertSchema(prayerSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  latitude: z.union([z.string(), z.number(), z.null()]).transform(val => {
    if (val === "" || val === null || val === undefined) return null;
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    }
    return val;
  }).nullable().optional(),
  longitude: z.union([z.string(), z.number(), z.null()]).transform(val => {
    if (val === "" || val === null || val === undefined) return null;
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    }
    return val;
  }).nullable().optional(),
});

export type InsertPrayerSettings = z.infer<typeof insertPrayerSettingsSchema>;
export type PrayerSettings = typeof prayerSettings.$inferSelect;

// Landing Pages table
export const landingPages = pgTable("landing_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(), // For public URL: /p/{slug}
  title: text("title").notNull(),
  description: text("description"),
  heroImageUrl: text("hero_image_url"),
  bannerImageUrl: text("banner_image_url"), // AI-generated banner displayed below org name
  aboutUs: text("about_us"), // About Us section content
  // Page builder components - similar to campaign pageComponents
  pageComponents: jsonb("page_components").default([]).notNull(),
  // Customization settings
  settings: jsonb("settings").default({
    primaryColor: "#00BCD4",
    secondaryColor: "#FF5722",
    fontFamily: "Inter",
    showCampaigns: true,
    showEvents: true,
    showLivestreams: true,
    showDonations: true,
    showPrayerTimes: false, // Only show if prayer_timetable module enabled
    showSermons: false,
    showVolunteers: false,
    showChatbot: true,
    moduleOrder: ["campaigns", "events", "livestreams", "donations", "prayerTimes", "sermons", "volunteers"], // Order of sections
  }).notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLandingPageSchema = createInsertSchema(landingPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export type InsertLandingPage = z.infer<typeof insertLandingPageSchema>;
export type LandingPage = typeof landingPages.$inferSelect;

// Email Templates table for thank you notes and notifications
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Template name for admin reference
  templateType: text("template_type"), // donation_thank_you, event_confirmation, email_builder, etc.
  subject: text("subject").notNull(),
  previewText: text("preview_text"), // Email preview text (for email builder)
  htmlBody: text("html_body"), // HTML email content with placeholders (legacy/simple templates)
  textBody: text("text_body"), // Plain text fallback
  blocks: jsonb("blocks").default([]), // JSON array of email blocks (for email builder)
  thumbnailUrl: text("thumbnail_url"), // Preview image (for email builder)
  // Donation thank you template conditions
  donationType: text("donation_type"), // one-time, recurring, both - only for donation_thank_you templates
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }), // Minimum donation amount to trigger this template
  maxAmount: decimal("max_amount", { precision: 10, scale: 2 }), // Maximum donation amount to trigger this template
  priority: integer("priority").default(0).notNull(), // Higher priority templates are checked first
  isDefault: boolean("is_default").default(false).notNull(), // Is this the default template for this type?
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

// Sermon Categories table
export const sermonCategories = pgTable("sermon_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSermonCategorySchema = createInsertSchema(sermonCategories).omit({
  id: true,
  createdAt: true,
});

export type InsertSermonCategory = z.infer<typeof insertSermonCategorySchema>;
export type SermonCategory = typeof sermonCategories.$inferSelect;

// Sermon Tags table
export const sermonTags = pgTable("sermon_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSermonTagSchema = createInsertSchema(sermonTags).omit({
  id: true,
  createdAt: true,
});

export type InsertSermonTag = z.infer<typeof insertSermonTagSchema>;
export type SermonTag = typeof sermonTags.$inferSelect;

// Sermons table - Main sermon media library
export const sermons = pgTable("sermons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  speaker: text("speaker").notNull(), // Pastor/speaker name
  sermonDate: timestamp("sermon_date").notNull(), // When the sermon was preached
  categoryId: varchar("category_id").references(() => sermonCategories.id, { onDelete: "set null" }),
  
  // Media URLs
  videoUrl: text("video_url"), // Uploaded video or embedded URL (YouTube/Facebook/Vimeo)
  audioUrl: text("audio_url"), // Uploaded audio file
  notesUrl: text("notes_url"), // PDF sermon notes
  thumbnailUrl: text("thumbnail_url"),
  
  // Platform integration
  platform: text("platform"), // youtube, facebook, vimeo, upload
  platformVideoId: text("platform_video_id"), // Video ID from platform
  
  // Metadata
  duration: integer("duration"), // Duration in seconds
  views: integer("views").default(0).notNull(),
  scripture: text("scripture").array(), // Array of scripture references (e.g., ["John 3:16", "Romans 8:28"])
  
  // AI-generated content
  aiSummary: text("ai_summary"), // AI-generated sermon summary
  aiNotes: text("ai_notes"), // AI-generated sermon notes
  searchEmbedding: text("search_embedding"), // Vector embedding for AI search
  
  // Status
  status: text("status").default("published").notNull(), // draft, published, archived
  isFeatured: boolean("is_featured").default(false).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSermonSchema = createInsertSchema(sermons).omit({
  id: true,
  views: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  sermonDate: z.coerce.date(),
  duration: z.coerce.number().optional().nullable(),
});

export type InsertSermon = z.infer<typeof insertSermonSchema>;
export type Sermon = typeof sermons.$inferSelect;

// Sermon Tag Assignments (many-to-many)
export const sermonTagAssignments = pgTable("sermon_tag_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sermonId: varchar("sermon_id").notNull().references(() => sermons.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => sermonTags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSermonTagAssignmentSchema = createInsertSchema(sermonTagAssignments).omit({
  id: true,
  createdAt: true,
});

export type InsertSermonTagAssignment = z.infer<typeof insertSermonTagAssignmentSchema>;
export type SermonTagAssignment = typeof sermonTagAssignments.$inferSelect;

// Volunteers table - Volunteer profiles and management
export const volunteers = pgTable("volunteers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Personal Information
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  dateOfBirth: timestamp("date_of_birth"),
  
  // Address
  street: text("street"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country"),
  
  // Profile
  photoUrl: text("photo_url"),
  bio: text("bio"),
  skills: text("skills").array().default([]), // Array of skills (e.g., ["Teaching", "Music", "Tech Support"])
  interests: text("interests").array().default([]), // Areas of interest
  
  // Availability & Preferences
  availability: jsonb("availability").default({}), // JSON object with availability schedule
  preferredRoles: text("preferred_roles").array().default([]), // Preferred volunteer roles
  teams: text("teams").array().default([]), // Team assignments (e.g., ["Youth Ministry", "Hospitality"])
  
  // Status & Tracking
  status: text("status").default("active").notNull(), // active, inactive, on_hold
  totalHours: integer("total_hours").default(0).notNull(), // Total hours volunteered
  shiftCount: integer("shift_count").default(0).notNull(), // Number of shifts completed
  startDate: timestamp("start_date"), // When they started volunteering
  
  // Emergency Contact
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactRelationship: text("emergency_contact_relationship"),
  
  // Notes & Admin
  notes: text("notes"), // Admin notes about the volunteer
  backgroundCheckStatus: text("background_check_status"), // pending, completed, not_required
  backgroundCheckDate: timestamp("background_check_date"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVolunteerSchema = createInsertSchema(volunteers).omit({
  id: true,
  totalHours: true,
  shiftCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVolunteer = z.infer<typeof insertVolunteerSchema>;
export type Volunteer = typeof volunteers.$inferSelect;

// Volunteer Shifts table - Shift scheduling and assignments
export const volunteerShifts = pgTable("volunteer_shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  volunteerId: varchar("volunteer_id").notNull().references(() => volunteers.id, { onDelete: "cascade" }),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "set null" }), // Optional link to an event
  
  // Shift Details
  title: text("title").notNull(), // e.g., "Sunday Service Setup", "Food Bank Distribution"
  description: text("description"),
  location: text("location"),
  
  // Schedule
  shiftDate: timestamp("shift_date").notNull(),
  startTime: text("start_time").notNull(), // Time in HH:MM format
  endTime: text("end_time").notNull(),
  
  // Assignment
  role: text("role"), // Specific role for this shift (e.g., "Greeter", "Tech Support")
  team: text("team"), // Team assignment
  
  // Status
  status: text("status").default("scheduled").notNull(), // scheduled, completed, cancelled, no_show
  reminderSent: boolean("reminder_sent").default(false).notNull(),
  reminderSentAt: timestamp("reminder_sent_at"),
  
  // Notes
  notes: text("notes"), // Shift-specific notes or instructions
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVolunteerShiftSchema = createInsertSchema(volunteerShifts).omit({
  id: true,
  reminderSent: true,
  reminderSentAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  shiftDate: z.coerce.date(),
});

export type InsertVolunteerShift = z.infer<typeof insertVolunteerShiftSchema>;
export type VolunteerShift = typeof volunteerShifts.$inferSelect;

// Volunteer Hours table - Manual hour logging and tracking
export const volunteerHours = pgTable("volunteer_hours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  volunteerId: varchar("volunteer_id").notNull().references(() => volunteers.id, { onDelete: "cascade" }),
  shiftId: varchar("shift_id").references(() => volunteerShifts.id, { onDelete: "set null" }), // Optional link to a shift
  
  // Hour Details
  date: timestamp("date").notNull(),
  hoursWorked: decimal("hours_worked", { precision: 5, scale: 2 }).notNull(), // e.g., 3.5 hours
  activity: text("activity").notNull(), // What they did
  description: text("description"), // Additional details
  
  // Approval
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  approvedBy: varchar("approved_by"), // Admin user who approved
  approvedAt: timestamp("approved_at"),
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVolunteerHourSchema = createInsertSchema(volunteerHours).omit({
  id: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.coerce.date(),
});

export type InsertVolunteerHour = z.infer<typeof insertVolunteerHourSchema>;
export type VolunteerHour = typeof volunteerHours.$inferSelect;

// Beneficiaries table - Individuals and organizations receiving support
export const beneficiaries = pgTable("beneficiaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Basic Information
  type: text("type").notNull(), // individual, organization, family
  firstName: text("first_name"), // For individuals
  lastName: text("last_name"), // For individuals
  organizationName: text("organization_name"), // For organizations
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"), // male, female, other, prefer_not_to_say
  
  // Contact Information
  email: text("email"),
  phone: text("phone"),
  street: text("street"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country"),
  
  // Profile & Background
  photoUrl: text("photo_url"),
  biography: text("biography"), // Their story, background
  occupation: text("occupation"),
  education: text("education"),
  languages: jsonb("languages").default([]), // Array of languages spoken
  
  // Health Information
  healthStatus: text("health_status"), // good, fair, poor, critical
  medicalConditions: jsonb("medical_conditions").default([]), // Array of conditions
  disabilities: text("disabilities"),
  medications: jsonb("medications").default([]), // Array of medications
  allergies: jsonb("allergies").default([]), // Array of allergies
  lastMedicalCheckup: timestamp("last_medical_checkup"),
  
  // Needs Assessment
  primaryNeeds: jsonb("primary_needs").default([]), // food, shelter, healthcare, education, etc
  urgencyLevel: text("urgency_level").default("medium").notNull(), // low, medium, high, critical
  housingStatus: text("housing_status"), // owned, rented, homeless, temporary, assisted
  employmentStatus: text("employment_status"), // employed, unemployed, student, retired, disabled
  monthlyIncome: decimal("monthly_income", { precision: 12, scale: 2 }),
  numberOfDependents: integer("number_of_dependents").default(0),
  
  // Support History
  totalDonationsReceived: decimal("total_donations_received", { precision: 12, scale: 2 }).default("0").notNull(),
  totalGiftsReceived: integer("total_gifts_received").default(0).notNull(),
  firstSupportDate: timestamp("first_support_date"),
  lastSupportDate: timestamp("last_support_date"),
  
  // Status & Management
  status: text("status").default("active").notNull(), // active, inactive, graduated, archived
  caseManager: text("case_manager"), // Staff member managing this case
  referralSource: text("referral_source"), // How they were referred
  tags: jsonb("tags").default([]), // Array of custom tags
  
  // Administrative
  internalNotes: text("internal_notes"), // Private notes for staff
  publicNotes: text("public_notes"), // Notes that can be shared
  verificationStatus: text("verification_status").default("pending").notNull(), // pending, verified, needs_review
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBeneficiarySchema = createInsertSchema(beneficiaries).omit({
  id: true,
  orgId: true,
  totalDonationsReceived: true,
  totalGiftsReceived: true,
  firstSupportDate: true,
  lastSupportDate: true,
  verifiedAt: true,
  verifiedBy: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dateOfBirth: z.coerce.date().optional(),
  lastMedicalCheckup: z.coerce.date().optional(),
});

export type InsertBeneficiary = z.infer<typeof insertBeneficiarySchema>;
export type Beneficiary = typeof beneficiaries.$inferSelect;

// Beneficiary Donations table - Links donations/gifts to beneficiaries
export const beneficiaryDonations = pgTable("beneficiary_donations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  beneficiaryId: varchar("beneficiary_id").notNull().references(() => beneficiaries.id, { onDelete: "cascade" }),
  donationId: varchar("donation_id").references(() => donations.id, { onDelete: "set null" }), // Link to actual donation if applicable
  
  // Source of Funds
  sourceOfFunds: text("source_of_funds"), // fundraiser, event, livestream, in_person
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "set null" }), // If source is fundraiser
  eventId: varchar("event_id").references(() => events.id, { onDelete: "set null" }), // If source is event
  livestreamId: varchar("livestream_id").references(() => livestreams.id, { onDelete: "set null" }), // If source is livestream
  
  // Donation Details
  donationType: text("donation_type").notNull(), // cash, food, clothing, medical, education, housing, computers, other
  amount: decimal("amount", { precision: 12, scale: 2 }), // Monetary value (if applicable)
  currency: text("currency").default("USD"),
  description: text("description").notNull(), // What was given
  quantity: integer("quantity"), // For non-monetary items
  
  // Delivery Information
  deliveryDate: timestamp("delivery_date").notNull(),
  deliveryMethod: text("delivery_method"), // in_person, mailed, bank_transfer, voucher
  deliveredBy: text("delivered_by"), // Staff member or volunteer who delivered
  receiptUrl: text("receipt_url"), // Photo or scan of receipt/acknowledgment
  
  // Impact & Follow-up
  impactNotes: text("impact_notes"), // How this helped the beneficiary
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  
  // Status
  status: text("status").default("completed").notNull(), // pending, completed, cancelled
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBeneficiaryDonationSchema = createInsertSchema(beneficiaryDonations).omit({
  id: true,
  orgId: true,
  beneficiaryId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  deliveryDate: z.coerce.date(),
  followUpDate: z.coerce.date().optional(),
});

export type InsertBeneficiaryDonation = z.infer<typeof insertBeneficiaryDonationSchema>;
export type BeneficiaryDonation = typeof beneficiaryDonations.$inferSelect;

// Beneficiary Communications table - Timeline of all interactions
export const beneficiaryCommunications = pgTable("beneficiary_communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  beneficiaryId: varchar("beneficiary_id").notNull().references(() => beneficiaries.id, { onDelete: "cascade" }),
  
  // Communication Details
  type: text("type").notNull(), // call, email, visit, sms, assessment, note, meeting
  subject: text("subject"), // Title/subject of communication
  content: text("content").notNull(), // Content of the communication
  direction: text("direction"), // inbound, outbound, internal
  
  // Metadata
  communicationDate: timestamp("communication_date").defaultNow().notNull(),
  staffMember: text("staff_member"), // Who made the communication
  attachments: jsonb("attachments").default([]), // Array of file URLs
  
  // Follow-up
  requiresFollowUp: boolean("requires_follow_up").default(false),
  followUpDate: timestamp("follow_up_date"),
  followUpCompleted: boolean("follow_up_completed").default(false),
  
  // Tags & Categorization
  tags: jsonb("tags").default([]), // Custom tags
  priority: text("priority").default("normal"), // low, normal, high, urgent
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBeneficiaryCommunicationSchema = createInsertSchema(beneficiaryCommunications).omit({
  id: true,
  followUpCompleted: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBeneficiaryCommunication = z.infer<typeof insertBeneficiaryCommunicationSchema>;
export type BeneficiaryCommunication = typeof beneficiaryCommunications.$inferSelect;

// Prayer Requests table - Public prayer wall
export const prayerRequests = pgTable("prayer_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Submitter Information (optional for anonymous prayers)
  submitterName: text("submitter_name"),
  submitterEmail: text("submitter_email"),
  isAnonymous: boolean("is_anonymous").default(false),
  
  // Prayer Request Content
  requestText: text("request_text").notNull(),
  category: text("category"), // health, family, financial, spiritual, guidance, thanksgiving, other
  
  // Status & Moderation
  status: text("status").default("pending").notNull(), // pending, approved, declined, answered
  moderationStatus: text("moderation_status").default("pending").notNull(), // pending, approved, flagged
  moderationNotes: text("moderation_notes"),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  
  // AI Analysis
  aiSuggestions: jsonb("ai_suggestions").default({}), // Category, sentiment, flags
  
  // Public Display
  isPublic: boolean("is_public").default(true),
  isPinned: boolean("is_pinned").default(false),
  
  // Prayer Count & Engagement
  prayerCount: integer("prayer_count").default(0).notNull(),
  
  // Answered Status
  isAnswered: boolean("is_answered").default(false),
  answeredAt: timestamp("answered_at"),
  answeredNote: text("answered_note"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPrayerRequestSchema = createInsertSchema(prayerRequests).omit({
  id: true,
  prayerCount: true,
  reviewedBy: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPrayerRequest = z.infer<typeof insertPrayerRequestSchema>;
export type PrayerRequest = typeof prayerRequests.$inferSelect;

// Activities table - Classes and courses
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Activity Details
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  category: text("category"),
  tags: jsonb("tags"),
  
  // Teacher Information
  teacherName: text("teacher_name"),
  teacherId: varchar("teacher_id"),
  teacherBio: text("teacher_bio"),
  teacherImageUrl: text("teacher_image_url"),
  
  // Pricing
  isFree: boolean("is_free").default(true).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).default("0").notNull(),
  currency: text("currency").default("USD"),
  
  // Capacity
  maxStudents: integer("max_students"),
  currentStudents: integer("current_students").default(0).notNull(),
  allowWaitlist: boolean("allow_waitlist").default(false).notNull(),
  
  // Schedule
  scheduleType: text("schedule_type").default("weekly").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  startTime: text("start_time"), // Time in HH:MM format for one-time activities
  endTime: text("end_time"), // Time in HH:MM format for one-time activities
  
  // Status
  status: text("status").default("draft").notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  requiresApproval: boolean("requires_approval").default(false).notNull(),
  
  // Settings
  settings: jsonb("settings"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  orgId: true,
  currentStudents: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  price: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  maxStudents: z.union([z.string(), z.number()]).transform(val => val ? Number(val) : null).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  settings: z.record(z.any()).optional().nullable(),
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Activity Sessions table - Timetable/Schedule
export const activitySessions = pgTable("activity_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityId: varchar("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Timing
  sessionDate: timestamp("session_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  
  // Location
  location: text("location"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertActivitySessionSchema = createInsertSchema(activitySessions).omit({
  id: true,
  activityId: true,
  orgId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  sessionDate: z.coerce.date(),
});

export type InsertActivitySession = z.infer<typeof insertActivitySessionSchema>;
export type ActivitySession = typeof activitySessions.$inferSelect;

// Activity Registrations table - Enrolled students
export const activityRegistrations = pgTable("activity_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityId: varchar("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Student Information
  studentName: text("student_name").notNull(),
  studentEmail: text("student_email").notNull(),
  studentPhone: text("student_phone"),
  
  // Parent/Guardian Information
  parentName: text("parent_name"),
  parentEmail: text("parent_email"),
  parentPhone: text("parent_phone"),
  
  // Registration Status
  status: text("status").default("confirmed").notNull(),
  
  // Payment
  stripePaymentId: text("stripe_payment_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertActivityRegistrationSchema = createInsertSchema(activityRegistrations).omit({
  id: true,
  activityId: true,
  orgId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertActivityRegistration = z.infer<typeof insertActivityRegistrationSchema>;
export type ActivityRegistration = typeof activityRegistrations.$inferSelect;

// Activity Attendance table - Attendance register
export const activityAttendance = pgTable("activity_attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityId: varchar("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  registrationId: varchar("registration_id").notNull().references(() => activityRegistrations.id, { onDelete: "cascade" }),
  
  // Attendance Details
  sessionDate: timestamp("session_date").notNull(),
  attended: boolean("attended").default(false).notNull(),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertActivityAttendanceSchema = createInsertSchema(activityAttendance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  sessionDate: z.coerce.date(),
});

export type InsertActivityAttendance = z.infer<typeof insertActivityAttendanceSchema>;
export type ActivityAttendance = typeof activityAttendance.$inferSelect;

// ============================================
// EMAIL BUILDER TABLES
// ============================================

// Member Tags table - for organizing members into groups
export const memberTags = pgTable("member_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#3B82F6"), // Hex color for UI
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMemberTagSchema = createInsertSchema(memberTags).omit({
  id: true,
  createdAt: true,
});

export type InsertMemberTag = z.infer<typeof insertMemberTagSchema>;
export type MemberTag = typeof memberTags.$inferSelect;

// Member Tag Assignments table - many-to-many relationship
export const memberTagAssignments = pgTable("member_tag_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  memberId: varchar("member_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => memberTags.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

export const insertMemberTagAssignmentSchema = createInsertSchema(memberTagAssignments).omit({
  id: true,
  assignedAt: true,
});

export type InsertMemberTagAssignment = z.infer<typeof insertMemberTagAssignmentSchema>;
export type MemberTagAssignment = typeof memberTagAssignments.$inferSelect;

// Email Campaigns table - email sends
export const emailCampaigns = pgTable("email_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  templateId: varchar("template_id").references(() => emailTemplates.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  previewText: text("preview_text"),
  blocks: jsonb("blocks").default([]).notNull(), // Snapshot of blocks at send time
  
  // Recipient selection
  recipientType: text("recipient_type").notNull(), // all_members, by_tags, custom
  recipientTags: jsonb("recipient_tags").default([]), // Array of tag IDs if by_tags
  recipientEmails: jsonb("recipient_emails").default([]), // Array of emails if custom
  
  // Scheduling
  status: text("status").default("draft").notNull(), // draft, scheduled, sending, sent, failed
  scheduledFor: timestamp("scheduled_for"), // If scheduled for later
  sentAt: timestamp("sent_at"),
  
  // Stats
  totalRecipients: integer("total_recipients").default(0).notNull(),
  sentCount: integer("sent_count").default(0).notNull(),
  deliveredCount: integer("delivered_count").default(0).notNull(),
  openedCount: integer("opened_count").default(0).notNull(),
  clickedCount: integer("clicked_count").default(0).notNull(),
  bouncedCount: integer("bounced_count").default(0).notNull(),
  unsubscribedCount: integer("unsubscribed_count").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  totalRecipients: true,
  sentCount: true,
  deliveredCount: true,
  openedCount: true,
  clickedCount: true,
  bouncedCount: true,
  unsubscribedCount: true,
  sentAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;

// Email Recipients table - individual send tracking
export const emailRecipients = pgTable("email_recipients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => emailCampaigns.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  
  // Tracking
  status: text("status").default("pending").notNull(), // pending, sent, delivered, bounced, failed
  resendEmailId: text("resend_email_id"), // Resend's email ID for tracking
  unsubscribeToken: text("unsubscribe_token").notNull(), // Unique token for unsubscribe link
  
  // Event timestamps
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bouncedAt: timestamp("bounced_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  
  // Error tracking
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEmailRecipientSchema = createInsertSchema(emailRecipients).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
  openedAt: true,
  clickedAt: true,
  bouncedAt: true,
  unsubscribedAt: true,
  createdAt: true,
});

export type InsertEmailRecipient = z.infer<typeof insertEmailRecipientSchema>;
export type EmailRecipient = typeof emailRecipients.$inferSelect;

// Email Events table - detailed event tracking from Resend webhooks
export const emailEvents = pgTable("email_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => emailCampaigns.id, { onDelete: "cascade" }),
  recipientId: varchar("recipient_id").references(() => emailRecipients.id, { onDelete: "cascade" }),
  resendEmailId: text("resend_email_id"), // Resend's email ID
  
  eventType: text("event_type").notNull(), // delivered, bounced, opened, clicked, complained
  email: text("email"),
  
  // Event metadata
  metadata: jsonb("metadata").default({}), // Additional data from Resend (IP, user agent, etc.)
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertEmailEventSchema = createInsertSchema(emailEvents).omit({
  id: true,
  timestamp: true,
});

export type InsertEmailEvent = z.infer<typeof insertEmailEventSchema>;
export type EmailEvent = typeof emailEvents.$inferSelect;
