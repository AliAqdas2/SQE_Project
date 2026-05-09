import { 
  type User, 
  type InsertUser,
  type Organization,
  type InsertOrganization,
  type Campaign,
  type InsertCampaign,
  type CampaignStrategy,
  type InsertCampaignStrategy,
  type Donor,
  type InsertDonor,
  type Donation,
  type DonationWithDonor,
  type InsertDonation,
  type Event,
  type InsertEvent,
  type EventRegistration,
  type InsertEventRegistration,
  type EventTicketType,
  type InsertEventTicketType,
  type EventSpeaker,
  type InsertEventSpeaker,
  type EventSponsor,
  type InsertEventSponsor,
  type EventPromoCode,
  type InsertEventPromoCode,
  type OrganizationRegistration,
  type InsertOrganizationRegistration,
  type AuthToken,
  type InsertAuthToken,
  type MarketplaceModule,
  type InsertMarketplaceModule,
  type ModulePricing,
  type InsertModulePricing,
  type OrganizationModule,
  type InsertOrganizationModule,
  type Partner,
  type InsertPartner,
  type ReferralCode,
  type InsertReferralCode,
  type Subscription,
  type InsertSubscription,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type CountryPricing,
  type InsertCountryPricing,
  type OrganizationSubscription,
  type InsertOrganizationSubscription,
  type Livestream,
  type InsertLivestream,
  type LivestreamDonation,
  type InsertLivestreamDonation,
  type LivestreamChatMessage,
  type InsertLivestreamChatMessage,
  type LivestreamAccess,
  type InsertLivestreamAccess,
  type Contact,
  type InsertContact,
  type ContactTag,
  type InsertContactTag,
  type ContactTagAssignment,
  type InsertContactTagAssignment,
  type ContactActivity,
  type InsertContactActivity,
  type PrayerSettings,
  type InsertPrayerSettings,
  type LandingPage,
  type InsertLandingPage,
  type EmailTemplate,
  type InsertEmailTemplate,
  type MemberTag,
  type InsertMemberTag,
  type MemberTagAssignment,
  type InsertMemberTagAssignment,
  type EmailCampaign,
  type InsertEmailCampaign,
  type EmailRecipient,
  type InsertEmailRecipient,
  type EmailEvent,
  type InsertEmailEvent,
  type Sermon,
  type InsertSermon,
  type SermonCategory,
  type InsertSermonCategory,
  type SermonTag,
  type InsertSermonTag,
  type SermonTagAssignment,
  type InsertSermonTagAssignment,
  type Volunteer,
  type InsertVolunteer,
  type VolunteerShift,
  type InsertVolunteerShift,
  type VolunteerHour,
  type InsertVolunteerHour,
  type Beneficiary,
  type InsertBeneficiary,
  type BeneficiaryDonation,
  type InsertBeneficiaryDonation,
  type BeneficiaryCommunication,
  type InsertBeneficiaryCommunication,
  type Activity,
  type InsertActivity,
  type ActivitySession,
  type InsertActivitySession,
  type ActivityRegistration,
  type InsertActivityRegistration,
  type ActivityAttendance,
  type InsertActivityAttendance,
  type P2PCampaignSettings,
  type InsertP2PCampaignSettings,
  type P2PParticipant,
  type InsertP2PParticipant,
  type P2PParticipantWithStats,
  type P2PInvitation,
  type InsertP2PInvitation,
  type P2PMilestone,
  type InsertP2PMilestone,
  type P2PParticipantMilestone,
  type InsertP2PParticipantMilestone,
  type P2PChatMessage,
  type InsertP2PChatMessage,
  type P2PGamificationBadge,
  type InsertP2PGamificationBadge,
  type P2PParticipantBadge,
  type InsertP2PParticipantBadge,
  type P2PDocument,
  type InsertP2PDocument,
  organizations,
  campaigns,
  donors,
  donations,
  events,
  eventRegistrations,
  eventTicketTypes,
  eventSpeakers,
  eventSponsors,
  eventPromoCodes,
  users,
  organizationRegistrations,
  authTokens,
  marketplaceModules,
  modulePricing,
  organizationModules,
  partners,
  referralCodes,
  subscriptions,
  subscriptionPlans,
  countryPricing,
  organizationSubscriptions,
  livestreams,
  livestreamDonations,
  livestreamChatMessages,
  livestreamAccess,
  contacts,
  contactTags,
  contactTagAssignments,
  contactActivities,
  prayerSettings,
  landingPages,
  emailTemplates,
  memberTags,
  memberTagAssignments,
  emailCampaigns,
  emailRecipients,
  emailEvents,
  sermons,
  sermonCategories,
  sermonTags,
  sermonTagAssignments,
  volunteers,
  volunteerShifts,
  volunteerHours,
  beneficiaries,
  beneficiaryDonations,
  beneficiaryCommunications,
  activities,
  activitySessions,
  activityRegistrations,
  activityAttendance,
  campaignStrategies,
  p2pCampaignSettings,
  p2pParticipants,
  p2pInvitations,
  p2pMilestones,
  p2pParticipantMilestones,
  p2pChatMessages,
  p2pGamificationBadges,
  p2pParticipantBadges,
  p2pDocuments,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, ilike, sql, isNull, desc } from "drizzle-orm";

export interface IStorage {
  // Organizations
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  listOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, org: Partial<InsertOrganization>): Promise<Organization | undefined>;
  
  // Campaigns
  getCampaign(id: string): Promise<Campaign | undefined>;
  listCampaigns(orgId: string): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  
  // Campaign Strategies
  getCampaignStrategy(campaignId: string): Promise<CampaignStrategy | undefined>;
  createCampaignStrategy(strategy: InsertCampaignStrategy): Promise<CampaignStrategy>;
  
  // Donors
  getDonor(id: string): Promise<Donor | undefined>;
  getDonorByEmail(email: string, orgId: string): Promise<Donor | undefined>;
  listDonors(orgId: string): Promise<Donor[]>;
  searchDonors(orgId: string, query: string, limit?: number): Promise<Donor[]>;
  createDonor(donor: InsertDonor): Promise<Donor>;
  updateDonor(id: string, donor: Partial<InsertDonor>): Promise<Donor | undefined>;
  
  // Donations
  getDonation(id: string): Promise<Donation | undefined>;
  getDonationByStripePaymentId(orgId: string, stripePaymentId: string): Promise<Donation | undefined>;
  listDonations(orgId: string): Promise<Donation[]>;
  listDonationsByCampaign(campaignId: string): Promise<Donation[]>;
  listDonationsByDonor(donorId: string): Promise<Donation[]>;
  filterDonations(orgId: string, filters: {
    donationType?: string;
    startDate?: Date;
    endDate?: Date;
    donorId?: string;
    minAmount?: string;
    maxAmount?: string;
    giftAidOptIn?: boolean;
    giftAidEligible?: boolean;
    taxReliefClaimed?: boolean;
  }): Promise<DonationWithDonor[]>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  updateDonation(id: string, donation: Partial<InsertDonation>): Promise<Donation | undefined>;
  deleteDonation(id: string): Promise<void>;
  
  // Events
  getEvent(id: string): Promise<Event | undefined>;
  listEvents(orgId: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  // Atomic increment for attendee count - returns true if successful, false if would exceed capacity
  incrementEventAttendeeCount(id: string, count: number): Promise<boolean>;
  
  // Event Registrations
  getEventRegistration(id: string): Promise<EventRegistration | undefined>;
  getEventRegistrationByQrCode(qrCode: string): Promise<EventRegistration | undefined>;
  listEventRegistrations(eventId: string): Promise<EventRegistration[]>;
  createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration>;
  updateEventRegistration(id: string, registration: Partial<InsertEventRegistration>): Promise<EventRegistration | undefined>;
  
  // Event Ticket Types
  getEventTicketType(id: string): Promise<EventTicketType | undefined>;
  listEventTicketTypes(eventId: string): Promise<EventTicketType[]>;
  createEventTicketType(ticketType: InsertEventTicketType): Promise<EventTicketType>;
  updateEventTicketType(id: string, ticketType: Partial<InsertEventTicketType>): Promise<EventTicketType | undefined>;
  deleteEventTicketType(id: string): Promise<void>;
  // Atomic increment for sold count - returns true if successful, false if would exceed capacity
  incrementTicketTypeSold(id: string, count: number): Promise<boolean>;
  
  // Event Speakers
  getEventSpeaker(id: string): Promise<EventSpeaker | undefined>;
  listEventSpeakers(eventId: string): Promise<EventSpeaker[]>;
  createEventSpeaker(speaker: InsertEventSpeaker): Promise<EventSpeaker>;
  updateEventSpeaker(id: string, speaker: Partial<InsertEventSpeaker>): Promise<EventSpeaker | undefined>;
  deleteEventSpeaker(id: string): Promise<void>;

  // Event Sponsors
  getEventSponsor(id: string): Promise<EventSponsor | undefined>;
  listEventSponsors(eventId: string): Promise<EventSponsor[]>;
  createEventSponsor(sponsor: InsertEventSponsor): Promise<EventSponsor>;
  updateEventSponsor(id: string, sponsor: Partial<InsertEventSponsor>): Promise<EventSponsor | undefined>;
  deleteEventSponsor(id: string): Promise<void>;
  
  // Event Promo Codes
  getEventPromoCode(id: string): Promise<EventPromoCode | undefined>;
  getEventPromoCodeByCode(code: string, eventId: string): Promise<EventPromoCode | undefined>;
  listEventPromoCodes(eventId: string): Promise<EventPromoCode[]>;
  createEventPromoCode(promoCode: InsertEventPromoCode): Promise<EventPromoCode>;
  updateEventPromoCode(id: string, promoCode: Partial<InsertEventPromoCode>): Promise<EventPromoCode | undefined>;
  deleteEventPromoCode(id: string): Promise<void>;
  
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Organization Registrations
  getOrganizationRegistration(id: string): Promise<OrganizationRegistration | undefined>;
  listOrganizationRegistrations(status?: string): Promise<OrganizationRegistration[]>;
  createOrganizationRegistration(registration: InsertOrganizationRegistration): Promise<OrganizationRegistration>;
  updateOrganizationRegistration(id: string, registration: Partial<InsertOrganizationRegistration>): Promise<OrganizationRegistration | undefined>;
  
  // Auth Tokens
  getAuthToken(token: string): Promise<AuthToken | undefined>;
  createAuthToken(token: InsertAuthToken): Promise<AuthToken>;
  markAuthTokenUsed(id: string): Promise<void>;
  
  // Marketplace Modules
  getMarketplaceModule(id: string): Promise<MarketplaceModule | undefined>;
  getMarketplaceModuleByKey(key: string): Promise<MarketplaceModule | undefined>;
  listMarketplaceModules(activeOnly?: boolean): Promise<MarketplaceModule[]>;
  createMarketplaceModule(module: InsertMarketplaceModule): Promise<MarketplaceModule>;
  updateMarketplaceModule(id: string, module: Partial<InsertMarketplaceModule>): Promise<MarketplaceModule | undefined>;
  deleteMarketplaceModule(id: string): Promise<void>;
  
  // Module Pricing
  getModulePricing(id: string): Promise<ModulePricing | undefined>;
  listModulePricing(moduleId: string): Promise<ModulePricing[]>;
  listModulePricingByCountry(country: string): Promise<ModulePricing[]>;
  createModulePricing(pricing: InsertModulePricing): Promise<ModulePricing>;
  updateModulePricing(id: string, pricing: Partial<InsertModulePricing>): Promise<ModulePricing | undefined>;
  deleteModulePricing(id: string): Promise<void>;
  
  // Organization Modules
  getOrganizationModule(orgId: string, moduleId: string): Promise<OrganizationModule | undefined>;
  listOrganizationModules(orgId: string): Promise<OrganizationModule[]>;
  enableOrganizationModule(module: InsertOrganizationModule): Promise<OrganizationModule>;
  disableOrganizationModule(orgId: string, moduleId: string): Promise<void>;
  
  // Partners
  getPartner(id: string): Promise<Partner | undefined>;
  getPartnerByEmail(email: string): Promise<Partner | undefined>;
  listPartners(status?: string): Promise<Partner[]>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  updatePartner(id: string, partner: Partial<InsertPartner>): Promise<Partner | undefined>;
  
  // Referral Codes
  getReferralCode(id: string): Promise<ReferralCode | undefined>;
  getReferralCodeByCode(code: string): Promise<ReferralCode | undefined>;
  listReferralCodes(partnerId?: string): Promise<ReferralCode[]>;
  createReferralCode(code: InsertReferralCode): Promise<ReferralCode>;
  updateReferralCode(id: string, code: Partial<InsertReferralCode>): Promise<ReferralCode | undefined>;
  incrementReferralCodeUsage(code: string): Promise<void>;
  
  // Subscriptions
  getSubscription(id: string): Promise<Subscription | undefined>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  listSubscriptions(orgId?: string): Promise<Subscription[]>;
  listActiveSubscriptions(): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  
  // Subscription Plans
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlanByTierCode(tierCode: string): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlanByStripePriceId(stripePriceId: string): Promise<SubscriptionPlan | undefined>;
  listSubscriptionPlans(activeOnly?: boolean): Promise<SubscriptionPlan[]>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  
  // Country Pricing
  getCountryPricing(id: string): Promise<CountryPricing | undefined>;
  getCountryPricingByCountryAndTier(countryCode: string, tierCode: string): Promise<CountryPricing | undefined>;
  listCountryPricing(countryCode?: string): Promise<CountryPricing[]>;
  createCountryPricing(pricing: InsertCountryPricing): Promise<CountryPricing>;
  updateCountryPricing(id: string, pricing: Partial<InsertCountryPricing>): Promise<CountryPricing | undefined>;
  deleteCountryPricing(id: string): Promise<void>;
  
  // Organization Subscriptions
  getOrganizationSubscription(orgId: string): Promise<OrganizationSubscription | undefined>;
  getOrganizationSubscriptionByStripeId(stripeSubscriptionId: string): Promise<OrganizationSubscription | undefined>;
  getOrganizationSubscriptionByStripeCustomerId(stripeCustomerId: string): Promise<OrganizationSubscription | undefined>;
  createOrganizationSubscription(subscription: InsertOrganizationSubscription): Promise<OrganizationSubscription>;
  updateOrganizationSubscription(orgId: string, subscription: Partial<InsertOrganizationSubscription>): Promise<OrganizationSubscription | undefined>;
  
  // Livestreams
  getLivestream(id: string): Promise<Livestream | undefined>;
  listLivestreams(orgId: string): Promise<Livestream[]>;
  createLivestream(livestream: InsertLivestream): Promise<Livestream>;
  updateLivestream(id: string, livestream: Partial<InsertLivestream>): Promise<Livestream | undefined>;
  
  // Livestream Donations
  getLivestreamDonation(id: string): Promise<LivestreamDonation | undefined>;
  listLivestreamDonations(livestreamId: string): Promise<LivestreamDonation[]>;
  createLivestreamDonation(donation: InsertLivestreamDonation): Promise<LivestreamDonation>;
  incrementLivestreamViews(id: string): Promise<void>;
  
  // Livestream Chat Messages
  listLivestreamChatMessages(livestreamId: string): Promise<LivestreamChatMessage[]>;
  createLivestreamChatMessage(message: InsertLivestreamChatMessage): Promise<LivestreamChatMessage>;
  
  // Livestream Access
  getLivestreamAccess(accessToken: string): Promise<LivestreamAccess | undefined>;
  createLivestreamAccess(access: InsertLivestreamAccess): Promise<LivestreamAccess>;
  
  // Contacts
  getContact(id: string): Promise<Contact | undefined>;
  listContacts(orgId: string): Promise<Contact[]>;
  searchContacts(orgId: string, query: string): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<void>;
  
  // Contact Tags
  getContactTag(id: string): Promise<ContactTag | undefined>;
  listContactTags(orgId: string): Promise<ContactTag[]>;
  createContactTag(tag: InsertContactTag): Promise<ContactTag>;
  updateContactTag(id: string, tag: Partial<InsertContactTag>): Promise<ContactTag | undefined>;
  deleteContactTag(id: string): Promise<void>;
  
  // Contact Tag Assignments
  addTagToContact(contactId: string, tagId: string): Promise<ContactTagAssignment>;
  removeTagFromContact(contactId: string, tagId: string): Promise<void>;
  getContactTags(contactId: string): Promise<ContactTag[]>;
  
  // Contact Activities
  getContactActivity(id: string): Promise<ContactActivity | undefined>;
  listContactActivities(contactId: string): Promise<ContactActivity[]>;
  createContactActivity(activity: InsertContactActivity): Promise<ContactActivity>;
  
  // Prayer Settings
  getPrayerSettings(orgId: string): Promise<PrayerSettings | undefined>;
  createPrayerSettings(settings: InsertPrayerSettings): Promise<PrayerSettings>;
  updatePrayerSettings(orgId: string, settings: Partial<InsertPrayerSettings>): Promise<PrayerSettings | undefined>;
  
  // Landing Pages
  getLandingPage(id: string): Promise<LandingPage | undefined>;
  getLandingPageBySlug(slug: string): Promise<LandingPage | undefined>;
  getLandingPageByOrgId(orgId: string): Promise<LandingPage | undefined>;
  createLandingPage(page: InsertLandingPage): Promise<LandingPage>;
  updateLandingPage(id: string, page: Partial<InsertLandingPage>): Promise<LandingPage | undefined>;
  publishLandingPage(id: string): Promise<LandingPage | undefined>;
  unpublishLandingPage(id: string): Promise<LandingPage | undefined>;
  
  // Email Templates
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  listEmailTemplates(orgId: string, templateType?: string): Promise<EmailTemplate[]>;
  getDefaultEmailTemplate(orgId: string, templateType: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: string): Promise<void>;
  setDefaultEmailTemplate(id: string, templateType: string, orgId: string): Promise<void>;
  
  // Member Tags
  getMemberTag(id: string): Promise<MemberTag | undefined>;
  listMemberTags(orgId: string): Promise<MemberTag[]>;
  createMemberTag(tag: InsertMemberTag): Promise<MemberTag>;
  updateMemberTag(id: string, tag: Partial<InsertMemberTag>): Promise<MemberTag | undefined>;
  deleteMemberTag(id: string): Promise<void>;
  
  // Member Tag Assignments
  assignTagToMember(orgId: string, memberId: string, tagId: string): Promise<MemberTagAssignment>;
  removeTagFromMember(memberId: string, tagId: string): Promise<void>;
  getMemberTags(memberId: string): Promise<MemberTag[]>;
  getMembersByTag(tagId: string): Promise<User[]>;
  
  // Email Campaigns
  getEmailCampaign(id: string): Promise<EmailCampaign | undefined>;
  listEmailCampaigns(orgId: string, status?: string): Promise<EmailCampaign[]>;
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  updateEmailCampaign(id: string, campaign: Partial<InsertEmailCampaign>): Promise<EmailCampaign | undefined>;
  deleteEmailCampaign(id: string): Promise<void>;
  updateCampaignStats(campaignId: string, stats: Partial<EmailCampaign>): Promise<void>;
  getScheduledCampaignsToSend(now: Date): Promise<EmailCampaign[]>;
  
  // Email Recipients
  getEmailRecipient(id: string): Promise<EmailRecipient | undefined>;
  listEmailRecipients(campaignId: string): Promise<EmailRecipient[]>;
  createEmailRecipient(recipient: InsertEmailRecipient): Promise<EmailRecipient>;
  updateEmailRecipient(id: string, recipient: Partial<EmailRecipient>): Promise<EmailRecipient | undefined>;
  getRecipientByToken(token: string): Promise<EmailRecipient | undefined>;
  getRecipientByResendId(resendEmailId: string): Promise<EmailRecipient | undefined>;
  
  // Email Events
  createEmailEvent(event: InsertEmailEvent): Promise<EmailEvent>;
  listEmailEvents(campaignId: string): Promise<EmailEvent[]>;
  
  // Sermons
  getSermon(id: string): Promise<Sermon | undefined>;
  listSermons(orgId: string): Promise<Sermon[]>;
  listSermonsByCategory(categoryId: string): Promise<Sermon[]>;
  listSermonsBySpeaker(orgId: string, speaker: string): Promise<Sermon[]>;
  searchSermons(orgId: string, query: string): Promise<Sermon[]>;
  filterSermons(orgId: string, filters: {
    categoryId?: string;
    speaker?: string;
    platform?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    isFeatured?: boolean;
  }): Promise<Sermon[]>;
  createSermon(sermon: InsertSermon): Promise<Sermon>;
  updateSermon(id: string, sermon: Partial<InsertSermon>): Promise<Sermon | undefined>;
  deleteSermon(id: string): Promise<void>;
  incrementSermonViews(id: string): Promise<void>;
  
  // Sermon Categories
  getSermonCategory(id: string): Promise<SermonCategory | undefined>;
  listSermonCategories(orgId: string): Promise<SermonCategory[]>;
  createSermonCategory(category: InsertSermonCategory): Promise<SermonCategory>;
  updateSermonCategory(id: string, category: Partial<InsertSermonCategory>): Promise<SermonCategory | undefined>;
  deleteSermonCategory(id: string): Promise<void>;
  
  // Sermon Tags
  getSermonTag(id: string): Promise<SermonTag | undefined>;
  listSermonTags(orgId: string): Promise<SermonTag[]>;
  createSermonTag(tag: InsertSermonTag): Promise<SermonTag>;
  updateSermonTag(id: string, tag: Partial<InsertSermonTag>): Promise<SermonTag | undefined>;
  deleteSermonTag(id: string): Promise<void>;
  
  // Sermon Tag Assignments
  addTagToSermon(sermonId: string, tagId: string): Promise<SermonTagAssignment>;
  removeTagFromSermon(sermonId: string, tagId: string): Promise<void>;
  getSermonTags(sermonId: string): Promise<SermonTag[]>;
  
  // Volunteers
  getVolunteer(id: string): Promise<Volunteer | undefined>;
  listVolunteers(orgId: string): Promise<Volunteer[]>;
  searchVolunteers(orgId: string, query: string): Promise<Volunteer[]>;
  filterVolunteers(orgId: string, filters: {
    status?: string;
    team?: string;
    skills?: string[];
    state?: string;
    country?: string;
  }): Promise<Volunteer[]>;
  createVolunteer(volunteer: InsertVolunteer): Promise<Volunteer>;
  updateVolunteer(id: string, volunteer: Partial<InsertVolunteer>): Promise<Volunteer | undefined>;
  deleteVolunteer(id: string): Promise<void>;
  
  // Volunteer Shifts
  getVolunteerShift(id: string): Promise<VolunteerShift | undefined>;
  listVolunteerShifts(orgId: string, volunteerId?: string): Promise<VolunteerShift[]>;
  createVolunteerShift(shift: InsertVolunteerShift): Promise<VolunteerShift>;
  updateVolunteerShift(id: string, shift: Partial<InsertVolunteerShift>): Promise<VolunteerShift | undefined>;
  deleteVolunteerShift(id: string): Promise<void>;
  
  // Volunteer Hours
  getVolunteerHour(id: string): Promise<VolunteerHour | undefined>;
  listVolunteerHours(orgId: string, volunteerId?: string): Promise<VolunteerHour[]>;
  createVolunteerHour(hour: InsertVolunteerHour): Promise<VolunteerHour>;
  updateVolunteerHour(id: string, hour: Partial<InsertVolunteerHour>): Promise<VolunteerHour | undefined>;
  deleteVolunteerHour(id: string): Promise<void>;
  approveVolunteerHour(id: string, approvedBy: string): Promise<VolunteerHour | undefined>;
  
  // Beneficiaries
  getBeneficiary(id: string): Promise<Beneficiary | undefined>;
  listBeneficiaries(orgId: string): Promise<Beneficiary[]>;
  searchBeneficiaries(orgId: string, query: string): Promise<Beneficiary[]>;
  filterBeneficiaries(orgId: string, filters: {
    type?: string;
    status?: string;
    urgencyLevel?: string;
    tags?: string[];
  }): Promise<Beneficiary[]>;
  createBeneficiary(beneficiary: InsertBeneficiary): Promise<Beneficiary>;
  updateBeneficiary(id: string, beneficiary: Partial<InsertBeneficiary>): Promise<Beneficiary | undefined>;
  deleteBeneficiary(id: string): Promise<void>;
  
  // Beneficiary Donations
  getBeneficiaryDonation(id: string): Promise<BeneficiaryDonation | undefined>;
  listBeneficiaryDonations(beneficiaryId: string): Promise<BeneficiaryDonation[]>;
  createBeneficiaryDonation(donation: InsertBeneficiaryDonation): Promise<BeneficiaryDonation>;
  updateBeneficiaryDonation(id: string, donation: Partial<InsertBeneficiaryDonation>): Promise<BeneficiaryDonation | undefined>;
  deleteBeneficiaryDonation(id: string): Promise<void>;
  
  // Beneficiary Communications
  getBeneficiaryCommunication(id: string): Promise<BeneficiaryCommunication | undefined>;
  listBeneficiaryCommunications(beneficiaryId: string): Promise<BeneficiaryCommunication[]>;
  createBeneficiaryCommunication(communication: InsertBeneficiaryCommunication): Promise<BeneficiaryCommunication>;
  updateBeneficiaryCommunication(id: string, communication: Partial<InsertBeneficiaryCommunication>): Promise<BeneficiaryCommunication | undefined>;
  deleteBeneficiaryCommunication(id: string): Promise<void>;
  
  // Activities
  getActivity(id: string): Promise<Activity | undefined>;
  listActivities(orgId: string): Promise<Activity[]>;
  listPublishedActivities(orgId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: string): Promise<void>;
  incrementActivityStudentCount(id: string, count: number): Promise<boolean>;
  
  // Activity Sessions
  getActivitySession(id: string): Promise<ActivitySession | undefined>;
  listActivitySessions(activityId: string): Promise<ActivitySession[]>;
  createActivitySession(session: InsertActivitySession): Promise<ActivitySession>;
  updateActivitySession(id: string, session: Partial<InsertActivitySession>): Promise<ActivitySession | undefined>;
  deleteActivitySession(id: string): Promise<void>;
  
  // Activity Registrations
  getActivityRegistration(id: string): Promise<ActivityRegistration | undefined>;
  listActivityRegistrations(activityId: string): Promise<ActivityRegistration[]>;
  getRegistrationByEmail(activityId: string, email: string): Promise<ActivityRegistration | undefined>;
  createActivityRegistration(registration: InsertActivityRegistration): Promise<ActivityRegistration>;
  updateActivityRegistration(id: string, registration: Partial<InsertActivityRegistration>): Promise<ActivityRegistration | undefined>;
  deleteActivityRegistration(id: string): Promise<void>;
  
  // Activity Attendance
  getActivityAttendance(id: string): Promise<ActivityAttendance | undefined>;
  listActivityAttendance(activityId: string, sessionDate?: Date): Promise<ActivityAttendance[]>;
  listRegistrationAttendance(registrationId: string): Promise<ActivityAttendance[]>;
  createActivityAttendance(attendance: InsertActivityAttendance): Promise<ActivityAttendance>;
  updateActivityAttendance(id: string, attendance: Partial<InsertActivityAttendance>): Promise<ActivityAttendance | undefined>;
  deleteActivityAttendance(id: string): Promise<void>;
  
  // P2P Campaign Settings
  getP2PCampaignSettings(campaignId: string): Promise<P2PCampaignSettings | undefined>;
  createP2PCampaignSettings(settings: InsertP2PCampaignSettings): Promise<P2PCampaignSettings>;
  updateP2PCampaignSettings(campaignId: string, settings: Partial<InsertP2PCampaignSettings>): Promise<P2PCampaignSettings | undefined>;
  
  // P2P Participants
  getP2PParticipant(id: string): Promise<P2PParticipant | undefined>;
  getP2PParticipantBySlug(slug: string): Promise<P2PParticipant | undefined>;
  listP2PParticipants(campaignId: string): Promise<P2PParticipant[]>;
  listP2PParticipantsWithStats(campaignId: string): Promise<P2PParticipantWithStats[]>;
  createP2PParticipant(participant: InsertP2PParticipant): Promise<P2PParticipant>;
  updateP2PParticipant(id: string, participant: Partial<InsertP2PParticipant>): Promise<P2PParticipant | undefined>;
  updateP2PParticipantRaised(id: string, amount: string, donationIncrement: number): Promise<P2PParticipant | undefined>;
  softDeleteP2PParticipant(id: string): Promise<void>; // Soft delete to preserve history
  
  // P2P Invitations
  getP2PInvitation(id: string): Promise<P2PInvitation | undefined>;
  getP2PInvitationByToken(token: string): Promise<P2PInvitation | undefined>;
  listP2PInvitations(campaignId: string): Promise<P2PInvitation[]>;
  createP2PInvitation(invitation: InsertP2PInvitation): Promise<P2PInvitation>;
  updateP2PInvitation(id: string, invitation: Partial<InsertP2PInvitation>): Promise<P2PInvitation | undefined>;
  softDeleteP2PInvitation(id: string): Promise<void>; // Soft delete for audit trail
  
  // P2P Milestones
  getP2PMilestone(id: string): Promise<P2PMilestone | undefined>;
  listP2PMilestones(campaignId: string): Promise<P2PMilestone[]>;
  createP2PMilestone(milestone: InsertP2PMilestone): Promise<P2PMilestone>;
  updateP2PMilestone(id: string, milestone: Partial<InsertP2PMilestone>): Promise<P2PMilestone | undefined>;
  deleteP2PMilestone(id: string): Promise<void>;
  
  // P2P Participant Milestones
  getP2PParticipantMilestone(id: string): Promise<P2PParticipantMilestone | undefined>;
  listP2PParticipantMilestones(participantId: string): Promise<P2PParticipantMilestone[]>;
  createP2PParticipantMilestone(milestone: InsertP2PParticipantMilestone): Promise<P2PParticipantMilestone>;
  updateP2PParticipantMilestone(id: string, milestone: Partial<InsertP2PParticipantMilestone>): Promise<P2PParticipantMilestone | undefined>;
  deleteP2PParticipantMilestone(id: string): Promise<void>; // Hard delete - can be regenerated
  
  // P2P Chat Messages
  getP2PChatMessage(id: string): Promise<P2PChatMessage | undefined>;
  listP2PChatMessages(campaignId: string, limit?: number): Promise<P2PChatMessage[]>;
  createP2PChatMessage(message: InsertP2PChatMessage): Promise<P2PChatMessage>;
  deleteP2PChatMessage(id: string): Promise<void>; // Hard delete - ephemeral
  
  // P2P Gamification Badges
  getP2PGamificationBadge(id: string): Promise<P2PGamificationBadge | undefined>;
  listP2PGamificationBadges(orgId: string, campaignId?: string): Promise<P2PGamificationBadge[]>;
  createP2PGamificationBadge(badge: InsertP2PGamificationBadge): Promise<P2PGamificationBadge>;
  updateP2PGamificationBadge(id: string, badge: Partial<InsertP2PGamificationBadge>): Promise<P2PGamificationBadge | undefined>;
  deleteP2PGamificationBadge(id: string): Promise<void>;
  
  // P2P Participant Badges
  listP2PParticipantBadges(participantId: string): Promise<P2PParticipantBadge[]>;
  createP2PParticipantBadge(badge: InsertP2PParticipantBadge): Promise<P2PParticipantBadge>;
  deleteP2PParticipantBadge(id: string): Promise<void>; // Hard delete - can be re-awarded
  
  // P2P Documents
  getP2PDocument(id: string): Promise<P2PDocument | undefined>;
  listP2PDocuments(campaignId: string): Promise<P2PDocument[]>;
  createP2PDocument(document: InsertP2PDocument): Promise<P2PDocument>;
  updateP2PDocument(id: string, document: Partial<InsertP2PDocument>): Promise<P2PDocument | undefined>;
  softDeleteP2PDocument(id: string): Promise<void>; // Soft delete for analytics
  incrementP2PDocumentDownloads(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private organizations: Map<string, Organization>;
  private campaigns: Map<string, Campaign>;
  private campaignStrategies: Map<string, CampaignStrategy>;
  private donors: Map<string, Donor>;
  private donations: Map<string, Donation>;
  private events: Map<string, Event>;
  private eventRegistrations: Map<string, EventRegistration>;
  private users: Map<string, User>;

  constructor() {
    this.organizations = new Map();
    this.campaigns = new Map();
    this.campaignStrategies = new Map();
    this.donors = new Map();
    this.donations = new Map();
    this.events = new Map();
    this.eventRegistrations = new Map();
    this.users = new Map();
  }

  // Organizations
  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    return Array.from(this.organizations.values()).find(org => org.slug === slug);
  }

  async listOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const id = randomUUID();
    const org: Organization = { 
      ...insertOrg,
      phone: insertOrg.phone ?? null,
      logoUrl: insertOrg.logoUrl ?? null,
      primaryColor: insertOrg.primaryColor ?? null,
      street: insertOrg.street ?? null,
      city: insertOrg.city ?? null,
      state: insertOrg.state ?? null,
      zip: insertOrg.zip ?? null,
      country: insertOrg.country ?? null,
      status: insertOrg.status ?? "pending",
      reviewedAt: null,
      approvedBy: null,
      incorporationDocUrl: insertOrg.incorporationDocUrl ?? null,
      settings: insertOrg.settings ?? {},
      id,
      createdAt: new Date(),
    };
    this.organizations.set(id, org);
    return org;
  }

  async updateOrganization(id: string, updates: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const org = this.organizations.get(id);
    if (!org) return undefined;
    const updated = { ...org, ...updates };
    this.organizations.set(id, updated);
    return updated;
  }

  // Campaigns
  async getCampaign(id: string): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async listCampaigns(orgId: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(c => c.orgId === orgId);
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = randomUUID();
    const campaign: Campaign = {
      ...insertCampaign,
      description: insertCampaign.description ?? null,
      imageUrl: insertCampaign.imageUrl ?? null,
      category: insertCampaign.category ?? null,
      status: insertCampaign.status ?? "active",
      startDate: insertCampaign.startDate ?? null,
      endDate: insertCampaign.endDate ?? null,
      id,
      currentAmount: "0",
      createdAt: new Date(),
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async updateCampaign(id: string, updates: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return undefined;
    const updated = { ...campaign, ...updates };
    this.campaigns.set(id, updated);
    return updated;
  }

  // Campaign Strategies
  async getCampaignStrategy(campaignId: string): Promise<CampaignStrategy | undefined> {
    return Array.from(this.campaignStrategies.values()).find(s => s.campaignId === campaignId);
  }

  async createCampaignStrategy(insertStrategy: InsertCampaignStrategy): Promise<CampaignStrategy> {
    const id = randomUUID();
    const strategy: CampaignStrategy = {
      ...insertStrategy,
      summary: insertStrategy.summary ?? null,
      insights: insertStrategy.insights ?? null,
      generatedBy: insertStrategy.generatedBy ?? null,
      id,
      generatedAt: new Date(),
    };
    this.campaignStrategies.set(id, strategy);
    return strategy;
  }

  // Donors
  async getDonor(id: string): Promise<Donor | undefined> {
    return this.donors.get(id);
  }

  async getDonorByEmail(email: string, orgId: string): Promise<Donor | undefined> {
    return Array.from(this.donors.values()).find(
      d => d.email === email && d.orgId === orgId
    );
  }

  async listDonors(orgId: string): Promise<Donor[]> {
    return Array.from(this.donors.values()).filter(d => d.orgId === orgId);
  }

  async searchDonors(orgId: string, query: string, limit: number = 10): Promise<Donor[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.donors.values())
      .filter(d => {
        if (d.orgId !== orgId) return false;
        const fullName = `${d.firstName} ${d.lastName}`.toLowerCase();
        return fullName.includes(lowerQuery) || d.email.toLowerCase().includes(lowerQuery);
      })
      .slice(0, limit);
  }

  async createDonor(insertDonor: InsertDonor): Promise<Donor> {
    const id = randomUUID();
    const donor: Donor = {
      ...insertDonor,
      phone: insertDonor.phone ?? null,
      tier: insertDonor.tier ?? "bronze",
      id,
      totalDonated: "0",
      donationCount: 0,
      createdAt: new Date(),
    };
    this.donors.set(id, donor);
    return donor;
  }

  async updateDonor(id: string, updates: Partial<InsertDonor>): Promise<Donor | undefined> {
    const donor = this.donors.get(id);
    if (!donor) return undefined;
    const updated = { ...donor, ...updates };
    this.donors.set(id, updated);
    return updated;
  }

  async deleteDonor(id: string): Promise<boolean> {
    return this.donors.delete(id);
  }

  // Donations
  async getDonation(id: string): Promise<Donation | undefined> {
    return this.donations.get(id);
  }

  async getDonationByStripePaymentId(orgId: string, stripePaymentId: string): Promise<Donation | undefined> {
    return Array.from(this.donations.values()).find(
      d => d.orgId === orgId && d.stripePaymentId === stripePaymentId
    );
  }

  async listDonations(orgId: string): Promise<Donation[]> {
    return Array.from(this.donations.values()).filter(d => d.orgId === orgId);
  }

  async listDonationsByCampaign(campaignId: string): Promise<Donation[]> {
    return Array.from(this.donations.values()).filter(d => d.campaignId === campaignId);
  }

  async listDonationsByDonor(donorId: string): Promise<Donation[]> {
    return Array.from(this.donations.values()).filter(d => d.donorId === donorId);
  }

  async createDonation(insertDonation: InsertDonation): Promise<Donation> {
    const id = randomUUID();
    const donation: Donation = {
      ...insertDonation,
      campaignId: insertDonation.campaignId ?? null,
      donorId: insertDonation.donorId ?? null,
      coverFees: insertDonation.coverFees ?? null,
      paymentMethod: insertDonation.paymentMethod ?? null,
      stripePaymentId: insertDonation.stripePaymentId ?? null,
      status: insertDonation.status ?? "completed",
      donorEmail: insertDonation.donorEmail ?? null,
      donorName: insertDonation.donorName ?? null,
      message: insertDonation.message ?? null,
      id,
      createdAt: new Date(),
    };
    this.donations.set(id, donation);
    return donation;
  }

  // Events
  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async listEvents(orgId: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(e => e.orgId === orgId);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = {
      ...insertEvent,
      description: insertEvent.description ?? null,
      imageUrl: insertEvent.imageUrl ?? null,
      price: insertEvent.price ?? "0",
      status: insertEvent.status ?? "upcoming",
      id,
      attendeeCount: 0,
      createdAt: new Date(),
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    const updated = { ...event, ...updates };
    this.events.set(id, updated);
    return updated;
  }

  // Event Registrations
  async getEventRegistration(id: string): Promise<EventRegistration | undefined> {
    return this.eventRegistrations.get(id);
  }

  async getEventRegistrationByQrCode(qrCode: string): Promise<EventRegistration | undefined> {
    return Array.from(this.eventRegistrations.values()).find(r => r.qrCode === qrCode);
  }

  async listEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    return Array.from(this.eventRegistrations.values()).filter(r => r.eventId === eventId);
  }

  async createEventRegistration(insertReg: InsertEventRegistration): Promise<EventRegistration> {
    const id = randomUUID();
    const registration: EventRegistration = {
      ...insertReg,
      phone: insertReg.phone ?? null,
      ticketCount: insertReg.ticketCount ?? 1,
      status: insertReg.status ?? "confirmed",
      id,
      createdAt: new Date(),
    };
    this.eventRegistrations.set(id, registration);
    return registration;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      orgId: insertUser.orgId ?? null,
      passwordHash: insertUser.passwordHash ?? null,
      passwordSetAt: null,
      role: insertUser.role ?? "org_admin",
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // Organization Registrations
  async getOrganizationRegistration(id: string): Promise<OrganizationRegistration | undefined> {
    throw new Error("MemStorage not implemented for organization registrations");
  }

  async listOrganizationRegistrations(_status?: string): Promise<OrganizationRegistration[]> {
    throw new Error("MemStorage not implemented for organization registrations");
  }

  async createOrganizationRegistration(_registration: InsertOrganizationRegistration): Promise<OrganizationRegistration> {
    throw new Error("MemStorage not implemented for organization registrations");
  }

  async updateOrganizationRegistration(_id: string, _registration: Partial<InsertOrganizationRegistration>): Promise<OrganizationRegistration | undefined> {
    throw new Error("MemStorage not implemented for organization registrations");
  }

  // Auth Tokens
  async getAuthToken(_token: string): Promise<AuthToken | undefined> {
    throw new Error("MemStorage not implemented for auth tokens");
  }

  async createAuthToken(_token: InsertAuthToken): Promise<AuthToken> {
    throw new Error("MemStorage not implemented for auth tokens");
  }

  async markAuthTokenUsed(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented for auth tokens");
  }

  // Marketplace Modules - Stubs
  async getMarketplaceModule(_id: string): Promise<MarketplaceModule | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getMarketplaceModuleByKey(_key: string): Promise<MarketplaceModule | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listMarketplaceModules(_activeOnly?: boolean): Promise<MarketplaceModule[]> {
    throw new Error("MemStorage not implemented");
  }
  async createMarketplaceModule(_module: InsertMarketplaceModule): Promise<MarketplaceModule> {
    throw new Error("MemStorage not implemented");
  }
  async updateMarketplaceModule(_id: string, _module: Partial<InsertMarketplaceModule>): Promise<MarketplaceModule | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteMarketplaceModule(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getModulePricing(_id: string): Promise<ModulePricing | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listModulePricing(_moduleId?: string): Promise<ModulePricing[]> {
    throw new Error("MemStorage not implemented");
  }
  async createModulePricing(_pricing: InsertModulePricing): Promise<ModulePricing> {
    throw new Error("MemStorage not implemented");
  }
  async updateModulePricing(_id: string, _pricing: Partial<InsertModulePricing>): Promise<ModulePricing | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteModulePricing(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getOrganizationModule(_orgId: string, _moduleId: string): Promise<OrganizationModule | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listOrganizationModules(_orgId: string): Promise<OrganizationModule[]> {
    throw new Error("MemStorage not implemented");
  }
  async enableOrganizationModule(_module: InsertOrganizationModule): Promise<OrganizationModule> {
    throw new Error("MemStorage not implemented");
  }
  async disableOrganizationModule(_orgId: string, _moduleId: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getPartner(_id: string): Promise<Partner | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getPartnerByEmail(_email: string): Promise<Partner | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listPartners(_status?: string): Promise<Partner[]> {
    throw new Error("MemStorage not implemented");
  }
  async createPartner(_partner: InsertPartner): Promise<Partner> {
    throw new Error("MemStorage not implemented");
  }
  async updatePartner(_id: string, _partner: Partial<InsertPartner>): Promise<Partner | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getReferralCode(_id: string): Promise<ReferralCode | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getReferralCodeByCode(_code: string): Promise<ReferralCode | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listReferralCodes(_partnerId?: string): Promise<ReferralCode[]> {
    throw new Error("MemStorage not implemented");
  }
  async createReferralCode(_code: InsertReferralCode): Promise<ReferralCode> {
    throw new Error("MemStorage not implemented");
  }
  async updateReferralCode(_id: string, _code: Partial<InsertReferralCode>): Promise<ReferralCode | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async incrementReferralCodeUsage(_code: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getSubscription(_id: string): Promise<Subscription | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getSubscriptionByStripeId(_stripeSubscriptionId: string): Promise<Subscription | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listSubscriptions(_orgId?: string): Promise<Subscription[]> {
    throw new Error("MemStorage not implemented");
  }
  async listActiveSubscriptions(): Promise<Subscription[]> {
    throw new Error("MemStorage not implemented");
  }
  async createSubscription(_subscription: InsertSubscription): Promise<Subscription> {
    throw new Error("MemStorage not implemented");
  }
  async updateSubscription(_id: string, _subscription: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    throw new Error("MemStorage not implemented");
  }
  
  // Subscription Plans - Stubs
  async getSubscriptionPlan(_id: string): Promise<SubscriptionPlan | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getSubscriptionPlanByStripePriceId(_stripePriceId: string): Promise<SubscriptionPlan | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listSubscriptionPlans(_activeOnly?: boolean): Promise<SubscriptionPlan[]> {
    throw new Error("MemStorage not implemented");
  }
  async createSubscriptionPlan(_plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    throw new Error("MemStorage not implemented");
  }
  async updateSubscriptionPlan(_id: string, _plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    throw new Error("MemStorage not implemented");
  }
  
  // Add-on Modules - Stubs
  async getSubscriptionPlanByTierCode(_tierCode: string): Promise<SubscriptionPlan | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getCountryPricing(_id: string): Promise<CountryPricing | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getCountryPricingByCountryAndTier(_countryCode: string, _tierCode: string): Promise<CountryPricing | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listCountryPricing(_countryCode?: string): Promise<CountryPricing[]> {
    throw new Error("MemStorage not implemented");
  }
  async createCountryPricing(_pricing: InsertCountryPricing): Promise<CountryPricing> {
    throw new Error("MemStorage not implemented");
  }
  async updateCountryPricing(_id: string, _pricing: Partial<InsertCountryPricing>): Promise<CountryPricing | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteCountryPricing(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  
  // Organization Subscriptions - Stubs
  async getOrganizationSubscription(_orgId: string): Promise<OrganizationSubscription | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getOrganizationSubscriptionByStripeId(_stripeSubscriptionId: string): Promise<OrganizationSubscription | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getOrganizationSubscriptionByStripeCustomerId(_stripeCustomerId: string): Promise<OrganizationSubscription | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async createOrganizationSubscription(_subscription: InsertOrganizationSubscription): Promise<OrganizationSubscription> {
    throw new Error("MemStorage not implemented");
  }
  async updateOrganizationSubscription(_orgId: string, _subscription: Partial<InsertOrganizationSubscription>): Promise<OrganizationSubscription | undefined> {
    throw new Error("MemStorage not implemented");
  }
  
  // Organization Add-ons - Stubs

  // All other missing methods as stubs
  async getLivestream(_id: string): Promise<Livestream | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listLivestreams(_orgId: string): Promise<Livestream[]> {
    throw new Error("MemStorage not implemented");
  }
  async createLivestream(_livestream: InsertLivestream): Promise<Livestream> {
    throw new Error("MemStorage not implemented");
  }
  async updateLivestream(_id: string, _livestream: Partial<InsertLivestream>): Promise<Livestream | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getLivestreamDonation(_id: string): Promise<LivestreamDonation | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listLivestreamDonations(_livestreamId: string): Promise<LivestreamDonation[]> {
    throw new Error("MemStorage not implemented");
  }
  async createLivestreamDonation(_donation: InsertLivestreamDonation): Promise<LivestreamDonation> {
    throw new Error("MemStorage not implemented");
  }
  async incrementLivestreamViews(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async listLivestreamChatMessages(_livestreamId: string): Promise<LivestreamChatMessage[]> {
    throw new Error("MemStorage not implemented");
  }
  async createLivestreamChatMessage(_message: InsertLivestreamChatMessage): Promise<LivestreamChatMessage> {
    throw new Error("MemStorage not implemented");
  }
  async getLivestreamAccess(_accessToken: string): Promise<LivestreamAccess | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async createLivestreamAccess(_access: InsertLivestreamAccess): Promise<LivestreamAccess> {
    throw new Error("MemStorage not implemented");
  }
  async getContact(_id: string): Promise<Contact | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listContacts(_orgId: string): Promise<Contact[]> {
    throw new Error("MemStorage not implemented");
  }
  async searchContacts(_orgId: string, _query: string): Promise<Contact[]> {
    throw new Error("MemStorage not implemented");
  }
  async createContact(_contact: InsertContact): Promise<Contact> {
    throw new Error("MemStorage not implemented");
  }
  async updateContact(_id: string, _contact: Partial<InsertContact>): Promise<Contact | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteContact(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getContactTag(_id: string): Promise<ContactTag | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listContactTags(_orgId: string): Promise<ContactTag[]> {
    throw new Error("MemStorage not implemented");
  }
  async createContactTag(_tag: InsertContactTag): Promise<ContactTag> {
    throw new Error("MemStorage not implemented");
  }
  async updateContactTag(_id: string, _tag: Partial<InsertContactTag>): Promise<ContactTag | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteContactTag(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async addTagToContact(_contactId: string, _tagId: string): Promise<ContactTagAssignment> {
    throw new Error("MemStorage not implemented");
  }
  async removeTagFromContact(_contactId: string, _tagId: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getContactTags(_contactId: string): Promise<ContactTag[]> {
    throw new Error("MemStorage not implemented");
  }
  async getContactActivity(_id: string): Promise<ContactActivity | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listContactActivities(_contactId: string): Promise<ContactActivity[]> {
    throw new Error("MemStorage not implemented");
  }
  async createContactActivity(_activity: InsertContactActivity): Promise<ContactActivity> {
    throw new Error("MemStorage not implemented");
  }
  async getPrayerSettings(_orgId: string): Promise<PrayerSettings | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async createPrayerSettings(_settings: InsertPrayerSettings): Promise<PrayerSettings> {
    throw new Error("MemStorage not implemented");
  }
  async updatePrayerSettings(_orgId: string, _settings: Partial<InsertPrayerSettings>): Promise<PrayerSettings | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getLandingPage(_id: string): Promise<LandingPage | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getLandingPageBySlug(_slug: string): Promise<LandingPage | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getLandingPageByOrgId(_orgId: string): Promise<LandingPage | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async createLandingPage(_page: InsertLandingPage): Promise<LandingPage> {
    throw new Error("MemStorage not implemented");
  }
  async updateLandingPage(_id: string, _page: Partial<InsertLandingPage>): Promise<LandingPage | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async publishLandingPage(_id: string): Promise<LandingPage | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async unpublishLandingPage(_id: string): Promise<LandingPage | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getEmailTemplate(_id: string): Promise<EmailTemplate | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listEmailTemplates(_orgId: string, _templateType?: string): Promise<EmailTemplate[]> {
    throw new Error("MemStorage not implemented");
  }
  async getDefaultEmailTemplate(_orgId: string, _templateType: string): Promise<EmailTemplate | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async createEmailTemplate(_template: InsertEmailTemplate): Promise<EmailTemplate> {
    throw new Error("MemStorage not implemented");
  }
  async updateEmailTemplate(_id: string, _template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteEmailTemplate(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async setDefaultEmailTemplate(_id: string, _templateType: string, _orgId: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  
  // Member Tags
  async getMemberTag(_id: string): Promise<MemberTag | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listMemberTags(_orgId: string): Promise<MemberTag[]> {
    throw new Error("MemStorage not implemented");
  }
  async createMemberTag(_tag: InsertMemberTag): Promise<MemberTag> {
    throw new Error("MemStorage not implemented");
  }
  async updateMemberTag(_id: string, _tag: Partial<InsertMemberTag>): Promise<MemberTag | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteMemberTag(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async assignTagToMember(_orgId: string, _memberId: string, _tagId: string): Promise<MemberTagAssignment> {
    throw new Error("MemStorage not implemented");
  }
  async removeTagFromMember(_memberId: string, _tagId: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getMemberTags(_memberId: string): Promise<MemberTag[]> {
    throw new Error("MemStorage not implemented");
  }
  async getMembersByTag(_tagId: string): Promise<User[]> {
    throw new Error("MemStorage not implemented");
  }
  
  // Email Campaigns
  async getEmailCampaign(_id: string): Promise<EmailCampaign | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listEmailCampaigns(_orgId: string, _status?: string): Promise<EmailCampaign[]> {
    throw new Error("MemStorage not implemented");
  }
  async createEmailCampaign(_campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    throw new Error("MemStorage not implemented");
  }
  async updateEmailCampaign(_id: string, _campaign: Partial<InsertEmailCampaign>): Promise<EmailCampaign | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteEmailCampaign(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async updateCampaignStats(_campaignId: string, _stats: Partial<EmailCampaign>): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getScheduledCampaignsToSend(_now: Date): Promise<EmailCampaign[]> {
    throw new Error("MemStorage not implemented");
  }
  
  // Email Recipients
  async getEmailRecipient(_id: string): Promise<EmailRecipient | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listEmailRecipients(_campaignId: string): Promise<EmailRecipient[]> {
    throw new Error("MemStorage not implemented");
  }
  async createEmailRecipient(_recipient: InsertEmailRecipient): Promise<EmailRecipient> {
    throw new Error("MemStorage not implemented");
  }
  async updateEmailRecipient(_id: string, _recipient: Partial<EmailRecipient>): Promise<EmailRecipient | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getRecipientByToken(_token: string): Promise<EmailRecipient | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getRecipientByResendId(_resendEmailId: string): Promise<EmailRecipient | undefined> {
    throw new Error("MemStorage not implemented");
  }
  
  // Email Events
  async createEmailEvent(_event: InsertEmailEvent): Promise<EmailEvent> {
    throw new Error("MemStorage not implemented");
  }
  async listEmailEvents(_campaignId: string): Promise<EmailEvent[]> {
    throw new Error("MemStorage not implemented");
  }
  
  async getSermon(_id: string): Promise<Sermon | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listSermons(_orgId: string): Promise<Sermon[]> {
    throw new Error("MemStorage not implemented");
  }
  async searchSermons(_orgId: string, _query: string): Promise<Sermon[]> {
    throw new Error("MemStorage not implemented");
  }
  async createSermon(_sermon: InsertSermon): Promise<Sermon> {
    throw new Error("MemStorage not implemented");
  }
  async updateSermon(_id: string, _sermon: Partial<InsertSermon>): Promise<Sermon | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteSermon(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async incrementSermonViews(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getSermonCategory(_id: string): Promise<SermonCategory | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listSermonCategories(_orgId: string): Promise<SermonCategory[]> {
    throw new Error("MemStorage not implemented");
  }
  async createSermonCategory(_category: InsertSermonCategory): Promise<SermonCategory> {
    throw new Error("MemStorage not implemented");
  }
  async updateSermonCategory(_id: string, _category: Partial<InsertSermonCategory>): Promise<SermonCategory | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteSermonCategory(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getSermonTag(_id: string): Promise<SermonTag | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listSermonTags(_orgId: string): Promise<SermonTag[]> {
    throw new Error("MemStorage not implemented");
  }
  async createSermonTag(_tag: InsertSermonTag): Promise<SermonTag> {
    throw new Error("MemStorage not implemented");
  }
  async updateSermonTag(_id: string, _tag: Partial<InsertSermonTag>): Promise<SermonTag | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteSermonTag(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async addTagToSermon(_sermonId: string, _tagId: string): Promise<SermonTagAssignment> {
    throw new Error("MemStorage not implemented");
  }
  async removeTagFromSermon(_sermonId: string, _tagId: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getSermonTags(_sermonId: string): Promise<SermonTag[]> {
    throw new Error("MemStorage not implemented");
  }
  async getVolunteer(_id: string): Promise<Volunteer | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listVolunteers(_orgId: string): Promise<Volunteer[]> {
    throw new Error("MemStorage not implemented");
  }
  async searchVolunteers(_orgId: string, _query: string): Promise<Volunteer[]> {
    throw new Error("MemStorage not implemented");
  }
  async filterVolunteers(_orgId: string, _filters: { status?: string; team?: string }): Promise<Volunteer[]> {
    throw new Error("MemStorage not implemented");
  }
  async createVolunteer(_volunteer: InsertVolunteer): Promise<Volunteer> {
    throw new Error("MemStorage not implemented");
  }
  async updateVolunteer(_id: string, _volunteer: Partial<InsertVolunteer>): Promise<Volunteer | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteVolunteer(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getVolunteerShift(_id: string): Promise<VolunteerShift | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listVolunteerShifts(_volunteerId: string): Promise<VolunteerShift[]> {
    throw new Error("MemStorage not implemented");
  }
  async listShiftsByDateRange(_orgId: string, _startDate: Date, _endDate: Date): Promise<VolunteerShift[]> {
    throw new Error("MemStorage not implemented");
  }
  async createVolunteerShift(_shift: InsertVolunteerShift): Promise<VolunteerShift> {
    throw new Error("MemStorage not implemented");
  }
  async updateVolunteerShift(_id: string, _shift: Partial<InsertVolunteerShift>): Promise<VolunteerShift | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteVolunteerShift(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getVolunteerHour(_id: string): Promise<VolunteerHour | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listVolunteerHours(_volunteerId: string): Promise<VolunteerHour[]> {
    throw new Error("MemStorage not implemented");
  }
  async createVolunteerHour(_hour: InsertVolunteerHour): Promise<VolunteerHour> {
    throw new Error("MemStorage not implemented");
  }
  async updateVolunteerHour(_id: string, _hour: Partial<InsertVolunteerHour>): Promise<VolunteerHour | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteVolunteerHour(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getBeneficiary(_id: string): Promise<Beneficiary | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listBeneficiaries(_orgId: string): Promise<Beneficiary[]> {
    throw new Error("MemStorage not implemented");
  }
  async searchBeneficiaries(_orgId: string, _query: string): Promise<Beneficiary[]> {
    throw new Error("MemStorage not implemented");
  }
  async createBeneficiary(_beneficiary: InsertBeneficiary): Promise<Beneficiary> {
    throw new Error("MemStorage not implemented");
  }
  async updateBeneficiary(_id: string, _beneficiary: Partial<InsertBeneficiary>): Promise<Beneficiary | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteBeneficiary(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getBeneficiaryDonation(_id: string): Promise<BeneficiaryDonation | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listBeneficiaryDonations(_beneficiaryId: string): Promise<BeneficiaryDonation[]> {
    throw new Error("MemStorage not implemented");
  }
  async createBeneficiaryDonation(_donation: InsertBeneficiaryDonation): Promise<BeneficiaryDonation> {
    throw new Error("MemStorage not implemented");
  }
  async updateBeneficiaryDonation(_id: string, _donation: Partial<InsertBeneficiaryDonation>): Promise<BeneficiaryDonation | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteBeneficiaryDonation(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getBeneficiaryCommunication(_id: string): Promise<BeneficiaryCommunication | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listBeneficiaryCommunications(_beneficiaryId: string): Promise<BeneficiaryCommunication[]> {
    throw new Error("MemStorage not implemented");
  }
  async createBeneficiaryCommunication(_communication: InsertBeneficiaryCommunication): Promise<BeneficiaryCommunication> {
    throw new Error("MemStorage not implemented");
  }
  async updateBeneficiaryCommunication(_id: string, _communication: Partial<InsertBeneficiaryCommunication>): Promise<BeneficiaryCommunication | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteBeneficiaryCommunication(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getActivity(_id: string): Promise<Activity | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listActivities(_orgId: string): Promise<Activity[]> {
    throw new Error("MemStorage not implemented");
  }
  async searchActivities(_orgId: string, _query: string): Promise<Activity[]> {
    throw new Error("MemStorage not implemented");
  }
  async createActivity(_activity: InsertActivity): Promise<Activity> {
    throw new Error("MemStorage not implemented");
  }
  async updateActivity(_id: string, _activity: Partial<InsertActivity>): Promise<Activity | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteActivity(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getActivitySession(_id: string): Promise<ActivitySession | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listActivitySessions(_activityId: string): Promise<ActivitySession[]> {
    throw new Error("MemStorage not implemented");
  }
  async createActivitySession(_session: InsertActivitySession): Promise<ActivitySession> {
    throw new Error("MemStorage not implemented");
  }
  async updateActivitySession(_id: string, _session: Partial<InsertActivitySession>): Promise<ActivitySession | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteActivitySession(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getActivityRegistration(_id: string): Promise<ActivityRegistration | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listActivityRegistrations(_activityId: string): Promise<ActivityRegistration[]> {
    throw new Error("MemStorage not implemented");
  }
  async getRegistrationByEmail(_activityId: string, _email: string): Promise<ActivityRegistration | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async createActivityRegistration(_registration: InsertActivityRegistration): Promise<ActivityRegistration> {
    throw new Error("MemStorage not implemented");
  }
  async updateActivityRegistration(_id: string, _registration: Partial<InsertActivityRegistration>): Promise<ActivityRegistration | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteActivityRegistration(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getActivityAttendance(_id: string): Promise<ActivityAttendance | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listActivityAttendance(_activityId: string, _sessionDate?: Date): Promise<ActivityAttendance[]> {
    throw new Error("MemStorage not implemented");
  }
  async listRegistrationAttendance(_registrationId: string): Promise<ActivityAttendance[]> {
    throw new Error("MemStorage not implemented");
  }
  async createActivityAttendance(_attendance: InsertActivityAttendance): Promise<ActivityAttendance> {
    throw new Error("MemStorage not implemented");
  }
  async updateActivityAttendance(_id: string, _attendance: Partial<InsertActivityAttendance>): Promise<ActivityAttendance | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteActivityAttendance(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async filterDonations(orgId: string, filters: { 
    donationType?: string; 
    startDate?: Date; 
    endDate?: Date; 
    donorId?: string; 
    minAmount?: string; 
    maxAmount?: string;
    giftAidOptIn?: boolean;
    giftAidEligible?: boolean;
    taxReliefClaimed?: boolean;
  }): Promise<DonationWithDonor[]> {
    let filtered = this.donations.filter(d => d.orgId === orgId);
    
    if (filters.donationType) {
      filtered = filtered.filter(d => d.donationType === filters.donationType);
    }
    if (filters.startDate) {
      filtered = filtered.filter(d => new Date(d.createdAt) >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter(d => new Date(d.createdAt) <= filters.endDate!);
    }
    if (filters.donorId) {
      filtered = filtered.filter(d => d.donorId === filters.donorId);
    }
    if (filters.minAmount) {
      filtered = filtered.filter(d => parseFloat(d.amount) >= parseFloat(filters.minAmount!));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(d => parseFloat(d.amount) <= parseFloat(filters.maxAmount!));
    }
    if (filters.giftAidOptIn !== undefined) {
      filtered = filtered.filter(d => d.giftAidOptIn === filters.giftAidOptIn);
    }
    if (filters.giftAidEligible !== undefined) {
      filtered = filtered.filter(d => d.giftAidEligible === filters.giftAidEligible);
    }
    if (filters.taxReliefClaimed !== undefined) {
      filtered = filtered.filter(d => d.taxReliefClaimed === filters.taxReliefClaimed);
    }
    
    // Join with donor information
    return filtered.map(donation => {
      const donor = this.donors.find(d => d.id === donation.donorId);
      return {
        ...donation,
        donor: donor ? {
          firstName: donor.firstName,
          lastName: donor.lastName,
          email: donor.email,
        } : null,
      };
    });
  }
  async updateDonation(id: string, updates: Partial<InsertDonation>): Promise<Donation | undefined> {
    const index = this.donations.findIndex(d => d.id === id);
    if (index === -1) return undefined;
    this.donations[index] = { ...this.donations[index], ...updates };
    return this.donations[index];
  }
  async deleteDonation(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async incrementEventAttendeeCount(_id: string, _count: number): Promise<boolean> {
    throw new Error("MemStorage not implemented");
  }
  async getEventTicketType(_id: string): Promise<EventTicketType | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listEventTicketTypes(_eventId: string): Promise<EventTicketType[]> {
    throw new Error("MemStorage not implemented");
  }
  async createEventTicketType(_ticketType: InsertEventTicketType): Promise<EventTicketType> {
    throw new Error("MemStorage not implemented");
  }
  async updateEventTicketType(_id: string, _ticketType: Partial<InsertEventTicketType>): Promise<EventTicketType | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteEventTicketType(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async incrementTicketTypeSold(_id: string, _count: number): Promise<boolean> {
    throw new Error("MemStorage not implemented");
  }
  async getEventSpeaker(_id: string): Promise<EventSpeaker | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listEventSpeakers(_eventId: string): Promise<EventSpeaker[]> {
    throw new Error("MemStorage not implemented");
  }
  async createEventSpeaker(_speaker: InsertEventSpeaker): Promise<EventSpeaker> {
    throw new Error("MemStorage not implemented");
  }
  async updateEventSpeaker(_id: string, _speaker: Partial<InsertEventSpeaker>): Promise<EventSpeaker | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteEventSpeaker(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getEventSponsor(_id: string): Promise<EventSponsor | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listEventSponsors(_eventId: string): Promise<EventSponsor[]> {
    throw new Error("MemStorage not implemented");
  }
  async createEventSponsor(_sponsor: InsertEventSponsor): Promise<EventSponsor> {
    throw new Error("MemStorage not implemented");
  }
  async updateEventSponsor(_id: string, _sponsor: Partial<InsertEventSponsor>): Promise<EventSponsor | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteEventSponsor(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async getEventPromoCode(_id: string): Promise<EventPromoCode | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getEventPromoCodeByCode(_code: string, _eventId: string): Promise<EventPromoCode | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listEventPromoCodes(_eventId: string): Promise<EventPromoCode[]> {
    throw new Error("MemStorage not implemented");
  }
  async createEventPromoCode(_promoCode: InsertEventPromoCode): Promise<EventPromoCode> {
    throw new Error("MemStorage not implemented");
  }
  async updateEventPromoCode(_id: string, _promoCode: Partial<InsertEventPromoCode>): Promise<EventPromoCode | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteEventPromoCode(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async updateEventRegistration(_id: string, _updates: Partial<InsertEventRegistration>): Promise<EventRegistration | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listModulePricingByCountry(_country: string): Promise<ModulePricing[]> {
    throw new Error("MemStorage not implemented");
  }
  async listPublishedActivities(_orgId: string): Promise<Activity[]> {
    throw new Error("MemStorage not implemented");
  }
  async incrementActivityStudentCount(_id: string, _count: number): Promise<boolean> {
    throw new Error("MemStorage not implemented");
  }
  async filterSermons(_orgId: string, _filters: {
    categoryId?: string;
    speaker?: string;
    platform?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    isFeatured?: boolean;
  }): Promise<Sermon[]> {
    throw new Error("MemStorage not implemented");
  }
  async approveVolunteerHour(_id: string, _approvedBy: string): Promise<VolunteerHour | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async filterBeneficiaries(_orgId: string, _filters: {
    type?: string;
    status?: string;
    urgencyLevel?: string;
    tags?: string[];
  }): Promise<Beneficiary[]> {
    throw new Error("MemStorage not implemented");
  }
  
  // P2P Campaign Settings
  async getP2PCampaignSettings(_campaignId: string): Promise<P2PCampaignSettings | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async createP2PCampaignSettings(_settings: InsertP2PCampaignSettings): Promise<P2PCampaignSettings> {
    throw new Error("MemStorage not implemented");
  }
  async updateP2PCampaignSettings(_campaignId: string, _settings: Partial<InsertP2PCampaignSettings>): Promise<P2PCampaignSettings | undefined> {
    throw new Error("MemStorage not implemented");
  }
  
  // P2P Participants
  async getP2PParticipant(_id: string): Promise<P2PParticipant | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getP2PParticipantBySlug(_slug: string): Promise<P2PParticipant | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listP2PParticipants(_campaignId: string): Promise<P2PParticipant[]> {
    throw new Error("MemStorage not implemented");
  }
  async listP2PParticipantsWithStats(_campaignId: string): Promise<P2PParticipantWithStats[]> {
    throw new Error("MemStorage not implemented");
  }
  async createP2PParticipant(_participant: InsertP2PParticipant): Promise<P2PParticipantWithStats> {
    throw new Error("MemStorage not implemented");
  }
  async updateP2PParticipant(_id: string, _participant: Partial<InsertP2PParticipant>): Promise<P2PParticipant | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async updateP2PParticipantRaised(_id: string, _amount: string, _donationIncrement: number): Promise<P2PParticipant | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async softDeleteP2PParticipant(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  
  // P2P Invitations
  async getP2PInvitation(_id: string): Promise<P2PInvitation | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async getP2PInvitationByToken(_token: string): Promise<P2PInvitation | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listP2PInvitations(_campaignId: string): Promise<P2PInvitation[]> {
    throw new Error("MemStorage not implemented");
  }
  async createP2PInvitation(_invitation: InsertP2PInvitation): Promise<P2PInvitation> {
    throw new Error("MemStorage not implemented");
  }
  async updateP2PInvitation(_id: string, _invitation: Partial<InsertP2PInvitation>): Promise<P2PInvitation | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async softDeleteP2PInvitation(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  
  // P2P Milestones
  async getP2PMilestone(_id: string): Promise<P2PMilestone | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listP2PMilestones(_campaignId: string): Promise<P2PMilestone[]> {
    throw new Error("MemStorage not implemented");
  }
  async createP2PMilestone(_milestone: InsertP2PMilestone): Promise<P2PMilestone> {
    throw new Error("MemStorage not implemented");
  }
  async updateP2PMilestone(_id: string, _milestone: Partial<InsertP2PMilestone>): Promise<P2PMilestone | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteP2PMilestone(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  
  // P2P Participant Milestones
  async getP2PParticipantMilestone(_id: string): Promise<P2PParticipantMilestone | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listP2PParticipantMilestones(_participantId: string): Promise<P2PParticipantMilestone[]> {
    throw new Error("MemStorage not implemented");
  }
  async createP2PParticipantMilestone(_milestone: InsertP2PParticipantMilestone): Promise<P2PParticipantMilestone> {
    throw new Error("MemStorage not implemented");
  }
  async updateP2PParticipantMilestone(_id: string, _milestone: Partial<InsertP2PParticipantMilestone>): Promise<P2PParticipantMilestone | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteP2PParticipantMilestone(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  
  // P2P Chat Messages
  async getP2PChatMessage(_id: string): Promise<P2PChatMessage | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listP2PChatMessages(_campaignId: string, _limit?: number): Promise<P2PChatMessage[]> {
    throw new Error("MemStorage not implemented");
  }
  async createP2PChatMessage(_message: InsertP2PChatMessage): Promise<P2PChatMessage> {
    throw new Error("MemStorage not implemented");
  }
  async deleteP2PChatMessage(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  
  // P2P Gamification Badges
  async getP2PGamificationBadge(_id: string): Promise<P2PGamificationBadge | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listP2PGamificationBadges(_orgId: string, _campaignId?: string): Promise<P2PGamificationBadge[]> {
    throw new Error("MemStorage not implemented");
  }
  async createP2PGamificationBadge(_badge: InsertP2PGamificationBadge): Promise<P2PGamificationBadge> {
    throw new Error("MemStorage not implemented");
  }
  async updateP2PGamificationBadge(_id: string, _badge: Partial<InsertP2PGamificationBadge>): Promise<P2PGamificationBadge | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async deleteP2PGamificationBadge(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  
  // P2P Participant Badges
  async listP2PParticipantBadges(_participantId: string): Promise<P2PParticipantBadge[]> {
    throw new Error("MemStorage not implemented");
  }
  async createP2PParticipantBadge(_badge: InsertP2PParticipantBadge): Promise<P2PParticipantBadge> {
    throw new Error("MemStorage not implemented");
  }
  async deleteP2PParticipantBadge(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  
  // P2P Documents
  async getP2PDocument(_id: string): Promise<P2PDocument | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async listP2PDocuments(_campaignId: string): Promise<P2PDocument[]> {
    throw new Error("MemStorage not implemented");
  }
  async createP2PDocument(_document: InsertP2PDocument): Promise<P2PDocument> {
    throw new Error("MemStorage not implemented");
  }
  async updateP2PDocument(_id: string, _document: Partial<InsertP2PDocument>): Promise<P2PDocument | undefined> {
    throw new Error("MemStorage not implemented");
  }
  async softDeleteP2PDocument(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
  async incrementP2PDocumentDownloads(_id: string): Promise<void> {
    throw new Error("MemStorage not implemented");
  }
}

export class DbStorage implements IStorage {
  // Organizations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
    return result[0];
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    // Try exact match first
    let result = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
    if (result[0]) {
      return result[0];
    }
    
    // Try case-insensitive match
    result = await db.select().from(organizations).where(sql`LOWER(${organizations.slug}) = LOWER(${slug})`).limit(1);
    return result[0];
  }

  async listOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations);
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const result = await db.insert(organizations).values(insertOrg).returning();
    return result[0];
  }

  async updateOrganization(id: string, updates: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const result = await db.update(organizations).set(updates).where(eq(organizations.id, id)).returning();
    return result[0];
  }

  // Campaigns
  async getCampaign(id: string): Promise<Campaign | undefined> {
    const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    return result[0];
  }

  async listCampaigns(orgId: string): Promise<Campaign[]> {
    return await db.select().from(campaigns).where(eq(campaigns.orgId, orgId));
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const result = await db.insert(campaigns).values(insertCampaign).returning();
    return result[0];
  }

  async updateCampaign(id: string, updates: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const result = await db.update(campaigns).set(updates).where(eq(campaigns.id, id)).returning();
    return result[0];
  }

  // Campaign Strategies
  async getCampaignStrategy(campaignId: string): Promise<CampaignStrategy | undefined> {
    const result = await db.select().from(campaignStrategies)
      .where(eq(campaignStrategies.campaignId, campaignId))
      .orderBy(sql`${campaignStrategies.generatedAt} DESC`)
      .limit(1);
    return result[0];
  }

  async createCampaignStrategy(insertStrategy: InsertCampaignStrategy): Promise<CampaignStrategy> {
    const result = await db.insert(campaignStrategies).values(insertStrategy).returning();
    return result[0];
  }

  // Donors
  async getDonor(id: string): Promise<Donor | undefined> {
    const result = await db.select().from(donors).where(eq(donors.id, id)).limit(1);
    return result[0];
  }

  async getDonorByEmail(email: string, orgId: string): Promise<Donor | undefined> {
    const result = await db.select().from(donors)
      .where(and(eq(donors.email, email), eq(donors.orgId, orgId)))
      .limit(1);
    return result[0];
  }

  async listDonors(orgId: string): Promise<Donor[]> {
    return await db.select().from(donors).where(eq(donors.orgId, orgId));
  }

  async searchDonors(orgId: string, query: string, limit: number = 10): Promise<Donor[]> {
    const searchPattern = `%${query}%`;
    return await db
      .select()
      .from(donors)
      .where(
        and(
          eq(donors.orgId, orgId),
          sql`(
            LOWER(CONCAT(${donors.firstName}, ' ', ${donors.lastName})) LIKE LOWER(${searchPattern})
            OR LOWER(${donors.email}) LIKE LOWER(${searchPattern})
          )`
        )
      )
      .limit(limit);
  }

  async createDonor(insertDonor: InsertDonor): Promise<Donor> {
    const result = await db.insert(donors).values(insertDonor).returning();
    return result[0];
  }

  async updateDonor(id: string, updates: Partial<InsertDonor>): Promise<Donor | undefined> {
    const result = await db.update(donors).set(updates).where(eq(donors.id, id)).returning();
    return result[0];
  }

  // Donations
  async getDonation(id: string): Promise<Donation | undefined> {
    const result = await db.select().from(donations).where(eq(donations.id, id)).limit(1);
    return result[0];
  }

  async getDonationByStripePaymentId(orgId: string, stripePaymentId: string): Promise<Donation | undefined> {
    const result = await db.select().from(donations)
      .where(and(
        eq(donations.orgId, orgId),
        eq(donations.stripePaymentId, stripePaymentId)
      ))
      .limit(1);
    return result[0];
  }

  async listDonations(orgId: string): Promise<Donation[]> {
    return await db.select().from(donations).where(eq(donations.orgId, orgId));
  }

  async listDonationsByCampaign(campaignId: string): Promise<Donation[]> {
    return await db.select().from(donations).where(eq(donations.campaignId, campaignId));
  }

  async listDonationsByDonor(donorId: string): Promise<Donation[]> {
    return await db.select().from(donations).where(eq(donations.donorId, donorId));
  }

  async createDonation(insertDonation: InsertDonation): Promise<Donation> {
    const result = await db.insert(donations).values(insertDonation).returning();
    return result[0];
  }

  async updateDonation(id: string, updates: Partial<InsertDonation>): Promise<Donation | undefined> {
    const result = await db.update(donations).set(updates).where(eq(donations.id, id)).returning();
    return result[0];
  }

  async deleteDonation(id: string): Promise<void> {
    await db.delete(donations).where(eq(donations.id, id));
  }

  async filterDonations(orgId: string, filters: {
    donationType?: string;
    startDate?: Date;
    endDate?: Date;
    donorId?: string;
    minAmount?: string;
    maxAmount?: string;
    giftAidOptIn?: boolean;
    giftAidEligible?: boolean;
    taxReliefClaimed?: boolean;
  }): Promise<DonationWithDonor[]> {
    const conditions = [eq(donations.orgId, orgId)];
    
    if (filters.donationType) {
      conditions.push(eq(donations.donationType, filters.donationType));
    }
    
    if (filters.donorId) {
      conditions.push(eq(donations.donorId, filters.donorId));
    }
    
    if (filters.startDate) {
      conditions.push(sql`${donations.createdAt} >= ${filters.startDate}`);
    }
    
    if (filters.endDate) {
      conditions.push(sql`${donations.createdAt} <= ${filters.endDate}`);
    }
    
    if (filters.minAmount) {
      conditions.push(sql`${donations.amount} >= ${filters.minAmount}`);
    }
    
    if (filters.maxAmount) {
      conditions.push(sql`${donations.amount} <= ${filters.maxAmount}`);
    }
    
    if (filters.giftAidOptIn !== undefined) {
      conditions.push(eq(donations.giftAidOptIn, filters.giftAidOptIn));
    }
    
    if (filters.giftAidEligible !== undefined) {
      conditions.push(eq(donations.giftAidEligible, filters.giftAidEligible));
    }
    
    if (filters.taxReliefClaimed !== undefined) {
      conditions.push(eq(donations.taxReliefClaimed, filters.taxReliefClaimed));
    }
    
    // Join with donors table and return donor information in a nested object
    // Frontend expects this structure with donation fields + nested donor object
    const results = await db
      .select()
      .from(donations)
      .leftJoin(donors, eq(donations.donorId, donors.id))
      .where(and(...conditions))
      .orderBy(desc(donations.createdAt));
    
    // Transform to include donor as nested object for frontend compatibility
    return results.map(row => ({
      ...row.donations,
      donor: row.donors ? {
        firstName: row.donors.firstName,
        lastName: row.donors.lastName,
        email: row.donors.email,
      } : null,
    }));
  }

  // Events
  async getEvent(id: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
    return result[0];
  }

  async listEvents(orgId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.orgId, orgId));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(insertEvent).returning();
    return result[0];
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const result = await db.update(events).set({ ...updates, updatedAt: new Date() }).where(eq(events.id, id)).returning();
    return result[0];
  }

  async incrementEventAttendeeCount(id: string, count: number): Promise<boolean> {
    // Atomic increment with capacity check
    const result = await db.execute(sql`
      UPDATE events 
      SET attendee_count = attendee_count + ${count}
      WHERE id = ${id} 
        AND attendee_count + ${count} <= capacity
      RETURNING id
    `);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Event Registrations
  async getEventRegistration(id: string): Promise<EventRegistration | undefined> {
    const result = await db.select().from(eventRegistrations).where(eq(eventRegistrations.id, id)).limit(1);
    return result[0];
  }

  async getEventRegistrationByQrCode(qrCode: string): Promise<EventRegistration | undefined> {
    const result = await db.select().from(eventRegistrations).where(eq(eventRegistrations.qrCode, qrCode)).limit(1);
    return result[0];
  }

  async listEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    return await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
  }

  async createEventRegistration(insertReg: InsertEventRegistration): Promise<EventRegistration> {
    const result = await db.insert(eventRegistrations).values(insertReg).returning();
    return result[0];
  }

  async updateEventRegistration(id: string, updates: Partial<InsertEventRegistration>): Promise<EventRegistration | undefined> {
    const result = await db.update(eventRegistrations).set(updates).where(eq(eventRegistrations.id, id)).returning();
    return result[0];
  }

  // Event Ticket Types
  async getEventTicketType(id: string): Promise<EventTicketType | undefined> {
    const result = await db.select().from(eventTicketTypes).where(eq(eventTicketTypes.id, id)).limit(1);
    return result[0];
  }

  async listEventTicketTypes(eventId: string): Promise<EventTicketType[]> {
    return await db.select().from(eventTicketTypes).where(eq(eventTicketTypes.eventId, eventId));
  }

  async createEventTicketType(insertTicketType: InsertEventTicketType): Promise<EventTicketType> {
    const result = await db.insert(eventTicketTypes).values(insertTicketType).returning();
    return result[0];
  }

  async updateEventTicketType(id: string, updates: Partial<InsertEventTicketType>): Promise<EventTicketType | undefined> {
    const result = await db.update(eventTicketTypes).set(updates).where(eq(eventTicketTypes.id, id)).returning();
    return result[0];
  }

  async deleteEventTicketType(id: string): Promise<void> {
    await db.delete(eventTicketTypes).where(eq(eventTicketTypes.id, id));
  }

  async incrementTicketTypeSold(id: string, count: number): Promise<boolean> {
    // Atomic increment with capacity check
    const result = await db.execute(sql`
      UPDATE event_ticket_types 
      SET sold = sold + ${count}
      WHERE id = ${id} 
        AND is_active = true
        AND sold + ${count} <= quantity
      RETURNING id
    `);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Event Promo Codes
  async getEventPromoCode(id: string): Promise<EventPromoCode | undefined> {
    const result = await db.select().from(eventPromoCodes).where(eq(eventPromoCodes.id, id)).limit(1);
    return result[0];
  }

  async getEventPromoCodeByCode(code: string, eventId: string): Promise<EventPromoCode | undefined> {
    const result = await db.select().from(eventPromoCodes).where(
      and(eq(eventPromoCodes.code, code.toUpperCase()), eq(eventPromoCodes.eventId, eventId))
    ).limit(1);
    return result[0];
  }

  async listEventPromoCodes(eventId: string): Promise<EventPromoCode[]> {
    return await db.select().from(eventPromoCodes).where(eq(eventPromoCodes.eventId, eventId));
  }

  async createEventPromoCode(insertPromoCode: InsertEventPromoCode): Promise<EventPromoCode> {
    const result = await db.insert(eventPromoCodes).values({
      ...insertPromoCode,
      code: insertPromoCode.code.toUpperCase(), // Always uppercase
    }).returning();
    return result[0];
  }

  async updateEventPromoCode(id: string, updates: Partial<InsertEventPromoCode>): Promise<EventPromoCode | undefined> {
    const updateData = updates.code ? { ...updates, code: updates.code.toUpperCase() } : updates;
    const result = await db.update(eventPromoCodes).set(updateData).where(eq(eventPromoCodes.id, id)).returning();
    return result[0];
  }

  async deleteEventPromoCode(id: string): Promise<void> {
    await db.delete(eventPromoCodes).where(eq(eventPromoCodes.id, id));
  }

  // Event Speakers
  async getEventSpeaker(id: string): Promise<EventSpeaker | undefined> {
    const result = await db.select().from(eventSpeakers).where(eq(eventSpeakers.id, id)).limit(1);
    return result[0];
  }

  async listEventSpeakers(eventId: string): Promise<EventSpeaker[]> {
    return await db.select().from(eventSpeakers).where(eq(eventSpeakers.eventId, eventId)).orderBy(eventSpeakers.sortOrder);
  }

  async createEventSpeaker(insertSpeaker: InsertEventSpeaker): Promise<EventSpeaker> {
    const result = await db.insert(eventSpeakers).values(insertSpeaker).returning();
    return result[0];
  }

  async updateEventSpeaker(id: string, updates: Partial<InsertEventSpeaker>): Promise<EventSpeaker | undefined> {
    const result = await db.update(eventSpeakers).set(updates).where(eq(eventSpeakers.id, id)).returning();
    return result[0];
  }

  async deleteEventSpeaker(id: string): Promise<void> {
    await db.delete(eventSpeakers).where(eq(eventSpeakers.id, id));
  }

  // Event Sponsors
  async getEventSponsor(id: string): Promise<EventSponsor | undefined> {
    const result = await db.select().from(eventSponsors).where(eq(eventSponsors.id, id)).limit(1);
    return result[0];
  }

  async listEventSponsors(eventId: string): Promise<EventSponsor[]> {
    return await db.select().from(eventSponsors).where(eq(eventSponsors.eventId, eventId)).orderBy(eventSponsors.sortOrder);
  }

  async createEventSponsor(insertSponsor: InsertEventSponsor): Promise<EventSponsor> {
    const result = await db.insert(eventSponsors).values(insertSponsor).returning();
    return result[0];
  }

  async updateEventSponsor(id: string, updates: Partial<InsertEventSponsor>): Promise<EventSponsor | undefined> {
    const result = await db.update(eventSponsors).set(updates).where(eq(eventSponsors.id, id)).returning();
    return result[0];
  }

  async deleteEventSponsor(id: string): Promise<void> {
    await db.delete(eventSponsors).where(eq(eventSponsors.id, id));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(ilike(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Organization Registrations
  async getOrganizationRegistration(id: string): Promise<OrganizationRegistration | undefined> {
    const result = await db.select().from(organizationRegistrations).where(eq(organizationRegistrations.id, id)).limit(1);
    return result[0];
  }

  async listOrganizationRegistrations(status?: string): Promise<OrganizationRegistration[]> {
    if (status) {
      return await db.select().from(organizationRegistrations).where(eq(organizationRegistrations.status, status));
    }
    return await db.select().from(organizationRegistrations);
  }

  async createOrganizationRegistration(insertRegistration: InsertOrganizationRegistration): Promise<OrganizationRegistration> {
    const result = await db.insert(organizationRegistrations).values(insertRegistration).returning();
    return result[0];
  }

  async updateOrganizationRegistration(id: string, updates: Partial<InsertOrganizationRegistration>): Promise<OrganizationRegistration | undefined> {
    const result = await db.update(organizationRegistrations).set(updates).where(eq(organizationRegistrations.id, id)).returning();
    return result[0];
  }

  // Auth Tokens
  async getAuthToken(token: string): Promise<AuthToken | undefined> {
    const result = await db.select().from(authTokens).where(eq(authTokens.token, token)).limit(1);
    return result[0];
  }

  async createAuthToken(insertToken: InsertAuthToken): Promise<AuthToken> {
    const result = await db.insert(authTokens).values(insertToken).returning();
    return result[0];
  }

  async markAuthTokenUsed(id: string): Promise<void> {
    await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, id));
  }

  // Marketplace Modules
  async getMarketplaceModule(id: string): Promise<MarketplaceModule | undefined> {
    const result = await db.select().from(marketplaceModules).where(eq(marketplaceModules.id, id)).limit(1);
    return result[0];
  }

  async getMarketplaceModuleByKey(key: string): Promise<MarketplaceModule | undefined> {
    const result = await db.select().from(marketplaceModules).where(eq(marketplaceModules.moduleKey, key)).limit(1);
    return result[0];
  }

  async listMarketplaceModules(activeOnly: boolean = false): Promise<MarketplaceModule[]> {
    if (activeOnly) {
      return await db.select().from(marketplaceModules).where(eq(marketplaceModules.isActive, true));
    }
    return await db.select().from(marketplaceModules);
  }

  async createMarketplaceModule(insertModule: InsertMarketplaceModule): Promise<MarketplaceModule> {
    const result = await db.insert(marketplaceModules).values(insertModule).returning();
    return result[0];
  }

  async updateMarketplaceModule(id: string, updates: Partial<InsertMarketplaceModule>): Promise<MarketplaceModule | undefined> {
    const result = await db.update(marketplaceModules).set(updates).where(eq(marketplaceModules.id, id)).returning();
    return result[0];
  }

  async deleteMarketplaceModule(id: string): Promise<void> {
    await db.delete(marketplaceModules).where(eq(marketplaceModules.id, id));
  }

  // Module Pricing
  async getModulePricing(id: string): Promise<ModulePricing | undefined> {
    const result = await db.select().from(modulePricing).where(eq(modulePricing.id, id)).limit(1);
    return result[0];
  }

  async listModulePricing(moduleId: string): Promise<ModulePricing[]> {
    return await db.select().from(modulePricing).where(eq(modulePricing.moduleId, moduleId));
  }

  async listModulePricingByCountry(country: string): Promise<ModulePricing[]> {
    return await db.select().from(modulePricing).where(eq(modulePricing.country, country));
  }

  async createModulePricing(insertPricing: InsertModulePricing): Promise<ModulePricing> {
    const result = await db.insert(modulePricing).values(insertPricing).returning();
    return result[0];
  }

  async updateModulePricing(id: string, updates: Partial<InsertModulePricing>): Promise<ModulePricing | undefined> {
    const result = await db.update(modulePricing).set(updates).where(eq(modulePricing.id, id)).returning();
    return result[0];
  }

  async deleteModulePricing(id: string): Promise<void> {
    await db.delete(modulePricing).where(eq(modulePricing.id, id));
  }

  // Organization Modules
  async getOrganizationModule(orgId: string, moduleId: string): Promise<OrganizationModule | undefined> {
    const result = await db.select().from(organizationModules)
      .where(and(eq(organizationModules.orgId, orgId), eq(organizationModules.moduleId, moduleId)))
      .limit(1);
    return result[0];
  }

  async listOrganizationModules(orgId: string): Promise<OrganizationModule[]> {
    return await db.select().from(organizationModules).where(eq(organizationModules.orgId, orgId));
  }

  async enableOrganizationModule(insertModule: InsertOrganizationModule): Promise<OrganizationModule> {
    const result = await db.insert(organizationModules).values(insertModule).returning();
    return result[0];
  }

  async disableOrganizationModule(orgId: string, moduleId: string): Promise<void> {
    await db.delete(organizationModules)
      .where(and(eq(organizationModules.orgId, orgId), eq(organizationModules.moduleId, moduleId)));
  }

  // Partners
  async getPartner(id: string): Promise<Partner | undefined> {
    const result = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
    return result[0];
  }

  async getPartnerByEmail(email: string): Promise<Partner | undefined> {
    const result = await db.select().from(partners).where(eq(partners.email, email)).limit(1);
    return result[0];
  }

  async listPartners(status?: string): Promise<Partner[]> {
    if (status) {
      return await db.select().from(partners).where(eq(partners.status, status));
    }
    return await db.select().from(partners);
  }

  async createPartner(insertPartner: InsertPartner): Promise<Partner> {
    const result = await db.insert(partners).values(insertPartner).returning();
    return result[0];
  }

  async updatePartner(id: string, updates: Partial<InsertPartner>): Promise<Partner | undefined> {
    const result = await db.update(partners).set(updates).where(eq(partners.id, id)).returning();
    return result[0];
  }

  // Referral Codes
  async getReferralCode(id: string): Promise<ReferralCode | undefined> {
    const result = await db.select().from(referralCodes).where(eq(referralCodes.id, id)).limit(1);
    return result[0];
  }

  async getReferralCodeByCode(code: string): Promise<ReferralCode | undefined> {
    const result = await db.select().from(referralCodes).where(eq(referralCodes.code, code)).limit(1);
    return result[0];
  }

  async listReferralCodes(partnerId?: string): Promise<ReferralCode[]> {
    if (partnerId) {
      return await db.select().from(referralCodes).where(eq(referralCodes.partnerId, partnerId));
    }
    return await db.select().from(referralCodes);
  }

  async createReferralCode(insertCode: InsertReferralCode): Promise<ReferralCode> {
    const result = await db.insert(referralCodes).values(insertCode).returning();
    return result[0];
  }

  async updateReferralCode(id: string, updates: Partial<InsertReferralCode>): Promise<ReferralCode | undefined> {
    const result = await db.update(referralCodes).set(updates).where(eq(referralCodes.id, id)).returning();
    return result[0];
  }

  async incrementReferralCodeUsage(code: string): Promise<void> {
    const referralCode = await this.getReferralCodeByCode(code);
    if (referralCode) {
      await db.update(referralCodes)
        .set({ usageCount: referralCode.usageCount + 1 })
        .where(eq(referralCodes.code, code));
    }
  }

  // Subscriptions
  async getSubscription(id: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
    return result[0];
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId)).limit(1);
    return result[0];
  }

  async listSubscriptions(orgId?: string): Promise<Subscription[]> {
    if (orgId) {
      return await db.select().from(subscriptions).where(eq(subscriptions.orgId, orgId));
    }
    return await db.select().from(subscriptions);
  }

  async listActiveSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions).where(eq(subscriptions.status, "active"));
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const result = await db.insert(subscriptions).values(insertSubscription).returning();
    return result[0];
  }

  async updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const result = await db.update(subscriptions).set(updates).where(eq(subscriptions.id, id)).returning();
    return result[0];
  }

  // Subscription Plans
  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
    return result[0];
  }

  async getSubscriptionPlanByStripePriceId(stripePriceId: string): Promise<SubscriptionPlan | undefined> {
    const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.stripePriceId, stripePriceId)).limit(1);
    return result[0];
  }

  async listSubscriptionPlans(activeOnly = false): Promise<SubscriptionPlan[]> {
    if (activeOnly) {
      return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
    }
    return await db.select().from(subscriptionPlans);
  }

  async createSubscriptionPlan(insertPlan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const result = await db.insert(subscriptionPlans).values(insertPlan).returning();
    return result[0];
  }

  async updateSubscriptionPlan(id: string, updates: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const result = await db.update(subscriptionPlans).set(updates).where(eq(subscriptionPlans.id, id)).returning();
    return result[0];
  }

  async getSubscriptionPlanByTierCode(tierCode: string): Promise<SubscriptionPlan | undefined> {
    const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.tierCode, tierCode)).limit(1);
    return result[0];
  }

  // Country Pricing
  async getCountryPricing(id: string): Promise<CountryPricing | undefined> {
    const result = await db.select().from(countryPricing).where(eq(countryPricing.id, id)).limit(1);
    return result[0];
  }

  async getCountryPricingByCountryAndTier(countryCode: string, tierCode: string): Promise<CountryPricing | undefined> {
    const result = await db.select().from(countryPricing)
      .where(and(
        eq(countryPricing.countryCode, countryCode),
        eq(countryPricing.tierCode, tierCode)
      ))
      .limit(1);
    return result[0];
  }

  async listCountryPricing(countryCode?: string): Promise<CountryPricing[]> {
    if (countryCode) {
      return await db.select().from(countryPricing).where(eq(countryPricing.countryCode, countryCode));
    }
    return await db.select().from(countryPricing);
  }

  async createCountryPricing(insertPricing: InsertCountryPricing): Promise<CountryPricing> {
    const result = await db.insert(countryPricing).values(insertPricing).returning();
    return result[0];
  }

  async updateCountryPricing(id: string, updates: Partial<InsertCountryPricing>): Promise<CountryPricing | undefined> {
    const result = await db.update(countryPricing)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(countryPricing.id, id))
      .returning();
    return result[0];
  }

  async deleteCountryPricing(id: string): Promise<void> {
    await db.delete(countryPricing).where(eq(countryPricing.id, id));
  }

  // Organization Subscriptions
  async getOrganizationSubscription(orgId: string): Promise<OrganizationSubscription | undefined> {
    const result = await db.select().from(organizationSubscriptions).where(eq(organizationSubscriptions.orgId, orgId)).limit(1);
    return result[0];
  }

  async getOrganizationSubscriptionByStripeId(stripeSubscriptionId: string): Promise<OrganizationSubscription | undefined> {
    const result = await db.select().from(organizationSubscriptions).where(eq(organizationSubscriptions.stripeSubscriptionId, stripeSubscriptionId)).limit(1);
    return result[0];
  }

  async getOrganizationSubscriptionByStripeCustomerId(stripeCustomerId: string): Promise<OrganizationSubscription | undefined> {
    const result = await db.select().from(organizationSubscriptions).where(eq(organizationSubscriptions.stripeCustomerId, stripeCustomerId)).limit(1);
    return result[0];
  }

  async createOrganizationSubscription(insertSubscription: InsertOrganizationSubscription): Promise<OrganizationSubscription> {
    const result = await db.insert(organizationSubscriptions).values(insertSubscription).returning();
    return result[0];
  }

  async updateOrganizationSubscription(orgId: string, updates: Partial<InsertOrganizationSubscription>): Promise<OrganizationSubscription | undefined> {
    const result = await db.update(organizationSubscriptions).set({ ...updates, updatedAt: new Date() }).where(eq(organizationSubscriptions.orgId, orgId)).returning();
    return result[0];
  }


  // Livestreams
  async getLivestream(id: string): Promise<Livestream | undefined> {
    const result = await db.select().from(livestreams).where(eq(livestreams.id, id)).limit(1);
    return result[0];
  }

  async listLivestreams(orgId: string): Promise<Livestream[]> {
    return await db.select().from(livestreams).where(eq(livestreams.orgId, orgId));
  }

  async createLivestream(insertLivestream: InsertLivestream): Promise<Livestream> {
    const result = await db.insert(livestreams).values(insertLivestream).returning();
    return result[0];
  }

  async updateLivestream(id: string, updates: Partial<InsertLivestream>): Promise<Livestream | undefined> {
    const result = await db.update(livestreams).set(updates).where(eq(livestreams.id, id)).returning();
    return result[0];
  }

  // Livestream Donations
  async getLivestreamDonation(id: string): Promise<LivestreamDonation | undefined> {
    const result = await db.select().from(livestreamDonations).where(eq(livestreamDonations.id, id)).limit(1);
    return result[0];
  }

  async listLivestreamDonations(livestreamId: string): Promise<LivestreamDonation[]> {
    return await db.select().from(livestreamDonations).where(eq(livestreamDonations.livestreamId, livestreamId));
  }

  async createLivestreamDonation(insertDonation: InsertLivestreamDonation): Promise<LivestreamDonation> {
    const result = await db.insert(livestreamDonations).values(insertDonation).returning();
    return result[0];
  }

  async incrementLivestreamViews(id: string): Promise<void> {
    await db.execute(sql`
      UPDATE livestreams 
      SET view_count = view_count + 1
      WHERE id = ${id}
    `);
  }

  // Livestream Chat Messages
  async listLivestreamChatMessages(livestreamId: string): Promise<LivestreamChatMessage[]> {
    return await db.select().from(livestreamChatMessages).where(eq(livestreamChatMessages.livestreamId, livestreamId));
  }

  async createLivestreamChatMessage(insertMessage: InsertLivestreamChatMessage): Promise<LivestreamChatMessage> {
    const result = await db.insert(livestreamChatMessages).values(insertMessage).returning();
    return result[0];
  }

  // Livestream Access
  async getLivestreamAccess(accessToken: string): Promise<LivestreamAccess | undefined> {
    const result = await db.select().from(livestreamAccess).where(eq(livestreamAccess.accessToken, accessToken)).limit(1);
    return result[0];
  }

  async createLivestreamAccess(insertAccess: InsertLivestreamAccess): Promise<LivestreamAccess> {
    const result = await db.insert(livestreamAccess).values(insertAccess).returning();
    return result[0];
  }

  // Contacts
  async getContact(id: string): Promise<Contact | undefined> {
    const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
    return result[0];
  }

  async listContacts(orgId: string): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.orgId, orgId));
  }

  async searchContacts(orgId: string, query: string): Promise<Contact[]> {
    return await db.select().from(contacts).where(
      and(
        eq(contacts.orgId, orgId),
        sql`(
          ${contacts.firstName} ILIKE ${`%${query}%`} OR 
          ${contacts.lastName} ILIKE ${`%${query}%`} OR 
          ${contacts.email} ILIKE ${`%${query}%`} OR 
          ${contacts.company} ILIKE ${`%${query}%`}
        )`
      )
    );
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const result = await db.insert(contacts).values(insertContact).returning();
    return result[0];
  }

  async updateContact(id: string, updateData: Partial<InsertContact>): Promise<Contact | undefined> {
    const result = await db.update(contacts)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return result[0];
  }

  async deleteContact(id: string): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // Contact Tags
  async getContactTag(id: string): Promise<ContactTag | undefined> {
    const result = await db.select().from(contactTags).where(eq(contactTags.id, id)).limit(1);
    return result[0];
  }

  async listContactTags(orgId: string): Promise<ContactTag[]> {
    return await db.select().from(contactTags).where(eq(contactTags.orgId, orgId));
  }

  async createContactTag(insertTag: InsertContactTag): Promise<ContactTag> {
    const result = await db.insert(contactTags).values(insertTag).returning();
    return result[0];
  }

  async updateContactTag(id: string, updateData: Partial<InsertContactTag>): Promise<ContactTag | undefined> {
    const result = await db.update(contactTags)
      .set(updateData)
      .where(eq(contactTags.id, id))
      .returning();
    return result[0];
  }

  async deleteContactTag(id: string): Promise<void> {
    await db.delete(contactTags).where(eq(contactTags.id, id));
  }

  // Contact Tag Assignments
  async addTagToContact(contactId: string, tagId: string): Promise<ContactTagAssignment> {
    const result = await db.insert(contactTagAssignments)
      .values({ contactId, tagId })
      .returning();
    return result[0];
  }

  async removeTagFromContact(contactId: string, tagId: string): Promise<void> {
    await db.delete(contactTagAssignments)
      .where(and(
        eq(contactTagAssignments.contactId, contactId),
        eq(contactTagAssignments.tagId, tagId)
      ));
  }

  async getContactTags(contactId: string): Promise<ContactTag[]> {
    const result = await db
      .select({
        id: contactTags.id,
        orgId: contactTags.orgId,
        name: contactTags.name,
        color: contactTags.color,
        createdAt: contactTags.createdAt,
      })
      .from(contactTagAssignments)
      .innerJoin(contactTags, eq(contactTagAssignments.tagId, contactTags.id))
      .where(eq(contactTagAssignments.contactId, contactId));
    
    return result;
  }

  // Contact Activities
  async getContactActivity(id: string): Promise<ContactActivity | undefined> {
    const result = await db.select().from(contactActivities).where(eq(contactActivities.id, id)).limit(1);
    return result[0];
  }

  async listContactActivities(contactId: string): Promise<ContactActivity[]> {
    return await db.select().from(contactActivities)
      .where(eq(contactActivities.contactId, contactId))
      .orderBy(contactActivities.createdAt);
  }

  async createContactActivity(insertActivity: InsertContactActivity): Promise<ContactActivity> {
    const result = await db.insert(contactActivities).values(insertActivity).returning();
    return result[0];
  }

  // Prayer Settings
  async getPrayerSettings(orgId: string): Promise<PrayerSettings | undefined> {
    const result = await db.select().from(prayerSettings).where(eq(prayerSettings.orgId, orgId)).limit(1);
    return result[0];
  }

  async createPrayerSettings(insertSettings: InsertPrayerSettings): Promise<PrayerSettings> {
    const result = await db.insert(prayerSettings).values(insertSettings).returning();
    return result[0];
  }

  async updatePrayerSettings(orgId: string, updateData: Partial<InsertPrayerSettings>): Promise<PrayerSettings | undefined> {
    const result = await db.update(prayerSettings)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(prayerSettings.orgId, orgId))
      .returning();
    return result[0];
  }

  // Landing Pages
  async getLandingPage(id: string): Promise<LandingPage | undefined> {
    const result = await db.select().from(landingPages).where(eq(landingPages.id, id)).limit(1);
    return result[0];
  }

  async getLandingPageBySlug(slug: string): Promise<LandingPage | undefined> {
    const result = await db.select().from(landingPages).where(eq(landingPages.slug, slug)).limit(1);
    return result[0];
  }

  async getLandingPageByOrgId(orgId: string): Promise<LandingPage | undefined> {
    const result = await db.select().from(landingPages).where(eq(landingPages.orgId, orgId)).limit(1);
    return result[0];
  }

  async createLandingPage(insertPage: InsertLandingPage): Promise<LandingPage> {
    const result = await db.insert(landingPages).values(insertPage).returning();
    return result[0];
  }

  async updateLandingPage(id: string, updateData: Partial<InsertLandingPage>): Promise<LandingPage | undefined> {
    const result = await db.update(landingPages)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(landingPages.id, id))
      .returning();
    return result[0];
  }

  async publishLandingPage(id: string): Promise<LandingPage | undefined> {
    const result = await db.update(landingPages)
      .set({ isPublished: true, publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(landingPages.id, id))
      .returning();
    return result[0];
  }

  async unpublishLandingPage(id: string): Promise<LandingPage | undefined> {
    const result = await db.update(landingPages)
      .set({ isPublished: false, updatedAt: new Date() })
      .where(eq(landingPages.id, id))
      .returning();
    return result[0];
  }

  // Email Templates
  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const result = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id)).limit(1);
    return result[0];
  }

  async listEmailTemplates(orgId: string, templateType?: string): Promise<EmailTemplate[]> {
    if (templateType) {
      return await db.select().from(emailTemplates)
        .where(and(eq(emailTemplates.orgId, orgId), eq(emailTemplates.templateType, templateType)));
    }
    return await db.select().from(emailTemplates).where(eq(emailTemplates.orgId, orgId));
  }

  async getDefaultEmailTemplate(orgId: string, templateType: string): Promise<EmailTemplate | undefined> {
    const result = await db.select().from(emailTemplates)
      .where(and(
        eq(emailTemplates.orgId, orgId),
        eq(emailTemplates.templateType, templateType),
        eq(emailTemplates.isDefault, true),
        eq(emailTemplates.isActive, true)
      ))
      .limit(1);
    return result[0];
  }

  async createEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const result = await db.insert(emailTemplates).values(insertTemplate).returning();
    return result[0];
  }

  async updateEmailTemplate(id: string, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const result = await db.update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  }

  async setDefaultEmailTemplate(id: string, templateType: string, orgId: string): Promise<void> {
    // First, unset all defaults for this template type and org
    await db.update(emailTemplates)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(and(
        eq(emailTemplates.orgId, orgId),
        eq(emailTemplates.templateType, templateType)
      ));
    
    // Then set the specified template as default
    await db.update(emailTemplates)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id));
  }

  // Member Tags
  async getMemberTag(id: string): Promise<MemberTag | undefined> {
    const result = await db.select().from(memberTags).where(eq(memberTags.id, id)).limit(1);
    return result[0];
  }

  async listMemberTags(orgId: string): Promise<MemberTag[]> {
    return await db.select().from(memberTags).where(eq(memberTags.orgId, orgId));
  }

  async createMemberTag(insertTag: InsertMemberTag): Promise<MemberTag> {
    const result = await db.insert(memberTags).values(insertTag).returning();
    return result[0];
  }

  async updateMemberTag(id: string, updateData: Partial<InsertMemberTag>): Promise<MemberTag | undefined> {
    const result = await db.update(memberTags)
      .set(updateData)
      .where(eq(memberTags.id, id))
      .returning();
    return result[0];
  }

  async deleteMemberTag(id: string): Promise<void> {
    await db.delete(memberTags).where(eq(memberTags.id, id));
  }

  // Member Tag Assignments
  async assignTagToMember(orgId: string, memberId: string, tagId: string): Promise<MemberTagAssignment> {
    const result = await db.insert(memberTagAssignments)
      .values({ orgId, memberId, tagId })
      .returning();
    return result[0];
  }

  async removeTagFromMember(memberId: string, tagId: string): Promise<void> {
    await db.delete(memberTagAssignments)
      .where(and(
        eq(memberTagAssignments.memberId, memberId),
        eq(memberTagAssignments.tagId, tagId)
      ));
  }

  async getMemberTags(memberId: string): Promise<MemberTag[]> {
    const results = await db.select({
      id: memberTags.id,
      orgId: memberTags.orgId,
      name: memberTags.name,
      description: memberTags.description,
      color: memberTags.color,
      createdAt: memberTags.createdAt,
    })
    .from(memberTagAssignments)
    .innerJoin(memberTags, eq(memberTagAssignments.tagId, memberTags.id))
    .where(eq(memberTagAssignments.memberId, memberId));

    return results;
  }

  async getMembersByTag(tagId: string): Promise<User[]> {
    const results = await db.select({
      id: users.id,
      orgId: users.orgId,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      passwordHash: users.passwordHash,
      passwordSetAt: users.passwordSetAt,
      emailOptedOut: users.emailOptedOut,
      createdAt: users.createdAt,
    })
    .from(memberTagAssignments)
    .innerJoin(users, eq(memberTagAssignments.memberId, users.id))
    .where(eq(memberTagAssignments.tagId, tagId));

    return results;
  }

  // Email Campaigns
  async getEmailCampaign(id: string): Promise<EmailCampaign | undefined> {
    const result = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id)).limit(1);
    return result[0];
  }

  async listEmailCampaigns(orgId: string, status?: string): Promise<EmailCampaign[]> {
    if (status) {
      return await db.select().from(emailCampaigns)
        .where(and(eq(emailCampaigns.orgId, orgId), eq(emailCampaigns.status, status)));
    }
    return await db.select().from(emailCampaigns).where(eq(emailCampaigns.orgId, orgId));
  }

  async createEmailCampaign(insertCampaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const result = await db.insert(emailCampaigns).values(insertCampaign).returning();
    return result[0];
  }

  async updateEmailCampaign(id: string, updateData: Partial<InsertEmailCampaign>): Promise<EmailCampaign | undefined> {
    const result = await db.update(emailCampaigns)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(emailCampaigns.id, id))
      .returning();
    return result[0];
  }

  async deleteEmailCampaign(id: string): Promise<void> {
    await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
  }

  async updateCampaignStats(campaignId: string, stats: Partial<EmailCampaign>): Promise<void> {
    await db.update(emailCampaigns)
      .set({ ...stats, updatedAt: new Date() })
      .where(eq(emailCampaigns.id, campaignId));
  }

  async getScheduledCampaignsToSend(now: Date): Promise<EmailCampaign[]> {
    return await db.select().from(emailCampaigns)
      .where(
        and(
          eq(emailCampaigns.status, 'scheduled'),
          sql`${emailCampaigns.scheduledFor} <= ${now}`
        )
      );
  }

  // Email Recipients
  async getEmailRecipient(id: string): Promise<EmailRecipient | undefined> {
    const result = await db.select().from(emailRecipients).where(eq(emailRecipients.id, id)).limit(1);
    return result[0];
  }

  async listEmailRecipients(campaignId: string): Promise<EmailRecipient[]> {
    return await db.select().from(emailRecipients).where(eq(emailRecipients.campaignId, campaignId));
  }

  async createEmailRecipient(insertRecipient: InsertEmailRecipient): Promise<EmailRecipient> {
    const result = await db.insert(emailRecipients).values(insertRecipient).returning();
    return result[0];
  }

  async updateEmailRecipient(id: string, updateData: Partial<EmailRecipient>): Promise<EmailRecipient | undefined> {
    const result = await db.update(emailRecipients)
      .set(updateData)
      .where(eq(emailRecipients.id, id))
      .returning();
    return result[0];
  }

  async getRecipientByToken(token: string): Promise<EmailRecipient | undefined> {
    const result = await db.select().from(emailRecipients).where(eq(emailRecipients.unsubscribeToken, token)).limit(1);
    return result[0];
  }

  async getRecipientByResendId(resendEmailId: string): Promise<EmailRecipient | undefined> {
    const result = await db.select().from(emailRecipients)
      .where(eq(emailRecipients.resendEmailId, resendEmailId))
      .limit(1);
    return result[0];
  }

  // Email Events
  async createEmailEvent(insertEvent: InsertEmailEvent): Promise<EmailEvent> {
    const result = await db.insert(emailEvents).values(insertEvent).returning();
    return result[0];
  }

  async listEmailEvents(campaignId: string): Promise<EmailEvent[]> {
    return await db.select().from(emailEvents).where(eq(emailEvents.campaignId, campaignId));
  }

  // Sermons
  async getSermon(id: string): Promise<Sermon | undefined> {
    const result = await db.select().from(sermons).where(eq(sermons.id, id)).limit(1);
    return result[0];
  }

  async listSermons(orgId: string): Promise<Sermon[]> {
    return await db.select().from(sermons).where(eq(sermons.orgId, orgId));
  }

  async listSermonsByCategory(categoryId: string): Promise<Sermon[]> {
    return await db.select().from(sermons).where(eq(sermons.categoryId, categoryId));
  }

  async listSermonsBySpeaker(orgId: string, speaker: string): Promise<Sermon[]> {
    return await db.select().from(sermons).where(
      and(eq(sermons.orgId, orgId), eq(sermons.speaker, speaker))
    );
  }

  async searchSermons(orgId: string, query: string): Promise<Sermon[]> {
    return await db.select().from(sermons).where(
      and(
        eq(sermons.orgId, orgId),
        sql`(
          ${sermons.title} ILIKE ${`%${query}%`} OR 
          ${sermons.description} ILIKE ${`%${query}%`} OR 
          ${sermons.speaker} ILIKE ${`%${query}%`} OR
          ${sermons.aiSummary} ILIKE ${`%${query}%`} OR
          ${sermons.aiNotes} ILIKE ${`%${query}%`}
        )`
      )
    );
  }

  async filterSermons(orgId: string, filters: {
    categoryId?: string;
    speaker?: string;
    platform?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    isFeatured?: boolean;
  }): Promise<Sermon[]> {
    const conditions = [eq(sermons.orgId, orgId)];

    if (filters.categoryId) {
      conditions.push(eq(sermons.categoryId, filters.categoryId));
    }

    if (filters.speaker) {
      conditions.push(eq(sermons.speaker, filters.speaker));
    }

    if (filters.platform) {
      conditions.push(eq(sermons.platform, filters.platform));
    }

    if (filters.status) {
      conditions.push(eq(sermons.status, filters.status));
    }

    if (filters.startDate) {
      conditions.push(sql`${sermons.sermonDate} >= ${filters.startDate}`);
    }

    if (filters.endDate) {
      conditions.push(sql`${sermons.sermonDate} <= ${filters.endDate}`);
    }

    if (filters.isFeatured !== undefined) {
      conditions.push(eq(sermons.isFeatured, filters.isFeatured));
    }

    return await db.select().from(sermons).where(and(...conditions));
  }

  async createSermon(insertSermon: InsertSermon): Promise<Sermon> {
    const result = await db.insert(sermons).values(insertSermon).returning();
    return result[0];
  }

  async updateSermon(id: string, updates: Partial<InsertSermon>): Promise<Sermon | undefined> {
    const result = await db.update(sermons)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sermons.id, id))
      .returning();
    return result[0];
  }

  async deleteSermon(id: string): Promise<void> {
    await db.delete(sermons).where(eq(sermons.id, id));
  }

  async incrementSermonViews(id: string): Promise<void> {
    await db.execute(sql`
      UPDATE sermons 
      SET views = views + 1
      WHERE id = ${id}
    `);
  }

  // Sermon Categories
  async getSermonCategory(id: string): Promise<SermonCategory | undefined> {
    const result = await db.select().from(sermonCategories).where(eq(sermonCategories.id, id)).limit(1);
    return result[0];
  }

  async listSermonCategories(orgId: string): Promise<SermonCategory[]> {
    return await db.select().from(sermonCategories).where(eq(sermonCategories.orgId, orgId));
  }

  async createSermonCategory(insertCategory: InsertSermonCategory): Promise<SermonCategory> {
    const result = await db.insert(sermonCategories).values(insertCategory).returning();
    return result[0];
  }

  async updateSermonCategory(id: string, updates: Partial<InsertSermonCategory>): Promise<SermonCategory | undefined> {
    const result = await db.update(sermonCategories)
      .set(updates)
      .where(eq(sermonCategories.id, id))
      .returning();
    return result[0];
  }

  async deleteSermonCategory(id: string): Promise<void> {
    await db.delete(sermonCategories).where(eq(sermonCategories.id, id));
  }

  // Sermon Tags
  async getSermonTag(id: string): Promise<SermonTag | undefined> {
    const result = await db.select().from(sermonTags).where(eq(sermonTags.id, id)).limit(1);
    return result[0];
  }

  async listSermonTags(orgId: string): Promise<SermonTag[]> {
    return await db.select().from(sermonTags).where(eq(sermonTags.orgId, orgId));
  }

  async createSermonTag(insertTag: InsertSermonTag): Promise<SermonTag> {
    const result = await db.insert(sermonTags).values(insertTag).returning();
    return result[0];
  }

  async updateSermonTag(id: string, updates: Partial<InsertSermonTag>): Promise<SermonTag | undefined> {
    const result = await db.update(sermonTags)
      .set(updates)
      .where(eq(sermonTags.id, id))
      .returning();
    return result[0];
  }

  async deleteSermonTag(id: string): Promise<void> {
    await db.delete(sermonTags).where(eq(sermonTags.id, id));
  }

  // Sermon Tag Assignments
  async addTagToSermon(sermonId: string, tagId: string): Promise<SermonTagAssignment> {
    const result = await db.insert(sermonTagAssignments).values({
      sermonId,
      tagId,
    }).returning();
    return result[0];
  }

  async removeTagFromSermon(sermonId: string, tagId: string): Promise<void> {
    await db.delete(sermonTagAssignments).where(
      and(
        eq(sermonTagAssignments.sermonId, sermonId),
        eq(sermonTagAssignments.tagId, tagId)
      )
    );
  }

  async getSermonTags(sermonId: string): Promise<SermonTag[]> {
    const results = await db.select({
      id: sermonTags.id,
      orgId: sermonTags.orgId,
      name: sermonTags.name,
      slug: sermonTags.slug,
      createdAt: sermonTags.createdAt,
    })
    .from(sermonTagAssignments)
    .innerJoin(sermonTags, eq(sermonTagAssignments.tagId, sermonTags.id))
    .where(eq(sermonTagAssignments.sermonId, sermonId));

    return results;
  }

  // Volunteers
  async getVolunteer(id: string): Promise<Volunteer | undefined> {
    const result = await db.select().from(volunteers).where(eq(volunteers.id, id)).limit(1);
    return result[0];
  }

  async listVolunteers(orgId: string): Promise<Volunteer[]> {
    return await db.select().from(volunteers).where(eq(volunteers.orgId, orgId));
  }

  async searchVolunteers(orgId: string, query: string): Promise<Volunteer[]> {
    const searchPattern = `%${query}%`;
    return await db.select().from(volunteers).where(
      and(
        eq(volunteers.orgId, orgId),
        sql`${volunteers.firstName} ILIKE ${searchPattern} OR ${volunteers.lastName} ILIKE ${searchPattern} OR ${volunteers.email} ILIKE ${searchPattern}`
      )
    );
  }

  async filterVolunteers(orgId: string, filters: {
    status?: string;
    team?: string;
    skills?: string[];
    state?: string;
    country?: string;
  }): Promise<Volunteer[]> {
    const conditions = [eq(volunteers.orgId, orgId)];
    
    if (filters.status) {
      conditions.push(eq(volunteers.status, filters.status));
    }
    
    if (filters.team) {
      // Check if teams array contains the team using PostgreSQL array contains operator
      conditions.push(sql`${volunteers.teams} @> ARRAY[${filters.team}]::text[]`);
    }
    
    if (filters.skills && filters.skills.length > 0) {
      // Check if skills array overlaps with filter skills (has any common element)
      conditions.push(sql`${volunteers.skills} && ${filters.skills}::text[]`);
    }
    
    if (filters.state) {
      conditions.push(eq(volunteers.state, filters.state));
    }
    
    if (filters.country) {
      conditions.push(eq(volunteers.country, filters.country));
    }
    
    return await db.select().from(volunteers).where(and(...conditions));
  }

  async createVolunteer(insertVolunteer: InsertVolunteer): Promise<Volunteer> {
    const result = await db.insert(volunteers).values(insertVolunteer).returning();
    return result[0];
  }

  async updateVolunteer(id: string, updates: Partial<InsertVolunteer>): Promise<Volunteer | undefined> {
    const result = await db.update(volunteers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(volunteers.id, id))
      .returning();
    return result[0];
  }

  async deleteVolunteer(id: string): Promise<void> {
    await db.delete(volunteers).where(eq(volunteers.id, id));
  }

  // Volunteer Shifts
  async getVolunteerShift(id: string): Promise<VolunteerShift | undefined> {
    const result = await db.select().from(volunteerShifts).where(eq(volunteerShifts.id, id)).limit(1);
    return result[0];
  }

  async listVolunteerShifts(orgId: string, volunteerId?: string): Promise<VolunteerShift[]> {
    if (volunteerId) {
      return await db.select().from(volunteerShifts).where(
        and(
          eq(volunteerShifts.orgId, orgId),
          eq(volunteerShifts.volunteerId, volunteerId)
        )
      );
    }
    return await db.select().from(volunteerShifts).where(eq(volunteerShifts.orgId, orgId));
  }

  async createVolunteerShift(insertShift: InsertVolunteerShift): Promise<VolunteerShift> {
    const result = await db.insert(volunteerShifts).values(insertShift).returning();
    
    // Update volunteer shift count
    await db.update(volunteers)
      .set({ shiftCount: sql`${volunteers.shiftCount} + 1` })
      .where(eq(volunteers.id, insertShift.volunteerId));
    
    return result[0];
  }

  async updateVolunteerShift(id: string, updates: Partial<InsertVolunteerShift>): Promise<VolunteerShift | undefined> {
    const result = await db.update(volunteerShifts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(volunteerShifts.id, id))
      .returning();
    return result[0];
  }

  async deleteVolunteerShift(id: string): Promise<void> {
    // Get shift to find volunteer
    const shift = await this.getVolunteerShift(id);
    if (shift) {
      await db.delete(volunteerShifts).where(eq(volunteerShifts.id, id));
      
      // Update volunteer shift count
      await db.update(volunteers)
        .set({ shiftCount: sql`${volunteers.shiftCount} - 1` })
        .where(eq(volunteers.id, shift.volunteerId));
    }
  }

  // Volunteer Hours
  async getVolunteerHour(id: string): Promise<VolunteerHour | undefined> {
    const result = await db.select().from(volunteerHours).where(eq(volunteerHours.id, id)).limit(1);
    return result[0];
  }

  async listVolunteerHours(orgId: string, volunteerId?: string): Promise<VolunteerHour[]> {
    if (volunteerId) {
      return await db.select().from(volunteerHours).where(
        and(
          eq(volunteerHours.orgId, orgId),
          eq(volunteerHours.volunteerId, volunteerId)
        )
      );
    }
    return await db.select().from(volunteerHours).where(eq(volunteerHours.orgId, orgId));
  }

  async createVolunteerHour(insertHour: InsertVolunteerHour): Promise<VolunteerHour> {
    const result = await db.insert(volunteerHours).values(insertHour).returning();
    return result[0];
  }

  async updateVolunteerHour(id: string, updates: Partial<InsertVolunteerHour>): Promise<VolunteerHour | undefined> {
    const result = await db.update(volunteerHours)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(volunteerHours.id, id))
      .returning();
    return result[0];
  }

  async deleteVolunteerHour(id: string): Promise<void> {
    await db.delete(volunteerHours).where(eq(volunteerHours.id, id));
  }

  async approveVolunteerHour(id: string, approvedBy: string): Promise<VolunteerHour | undefined> {
    // Get the hour record to add to volunteer's total
    const hour = await this.getVolunteerHour(id);
    if (!hour) return undefined;

    // Update the hour record to approved
    const result = await db.update(volunteerHours)
      .set({ 
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(volunteerHours.id, id))
      .returning();

    // Add hours to volunteer's total
    if (result[0] && hour.hoursWorked) {
      await db.update(volunteers)
        .set({ 
          totalHours: sql`${volunteers.totalHours} + ${parseFloat(hour.hoursWorked.toString())}`
        })
        .where(eq(volunteers.id, hour.volunteerId));
    }

    return result[0];
  }

  // Beneficiaries
  async getBeneficiary(id: string): Promise<Beneficiary | undefined> {
    const result = await db.select().from(beneficiaries).where(eq(beneficiaries.id, id)).limit(1);
    return result[0];
  }

  async listBeneficiaries(orgId: string): Promise<Beneficiary[]> {
    return await db.select().from(beneficiaries).where(eq(beneficiaries.orgId, orgId));
  }

  async searchBeneficiaries(orgId: string, query: string): Promise<Beneficiary[]> {
    return await db.select().from(beneficiaries).where(
      and(
        eq(beneficiaries.orgId, orgId),
        sql`(
          ${beneficiaries.firstName} ILIKE ${`%${query}%`} OR 
          ${beneficiaries.lastName} ILIKE ${`%${query}%`} OR 
          ${beneficiaries.organizationName} ILIKE ${`%${query}%`} OR
          ${beneficiaries.email} ILIKE ${`%${query}%`} OR
          ${beneficiaries.phone} ILIKE ${`%${query}%`}
        )`
      )
    );
  }

  async filterBeneficiaries(orgId: string, filters: {
    type?: string;
    status?: string;
    urgencyLevel?: string;
    tags?: string[];
  }): Promise<Beneficiary[]> {
    const conditions = [eq(beneficiaries.orgId, orgId)];

    if (filters.type) {
      conditions.push(eq(beneficiaries.type, filters.type));
    }

    if (filters.status) {
      conditions.push(eq(beneficiaries.status, filters.status));
    }

    if (filters.urgencyLevel) {
      conditions.push(eq(beneficiaries.urgencyLevel, filters.urgencyLevel));
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push(
        sql`${beneficiaries.tags} @> ${JSON.stringify(filters.tags)}::jsonb`
      );
    }

    return await db.select().from(beneficiaries).where(and(...conditions));
  }

  async createBeneficiary(insertBeneficiary: InsertBeneficiary): Promise<Beneficiary> {
    const result = await db.insert(beneficiaries).values(insertBeneficiary).returning();
    return result[0];
  }

  async updateBeneficiary(id: string, updates: Partial<InsertBeneficiary>): Promise<Beneficiary | undefined> {
    const result = await db.update(beneficiaries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(beneficiaries.id, id))
      .returning();
    return result[0];
  }

  async deleteBeneficiary(id: string): Promise<void> {
    await db.delete(beneficiaries).where(eq(beneficiaries.id, id));
  }

  // Beneficiary Donations
  async getBeneficiaryDonation(id: string): Promise<BeneficiaryDonation | undefined> {
    const result = await db.select().from(beneficiaryDonations).where(eq(beneficiaryDonations.id, id)).limit(1);
    return result[0];
  }

  async listBeneficiaryDonations(beneficiaryId: string): Promise<BeneficiaryDonation[]> {
    return await db.select().from(beneficiaryDonations).where(eq(beneficiaryDonations.beneficiaryId, beneficiaryId));
  }

  async createBeneficiaryDonation(insertDonation: InsertBeneficiaryDonation): Promise<BeneficiaryDonation> {
    const result = await db.insert(beneficiaryDonations).values(insertDonation).returning();
    
    // Update beneficiary totals
    const beneficiary = await this.getBeneficiary(insertDonation.beneficiaryId);
    if (beneficiary) {
      const amountToAdd = insertDonation.amount ? parseFloat(insertDonation.amount.toString()) : 0;
      await db.update(beneficiaries)
        .set({ 
          totalDonationsReceived: sql`${beneficiaries.totalDonationsReceived} + ${amountToAdd}`,
          totalGiftsReceived: sql`${beneficiaries.totalGiftsReceived} + 1`,
          lastSupportDate: new Date(),
          firstSupportDate: beneficiary.firstSupportDate || new Date(),
          updatedAt: new Date()
        })
        .where(eq(beneficiaries.id, insertDonation.beneficiaryId));
    }
    
    return result[0];
  }

  async updateBeneficiaryDonation(id: string, updates: Partial<InsertBeneficiaryDonation>): Promise<BeneficiaryDonation | undefined> {
    const result = await db.update(beneficiaryDonations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(beneficiaryDonations.id, id))
      .returning();
    return result[0];
  }

  async deleteBeneficiaryDonation(id: string): Promise<void> {
    // Get donation to update beneficiary totals
    const donation = await this.getBeneficiaryDonation(id);
    if (donation) {
      await db.delete(beneficiaryDonations).where(eq(beneficiaryDonations.id, id));
      
      // Update beneficiary totals
      const amountToSubtract = donation.amount ? parseFloat(donation.amount.toString()) : 0;
      await db.update(beneficiaries)
        .set({ 
          totalDonationsReceived: sql`${beneficiaries.totalDonationsReceived} - ${amountToSubtract}`,
          totalGiftsReceived: sql`${beneficiaries.totalGiftsReceived} - 1`,
          updatedAt: new Date()
        })
        .where(eq(beneficiaries.id, donation.beneficiaryId));
    }
  }

  // Beneficiary Communications
  async getBeneficiaryCommunication(id: string): Promise<BeneficiaryCommunication | undefined> {
    const result = await db.select().from(beneficiaryCommunications).where(eq(beneficiaryCommunications.id, id)).limit(1);
    return result[0];
  }

  async listBeneficiaryCommunications(beneficiaryId: string): Promise<BeneficiaryCommunication[]> {
    return await db.select().from(beneficiaryCommunications)
      .where(eq(beneficiaryCommunications.beneficiaryId, beneficiaryId))
      .orderBy(sql`${beneficiaryCommunications.communicationDate} DESC`);
  }

  async createBeneficiaryCommunication(insertCommunication: InsertBeneficiaryCommunication): Promise<BeneficiaryCommunication> {
    const result = await db.insert(beneficiaryCommunications).values(insertCommunication).returning();
    return result[0];
  }

  async updateBeneficiaryCommunication(id: string, updates: Partial<InsertBeneficiaryCommunication>): Promise<BeneficiaryCommunication | undefined> {
    const result = await db.update(beneficiaryCommunications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(beneficiaryCommunications.id, id))
      .returning();
    return result[0];
  }

  async deleteBeneficiaryCommunication(id: string): Promise<void> {
    await db.delete(beneficiaryCommunications).where(eq(beneficiaryCommunications.id, id));
  }

  // Activities
  async getActivity(id: string): Promise<Activity | undefined> {
    const result = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
    return result[0];
  }

  async listActivities(orgId: string): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.orgId, orgId));
  }

  async listPublishedActivities(orgId: string): Promise<Activity[]> {
    return await db.select().from(activities)
      .where(and(eq(activities.orgId, orgId), eq(activities.isPublished, true)));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const result = await db.insert(activities).values(insertActivity).returning();
    return result[0];
  }

  async updateActivity(id: string, updates: Partial<InsertActivity>): Promise<Activity | undefined> {
    const result = await db.update(activities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(activities.id, id))
      .returning();
    return result[0];
  }

  async deleteActivity(id: string): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
  }

  async incrementActivityStudentCount(id: string, count: number): Promise<boolean> {
    const activity = await this.getActivity(id);
    if (!activity) return false;
    
    const newCount = activity.currentStudents + count;
    if (activity.maxStudents && newCount > activity.maxStudents) {
      return false;
    }
    
    await db.update(activities)
      .set({ currentStudents: newCount, updatedAt: new Date() })
      .where(eq(activities.id, id));
    return true;
  }

  // Activity Sessions
  async getActivitySession(id: string): Promise<ActivitySession | undefined> {
    const result = await db.select().from(activitySessions).where(eq(activitySessions.id, id)).limit(1);
    return result[0];
  }

  async listActivitySessions(activityId: string): Promise<ActivitySession[]> {
    return await db.select().from(activitySessions).where(eq(activitySessions.activityId, activityId));
  }

  async createActivitySession(insertSession: InsertActivitySession): Promise<ActivitySession> {
    const result = await db.insert(activitySessions).values(insertSession).returning();
    return result[0];
  }

  async updateActivitySession(id: string, updates: Partial<InsertActivitySession>): Promise<ActivitySession | undefined> {
    const result = await db.update(activitySessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(activitySessions.id, id))
      .returning();
    return result[0];
  }

  async deleteActivitySession(id: string): Promise<void> {
    await db.delete(activitySessions).where(eq(activitySessions.id, id));
  }

  // Activity Registrations
  async getActivityRegistration(id: string): Promise<ActivityRegistration | undefined> {
    const result = await db.select().from(activityRegistrations).where(eq(activityRegistrations.id, id)).limit(1);
    return result[0];
  }

  async listActivityRegistrations(activityId: string): Promise<ActivityRegistration[]> {
    return await db.select().from(activityRegistrations).where(eq(activityRegistrations.activityId, activityId));
  }

  async getRegistrationByEmail(activityId: string, email: string): Promise<ActivityRegistration | undefined> {
    const result = await db.select().from(activityRegistrations)
      .where(and(eq(activityRegistrations.activityId, activityId), eq(activityRegistrations.studentEmail, email)))
      .limit(1);
    return result[0];
  }

  async createActivityRegistration(insertRegistration: InsertActivityRegistration): Promise<ActivityRegistration> {
    const result = await db.insert(activityRegistrations).values(insertRegistration).returning();
    return result[0];
  }

  async updateActivityRegistration(id: string, updates: Partial<InsertActivityRegistration>): Promise<ActivityRegistration | undefined> {
    const result = await db.update(activityRegistrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(activityRegistrations.id, id))
      .returning();
    return result[0];
  }

  async deleteActivityRegistration(id: string): Promise<void> {
    await db.delete(activityRegistrations).where(eq(activityRegistrations.id, id));
  }

  // Activity Attendance
  async getActivityAttendance(id: string): Promise<ActivityAttendance | undefined> {
    const result = await db.select().from(activityAttendance).where(eq(activityAttendance.id, id)).limit(1);
    return result[0];
  }

  async listActivityAttendance(activityId: string, sessionDate?: Date): Promise<ActivityAttendance[]> {
    if (sessionDate) {
      return await db.select().from(activityAttendance)
        .where(and(
          eq(activityAttendance.activityId, activityId),
          eq(activityAttendance.sessionDate, sessionDate)
        ));
    }
    return await db.select().from(activityAttendance).where(eq(activityAttendance.activityId, activityId));
  }

  async listRegistrationAttendance(registrationId: string): Promise<ActivityAttendance[]> {
    return await db.select().from(activityAttendance)
      .where(eq(activityAttendance.registrationId, registrationId))
      .orderBy(sql`${activityAttendance.sessionDate} DESC`);
  }

  async createActivityAttendance(insertAttendance: InsertActivityAttendance): Promise<ActivityAttendance> {
    const result = await db.insert(activityAttendance).values(insertAttendance).returning();
    return result[0];
  }

  async updateActivityAttendance(id: string, updates: Partial<InsertActivityAttendance>): Promise<ActivityAttendance | undefined> {
    const result = await db.update(activityAttendance)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(activityAttendance.id, id))
      .returning();
    return result[0];
  }

  async deleteActivityAttendance(id: string): Promise<void> {
    await db.delete(activityAttendance).where(eq(activityAttendance.id, id));
  }

  // P2P Campaign Settings
  async getP2PCampaignSettings(campaignId: string): Promise<P2PCampaignSettings | undefined> {
    const result = await db.select().from(p2pCampaignSettings)
      .where(eq(p2pCampaignSettings.campaignId, campaignId))
      .limit(1);
    return result[0];
  }

  async createP2PCampaignSettings(insertSettings: InsertP2PCampaignSettings): Promise<P2PCampaignSettings> {
    const result = await db.insert(p2pCampaignSettings).values(insertSettings).returning();
    return result[0];
  }

  async updateP2PCampaignSettings(campaignId: string, updates: Partial<InsertP2PCampaignSettings>): Promise<P2PCampaignSettings | undefined> {
    const result = await db.update(p2pCampaignSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(p2pCampaignSettings.campaignId, campaignId))
      .returning();
    return result[0];
  }

  // P2P Participants
  async getP2PParticipant(id: string): Promise<P2PParticipant | undefined> {
    const result = await db.select().from(p2pParticipants)
      .where(and(eq(p2pParticipants.id, id), isNull(p2pParticipants.deletedAt)))
      .limit(1);
    return result[0];
  }

  async getP2PParticipantBySlug(slug: string): Promise<P2PParticipant | undefined> {
    const result = await db.select().from(p2pParticipants)
      .where(and(eq(p2pParticipants.slug, slug), isNull(p2pParticipants.deletedAt)))
      .limit(1);
    return result[0];
  }

  async listP2PParticipants(campaignId: string): Promise<P2PParticipant[]> {
    return await db.select().from(p2pParticipants)
      .where(and(eq(p2pParticipants.campaignId, campaignId), isNull(p2pParticipants.deletedAt)));
  }

  async listP2PParticipantsWithStats(campaignId: string): Promise<P2PParticipantWithStats[]> {
    const { hydrateParticipants } = await import('./storage/p2pParticipantHydrator');
    return await hydrateParticipants(campaignId);
  }

  async createP2PParticipant(insertParticipant: InsertP2PParticipant): Promise<P2PParticipantWithStats> {
    const result = await db.insert(p2pParticipants).values(insertParticipant).returning();
    const newParticipant = result[0];
    
    const { hydrateParticipants } = await import('./storage/p2pParticipantHydrator');
    const hydrated = await hydrateParticipants(insertParticipant.campaignId, [newParticipant.id]);
    return hydrated[0];
  }

  async updateP2PParticipant(id: string, updates: Partial<InsertP2PParticipant>): Promise<P2PParticipant | undefined> {
    const result = await db.update(p2pParticipants)
      .set(updates)
      .where(eq(p2pParticipants.id, id))
      .returning();
    return result[0];
  }

  async updateP2PParticipantRaised(id: string, amount: string, donationIncrement: number): Promise<P2PParticipant | undefined> {
    const result = await db.update(p2pParticipants)
      .set({
        raisedAmount: sql`${p2pParticipants.raisedAmount} + ${amount}`,
        donationCount: sql`${p2pParticipants.donationCount} + ${donationIncrement}`,
        lastActive: new Date(),
      })
      .where(eq(p2pParticipants.id, id))
      .returning();
    return result[0];
  }

  async softDeleteP2PParticipant(id: string): Promise<void> {
    await db.update(p2pParticipants)
      .set({ deletedAt: new Date() })
      .where(eq(p2pParticipants.id, id));
  }

  // P2P Invitations
  async getP2PInvitation(id: string): Promise<P2PInvitation | undefined> {
    const result = await db.select().from(p2pInvitations)
      .where(and(eq(p2pInvitations.id, id), isNull(p2pInvitations.deletedAt)))
      .limit(1);
    return result[0];
  }

  async getP2PInvitationByToken(token: string): Promise<P2PInvitation | undefined> {
    const result = await db.select().from(p2pInvitations)
      .where(and(eq(p2pInvitations.token, token), isNull(p2pInvitations.deletedAt)))
      .limit(1);
    return result[0];
  }

  async listP2PInvitations(campaignId: string): Promise<P2PInvitation[]> {
    return await db.select().from(p2pInvitations)
      .where(and(eq(p2pInvitations.campaignId, campaignId), isNull(p2pInvitations.deletedAt)));
  }

  async createP2PInvitation(insertInvitation: InsertP2PInvitation): Promise<P2PInvitation> {
    const result = await db.insert(p2pInvitations).values(insertInvitation).returning();
    return result[0];
  }

  async updateP2PInvitation(id: string, updates: Partial<InsertP2PInvitation>): Promise<P2PInvitation | undefined> {
    const result = await db.update(p2pInvitations)
      .set(updates)
      .where(eq(p2pInvitations.id, id))
      .returning();
    return result[0];
  }

  async softDeleteP2PInvitation(id: string): Promise<void> {
    await db.update(p2pInvitations)
      .set({ deletedAt: new Date() })
      .where(eq(p2pInvitations.id, id));
  }

  // P2P Milestones
  async getP2PMilestone(id: string): Promise<P2PMilestone | undefined> {
    const result = await db.select().from(p2pMilestones)
      .where(eq(p2pMilestones.id, id))
      .limit(1);
    return result[0];
  }

  async listP2PMilestones(campaignId: string): Promise<P2PMilestone[]> {
    return await db.select().from(p2pMilestones)
      .where(eq(p2pMilestones.campaignId, campaignId));
  }

  async createP2PMilestone(insertMilestone: InsertP2PMilestone): Promise<P2PMilestone> {
    const result = await db.insert(p2pMilestones).values(insertMilestone).returning();
    return result[0];
  }

  async updateP2PMilestone(id: string, updates: Partial<InsertP2PMilestone>): Promise<P2PMilestone | undefined> {
    const result = await db.update(p2pMilestones)
      .set(updates)
      .where(eq(p2pMilestones.id, id))
      .returning();
    return result[0];
  }

  async deleteP2PMilestone(id: string): Promise<void> {
    await db.delete(p2pMilestones).where(eq(p2pMilestones.id, id));
  }

  // P2P Participant Milestones
  async getP2PParticipantMilestone(id: string): Promise<P2PParticipantMilestone | undefined> {
    const result = await db.select().from(p2pParticipantMilestones)
      .where(eq(p2pParticipantMilestones.id, id))
      .limit(1);
    return result[0];
  }

  async listP2PParticipantMilestones(participantId: string): Promise<P2PParticipantMilestone[]> {
    return await db.select().from(p2pParticipantMilestones)
      .where(eq(p2pParticipantMilestones.participantId, participantId));
  }

  async createP2PParticipantMilestone(insertMilestone: InsertP2PParticipantMilestone): Promise<P2PParticipantMilestone> {
    const result = await db.insert(p2pParticipantMilestones).values(insertMilestone).returning();
    return result[0];
  }

  async updateP2PParticipantMilestone(id: string, updates: Partial<InsertP2PParticipantMilestone>): Promise<P2PParticipantMilestone | undefined> {
    const result = await db.update(p2pParticipantMilestones)
      .set(updates)
      .where(eq(p2pParticipantMilestones.id, id))
      .returning();
    return result[0];
  }

  async deleteP2PParticipantMilestone(id: string): Promise<void> {
    await db.delete(p2pParticipantMilestones).where(eq(p2pParticipantMilestones.id, id));
  }

  // P2P Chat Messages
  async getP2PChatMessage(id: string): Promise<P2PChatMessage | undefined> {
    const result = await db.select().from(p2pChatMessages)
      .where(eq(p2pChatMessages.id, id))
      .limit(1);
    return result[0];
  }

  async listP2PChatMessages(campaignId: string, limit?: number): Promise<P2PChatMessage[]> {
    const query = db.select().from(p2pChatMessages)
      .where(eq(p2pChatMessages.campaignId, campaignId))
      .orderBy(desc(p2pChatMessages.createdAt));
    
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async createP2PChatMessage(insertMessage: InsertP2PChatMessage): Promise<P2PChatMessage> {
    const result = await db.insert(p2pChatMessages).values(insertMessage).returning();
    return result[0];
  }

  async deleteP2PChatMessage(id: string): Promise<void> {
    await db.delete(p2pChatMessages).where(eq(p2pChatMessages.id, id));
  }

  // P2P Gamification Badges
  async getP2PGamificationBadge(id: string): Promise<P2PGamificationBadge | undefined> {
    const result = await db.select().from(p2pGamificationBadges)
      .where(eq(p2pGamificationBadges.id, id))
      .limit(1);
    return result[0];
  }

  async listP2PGamificationBadges(orgId: string, campaignId?: string): Promise<P2PGamificationBadge[]> {
    if (campaignId) {
      return await db.select().from(p2pGamificationBadges)
        .where(and(
          eq(p2pGamificationBadges.orgId, orgId),
          eq(p2pGamificationBadges.campaignId, campaignId)
        ));
    }
    return await db.select().from(p2pGamificationBadges)
      .where(eq(p2pGamificationBadges.orgId, orgId));
  }

  async createP2PGamificationBadge(insertBadge: InsertP2PGamificationBadge): Promise<P2PGamificationBadge> {
    const result = await db.insert(p2pGamificationBadges).values(insertBadge).returning();
    return result[0];
  }

  async updateP2PGamificationBadge(id: string, updates: Partial<InsertP2PGamificationBadge>): Promise<P2PGamificationBadge | undefined> {
    const result = await db.update(p2pGamificationBadges)
      .set(updates)
      .where(eq(p2pGamificationBadges.id, id))
      .returning();
    return result[0];
  }

  async deleteP2PGamificationBadge(id: string): Promise<void> {
    await db.delete(p2pGamificationBadges).where(eq(p2pGamificationBadges.id, id));
  }

  // P2P Participant Badges
  async listP2PParticipantBadges(participantId: string): Promise<P2PParticipantBadge[]> {
    return await db.select().from(p2pParticipantBadges)
      .where(eq(p2pParticipantBadges.participantId, participantId));
  }

  async createP2PParticipantBadge(insertBadge: InsertP2PParticipantBadge): Promise<P2PParticipantBadge> {
    const result = await db.insert(p2pParticipantBadges).values(insertBadge).returning();
    return result[0];
  }

  async deleteP2PParticipantBadge(id: string): Promise<void> {
    await db.delete(p2pParticipantBadges).where(eq(p2pParticipantBadges.id, id));
  }

  // P2P Documents
  async getP2PDocument(id: string): Promise<P2PDocument | undefined> {
    const result = await db.select().from(p2pDocuments)
      .where(and(eq(p2pDocuments.id, id), isNull(p2pDocuments.deletedAt)))
      .limit(1);
    return result[0];
  }

  async listP2PDocuments(campaignId: string): Promise<P2PDocument[]> {
    return await db.select().from(p2pDocuments)
      .where(and(eq(p2pDocuments.campaignId, campaignId), isNull(p2pDocuments.deletedAt)));
  }

  async createP2PDocument(insertDocument: InsertP2PDocument): Promise<P2PDocument> {
    const result = await db.insert(p2pDocuments).values(insertDocument).returning();
    return result[0];
  }

  async updateP2PDocument(id: string, updates: Partial<InsertP2PDocument>): Promise<P2PDocument | undefined> {
    const result = await db.update(p2pDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(p2pDocuments.id, id))
      .returning();
    return result[0];
  }

  async softDeleteP2PDocument(id: string): Promise<void> {
    await db.update(p2pDocuments)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(p2pDocuments.id, id));
  }

  async incrementP2PDocumentDownloads(id: string): Promise<void> {
    await db.update(p2pDocuments)
      .set({
        downloadCount: sql`${p2pDocuments.downloadCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(p2pDocuments.id, id));
  }
}

export const storage = new DbStorage();
