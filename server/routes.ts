import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { 
  insertOrganizationSchema,
  insertCampaignSchema,
  insertDonorSchema,
  insertDonationSchema,
  insertEventSchema,
  insertEventRegistrationSchema,
  insertEventTicketTypeSchema,
  insertEventSpeakerSchema,
  insertEventSponsorSchema,
  insertEventPromoCodeSchema,
  insertOrganizationRegistrationSchema,
  insertAuthTokenSchema,
  insertUserSchema,
  insertMarketplaceModuleSchema,
  insertModulePricingSchema,
  insertOrganizationModuleSchema,
  insertPartnerSchema,
  insertReferralCodeSchema,
  insertCampaignUpdateSchema,
  insertCampaignExpenseSchema,
  insertCampaignChatMessageSchema,
  insertCampaignStrategySchema,
  insertLivestreamSchema,
  insertLivestreamDonationSchema,
  insertLivestreamChatMessageSchema,
  insertLivestreamAccessSchema,
  insertContactSchema,
  insertContactTagSchema,
  insertContactActivitySchema,
  insertLandingPageSchema,
  insertEmailTemplateSchema,
  insertMemberTagSchema,
  insertMemberTagAssignmentSchema,
  insertEmailCampaignSchema,
  insertEmailRecipientSchema,
  insertEmailEventSchema,
  insertSermonSchema,
  insertSermonCategorySchema,
  insertSermonTagSchema,
  insertDonorTagSchema,
  insertDonorTagAssignmentSchema,
  insertVolunteerSchema,
  insertVolunteerShiftSchema,
  insertVolunteerHourSchema,
  insertBeneficiarySchema,
  insertBeneficiaryDonationSchema,
  insertPrayerRequestSchema,
  insertPrayerSettingsSchema,
  insertActivitySchema,
  insertActivitySessionSchema,
  insertActivityRegistrationSchema,
  insertActivityAttendanceSchema,
  insertP2PCampaignSettingsSchema,
  insertP2PParticipantSchema,
  insertP2PInvitationSchema,
  insertP2PMilestoneSchema,
  insertP2PParticipantMilestoneSchema,
  insertP2PChatMessageSchema,
  insertP2PGamificationBadgeSchema,
  insertP2PParticipantBadgeSchema,
  insertP2PDocumentSchema,
  users,
  donations,
  donorTags,
  donorTagAssignments,
  campaigns,
  campaignUpdates,
  campaignExpenses,
  campaignChatMessages,
  campaignStrategies,
  events,
  livestreams,
  landingPages,
  emailTemplates,
  memberTags,
  memberTagAssignments,
  emailCampaigns,
  emailRecipients,
  emailEvents,
  sermons,
  prayerRequests,
  p2pCampaignSettings,
  p2pParticipants,
  p2pInvitations,
  p2pMilestones,
  p2pParticipantMilestones,
  p2pChatMessages,
  p2pGamificationBadges,
  p2pParticipantBadges,
  p2pDocuments,
  dashboardPreferences,
  activityRegistrations,
  activities,
  eventRegistrations,
} from "@shared/schema";
import { eq, and, or, gte, lte, asc, desc, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import Stripe from "stripe";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";
import { sendApprovalEmail, sendRejectionEmail, sendNewRegistrationNotification, sendTeamAdminInvitation } from "./email";
import { sendCampaign } from "./emailSender";
import { sendThankYouEmail, sendTicketConfirmationEmail, resendEmail } from "./resendEmail";
import QRCode from "qrcode";
import { seedDefaultEmailTemplate } from "./seed-default-email-templates";
import { objectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectAclPolicy, ObjectPermission } from "./objectAcl";
import { seedSubscriptionData } from "./seed-subscriptions";
import { openai } from "./openai";
import { buildOrgChatContext } from "./ai/contextBuilder";
import multer from "multer";
import { stripeSubscriptionService } from "./stripeSubscription";
import { memberCountService } from "./memberCount";
import * as analytics from "./analytics";

const stripeSecretKey = process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey!, {
  apiVersion: "2024-12-18.acacia" as any,
});

// Helper function to build ticket email context
async function buildTicketEmailContext(params: {
  eventId: string;
  ticketTypeId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  ticketCount: number;
  totalPaid: string;
  qrCode: string;
}) {
  try {
    // Fetch event details
    const event = await storage.getEvent(params.eventId);
    if (!event) {
      console.error('Event not found for email:', params.eventId);
      return null;
    }

    // Fetch organization details
    const organization = await storage.getOrganization(event.orgId);

    // Fetch ticket type details if applicable
    let ticketTypeName: string | undefined;
    if (params.ticketTypeId) {
      const ticketType = await storage.getEventTicketType(params.ticketTypeId);
      ticketTypeName = ticketType?.name;
    }

    // Generate QR code URL that encodes the registration's unique QR code string
    // This allows staff to scan and check-in attendees using the code like EVT-D4DF4963-MK2XW8IQ
    const baseUrl = process.env.BASE_URL || process.env.APP_URL || `https://devportal.plegit.ai`;
    const qrCodeUrl = `${baseUrl.replace(/\/+$/, '')}/api/qr/checkin/${encodeURIComponent(params.qrCode)}`;
    
    console.log('[Email] QR code for check-in:', params.qrCode, 'URL:', qrCodeUrl);

    // Format event date
    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      to: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      eventTitle: event.title,
      eventDate,
      eventTime: event.time || undefined,
      eventLocation: event.location,
      ticketTypeName,
      ticketCount: params.ticketCount,
      totalPaid: params.totalPaid,
      qrCodeDataUrl: qrCodeUrl,  // URL to fetch QR code image
      qrCodeString: params.qrCode,  // The actual code string like EVT-D4DF4963-MK2XW8IQ
      organizationName: organization?.name,
      logoUrl: organization?.logoUrl || undefined,
    };
  } catch (error) {
    console.error('Error building ticket email context:', error);
    return null;
  }
}

// Authentication middleware
const requireAuth = async (req: any, res: any, next: any) => {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(403).json({ error: "User not found" });
  }
  
  req.user = user;
  next();
};

const requireRole = (role: string) => {
  return async (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Access denied - insufficient permissions" });
    }
    
    next();
  };
};

// Middleware to enforce audience-based portal access
const requireAudience = (expectedAudience: "eco_admin" | "org_portal") => {
  return async (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const sessionAudience = req.session?.audience;
    
    // Force re-login for sessions without explicit audience (security hardening)
    if (!sessionAudience) {
      req.session.destroy(() => {});
      return res.status(401).json({ 
        error: "Session expired - please log in again",
        reason: "audience_required"
      });
    }
    
    if (sessionAudience !== expectedAudience) {
      const message = expectedAudience === "eco_admin" 
        ? "Access denied - This portal is restricted to platform administrators"
        : "Access denied - This portal is restricted to organization users";
      return res.status(403).json({ 
        error: message,
        expectedAudience,
        actualAudience: sessionAudience
      });
    }
    
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Public routes - no authentication required
  // These must be registered BEFORE protected routes to take precedence
  const publicPaths = [
    '/api/auth',
    '/api/webhooks',
    '/api/registrations',           // Organization registration
    '/api/ai-chat',
    '/api/public',
    '/api/email/unsubscribe',
    '/api/campaigns/public',        // Public campaign pages
    '/api/campaigns/:id/donate',    // Public donation endpoint
    '/api/campaigns/:id/donate-confirm',
    '/api/events/public',           // Public event pages
    '/api/events/:id',              // Public event detail (for backward compatibility)
    '/api/events/:id/register',     // Public event registration
    '/api/events/:id/ticket-types', // Public ticket types for event registration
    '/api/qr/:eventId',             // Public QR code image generation for emails
    '/api/qr/checkin/:qrCode',      // Public QR code for check-in codes
    '/api/activities/public',       // Public activity pages
    '/api/livestreams/public',      // Public livestream pages
    '/api/livestreams/:id/donate',  // Public livestream donation
    '/api/livestreams/:id/chat',    // Public livestream chat
    '/api/prayer-requests',         // Public prayer wall submissions and viewing
    '/api/upload/url',              // Upload URL generation for registrations
    '/api/files/set-acl',           // ACL setting for registration uploads
  ];

  // Apply public paths middleware FIRST - before any authentication
  app.use((req: any, res: any, next: any) => {
    const path = req.path;
    
    // Check if path matches any public path pattern
    const isPublicPath = publicPaths.some(publicPath => {
      // Handle exact matches
      if (path === publicPath) {
        return true;
      }
      
      // Handle paths that start with the public path (for sub-paths like /api/public/chat)
      if (path.startsWith(publicPath + '/')) {
        return true;
      }
      
      // Convert Express route pattern to regex for parameterized routes
      const pattern = publicPath
        .replace(/\//g, '\\/')  // Escape slashes
        .replace(/:(\w+)/g, '[^/]+'); // Replace :param with [^/]+
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(path);
    });
    
    // If it's a public path, skip authentication
    if (isPublicPath) {
      return next();
    }
    
    // Otherwise, continue to next middleware (which may require auth)
    next();
  });
  
  // Audience enforcement via path-based middleware
  // This provides comprehensive protection without refactoring all routes
  
  // Middleware to allow both audiences (for shared routes)
  const requireEitherAudience = async (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const sessionAudience = req.session?.audience;
    
    // Force re-login for sessions without explicit audience
    if (!sessionAudience) {
      req.session.destroy(() => {});
      return res.status(401).json({ 
        error: "Session expired - please log in again",
        reason: "audience_required"
      });
    }
    
    // Accept either eco_admin or org_portal audience
    if (sessionAudience !== "eco_admin" && sessionAudience !== "org_portal") {
      return res.status(403).json({ error: "Invalid audience" });
    }
    
    next();
  };

  // Eco Admin routes - require eco_admin audience
  const ecoAdminPrefixes = [
    '/api/eco-admin',
    '/api/admin',                   // Platform admin functions - CRITICAL
  ];
  
  // Organization portal routes - require org_portal audience
  // NOTE: Campaigns, events, activities, livestreams are handled via mixedPrefixRoutes below
  const orgPortalPrefixes = [
    '/api/organizations',           // Organization CRUD - CRITICAL
    '/api/event-registrations',     // (Admin view only - public uses /events/:id/register)
    '/api/donors',
    '/api/donor-tags',
    '/api/donations',               // Donations management - CRITICAL
    '/api/contacts',
    '/api/contact-tags',
    '/api/sermons',
    '/api/beneficiaries',
    '/api/beneficiary-communications',
    '/api/beneficiary-donations',
    '/api/volunteers',
    '/api/activity-attendance',
    '/api/activity-registrations',  // (Admin view only - public uses /activities/:id/register)
    '/api/activity-sessions',
    '/api/email-templates',
    '/api/email-campaigns',
    '/api/landing-page',
    '/api/marketplace',
    '/api/prayer-times',
    '/api/files',                   // File uploads
    '/api/org',
  ];
  
  // Shared routes - allow both eco_admin and org_portal audiences
  const sharedPrefixes = [
    '/api/me',                      // User profile (both portals need this)
  ];
  
  // Routes with mixed access patterns - need careful handling
  // These have both public and authenticated endpoints under same prefix
  const mixedPrefixRoutes = [
    { prefix: '/api/campaigns', authenticated: true, audience: 'org_portal' },
    { prefix: '/api/events', authenticated: true, audience: 'org_portal' },
    { prefix: '/api/activities', authenticated: true, audience: 'org_portal' },
    { prefix: '/api/livestreams', authenticated: true, audience: 'org_portal' },
  ];
  
  // CRITICAL: Apply mixed-access routes FIRST so public paths bypass auth
  // These routes have both public and authenticated endpoints under same prefix
  mixedPrefixRoutes.forEach(({ prefix, audience }) => {
    app.use(prefix, (req: any, res: any, next: any) => {
      const path = req.path;  // Path is relative to the mounted prefix
      
      // Explicit allowlist for public paths (no authentication required)
      // Note: req.path is relative, so /api/campaigns/public becomes /public
      // 
      // SECURITY: This is an explicit allowlist - do NOT use broad catch-all patterns
      // Only documented public endpoints should be listed here
      const isPublicPath = 
        // Public list endpoints
        path === '/public' ||
        path.startsWith('/public/') ||
        // Public interaction endpoints (donations, registrations, chat)
        /^\/[^/]+\/donate$/.test(path) ||          // /api/campaigns/:id/donate
        /^\/[^/]+\/donate-confirm$/.test(path) ||  // /api/campaigns/:id/donate-confirm
        /^\/[^/]+\/register$/.test(path) ||        // /api/events/:id/register, /api/activities/:id/register
        /^\/[^/]+\/chat$/.test(path);              // /api/livestreams/:id/chat
      
      // If public path, skip authentication
      if (isPublicPath) {
        return next();
      }
      
      // Require authentication and audience for non-public paths
      return requireAuth(req, res, () => {
        requireAudience(audience as "org_portal")(req, res, next);
      });
    });
  });
  
  // Apply eco-admin audience enforcement
  ecoAdminPrefixes.forEach(prefix => {
    app.use(prefix, requireAuth, requireAudience("eco_admin"));
  });
  
  // Apply shared route enforcement (both audiences allowed)
  sharedPrefixes.forEach(prefix => {
    app.use(prefix, requireAuth, requireEitherAudience);
  });
  
  // Apply org-portal audience enforcement
  orgPortalPrefixes.forEach(prefix => {
    app.use(prefix, async (req: any, res: any, next: any) => {
      // Allow file uploads and ACL setting without authentication (for registration uploads)
      if ((req.method === 'POST' || req.method === 'PUT') && req.path === '/upload') {
        return next(); // Allow through without authentication
      }
      
      if (req.method === 'POST' && req.path === '/set-acl') {
        return next(); // Allow through without authentication
      }
      
      // Special handling for /api/files - allow both eco_admin and org_portal for file downloads
      // This allows eco-admin users to view registration documents
      if (prefix === '/api/files' && req.method === 'GET') {
        return requireAuth(req, res, () => {
          requireEitherAudience(req, res, next);
        });
      }
      
      // For all other routes, require authentication
      return requireAuth(req, res, () => {
        requireAudience("org_portal")(req, res, next);
      });
    });
  });

  // Helper function to construct URLs without double slashes
  // Optionally accepts a request object to get host (always uses HTTPS for production)
  const buildUrl = (path: string, queryParams?: Record<string, string>, req?: any): string => {
    let baseUrl = process.env.BASE_URL || process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
    
    // If request is provided, use the request host but always force HTTPS (except localhost)
    if (req) {
      try {
        const host = req.get ? req.get('host') : (req.headers?.host);
        
        if (host) {
          // Always use HTTPS unless it's localhost (for development)
          const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
          baseUrl = `${protocol}://${host}`;
        }
      } catch (error) {
        // Fall back to BASE_URL if request parsing fails
        console.warn('Failed to detect host from request, using BASE_URL:', error);
      }
    }
    
    // If BASE_URL is set and not localhost, ensure it uses HTTPS
    if (baseUrl && !baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1')) {
      baseUrl = baseUrl.replace(/^http:\/\//, 'https://');
    }
    
    baseUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
    
    const url = new URL(path, baseUrl);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return url.toString();
  };

  // Get current user
  app.get("/api/me", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return user without password hash
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update current user profile
  app.patch("/api/me", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { firstName, lastName, email } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { passwordHash, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Dashboard Preferences
  app.get("/api/dashboard/preferences", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      const user = await storage.getUser(userId);
      if (!user || !user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const [preferences] = await db
        .select()
        .from(dashboardPreferences)
        .where(and(eq(dashboardPreferences.userId, userId), eq(dashboardPreferences.orgId, user.orgId)))
        .limit(1);

      if (!preferences) {
        // Return default preferences
        return res.json({
          userId,
          orgId: user.orgId,
          widgetLayout: {
            enabled: ["donations", "campaigns", "events", "volunteers", "beneficiaries", "activities", "recent-activity"],
            order: ["donations", "campaigns", "events", "volunteers", "beneficiaries", "activities", "recent-activity"],
            sizes: {},
          },
          dateRangePreset: "last30days",
        });
      }

      res.json(preferences);
    } catch (error) {
      console.error("Error fetching dashboard preferences:", error);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.patch("/api/dashboard/preferences", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      const user = await storage.getUser(userId);
      if (!user || !user.orgId) {
        console.log('[Dashboard API] Access denied - no user or orgId');
        return res.status(403).json({ error: "Access denied" });
      }

      const { widgetLayout, dateRangePreset } = req.body;
      console.log('[Dashboard API] PATCH request from userId:', userId, 'orgId:', user.orgId);
      console.log('[Dashboard API] Request body:', JSON.stringify(req.body, null, 2));

      // Check if preferences exist
      const [existing] = await db
        .select()
        .from(dashboardPreferences)
        .where(and(eq(dashboardPreferences.userId, userId), eq(dashboardPreferences.orgId, user.orgId)))
        .limit(1);
      
      console.log('[Dashboard API] Existing preferences:', existing ? 'Found' : 'Not found');

      let result;
      if (existing) {
        // Update existing
        [result] = await db
          .update(dashboardPreferences)
          .set({
            widgetLayout: widgetLayout || existing.widgetLayout,
            dateRangePreset: dateRangePreset || existing.dateRangePreset,
            updatedAt: new Date(),
          })
          .where(eq(dashboardPreferences.id, existing.id))
          .returning();
      } else {
        // Create new
        [result] = await db
          .insert(dashboardPreferences)
          .values({
            userId,
            orgId: user.orgId,
            widgetLayout: widgetLayout || {
              enabled: ["donations", "campaigns", "events", "volunteers", "beneficiaries", "activities", "recent-activity"],
              order: ["donations", "campaigns", "events", "volunteers", "beneficiaries", "activities", "recent-activity"],
              sizes: {},
            },
            dateRangePreset: dateRangePreset || "last30days",
          })
          .returning();
      }

      console.log('[Dashboard API] Returning result:', JSON.stringify(result, null, 2));
      res.json(result);
    } catch (error) {
      console.error("Error updating dashboard preferences:", error);
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });
  
  // Organizations
  // Get current user's organization
  app.get("/api/org", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.orgId) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const org = await storage.getOrganization(user.orgId);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      res.json(org);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ error: "Failed to fetch organization" });
    }
  });

  app.get("/api/organizations", async (req, res) => {
    try {
      const orgs = await storage.listOrganizations();
      res.json(orgs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  app.get("/api/organizations/:id", async (req, res) => {
    try {
      const org = await storage.getOrganization(req.params.id);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }
      res.json(org);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organization" });
    }
  });

  // Alternative route format for organization fetch (used by frontend)
  // NOTE: More specific routes must be registered BEFORE general routes
  // Register subscription routes first (before /api/org/:orgId)
  
  // Organization - Get Subscription Info
  app.get("/api/org/:orgId/subscription", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const subscription = await storage.getOrganizationSubscription(req.params.orgId);
      
      // If no subscription exists, return a default free tier subscription structure
      if (!subscription) {
        console.log("No subscription found - returning default free tier structure");
        let freePlan = await storage.getSubscriptionPlanByTierCode('free');
        
        // If free plan doesn't exist, create a dummy free plan
        if (!freePlan) {
          console.log("Free tier plan not found - creating dummy free plan");
          try {
            freePlan = await storage.createSubscriptionPlan({
              tierCode: 'free',
              name: 'Free',
              description: 'Perfect for getting started with up to 100 members. Includes Donor CRM, Contacts, and Landing Page.',
              minMembers: 0,
              maxMembers: 100,
              baseMonthlyPrice: '0.00',
              baseYearlyPrice: '0.00',
              currency: 'GBP',
              isActive: true,
            });
            console.log("Created dummy free plan:", freePlan.id);
          } catch (error) {
            console.error("Error creating free plan:", error);
            // If creation fails, return a hardcoded structure
            return res.json({
              subscription: {
                id: 'default-free',
                orgId: req.params.orgId,
                planId: 'dummy-free-plan',
                status: 'active',
                memberCount: 0,
                billingCycle: 'monthly',
                autoUpgradeQueued: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              plan: {
                id: 'dummy-free-plan',
                tierCode: 'free',
                name: 'Free',
                description: 'Perfect for getting started with up to 100 members. Includes Donor CRM, Contacts, and Landing Page.',
                minMembers: 0,
                maxMembers: 100,
                baseMonthlyPrice: '0.00',
                baseYearlyPrice: '0.00',
                currency: 'GBP',
                isActive: true,
              },
              usagePercentage: 0,
              recommendedTier: null,
            });
          }
        }
        
        // Return a default free subscription structure
        return res.json({
          subscription: {
            id: 'default-free',
            orgId: req.params.orgId,
            planId: freePlan.id,
            status: 'active',
            memberCount: 0,
            billingCycle: 'monthly',
            autoUpgradeQueued: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          plan: freePlan,
          usagePercentage: 0,
          recommendedTier: null,
        });
      }

      console.log("Subscription found:", subscription);
      console.log("Looking up plan with ID:", subscription.planId);

      const plan = await storage.getSubscriptionPlan(subscription.planId);
      console.log("Plan found:", plan);

      if (!plan) {
        console.error("Plan not found for ID:", subscription.planId);
        return res.status(404).json({ error: "Subscription plan not found" });
      }

      const usagePercentage = await memberCountService.getTierUsagePercentage(req.params.orgId);
      const recommendedTier = await memberCountService.getRecommendedTier(subscription.memberCount);

      res.json({
        subscription,
        plan,
        usagePercentage,
        recommendedTier: subscription.memberCount > (plan?.maxMembers || Infinity) ? recommendedTier : null,
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  // Organization - Update Member Count
  app.post("/api/org/:orgId/subscription/update-member-count", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const memberCount = await memberCountService.updateOrganizationMemberCount(req.params.orgId);
      const autoUpgradeQueued = await memberCountService.checkAndQueueAutoUpgrade(req.params.orgId);

      res.json({
        memberCount,
        autoUpgradeQueued,
        message: autoUpgradeQueued
          ? "Member count updated and auto-upgrade queued"
          : "Member count updated successfully",
      });
    } catch (error) {
      console.error("Error updating member count:", error);
      res.status(500).json({ error: "Failed to update member count" });
    }
  });

  // Organization - Get Available Subscription Plans for Upgrade
  app.get("/api/org/:orgId/subscription/available-plans", async (req, res) => {
    try {
      console.log(`[Available Plans] Request received for orgId: ${req.params.orgId}`);
      const userId = (req as any).session?.userId;
      if (!userId) {
        console.log(`[Available Plans] No userId in session`);
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        console.log(`[Available Plans] Access denied - userId: ${userId}, user.orgId: ${user?.orgId}, requested orgId: ${req.params.orgId}`);
        return res.status(403).json({ error: "Access denied" });
      }

      // Get organization for default currency
      const organization = await storage.getOrganization(req.params.orgId);
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Hardcoded FREE plan (not in DB)
      const hardcodedFreePlan = {
        id: 'free-plan-hardcoded',
        tierCode: 'free',
        name: 'Free',
        description: 'Perfect for getting started with up to 100 members. Includes Donor CRM, Contacts, and Landing Page.',
        minMembers: 0,
        maxMembers: 100,
        baseMonthlyPrice: '0.00',
        baseYearlyPrice: '0.00',
        currency: 'GBP',
        isActive: true,
        createdAt: new Date(),
      };

      // Get organization's current subscription (if exists) - just for currentPlan and memberCount
      const currentSubscription = await storage.getOrganizationSubscription(req.params.orgId);
      let currentPlan = null;
      let memberCount = 0;

      if (currentSubscription) {
        currentPlan = await storage.getSubscriptionPlan(currentSubscription.planId);
        memberCount = currentSubscription.memberCount || 0;
        console.log(`[Available Plans] Found subscription - plan: ${currentPlan?.name}, memberCount: ${memberCount}`);
      } else {
        // No subscription found - use hardcoded free plan
        console.log(`[Available Plans] No subscription found - using hardcoded free plan`);
        currentPlan = hardcodedFreePlan;
      }

      // Get ALL active subscription plans from DB - filter out any "free" plan if it exists
      const allDbPlans = await storage.listSubscriptionPlans(true);
      const dbPlans = allDbPlans.filter(plan => plan.tierCode !== 'free');
      
      // Get pricing for ALL currencies (GBP, USD, AED)
      const allCountryPricing = await storage.listCountryPricing();
      
      // Add pricing to hardcoded free plan (always free for all currencies)
      const freePlanWithPricing = {
        ...hardcodedFreePlan,
        pricing: {
          GBP: {
            currency: 'GBP',
            monthlyPrice: '0.00',
            yearlyPrice: '0.00',
          },
          USD: {
            currency: 'USD',
            monthlyPrice: '0.00',
            yearlyPrice: '0.00',
          },
          AED: {
            currency: 'AED',
            monthlyPrice: '0.00',
            yearlyPrice: '0.00',
          },
        },
      };
      
      // Add pricing information for all currencies to each DB plan
      const dbPlansWithPricing = dbPlans.map(plan => {
        // Find pricing for each currency
        const gbpPricing = allCountryPricing.find(p => p.tierCode === plan.tierCode && p.currency === 'GBP');
        const usdPricing = allCountryPricing.find(p => p.tierCode === plan.tierCode && p.currency === 'USD');
        const aedPricing = allCountryPricing.find(p => p.tierCode === plan.tierCode && p.currency === 'AED');
        
        return {
          ...plan,
          pricing: {
            GBP: gbpPricing ? {
              currency: 'GBP',
              monthlyPrice: gbpPricing.monthlyPrice,
              yearlyPrice: gbpPricing.yearlyPrice,
            } : null,
            USD: usdPricing ? {
              currency: 'USD',
              monthlyPrice: usdPricing.monthlyPrice,
              yearlyPrice: usdPricing.yearlyPrice,
            } : null,
            AED: aedPricing ? {
              currency: 'AED',
              monthlyPrice: aedPricing.monthlyPrice,
              yearlyPrice: aedPricing.yearlyPrice,
            } : null,
          },
        };
      });

      // Combine: free plan first, then all DB plans
      const allPlansWithPricing = [freePlanWithPricing, ...dbPlansWithPricing];

      // Sort plans by member count (minMembers) in ascending order
      allPlansWithPricing.sort((a, b) => a.minMembers - b.minMembers);

      // Clamp defaultCurrency to supported currencies (GBP, USD, AED)
      const supportedCurrencies = ['GBP', 'USD', 'AED'];
      const orgCurrency = organization.currency || 'GBP';
      const defaultCurrency = supportedCurrencies.includes(orgCurrency) ? orgCurrency : 'GBP';

      console.log(`[Available Plans] Returning response - currentPlan: ${currentPlan?.name || 'null'}, availablePlans count: ${allPlansWithPricing.length}, memberCount: ${memberCount}, defaultCurrency: ${defaultCurrency}`);

      res.json({
        currentPlan: currentPlan || hardcodedFreePlan,
        availablePlans: allPlansWithPricing,
        currentMemberCount: memberCount,
        defaultCurrency: defaultCurrency as 'GBP' | 'USD' | 'AED',
      });
    } catch (error) {
      console.error("Error fetching available plans:", error);
      res.status(500).json({ error: "Failed to fetch available plans" });
    }
  });

  // Organization - Create Stripe Checkout Session for Subscription Upgrade
  app.post("/api/org/:orgId/subscription/create-checkout", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      // Only allow eco_admin or org_admin to create checkout sessions
      if (user.role !== "eco_admin" && user.role !== "org_admin") {
        return res.status(403).json({ error: "Only organization administrators can upgrade subscription plans" });
      }

      // Verify user belongs to the organization (org_admin only)
      if (user.role === "org_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { planId, billingCycle, currency } = req.body;
      if (!planId || !billingCycle || !currency) {
        return res.status(400).json({ error: "planId, billingCycle, and currency are required" });
      }

      if (billingCycle !== "monthly" && billingCycle !== "yearly") {
        return res.status(400).json({ error: "billingCycle must be 'monthly' or 'yearly'" });
      }

      if (!['GBP', 'USD', 'AED'].includes(currency)) {
        return res.status(400).json({ error: "currency must be GBP, USD, or AED" });
      }

      // Get organization
      const organization = await storage.getOrganization(req.params.orgId);
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Handle hardcoded free plan ID
      let plan;
      if (planId === 'free-plan-hardcoded') {
        // Hardcoded free plan
        plan = {
          id: 'free-plan-hardcoded',
          tierCode: 'free',
          name: 'Free',
          description: 'Perfect for getting started with up to 100 members. Includes Donor CRM, Contacts, and Landing Page.',
          minMembers: 0,
          maxMembers: 100,
          baseMonthlyPrice: '0.00',
          baseYearlyPrice: '0.00',
          currency: 'GBP',
          isActive: true,
        };
      } else {
        // Get the plan from database
        plan = await storage.getSubscriptionPlan(planId);
        if (!plan) {
          return res.status(404).json({ error: "Subscription plan not found" });
        }
      }

      // Get current subscription (if exists) - this is optional for new subscriptions
      const currentSubscription = await storage.getOrganizationSubscription(req.params.orgId);
      let currentPlan = null;
      
      if (currentSubscription) {
        // Get current plan to prevent selecting the same plan
        // Handle hardcoded free plan ID
        if (currentSubscription.planId === 'free-plan-hardcoded' || currentSubscription.planId === 'dummy-free-plan' || currentSubscription.planId === 'default-free') {
          currentPlan = {
            id: 'free-plan-hardcoded',
            tierCode: 'free',
            name: 'Free',
          };
        } else {
          currentPlan = await storage.getSubscriptionPlan(currentSubscription.planId);
        }
        
        // Prevent selecting the same plan (allow both upgrades and downgrades)
        if (currentPlan && plan.id === currentPlan.id) {
          return res.status(400).json({ error: "You are already on this plan" });
        }
        
        // Also check by tierCode for free plan
        if (currentPlan?.tierCode === 'free' && plan.tierCode === 'free') {
          return res.status(400).json({ error: "You are already on the free plan" });
        }
      }
      

      // Handle free plan - no payment required
      if (plan.tierCode === 'free') {
        return res.status(400).json({ 
          error: "The free plan is automatically assigned to organizations without a subscription. You cannot subscribe to the free plan through checkout." 
        });
      }

      // Get pricing for the selected currency
      const allCountryPricing = await storage.listCountryPricing();
      const localizedPricing = allCountryPricing.find(
        p => p.tierCode === plan.tierCode && p.currency === currency
      );
      
      if (!localizedPricing) {
        return res.status(400).json({ 
          error: `Pricing not available for plan "${plan.name}" in currency ${currency}. Please contact support.` 
        });
      }

      // Use localized pricing
      const price = billingCycle === "monthly" ? localizedPricing.monthlyPrice : localizedPricing.yearlyPrice;
      
      // Additional validation: ensure price is valid (display / reporting only — no payment)
      if (!price || parseFloat(price) < 0) {
        return res.status(400).json({
          error: `Invalid pricing for plan "${plan.name}" in currency ${currency}. Please contact support.`,
        });
      }

      const now = new Date();
      const periodEnd = new Date(now);
      if (billingCycle === "monthly") {
        periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
      } else {
        periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 1);
      }

      const memberCount = currentSubscription?.memberCount ?? 0;

      const subscriptionPayload = {
        planId: plan.id,
        billingCycle,
        memberCount,
        status: "active" as const,
        stripeCustomerId: null as string | null,
        stripeSubscriptionId: null as string | null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        canceledAt: null as Date | null,
      };

      let saved;
      if (currentSubscription) {
        saved = await storage.updateOrganizationSubscription(req.params.orgId, subscriptionPayload);
      } else {
        saved = await storage.createOrganizationSubscription({
          orgId: req.params.orgId,
          ...subscriptionPayload,
        });
      }

      console.log("[subscription] Recorded locally (no payment):", req.params.orgId, plan.id, billingCycle, currency);

      res.json({
        success: true,
        subscription: saved,
      });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Organization - Cancel Subscription
  app.post("/api/org/:orgId/subscription/cancel", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      // Only allow eco_admin or org_admin to cancel subscriptions
      if (user.role !== "eco_admin" && user.role !== "org_admin") {
        return res.status(403).json({ error: "Only organization administrators can cancel subscriptions" });
      }

      // Verify user belongs to the organization (org_admin only)
      if (user.role === "org_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get current subscription
      const currentSubscription = await storage.getOrganizationSubscription(req.params.orgId);
      if (!currentSubscription) {
        return res.status(404).json({ error: "No subscription found" });
      }

      // Prevent canceling FREE tier
      const currentPlan = await storage.getSubscriptionPlan(currentSubscription.planId);
      if (!currentPlan || currentPlan.tierCode === "free") {
        return res.status(400).json({ error: "Cannot cancel FREE tier subscription" });
      }

      // Check if already canceled
      if (currentSubscription.cancelAtPeriodEnd || currentSubscription.status === "canceled") {
        return res.status(400).json({ error: "Subscription is already canceled" });
      }

      if (currentSubscription.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.update(currentSubscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
          });
        } catch (stripeErr) {
          console.warn("Stripe cancel skipped or failed (subscription may be local-only):", stripeErr);
        }
      }

      await storage.updateOrganizationSubscription(req.params.orgId, {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      });

      res.json({
        message: "Subscription will be canceled at the end of the billing period",
        canceledAt: new Date(),
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // Stripe Connect OAuth routes - must be registered BEFORE general /api/org/:orgId route
  // Get Stripe connection status
  app.get("/api/org/:orgId/stripe", async (req: any, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      const { orgId } = req.params;
      
      // Verify user belongs to this org or is eco_admin
      if (user.role !== "eco_admin" && user.orgId !== orgId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const org = await storage.getOrganization(orgId);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Return safe connection info (not tokens!)
      res.json({
        connected: !!org.stripeAccountId,
        accountId: org.stripeAccountId,
        accountStatus: org.stripeAccountStatus,
        scope: org.stripeScope,
      });
    } catch (error) {
      console.error("Error fetching Stripe connection:", error);
      res.status(500).json({ error: "Failed to fetch Stripe connection" });
    }
  });

  // Handle GET requests to stripe/connect - redirect to settings page
  // This endpoint should only be accessed via POST, but if someone navigates
  // to it via GET (e.g., from a bookmark or direct URL), redirect them to settings
  app.get("/api/org/:orgId/stripe/connect", async (req: any, res) => {
    console.log("[Stripe Connect] GET request received - redirecting to settings");
    return res.redirect("/dashboard/settings");
  });

  // Initiate Stripe Connect OAuth
  app.post("/api/org/:orgId/stripe/connect", async (req: any, res) => {
    console.log("[Stripe Connect] ===== Starting Stripe Connect OAuth flow =====");
    try {
      const userId = (req as any).session?.userId;
      console.log("[Stripe Connect] Step 1: Checking authentication - userId:", userId);
      if (!userId) {
        console.log("[Stripe Connect] ERROR: No userId in session");
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      console.log("[Stripe Connect] Step 2: Fetching user - found:", !!user, "role:", user?.role, "orgId:", user?.orgId);
      if (!user) {
        console.log("[Stripe Connect] ERROR: User not found in database");
        return res.status(403).json({ error: "User not found" });
      }

      const { orgId } = req.params;
      console.log("[Stripe Connect] Step 3: Request orgId:", orgId);
      
      // Verify user belongs to this org or is eco_admin
      if (user.role !== "eco_admin" && user.orgId !== orgId) {
        console.log("[Stripe Connect] ERROR: Access denied - user role:", user.role, "user orgId:", user.orgId, "request orgId:", orgId);
        return res.status(403).json({ error: "Forbidden" });
      }
      console.log("[Stripe Connect] Step 4: Authorization check passed");

      const org = await storage.getOrganization(orgId);
      console.log("[Stripe Connect] Step 5: Fetching organization - found:", !!org, "name:", org?.name, "email:", org?.email);
      if (!org) {
        console.log("[Stripe Connect] ERROR: Organization not found");
        return res.status(404).json({ error: "Organization not found" });
      }

      // Build Stripe OAuth URL (using Standard account type)
      // For Stripe Connect, we need the Connect Client ID (not the public key)
      // This should be set in STRIPE_CLIENT_ID environment variable
      const stripeClientId = process.env.STRIPE_CLIENT_ID;
      console.log("[Stripe Connect] Step 6: Checking STRIPE_CLIENT_ID - set:", !!stripeClientId, "length:", stripeClientId?.length);
      if (!stripeClientId) {
        console.error("[Stripe Connect] ERROR: STRIPE_CLIENT_ID is not set. Stripe Connect requires a Connect Client ID from Stripe Dashboard > Settings > Connect");
        return res.status(500).json({ 
          error: "Stripe Connect is not configured. Please set STRIPE_CLIENT_ID environment variable." 
        });
      }
      
      // Validate that it's a Connect Client ID (starts with 'ca_'), not a publishable key (starts with 'pk_')
      if (stripeClientId.startsWith('pk_')) {
        console.error("[Stripe Connect] ERROR: STRIPE_CLIENT_ID appears to be a publishable key (starts with 'pk_'). It should be a Connect Client ID (starts with 'ca_').");
        console.error("[Stripe Connect] Get your Connect Client ID from: Stripe Dashboard > Settings > Connect > Standard accounts");
        return res.status(500).json({ 
          error: "Invalid STRIPE_CLIENT_ID: You've set a publishable key instead of a Connect Client ID. Get your Connect Client ID from Stripe Dashboard > Settings > Connect > Standard accounts (it starts with 'ca_', not 'pk_')." 
        });
      }
      
      if (!stripeClientId.startsWith('ca_')) {
        console.warn("[Stripe Connect] WARNING: STRIPE_CLIENT_ID doesn't start with 'ca_'. Make sure you're using the Connect Client ID, not the publishable key.");
      }

      // Generate state parameter for CSRF protection
      const state = randomBytes(32).toString('hex');
      console.log("[Stripe Connect] Step 7: Generated state parameter:", state.substring(0, 16) + "...");
      
      // Store state in session for verification in callback
      if (!req.session) {
        console.log("[Stripe Connect] ERROR: Session not available");
        return res.status(500).json({ error: "Session not available" });
      }
      req.session.stripeConnectState = state;
      req.session.stripeConnectOrgId = orgId;
      console.log("[Stripe Connect] Step 8: Stored state and orgId in session");

      const protocol = 'https';
      const host = req.get('host');
      const redirectUri = `${protocol}://${host}/api/stripe/callback`;
      console.log("[Stripe Connect] Step 9: Building OAuth parameters");
      console.log("[Stripe Connect]   - protocol:", protocol);
      console.log("[Stripe Connect]   - host:", host);
      console.log("[Stripe Connect]   - redirect_uri:", redirectUri);

      // Standard account OAuth (not Express)
      // Standard accounts give you full control and allow direct transfers
      const params = new URLSearchParams({
        response_type: 'code', // Required: OAuth authorization code flow
        client_id: stripeClientId,
        state,
        scope: 'read_write',
        redirect_uri: redirectUri,
        // Note: Standard accounts don't use stripe_user[] parameters
        // The user will complete their account setup on Stripe's platform
      });

      const oauthUrl = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
      console.log("[Stripe Connect] Step 10: Generated OAuth URL (first 100 chars):", oauthUrl.substring(0, 100) + "...");
      console.log("[Stripe Connect] ===== Successfully generated OAuth URL, returning to frontend =====");
      
      res.json({ url: oauthUrl });
    } catch (error) {
      console.error("[Stripe Connect] ===== ERROR in Stripe Connect flow =====");
      console.error("[Stripe Connect] Error type:", error?.constructor?.name);
      console.error("[Stripe Connect] Error message:", error instanceof Error ? error.message : String(error));
      console.error("[Stripe Connect] Error stack:", error instanceof Error ? error.stack : "No stack trace");
      res.status(500).json({ error: "Failed to initiate Stripe Connect" });
    }
  });

  // Stripe OAuth Callback
  app.get("/api/stripe/callback", async (req: any, res) => {
    console.log("[Stripe Callback] ===== Starting Stripe OAuth callback =====");
    try {
      const { code, state, error, error_description } = req.query;
      console.log("[Stripe Callback] Step 1: Received callback parameters");
      console.log("[Stripe Callback]   - code:", code ? code.substring(0, 20) + "..." : "missing");
      console.log("[Stripe Callback]   - state:", state ? state.substring(0, 20) + "..." : "missing");
      console.log("[Stripe Callback]   - error:", error || "none");
      console.log("[Stripe Callback]   - error_description:", error_description || "none");

      if (error) {
        console.error("[Stripe Callback] ERROR: Stripe returned error:", error, error_description);
        return res.redirect(`/dashboard/settings?stripe_error=${encodeURIComponent(error_description || error)}`);
      }

      if (!code) {
        console.error("[Stripe Callback] ERROR: No authorization code received");
        return res.redirect(`/dashboard/settings?stripe_error=${encodeURIComponent("No authorization code received")}`);
      }

      if (!req.session) {
        console.error("[Stripe Callback] ERROR: No session available");
        return res.redirect(`/dashboard/settings?stripe_error=${encodeURIComponent("Session expired")}`);
      }

      const sessionState = req.session.stripeConnectState;
      const orgId = req.session.stripeConnectOrgId;
      console.log("[Stripe Callback] Step 2: Checking session state");
      console.log("[Stripe Callback]   - session state:", sessionState ? sessionState.substring(0, 20) + "..." : "missing");
      console.log("[Stripe Callback]   - orgId:", orgId);

      if (!sessionState || !orgId) {
        console.error("[Stripe Callback] ERROR: Missing state or orgId in session");
        return res.redirect(`/dashboard/settings?stripe_error=${encodeURIComponent("Session expired or invalid")}`);
      }

      if (state !== sessionState) {
        console.error("[Stripe Callback] ERROR: State mismatch");
        console.error("[Stripe Callback]   - received state:", state);
        console.error("[Stripe Callback]   - session state:", sessionState);
        return res.redirect(`/dashboard/settings?stripe_error=${encodeURIComponent("Security validation failed")}`);
      }
      console.log("[Stripe Callback] Step 3: State validation passed");

      const stripeClientId = process.env.STRIPE_CLIENT_ID;
      const stripeSecretKey = process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
      console.log("[Stripe Callback] Step 4: Checking Stripe credentials");
      console.log("[Stripe Callback]   - STRIPE_CLIENT_ID set:", !!stripeClientId);
      console.log("[Stripe Callback]   - STRIPE_SECRET_KEY set:", !!stripeSecretKey);

      if (!stripeClientId || !stripeSecretKey) {
        console.error("[Stripe Callback] ERROR: Missing Stripe credentials");
        return res.redirect(`/dashboard/settings?stripe_error=${encodeURIComponent("Stripe not configured")}`);
      }

      console.log("[Stripe Callback] Step 5: Exchanging authorization code for access token");
      const tokenResponse = await stripe.oauth.token({
        grant_type: 'authorization_code',
        code: code as string,
      });
      console.log("[Stripe Callback] Step 6: Token exchange successful");
      console.log("[Stripe Callback]   - stripe_user_id:", tokenResponse.stripe_user_id);
      console.log("[Stripe Callback]   - scope:", tokenResponse.scope);

      const org = await storage.getOrganization(orgId);
      if (!org) {
        console.error("[Stripe Callback] ERROR: Organization not found:", orgId);
        return res.redirect(`/dashboard/settings?stripe_error=${encodeURIComponent("Organization not found")}`);
      }
      console.log("[Stripe Callback] Step 7: Organization found:", org.name);

      console.log("[Stripe Callback] Step 8: Updating organization with Stripe account info");
      // After successful OAuth connection, we receive:
      // - stripe_user_id: The connected account ID (e.g., acct_xxx) - this is what we use to transfer funds
      // - access_token: Token to make API calls on behalf of the connected account
      // - refresh_token: Token to refresh the access token when it expires
      // - scope: Permissions granted (read_write allows us to create payments and transfers)
      await storage.updateOrganization(orgId, {
        stripeAccountId: tokenResponse.stripe_user_id, // Connected account ID - used for direct transfers
        stripeAccessToken: tokenResponse.access_token, // For API calls on behalf of connected account
        stripeRefreshToken: tokenResponse.refresh_token || null, // To refresh access token
        stripeScope: tokenResponse.scope, // Permissions: read_write
        stripeAccountStatus: 'active',
      });
      console.log("[Stripe Callback] Step 9: Organization updated successfully");
      console.log("[Stripe Callback]   - Connected Account ID:", tokenResponse.stripe_user_id);
      console.log("[Stripe Callback]   - Scope:", tokenResponse.scope);
      console.log("[Stripe Callback]   - Funds will now be transferred directly to this account");

      // Clear session state
      delete req.session.stripeConnectState;
      delete req.session.stripeConnectOrgId;
      console.log("[Stripe Callback] Step 10: Session state cleared");
      console.log("[Stripe Callback] ===== Stripe Connect completed successfully =====");

      res.redirect(`/dashboard/settings?stripe_connected=true`);
    } catch (error) {
      console.error("[Stripe Callback] ===== ERROR in Stripe callback =====");
      console.error("[Stripe Callback] Error type:", error?.constructor?.name);
      console.error("[Stripe Callback] Error message:", error instanceof Error ? error.message : String(error));
      console.error("[Stripe Callback] Error stack:", error instanceof Error ? error.stack : "No stack trace");
      res.redirect(`/dashboard/settings?stripe_error=${encodeURIComponent(error instanceof Error ? error.message : "Unknown error")}`);
    }
  });

  // Disconnect Stripe account
  app.delete("/api/org/:orgId/stripe/disconnect", async (req: any, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      const { orgId } = req.params;
      
      // Verify user belongs to this org or is eco_admin
      if (user.role !== "eco_admin" && user.orgId !== orgId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const org = await storage.getOrganization(orgId);
      if (!org || !org.stripeAccountId) {
        return res.status(404).json({ error: "No Stripe account connected" });
      }

      // Deauthorize the Stripe account
      try {
        const stripeClientId = process.env.STRIPE_CLIENT_ID;
        if (stripeClientId) {
        await stripe.oauth.deauthorize({
            client_id: stripeClientId,
          stripe_user_id: org.stripeAccountId,
        });
        }
      } catch (error) {
        console.error("Error deauthorizing Stripe account:", error);
        // Continue with clearing local data even if deauthorization fails
      }

      // Clear Stripe connection data
      await storage.updateOrganization(orgId, {
        stripeAccountId: null,
        stripeAccessToken: null,
        stripeRefreshToken: null,
        stripeScope: null,
        stripeAccountStatus: null,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error disconnecting Stripe:", error);
      res.status(500).json({ error: "Failed to disconnect Stripe" });
    }
  });

  // General organization route - must be registered AFTER specific routes
  app.get("/api/org/:orgId", async (req, res) => {
    try {
      const org = await storage.getOrganization(req.params.orgId);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }
      res.json(org);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organization" });
    }
  });

  app.patch("/api/org/:orgId", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      // Check if user belongs to the org or is eco_admin
      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Validate and update organization
      const validatedData = insertOrganizationSchema.partial().parse(req.body);
      const updatedOrg = await storage.updateOrganization(req.params.orgId, validatedData);

      if (!updatedOrg) {
        return res.status(404).json({ error: "Organization not found" });
      }

      res.json(updatedOrg);
    } catch (error) {
      console.error("Error updating organization:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update organization" });
    }
  });

  app.get("/api/organizations/slug/:slug", async (req, res) => {
    try {
      const org = await storage.getOrganizationBySlug(req.params.slug);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }
      res.json(org);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organization" });
    }
  });

  app.post("/api/organizations", async (req, res) => {
    try {
      const data = insertOrganizationSchema.parse(req.body);
      const org = await storage.createOrganization(data);
      res.status(201).json(org);
    } catch (error) {
      res.status(400).json({ error: "Invalid organization data" });
    }
  });

  app.patch("/api/organizations/:id", async (req, res) => {
    try {
      // Validate partial updates using the same schema
      const validatedData = insertOrganizationSchema.partial().parse(req.body);
      
      const org = await storage.updateOrganization(req.params.id, validatedData);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }
      res.json(org);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid organization data", 
          details: error.errors 
        });
      }
      res.status(400).json({ error: "Failed to update organization" });
    }
  });

  // Campaigns
  app.get("/api/campaigns", async (req, res) => {
    try {
      let orgId = req.query.orgId as string;
      const orgSlug = req.query.orgSlug as string;
      
      if (!orgId && !orgSlug) {
        return res.status(400).json({ error: "orgId or orgSlug is required" });
      }
      
      // If slug provided, resolve to ID
      if (orgSlug && !orgId) {
        const org = await storage.getOrganizationBySlug(orgSlug);
        if (!org) {
          return res.status(404).json({ error: "Organization not found" });
        }
        orgId = org.id;
      }
      
      const campaigns = await storage.listCampaigns(orgId);
      
      // Calculate donor count for each campaign
      const campaignsWithDonorCount = await Promise.all(
        campaigns.map(async (campaign) => {
          const donations = await storage.listDonationsByCampaign(campaign.id);
          const uniqueDonorEmails = new Set(donations.map(d => d.donorEmail).filter(Boolean));
          const donorCount = uniqueDonorEmails.size;
          
          return {
            ...campaign,
            donorCount,
          };
        })
      );
      
      res.json(campaignsWithDonorCount);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // ROUTE ORDER CRITICAL: Public routes must come BEFORE /:id to avoid "public" matching as ID
  // Public Campaigns List (no auth required)
  // SECURITY: Only shows approved organizations + active campaigns with safe fields
  // PERFORMANCE: Preloads organizations to avoid N+1 queries
  app.get("/api/campaigns/public", async (req, res) => {
    try {
      // PERFORMANCE: Fetch data in parallel (2 queries total, not N)
      const [allCampaigns, allOrganizations] = await Promise.all([
        storage.listCampaigns(),
        storage.listOrganizations(),
      ]);

      // Build approved organizations map
      const approvedOrgs = new Map(
        allOrganizations
          .filter(org => org.status === "approved")
          .map(org => [org.id, org])
      );

      // Filter and map campaigns
      const publicCampaigns = allCampaigns
        .filter(c => c.status === "active")
        .map(campaign => {
          const org = approvedOrgs.get(campaign.orgId);
          if (!org) return null;

          // SECURITY: Only expose public-safe fields (redact internal metadata)
          return {
            id: campaign.id,
            title: campaign.title,
            slug: campaign.slug,
            description: campaign.description,
            goalAmount: campaign.goalAmount,
            currentAmount: campaign.currentAmount,
            image: campaign.image,
            category: campaign.category,
            status: campaign.status,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            organizationName: org.name,
            organizationLogo: org.logo,
            organizationSlug: org.slug,
          };
        })
        .filter(c => c !== null);

      res.json(publicCampaigns);
    } catch (error: any) {
      console.error("Error fetching public campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // Public Campaign View (no auth required)
  // SECURITY: Only shows approved organizations + active campaigns with safe fields
  app.get("/api/campaigns/public/:campaignId", async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Only show active campaigns to public
      if (campaign.status !== "active") {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Get organization details and verify approval
      const organization = await storage.getOrganization(campaign.orgId);
      if (!organization || organization.status !== "approved") {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Get donor count for this campaign
      const donations = await storage.listDonationsByCampaign(campaign.id);
      const uniqueDonorEmails = new Set(donations.map(d => d.donorEmail).filter(Boolean));
      const donorCount = uniqueDonorEmails.size;

      // Calculate days left
      let daysLeft: number | undefined;
      if (campaign.endDate) {
        const end = new Date(campaign.endDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      // Get public updates (only those marked to show on public page)
      const publicUpdates = await db.select()
        .from(campaignUpdates)
        .where(and(
          eq(campaignUpdates.campaignId, campaign.id),
          eq(campaignUpdates.showOnPublicPage, true)
        ))
        .orderBy(desc(campaignUpdates.createdAt));

      // Get P2P settings (public-safe info only)
      const p2pSettings = await storage.getP2PCampaignSettings(campaign.id);
      const p2pEnabled = p2pSettings?.isEnabled || false;
      const allowSelfSignup = p2pSettings?.allowSelfSignup || false;

      // SECURITY: Only expose public-safe fields
      res.json({
        id: campaign.id,
        title: campaign.title,
        slug: campaign.slug,
        
        description: campaign.description,
        goalAmount: campaign.goalAmount,
        currentAmount: campaign.currentAmount,
        p2pEnabled,
        allowSelfSignup,
        image: campaign.image,
        imageUrl: campaign.imageUrl,
        category: campaign.category,
        status: campaign.status,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        pageContent: campaign.pageContent,
        pageComponents: campaign.pageComponents,
        quickDonationButtons: campaign.quickDonationButtons, // Include quick donation buttons
        currency: campaign.currency,
        country: campaign.country,
        organization: {
          id: organization.id,
          name: organization.name,
          logo: organization.logo,
          slug: organization.slug,
          religion: organization.religion,
          country: organization.country,
          settings: organization.settings || {},
        },
        organizationName: organization.name,
        organizationLogo: organization.logo,
        organizationSlug: organization.slug,
        donorCount,
        daysLeft,
        publicUpdates,
      });
    } catch (error) {
      console.error("Failed to fetch public campaign:", error);
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  app.post("/api/campaigns", requireAuth, async (req: any, res) => {
    try {
      const data = insertCampaignSchema.parse(req.body);
      
      // Verify orgId matches authenticated user's organization
      if (data.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Unauthorized: Cannot create campaigns for other organizations" });
      }
      
      const campaign = await storage.createCampaign(data);
      res.status(201).json(campaign);
    } catch (error) {
      res.status(400).json({ error: "Invalid campaign data" });
    }
  });

  // Helper function to send SSE progress update
  const sendProgress = (res: any, progress: number, message: string) => {
    res.write(`data: ${JSON.stringify({ progress, message })}\n\n`);
  };

  app.post("/api/campaigns/generate", requireAuth, async (req: any, res) => {
    try {
      const { title, briefDescription, country, target } = req.body;

      if (!title || !briefDescription || !country || !target) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify user has an organization
      if (!req.user.orgId) {
        return res.status(403).json({ error: "User must be associated with an organization" });
      }

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      // Send initial progress
      sendProgress(res, 0, "Starting campaign generation...");

      // Stage 1: Generating text content (0-40%)
      sendProgress(res, 10, "Analyzing your campaign details...");
      
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      sendProgress(res, 20, "Generating compelling content...");
      
      const completion = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are a fundraising campaign expert helping faith-based organizations create compelling campaigns. Generate engaging, empathetic, and inspiring campaign content that resonates with donors.`
          },
          {
            role: "user",
            content: `Create a comprehensive fundraising campaign based on:
Title: ${title}
Brief Description: ${briefDescription}
Country: ${country}
Target Amount: ${target}

Generate:
1. A full, compelling description (3-4 paragraphs) that tells a story and motivates donors
2. Three suggested quick donation amounts with short descriptions for each (e.g., "£25 - Provides meals for one family")
3. A suggested banner image description that would be appropriate for this campaign

Respond in JSON format with this structure:
{
  "description": "full campaign description",
  "quickDonations": [
    { "amount": number, "description": "what this amount provides" },
    { "amount": number, "description": "what this amount provides" },
    { "amount": number, "description": "what this amount provides" }
  ],
  "bannerPrompt": "description for AI image generation"
}`
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192
      });

      sendProgress(res, 40, "Text content generated successfully!");

      let generatedContent;
      try {
        generatedContent = JSON.parse(completion.choices[0].message.content || "{}");
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        res.write(`data: ${JSON.stringify({ error: "Failed to parse AI-generated content" })}\n\n`);
        res.end();
        return;
      }

      // Stage 2: Generating banner image (40-70%)
      sendProgress(res, 50, "Creating donation tiers and banner...");
      sendProgress(res, 60, "Generating banner image...");

      // Generate banner image using AI
      const imageResponse = await openai.images.generate({
        model: "gpt-image-1",
        prompt: `Professional, inspiring banner image for a fundraising campaign: ${generatedContent.bannerPrompt || title}. Faith-based, hopeful, community-oriented, high quality, warm lighting.`,
        n: 1,
        size: "1536x1024"
      });

      sendProgress(res, 70, "Banner image created!");

      const bannerImage = imageResponse.data[0].b64_json;

      // Stage 3: Finalizing (70-100%)
      sendProgress(res, 80, "Finalizing your campaign...");
      sendProgress(res, 90, "Almost done...");
      sendProgress(res, 100, "Campaign generated successfully!");

      // Send final result
      res.write(`data: ${JSON.stringify({ 
        type: "complete",
        data: {
          ...generatedContent,
          bannerImage
        }
      })}\n\n`);
      
      res.end();
    } catch (error: any) {
      console.error("AI generation error:", error);
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
      }
      res.write(`data: ${JSON.stringify({ 
        error: "Failed to generate campaign content", 
        details: error.message 
      })}\n\n`);
      res.end();
    }
  });

  app.post("/api/campaigns/optimize-goal", requireAuth, async (req: any, res) => {
    try {
      const { title, description, country, category, organizationType } = req.body;

      if (!title || !country) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify user has an organization
      if (!req.user.orgId) {
        return res.status(403).json({ error: "User must be associated with an organization" });
      }

      // Fetch some sample campaigns for context (limit to 10 for performance)
      const sampleCampaigns = await db.select({
        title: campaigns.title,
        goalAmount: campaigns.goalAmount,
        currentAmount: campaigns.currentAmount,
        category: campaigns.category,
        country: campaigns.country,
      })
        .from(campaigns)
        .limit(10);

      const campaignContext = sampleCampaigns.map(c => 
        `${c.title}: Target ${c.goalAmount}, Raised ${c.currentAmount || 0} (${c.country})`
      ).join('\n');

      const completion = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are a fundraising analytics expert helping faith-based organizations set realistic and achievable campaign goals. Analyze campaign details and historical data to suggest optimal fundraising targets.`
          },
          {
            role: "user",
            content: `Analyze this fundraising campaign and suggest three goal tiers:

Campaign Details:
- Title: ${title}
- Description: ${description || "No description provided"}
- Country: ${country}
- Category: ${category || "General"}
- Organization Type: ${organizationType || "Faith-based"}

Sample Historical Campaigns:
${campaignContext || "No historical data available"}

Based on this information, suggest three fundraising goal tiers with reasoning:
1. Conservative Goal: A safe, achievable target based on typical success rates
2. Moderate Goal: A balanced target that's challenging but realistic
3. Ambitious Goal: A stretch target that represents high success

Respond in JSON format with this structure:
{
  "conservative": {
    "amount": number,
    "reasoning": "Brief explanation (1-2 sentences)"
  },
  "moderate": {
    "amount": number,
    "reasoning": "Brief explanation (1-2 sentences)"
  },
  "ambitious": {
    "amount": number,
    "reasoning": "Brief explanation (1-2 sentences)"
  },
  "insights": "Overall insights about goal setting for this campaign (2-3 sentences)"
}`
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192
      });

      let suggestions;
      try {
        suggestions = JSON.parse(completion.choices[0].message.content || "{}");
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        return res.status(500).json({ error: "Failed to parse AI suggestions" });
      }

      res.json(suggestions);
    } catch (error: any) {
      console.error("Goal optimization error:", error);
      res.status(500).json({ error: "Failed to optimize goal", details: error.message });
    }
  });

  app.post("/api/campaigns/:id/regenerate-story", requireAuth, async (req: any, res) => {
    try {
      const { style, additionalContext } = req.body;
      const campaignId = req.params.id;

      // Fetch existing campaign
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Verify user has access to this campaign
      if (campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const stylePrompts = {
        emotional: "Write an emotionally compelling narrative that tugs at heartstrings and inspires empathy. Use vivid storytelling and personal touches.",
        factual: "Write a clear, factual narrative focused on data, impact metrics, and concrete outcomes. Use specific numbers and evidence.",
        testimonial: "Write from the perspective of those being helped. Include stories, voices, and personal experiences of beneficiaries.",
        urgent: "Write with a sense of urgency and immediate need. Emphasize the critical timing and pressing nature of the cause.",
        inspirational: "Write an uplifting narrative that focuses on hope, transformation, and positive change. Celebrate victories and possibilities."
      };

      const selectedStyle = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.emotional;

      const completion = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are a fundraising campaign expert helping faith-based organizations create compelling campaigns. ${selectedStyle}`
          },
          {
            role: "user",
            content: `Regenerate a compelling campaign description for this fundraising campaign:

Title: ${campaign.title}
Current Description: ${campaign.description || "No description yet"}
Target Amount: ${campaign.goalAmount}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Create a new, engaging description (3-4 paragraphs) that:
- Matches the ${style} narrative style
- Tells a clear story that motivates donors
- Highlights the impact of donations
- Is authentic and compelling

Respond with only the new description text, no JSON wrapper.`
          }
        ],
        max_completion_tokens: 8192
      });

      const newDescription = completion.choices[0].message.content || "";

      res.type("text/plain").send(newDescription);
    } catch (error: any) {
      console.error("Story regeneration error:", error);
      res.status(500).json({ error: "Failed to regenerate story", details: error.message });
    }
  });

  app.patch("/api/campaigns/:id", async (req, res) => {
    try {
      const validatedData = insertCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateCampaign(req.params.id, validatedData);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(400).json({ error: "Failed to update campaign" });
    }
  });

  app.patch("/api/campaigns/:id/status", requireAuth, async (req: any, res) => {
    try {
      const { status } = req.body;
      
      if (!status || !["active", "disabled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be 'active' or 'disabled'" });
      }

      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== campaign.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updatedCampaign = await storage.updateCampaign(req.params.id, { status });
      res.json(updatedCampaign);
    } catch (error) {
      console.error("Error toggling campaign status:", error);
      res.status(500).json({ error: "Failed to update campaign status" });
    }
  });

  // Campaign Updates
  app.get("/api/campaigns/:campaignId/updates", async (req, res) => {
    try {
      const updates = await db.select()
        .from(campaignUpdates)
        .where(eq(campaignUpdates.campaignId, req.params.campaignId))
        .orderBy(campaignUpdates.createdAt);
      res.json(updates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaign updates" });
    }
  });

  app.post("/api/campaigns/:campaignId/updates", requireAuth, async (req: any, res) => {
    try {
      const data = insertCampaignUpdateSchema.parse({
        ...req.body,
        campaignId: req.params.campaignId,
        createdBy: req.user.id,
      });
      const [update] = await db.insert(campaignUpdates).values(data).returning();
      res.status(201).json(update);
    } catch (error) {
      res.status(400).json({ error: "Failed to create campaign update" });
    }
  });

  app.patch("/api/campaigns/:campaignId/updates/:id", requireAuth, async (req: any, res) => {
    try {
      // Get the update with campaign info for authorization check
      const [existingUpdate] = await db.select()
        .from(campaignUpdates)
        .innerJoin(campaigns, eq(campaignUpdates.campaignId, campaigns.id))
        .where(eq(campaignUpdates.id, req.params.id));

      if (!existingUpdate) {
        return res.status(404).json({ error: "Update not found" });
      }

      // Verify org ownership and campaign match
      const campaign = existingUpdate.campaigns;
      const user = await storage.getUser(req.user.id);
      
      if (!user || (user.role !== "eco_admin" && user.orgId !== campaign.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Verify the update belongs to the specified campaign (strict comparison)
      if (String(existingUpdate.campaign_updates.campaignId).trim() !== String(req.params.campaignId).trim()) {
        return res.status(404).json({ error: "Update not found" });
      }

      // Parse and sanitize update data - exclude tenant-identifying fields
      const rawData = insertCampaignUpdateSchema.partial().parse(req.body);
      const { campaignId: _, createdBy: __, ...data } = rawData;
      
      const [update] = await db.update(campaignUpdates)
        .set(data)
        .where(eq(campaignUpdates.id, req.params.id))
        .returning();
      
      res.json(update);
    } catch (error) {
      console.error("Error updating campaign update:", error);
      res.status(500).json({ error: "Failed to update campaign update" });
    }
  });

  app.delete("/api/campaigns/:campaignId/updates/:id", requireAuth, async (req: any, res) => {
    try {
      // Get the update with campaign info for authorization check
      const [existingUpdate] = await db.select()
        .from(campaignUpdates)
        .innerJoin(campaigns, eq(campaignUpdates.campaignId, campaigns.id))
        .where(eq(campaignUpdates.id, req.params.id));

      if (!existingUpdate) {
        return res.status(404).json({ error: "Update not found" });
      }

      // Verify org ownership and campaign match
      const campaign = existingUpdate.campaigns;
      const user = await storage.getUser(req.user.id);
      
      if (!user || (user.role !== "eco_admin" && user.orgId !== campaign.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Verify the update belongs to the specified campaign (strict comparison)
      if (String(existingUpdate.campaign_updates.campaignId).trim() !== String(req.params.campaignId).trim()) {
        return res.status(404).json({ error: "Update not found" });
      }

      await db.delete(campaignUpdates).where(eq(campaignUpdates.id, req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting campaign update:", error);
      res.status(500).json({ error: "Failed to delete campaign update" });
    }
  });

  // Campaign Expenses
  app.get("/api/campaigns/:campaignId/expenses", requireAuth, async (req: any, res) => {
    try {
      const { campaignId } = req.params;
      
      if (!campaignId) {
        return res.status(400).json({ error: "Campaign ID is required" });
      }

      // Verify user has access to this campaign
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Check authorization: eco_admin or org member
      const user = await storage.getUser(req.user.id);
      if (!user || (user.role !== "eco_admin" && user.orgId !== campaign.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const expenses = await db.select()
        .from(campaignExpenses)
        .where(eq(campaignExpenses.campaignId, campaignId))
        .orderBy(campaignExpenses.date);
      res.json(expenses);
    } catch (error: any) {
      console.error("Error fetching campaign expenses:", error);
      res.status(500).json({ error: "Failed to fetch campaign expenses", details: error.message });
    }
  });

  app.post("/api/campaigns/:campaignId/expenses", requireAuth, async (req: any, res) => {
    try {
      const { campaignId } = req.params;
      
      if (!campaignId) {
        return res.status(400).json({ error: "Campaign ID is required" });
      }

      // Verify user has access to this campaign
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Check authorization: eco_admin or org member
      const user = await storage.getUser(req.user.id);
      if (!user || (user.role !== "eco_admin" && user.orgId !== campaign.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Extract quantity and unitPrice from request body
      const { quantity, unitPrice, amount, ...restBody } = req.body;
      
      // Calculate total: if quantity and unitPrice are provided, use them; otherwise use amount
      let totalAmount: string;
      let finalQuantity: number | null = null;
      let finalUnitPrice: string | null = null;
      
      if (quantity && unitPrice) {
        // Calculate total from quantity * unitPrice
        const qty = parseFloat(quantity) || 1;
        const unit = parseFloat(unitPrice) || 0;
        totalAmount = (qty * unit).toFixed(2);
        finalQuantity = qty;
        finalUnitPrice = unit.toFixed(2);
      } else {
        // Use provided amount as total (backward compatibility)
        totalAmount = amount || "0";
      }

      const data = insertCampaignExpenseSchema.parse({
        ...restBody,
        amount: totalAmount,
        quantity: finalQuantity,
        unitPrice: finalUnitPrice,
        campaignId: campaignId,
        createdBy: req.user.id,
      });
      const [expense] = await db.insert(campaignExpenses).values(data).returning();
      res.status(201).json(expense);
    } catch (error: any) {
      console.error("Error creating campaign expense:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid expense data", details: error.errors });
      }
      res.status(400).json({ error: "Failed to create campaign expense", details: error.message });
    }
  });

  app.delete("/api/campaigns/:campaignId/expenses/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(campaignExpenses).where(eq(campaignExpenses.id, req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete campaign expense" });
    }
  });

  // Campaign Chat (AI Campaign Manager)
  app.get("/api/campaigns/:campaignId/chat", async (req, res) => {
    try {
      const messages = await db.select()
        .from(campaignChatMessages)
        .where(eq(campaignChatMessages.campaignId, req.params.campaignId))
        .orderBy(campaignChatMessages.createdAt);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/campaigns/:campaignId/chat", requireAuth, async (req: any, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Get campaign details for context
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Get recent chat history
      const history = await db.select()
        .from(campaignChatMessages)
        .where(eq(campaignChatMessages.campaignId, req.params.campaignId))
        .orderBy(campaignChatMessages.createdAt)
        .limit(10);

      // Save user message
      await db.insert(campaignChatMessages).values({
        campaignId: req.params.campaignId,
        role: "user",
        content: message,
      });

      // Calculate progress percentage
      const currentAmount = parseFloat(campaign.currentAmount) || 0;
      const goalAmount = parseFloat(campaign.goalAmount) || 1;
      const progressPercentage = (currentAmount / goalAmount) * 100;

      // Get AI response
      const completion = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are an expert fundraising strategist and campaign manager helping faith-based organizations optimize their campaigns. You provide actionable, specific advice on promotion strategies, donor engagement, and campaign optimization.
            
Campaign Context:
- Title: ${campaign.title}
- Description: ${campaign.description?.substring(0, 200)}
- Goal: ${campaign.goalAmount}
- Current Amount: ${campaign.currentAmount}
- Progress: ${progressPercentage.toFixed(1)}%
- Category: ${campaign.category || "General"}
- Country: ${campaign.country || "Not specified"}
- Status: ${campaign.status}

Focus on: social media strategies, email marketing, community outreach, donor stewardship, timing optimization, and platform-specific tactics. Be specific and actionable.`
          },
          ...history.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
          {
            role: "user",
            content: message
          }
        ],
        max_completion_tokens: 2048
      });

      const aiResponse = completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";

      // Save AI response
      const [savedMessage] = await db.insert(campaignChatMessages).values({
        campaignId: req.params.campaignId,
        role: "assistant",
        content: aiResponse,
      }).returning();

      res.json(savedMessage);
    } catch (error: any) {
      console.error("AI chat error:", error);
      res.status(500).json({ error: "Failed to get AI response", details: error.message });
    }
  });

  // Campaign Strategy - Get existing strategy
  app.get("/api/campaigns/:campaignId/strategy", requireAuth, async (req: any, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Enforce org ownership
      if (req.user.orgId !== campaign.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const strategy = await storage.getCampaignStrategy(req.params.campaignId);
      res.json(strategy || null);
    } catch (error) {
      console.error("Error fetching strategy:", error);
      res.status(500).json({ error: "Failed to fetch campaign strategy" });
    }
  });

  // Campaign Strategy - Generate new strategy
  app.post("/api/campaigns/:campaignId/strategy", requireAuth, async (req: any, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Enforce org ownership
      if (req.user.orgId !== campaign.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get organization details
      const organization = await storage.getOrganization(campaign.orgId);
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Aggregate donor data
      const allDonors = await storage.listDonors(campaign.orgId);
      const donations = await storage.listDonationsByCampaign(campaign.id);
      
      // Calculate donor insights
      const totalDonors = allDonors.length;
      const campaignDonorEmails = new Set(donations.map(d => d.donorEmail).filter(Boolean));
      const campaignDonorCount = campaignDonorEmails.size;
      
      // Top donor segments
      const donorsByTier = allDonors.reduce((acc, donor) => {
        const tier = donor.tier || 'bronze';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Recent donors (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentDonations = donations.filter(d => 
        new Date(d.createdAt) >= thirtyDaysAgo
      );
      
      // Average donation amount (guard against NaN)
      const totalAmount = donations.reduce((sum, d) => {
        const amount = parseFloat(d.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      const avgDonation = donations.length > 0 ? totalAmount / donations.length : 0;
      
      // Get donor tags for segmentation
      const donorTagResults = await db.select()
        .from(donorTagAssignments)
        .leftJoin(donorTags, eq(donorTagAssignments.tagId, donorTags.id))
        .where(sql`${donorTagAssignments.donorId} IN (SELECT id FROM donors WHERE org_id = ${campaign.orgId})`)
        .limit(50);
      
      const topTags = donorTagResults.reduce((acc: Record<string, number>, row) => {
        const tagName = row.donor_tags?.name;
        if (tagName) {
          acc[tagName] = (acc[tagName] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Build structured prompt for AI
      const systemPrompt = `You are an expert fundraising strategist specializing in faith-based organizations. Generate a comprehensive marketing strategy for this campaign.

CAMPAIGN DETAILS:
- Title: ${campaign.title}
- Category: ${campaign.category || 'General'}
- Location: ${campaign.country || organization.country || 'Not specified'}, ${organization.city || 'Unknown city'}
- Goal: ${campaign.goalAmount} ${campaign.currency}
- Current Amount: ${campaign.currentAmount} ${campaign.currency}
- Status: ${campaign.status}
- Description: ${campaign.description?.substring(0, 300)}

ORGANIZATION CONTEXT:
- Name: ${organization.name}
- Religion: ${organization.religion || 'Multi-faith'}
- City: ${organization.city || 'Unknown'}
- Country: ${organization.country || 'Unknown'}

DONOR DATABASE INSIGHTS:
- Total Donors in Database: ${totalDonors}
- Campaign Donors: ${campaignDonorCount}
- Average Donation: ${avgDonation.toFixed(2)} ${campaign.currency}
- Donor Tiers: ${JSON.stringify(donorsByTier)}
- Top Donor Tags: ${JSON.stringify(Object.entries(topTags).slice(0, 5))}
- Recent Donations (30 days): ${recentDonations.length}

Generate a comprehensive strategy with these EXACT 5 sections. Each section should be 3-5 bullet points of actionable advice:

1. **Donor Outreach Strategy**
   - How to engage existing donors
   - Strategies for donor acquisition
   - Personalization tactics based on donor segments

2. **Social Media Strategy**
   - Platform-specific tactics (Facebook, Instagram, Twitter/X, LinkedIn)
   - Content themes and posting frequency
   - Hashtag and community engagement strategies

3. **Messaging & Communication**
   - Key messages that resonate with ${organization.religion || 'multi-faith'} audiences
   - Emotional appeals and storytelling angles
   - Email and SMS communication tactics

4. **Event Ideas**
   - Fundraising events to organize
   - Community engagement activities
   - Virtual and in-person event concepts

5. **Online Communities to Target**
   - Specific Facebook groups, forums, or online communities
   - Relevant hashtags and social media trends
   - Partnership opportunities with similar organizations

Format your response as JSON with this structure:
{
  "donorOutreach": ["point 1", "point 2", "point 3"],
  "socialMedia": ["point 1", "point 2", "point 3"],
  "messaging": ["point 1", "point 2", "point 3"],
  "events": ["point 1", "point 2", "point 3"],
  "onlineCommunities": ["point 1", "point 2", "point 3"]
}`;

      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: "Generate the comprehensive fundraising strategy for this campaign."
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048
      });

      const aiResponse = completion.choices[0].message.content || "{}";
      const strategyContent = JSON.parse(aiResponse);
      
      // Create summary
      const summary = `AI-generated fundraising strategy for ${campaign.title}. Analyzed ${totalDonors} donors, ${campaignDonorCount} campaign donors, and ${recentDonations.length} recent donations to provide targeted recommendations.`;
      
      // Create insights object
      const insights = {
        totalDonors,
        campaignDonorCount,
        avgDonation,
        donorsByTier,
        topTags: Object.entries(topTags).slice(0, 5),
        recentDonationsCount: recentDonations.length
      };

      // Save strategy
      const strategy = await storage.createCampaignStrategy({
        campaignId: campaign.id,
        orgId: campaign.orgId,
        content: strategyContent,
        summary,
        insights,
        model: "gpt-4o",
        generatedBy: req.user.id
      });

      res.json(strategy);
    } catch (error: any) {
      console.error("Strategy generation error:", error);
      res.status(500).json({ error: "Failed to generate campaign strategy", details: error.message });
    }
  });

  // Generate Impact Report for Campaign
  app.post("/api/campaigns/:campaignId/impact-report", requireAuth, async (req: any, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Fetch all donations for this campaign
      const donations = await storage.listDonationsByCampaign(campaign.id);

      // Calculate statistics
      const totalRaised = parseFloat(campaign.currentAmount) || 0;
      const goalAmount = parseFloat(campaign.goalAmount) || 1;
      const progressPercentage = (totalRaised / goalAmount) * 100;
      const donationCount = donations.length;
      const uniqueDonors = new Set(donations.map(d => d.donorEmail).filter(Boolean)).size;
      const averageDonation = donationCount > 0 ? totalRaised / donationCount : 0;

      // Find largest and smallest donations
      const donationAmounts = donations.map(d => parseFloat(d.amount)).filter(a => !isNaN(a));
      const largestDonation = donationAmounts.length > 0 ? Math.max(...donationAmounts) : 0;
      const smallestDonation = donationAmounts.length > 0 ? Math.min(...donationAmounts) : 0;

      // Calculate days active
      const startDate = campaign.startDate ? new Date(campaign.startDate) : new Date(campaign.createdAt || Date.now());
      const now = new Date();
      const daysActive = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

      // Days until end (if applicable)
      let daysRemaining = null;
      if (campaign.endDate) {
        const endDate = new Date(campaign.endDate);
        daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      // Calculate daily average
      const dailyAverage = totalRaised / daysActive;

      // Analyze donation timeline (group by day)
      const donationsByDay = new Map<string, number>();
      donations.forEach(d => {
        const date = new Date(d.createdAt || Date.now()).toISOString().split('T')[0];
        donationsByDay.set(date, (donationsByDay.get(date) || 0) + parseFloat(d.amount));
      });

      // Find best and worst days
      const dailyAmounts = Array.from(donationsByDay.values());
      const bestDay = dailyAmounts.length > 0 ? Math.max(...dailyAmounts) : 0;
      const worstDay = dailyAmounts.length > 0 ? Math.min(...dailyAmounts) : 0;

      // Recent momentum (last 7 days vs previous 7 days)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const recent7Days = donations.filter(d => new Date(d.createdAt || 0) >= sevenDaysAgo);
      const previous7Days = donations.filter(d => {
        const date = new Date(d.createdAt || 0);
        return date >= fourteenDaysAgo && date < sevenDaysAgo;
      });
      const recent7DaysTotal = recent7Days.reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const previous7DaysTotal = previous7Days.reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const momentumChange = previous7DaysTotal > 0 
        ? ((recent7DaysTotal - previous7DaysTotal) / previous7DaysTotal) * 100 
        : 0;

      // Check if campaign strategy exists, if not generate one
      let strategy = await storage.getCampaignStrategy(campaign.id);
      let report: string;

      if (strategy && strategy.content) {
        // Format existing strategy content for the report
        const content = strategy.content as any;
        const sections: string[] = [];

        if (content.donorOutreach && Array.isArray(content.donorOutreach)) {
          sections.push("**Donor Outreach Strategy:**\n" + content.donorOutreach.map((point: string) => `• ${point}`).join("\n"));
        }
        if (content.socialMedia && Array.isArray(content.socialMedia)) {
          sections.push("\n**Social Media Strategy:**\n" + content.socialMedia.map((point: string) => `• ${point}`).join("\n"));
        }
        if (content.messaging && Array.isArray(content.messaging)) {
          sections.push("\n**Messaging & Communication:**\n" + content.messaging.map((point: string) => `• ${point}`).join("\n"));
        }
        if (content.eventIdeas && Array.isArray(content.eventIdeas)) {
          sections.push("\n**Event Ideas:**\n" + content.eventIdeas.map((point: string) => `• ${point}`).join("\n"));
        }
        if (content.onlineCommunities && Array.isArray(content.onlineCommunities)) {
          sections.push("\n**Online Communities:**\n" + content.onlineCommunities.map((point: string) => `• ${point}`).join("\n"));
        }

        report = sections.length > 0 
          ? sections.join("\n\n")
          : "Strategy content is available but in an unexpected format. Please regenerate the strategy in the AI Campaign Manager.";
      } else {
        // No strategy exists, generate one using the same logic as the strategy endpoint
        const organization = await storage.getOrganization(campaign.orgId);
        if (!organization) {
          return res.status(404).json({ error: "Organization not found" });
        }

        // Aggregate donor data (same as strategy endpoint)
        const allDonors = await storage.listDonors(campaign.orgId);
        const totalDonors = allDonors.length;
        const campaignDonorEmails = new Set(donations.map(d => d.donorEmail).filter(Boolean));
        const campaignDonorCount = campaignDonorEmails.size;
        const avgDonation = averageDonation;

        // Get recent donations (last 30 days)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recentDonations = donations.filter(d => new Date(d.createdAt || 0) >= thirtyDaysAgo);

        // Donor tier distribution
        const donorsByTier = {
          platinum: allDonors.filter(d => d.tier === "platinum").length,
          gold: allDonors.filter(d => d.tier === "gold").length,
          silver: allDonors.filter(d => d.tier === "silver").length,
          bronze: allDonors.filter(d => d.tier === "bronze").length,
        };

        // Top donor tags (placeholder - tags would need to be fetched from donor_tags table if needed)
        const topTags: [string, number][] = [];

        // Generate strategy using same prompt as strategy endpoint
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an expert fundraising strategist specializing in faith-based organizations. Generate a comprehensive marketing strategy for this campaign.

CAMPAIGN DETAILS:
- Title: ${campaign.title}
- Category: ${campaign.category || 'General'}
- Location: ${campaign.country || organization.country || 'Not specified'}, ${organization.city || 'Unknown city'}
- Goal: ${campaign.goalAmount} ${campaign.currency}
- Current Amount: ${campaign.currentAmount} ${campaign.currency}
- Status: ${campaign.status}
- Description: ${campaign.description?.substring(0, 300)}

ORGANIZATION CONTEXT:
- Name: ${organization.name}
- Religion: ${organization.religion || 'Multi-faith'}
- City: ${organization.city || 'Unknown'}
- Country: ${organization.country || 'Unknown'}

DONOR DATABASE INSIGHTS:
- Total Donors in Database: ${totalDonors}
- Campaign Donors: ${campaignDonorCount}
- Average Donation: ${avgDonation.toFixed(2)} ${campaign.currency}
- Recent Donations (30 days): ${recentDonations.length}

Generate a comprehensive strategy with these EXACT 5 sections. Each section should be 3-5 bullet points of actionable advice:

1. **Donor Outreach Strategy**
   - How to engage existing donors
   - Strategies for donor acquisition
   - Personalization tactics based on donor segments

2. **Social Media Strategy**
   - Platform-specific tactics (Facebook, Instagram, Twitter/X, LinkedIn)
   - Content themes and posting frequency
   - Hashtag and community engagement strategies

3. **Messaging & Communication**
   - Key messages that resonate with ${organization.religion || 'multi-faith'} audiences
   - Emotional appeals and storytelling angles
   - Email and SMS communication tactics

4. **Event Ideas**
   - Fundraising events to organize
   - Community engagement activities
   - Virtual and in-person event concepts

5. **Online Communities**
   - How to leverage online platforms and forums
   - Building and engaging digital communities
   - Partnering with influencers and community leaders

Return ONLY a valid JSON object with this exact structure:
{
  "donorOutreach": ["point 1", "point 2", "point 3"],
  "socialMedia": ["point 1", "point 2", "point 3"],
  "messaging": ["point 1", "point 2", "point 3"],
  "eventIdeas": ["point 1", "point 2", "point 3"],
  "onlineCommunities": ["point 1", "point 2", "point 3"]
}`
            },
            {
              role: "user",
              content: "Generate the comprehensive fundraising strategy for this campaign."
            }
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 2048
        });

        const aiResponse = completion.choices[0].message.content || "{}";
        const strategyContent = JSON.parse(aiResponse);

        // Save the generated strategy
        const summary = `AI-generated fundraising strategy for ${campaign.title}. Analyzed ${totalDonors} donors, ${campaignDonorCount} campaign donors, and ${recentDonations.length} recent donations to provide targeted recommendations.`;
        
        const insights = {
          totalDonors,
          campaignDonorCount,
          avgDonation,
          donorsByTier,
          topTags: Object.entries(topTags).slice(0, 5),
          recentDonationsCount: recentDonations.length
        };

        strategy = await storage.createCampaignStrategy({
          campaignId: campaign.id,
          orgId: campaign.orgId,
          content: strategyContent,
          summary,
          insights,
          model: "gpt-4o",
          generatedBy: req.user.id
        });

        // Format the strategy for the report
        const sections: string[] = [];
        if (strategyContent.donorOutreach && Array.isArray(strategyContent.donorOutreach)) {
          sections.push("**Donor Outreach Strategy:**\n" + strategyContent.donorOutreach.map((point: string) => `• ${point}`).join("\n"));
        }
        if (strategyContent.socialMedia && Array.isArray(strategyContent.socialMedia)) {
          sections.push("\n**Social Media Strategy:**\n" + strategyContent.socialMedia.map((point: string) => `• ${point}`).join("\n"));
        }
        if (strategyContent.messaging && Array.isArray(strategyContent.messaging)) {
          sections.push("\n**Messaging & Communication:**\n" + strategyContent.messaging.map((point: string) => `• ${point}`).join("\n"));
        }
        if (strategyContent.eventIdeas && Array.isArray(strategyContent.eventIdeas)) {
          sections.push("\n**Event Ideas:**\n" + strategyContent.eventIdeas.map((point: string) => `• ${point}`).join("\n"));
        }
        if (strategyContent.onlineCommunities && Array.isArray(strategyContent.onlineCommunities)) {
          sections.push("\n**Online Communities:**\n" + strategyContent.onlineCommunities.map((point: string) => `• ${point}`).join("\n"));
        }

        report = sections.length > 0 
          ? sections.join("\n\n")
          : "Unable to generate strategy report.";
      }

      res.json({
        report,
        statistics: {
          totalRaised,
          goalAmount,
          progressPercentage,
          donationCount,
          uniqueDonors,
          averageDonation,
          largestDonation,
          smallestDonation,
          daysActive,
          daysRemaining,
          dailyAverage,
          recent7DaysTotal,
          previous7DaysTotal,
          momentumChange,
        }
      });
    } catch (error: any) {
      console.error("Impact report error:", error);
      res.status(500).json({ error: "Failed to generate impact report", details: error.message });
    }
  });

  // Process Donation (no auth required for public donations) — records payment without Stripe
  app.post("/api/campaigns/:campaignId/donate", async (req, res) => {
    try {
      const {
        amount,
        donorName,
        donorEmail,
        message,
        recurring,
        frequency,
        coverFees,
        totalAmount,
        category,
        giftAidOptIn,
        donorAddress,
        donorTown,
        donorState,
        donorPostcode,
      } = req.body;

      if (!amount || !donorName || !donorEmail || totalAmount === undefined || totalAmount === null) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (recurring) {
        return res.status(400).json({
          error: "Recurring donations are not available. Please make a one-time donation.",
        });
      }

      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      if (campaign.status !== "active") {
        return res.status(400).json({ error: "This campaign is not accepting donations" });
      }

      const donationAmount = parseFloat(amount);
      const total = parseFloat(totalAmount);
      if (Number.isNaN(donationAmount) || donationAmount <= 0 || Number.isNaN(total) || total < donationAmount) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const feeAmount = Math.max(0, total - donationAmount);
      const giftAidBool = giftAidOptIn === true || giftAidOptIn === "true";

      const stripePaymentId = `recorded-${randomUUID()}`;

      const result = await processDonationWithEmail({
        orgId: campaign.orgId,
        campaignId: campaign.id,
        stripePaymentId,
        donorEmail,
        donorName,
        amount: donationAmount,
        currency: campaign.currency || "USD",
        category: category || "general",
        message: message || "",
        coverFees: !!(coverFees === true || coverFees === "true"),
        feeAmount,
        recurring: false,
        frequency: frequency || undefined,
        giftAidOptIn: giftAidBool,
        donorAddress,
        donorTown,
        donorState,
        donorPostcode,
      });

      res.json({ success: true, donation: result.donation, duplicate: result.duplicate });
    } catch (error: unknown) {
      const messageErr = error instanceof Error ? error.message : "Unknown error";
      console.error("Donation processing error:", error);
      res.status(500).json({ error: "Failed to process donation", details: messageErr });
    }
  });

  // Helper function to select the best matching thank you email template
  function selectThankYouTemplate(
    templates: any[],
    donationAmount: number,
    donationType: 'one-time' | 'recurring'
  ): any | undefined {
    const activeTemplates = templates.filter(t => t.isActive);
    
    // Filter templates that match donation type and amount range
    const matchingTemplates = activeTemplates.filter(template => {
      // Check donation type match
      const typeMatch = 
        template.donationType === 'both' ||
        template.donationType === donationType ||
        !template.donationType;
      
      if (!typeMatch) return false;
      
      // Check amount range - explicit null/undefined checks to handle zero values correctly
      const minAmount = (template.minAmount !== null && template.minAmount !== undefined) 
        ? parseFloat(template.minAmount) 
        : null;
      const maxAmount = (template.maxAmount !== null && template.maxAmount !== undefined) 
        ? parseFloat(template.maxAmount) 
        : null;
      
      const minMatch = minAmount === null || donationAmount >= minAmount;
      const maxMatch = maxAmount === null || donationAmount <= maxAmount;
      
      return minMatch && maxMatch;
    });
    
    // Sort by priority (highest first)
    matchingTemplates.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    // Return highest priority match, or fall back to default
    return matchingTemplates[0] || activeTemplates.find(t => t.isDefault);
  }

  // Shared donation processing service
  async function processDonationWithEmail(params: {
    orgId: string;
    campaignId?: string;
    eventId?: string;
    livestreamId?: string;
    stripePaymentId: string;
    donorEmail: string;
    donorName: string;
    donorPhone?: string;
    amount: number;
    currency: string;
    category?: string;
    message?: string;
    coverFees?: boolean;
    feeAmount?: number;
    recurring?: boolean;
    frequency?: string;
    donationType?: string;
    giftAidOptIn?: boolean;
    donorAddress?: string;
    donorTown?: string;
    donorCity?: string;
    donorState?: string;
    donorPostcode?: string;
    donorCountry?: string;
  }): Promise<any> {
    const {
      orgId,
      campaignId,
      eventId,
      livestreamId,
      stripePaymentId,
      donorEmail,
      donorName,
      donorPhone,
      amount,
      currency,
      category = "general",
      message,
      coverFees = false,
      feeAmount = 0,
      recurring = false,
      frequency,
      donationType = "online",
      giftAidOptIn = false,
      donorAddress,
      donorTown: donorTownParam,
      donorCity,
      donorState: donorStateParam,
      donorPostcode,
      donorCountry,
    } = params;

    const donorTown = donorTownParam ?? donorCity;
    const donorState = donorStateParam ?? donorCountry;

    // Check for duplicate donation (idempotency) - only if we have a real Stripe payment ID
    if (stripePaymentId) {
      const duplicate = await storage.getDonationByStripePaymentId(orgId, stripePaymentId);
      
      if (duplicate) {
        console.log('Duplicate donation found, skipping:', stripePaymentId);
        return { success: true, donation: duplicate, duplicate: true };
      }
    }

    // Create or get donor
    let donor = await storage.getDonorByEmail(donorEmail, orgId);
    if (!donor) {
      const [firstName, ...lastNameParts] = donorName.split(" ");
      donor = await storage.createDonor({
        orgId,
        firstName: firstName || donorName,
        lastName: lastNameParts.join(" ") || "",
        email: donorEmail,
        phone: donorPhone || "",
      });
    }

    // Calculate tax relief amount if Gift Aid opted in
    let donationData: any = {
      orgId,
      campaignId: campaignId || null,
      eventId: eventId || null,
      livestreamId: livestreamId || null,
      donorId: donor.id,
      amount: amount.toString(),
      currency: currency.toUpperCase(),
      category,
      coverFees,
      feeAmount: feeAmount.toString(),
      recurring,
      frequency: frequency || null,
      donationType,
      status: "completed",
      donorEmail,
      donorName,
      message: message || "",
      stripePaymentId,
      thankYouSent: false,
      giftAidOptIn,
      donorAddress: donorAddress || null,
      donorCity: donorTown || null, // Map Town to donorCity in database
      donorPostcode: donorPostcode || null,
      donorCountry: donorState || null, // Map State/City to donorCountry in database
    };

    if (giftAidOptIn) {
      const org = await storage.getOrganization(orgId);
      if (org?.country) {
        // Get Gift Aid percentage from organization settings (default to 25%)
        const giftAidPercentage = (org.settings as any)?.giftAidPercentage || 25;
        
        if (giftAidPercentage > 0) {
          const taxReliefAmount = (amount * (giftAidPercentage / 100)).toFixed(2);
          donationData.taxReliefAmount = taxReliefAmount;
          // Only mark as eligible if address fields are provided
          const hasAddress = !!(donorAddress && donorTown && donorPostcode);
          donationData.giftAidEligible = hasAddress; // Only eligible if address is complete
        }
      }
    }
    
    // Update donor with Gift Aid address information if provided
    if (giftAidOptIn && donorAddress && donorTown && donorState && donorPostcode) {
      // Note: Donor table doesn't have address fields in schema, but donation record has all the info
      // We could extend the donor schema later if needed, but for now the donation record is the source of truth
    }

    // Create donation record
    const donation = await storage.createDonation(donationData);

    // Update campaign total if applicable
    if (campaignId) {
      const campaign = await storage.getCampaign(campaignId);
      if (campaign) {
        const newTotal = (parseFloat(campaign.currentAmount) + amount).toString();
        await storage.updateCampaign(campaignId, {
          goalAmount: campaign.goalAmount,
          currentAmount: newTotal,
        } as any);
      }
    }

    // Update donor stats
    const updatedDonor = await storage.getDonor(donor.id);
    if (updatedDonor) {
      const newDonorTotal = (parseFloat(updatedDonor.totalDonated) + amount).toString();
      await storage.updateDonor(donor.id, {
        totalDonated: newDonorTotal,
        donationCount: updatedDonor.donationCount + 1,
      } as any);
    }

    console.log('Donation created:', stripePaymentId, {
      donationAmount: amount,
      feeAmount,
      totalCharged: amount + feeAmount,
    });

    // Send thank you email (non-blocking)
    try {
      const organization = await storage.getOrganization(orgId);
      if (organization) {
        const templates = await storage.listEmailTemplates(orgId);
        const thankYouTemplates = templates.filter(t => t.templateType === 'donation_thank_you');
        
        if (thankYouTemplates.length > 0) {
          const donationTypeForTemplate: 'one-time' | 'recurring' = recurring ? 'recurring' : 'one-time';
          const selectedTemplate = selectThankYouTemplate(thankYouTemplates, amount, donationTypeForTemplate);
          
          let templateData = undefined;
          if (selectedTemplate && selectedTemplate.htmlBody) {
            // Fetch campaign title if campaignId exists
            let campaignTitle = '';
            if (campaignId) {
              const campaign = await storage.getCampaign(campaignId);
              if (campaign) {
                campaignTitle = campaign.title;
              }
            }
            
            // Format donation date
            const donationDate = new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
            
            const replacePlaceholders = (text: string) => {
              return text
                .replace(/\{\{donorName\}\}/g, donorName || 'Valued Supporter')
                .replace(/\{\{amount\}\}/g, `${currency} ${amount.toFixed(2)}`)
                .replace(/\{\{donationType\}\}/g, recurring ? 'recurring' : 'one-time')
                .replace(/\{\{organizationName\}\}/g, organization.name)
                .replace(/\{\{donationCategory\}\}/g, category || 'General')
                .replace(/\{\{campaignTitle\}\}/g, campaignTitle || 'General')
                .replace(/\{\{date\}\}/g, donationDate);
            };

            templateData = {
              subject: replacePlaceholders(selectedTemplate.subject),
              htmlBody: replacePlaceholders(selectedTemplate.htmlBody),
              textBody: selectedTemplate.textBody ? replacePlaceholders(selectedTemplate.textBody) : '',
            };
          }

          await resendEmail({
            to: donorEmail,
            subject: templateData?.subject || `Thank you for your ${recurring ? 'recurring' : 'one-time'} donation!`,
            htmlContent: templateData?.htmlBody || `<p>Dear ${donorName},</p><p>Thank you for your generous ${recurring ? 'recurring' : 'one-time'} donation of ${currency} ${amount.toFixed(2)}!</p>`,
            textContent: templateData?.textBody || '',
          });

          await storage.updateDonation(donation.id, {
            thankYouSent: true,
            thankYouSentAt: new Date(),
          } as any);

          console.log(`Thank you email sent successfully to ${donorEmail}`);
        }
      }
    } catch (emailError: any) {
      console.error('Failed to send thank you email:', emailError.message);
    }

    return { success: true, donation };
  }

  // Confirm donation after payment success (creates donation record)
  app.post("/api/campaigns/:campaignId/confirm-donation", async (req, res) => {
    try {
      const { paymentIntentId, clientSecret } = req.body;
      const campaignIdFromUrl = req.params.campaignId;

      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID required" });
      }

      // Retrieve the payment intent from Stripe to verify it succeeded
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "Payment not completed" });
      }

      // Validate client secret if provided (security measure)
      if (clientSecret && paymentIntent.client_secret !== clientSecret) {
        return res.status(400).json({ error: "Invalid client secret" });
      }

      const metadata = paymentIntent.metadata;
      const { 
        campaignId: campaignIdFromMetadata, 
        donorId, 
        donorName, 
        donorEmail, 
        message, 
        category, 
        coverFees, 
        feeAmount,
        giftAidOptIn,
        donorAddress,
        donorTown,
        donorState,
        donorPostcode
      } = metadata;
      
      // Prefer campaignId from metadata (secure), fallback to URL path for backward compatibility
      const campaignId = campaignIdFromMetadata || campaignIdFromUrl;
      
      if (!campaignId) {
        return res.status(400).json({ error: "Campaign ID not found" });
      }
      
      const stripePaymentId = paymentIntent.id;

      // Get campaign first to get orgId
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Check if donation already exists (idempotency)
      const duplicate = await storage.getDonationByStripePaymentId(campaign.orgId, stripePaymentId);

      if (duplicate) {
        return res.json({ success: true, donation: duplicate, duplicate: true });
      }

      // Calculate amounts
      const totalAmount = paymentIntent.amount / 100;
      const fee = feeAmount ? parseFloat(feeAmount) : 0;
      const donationAmount = totalAmount - fee;

      // Prepare donation data with Gift Aid fields
      const giftAidOptedIn = giftAidOptIn === "true";
      let donationData: any = {
        orgId: campaign.orgId,
        campaignId,
        donorId,
        amount: donationAmount.toString(),
        currency: paymentIntent.currency.toUpperCase(),
        category: category || "general",
        coverFees: coverFees === "true",
        feeAmount: fee.toString(),
        status: "completed",
        stripePaymentId,
        donorEmail,
        donorName,
        message: message || "",
        giftAidOptIn: giftAidOptedIn,
        donorAddress: donorAddress || null,
        donorCity: donorTown || null, // Map Town to donorCity in database
        donorPostcode: donorPostcode || null,
        donorCountry: donorState || null, // Map State/City to donorCountry in database
      };

      // Calculate tax relief amount if Gift Aid opted in
      if (giftAidOptedIn) {
        const org = await storage.getOrganization(campaign.orgId);
        if (org?.country === "GB") {
          // Get Gift Aid percentage from organization settings (default to 25%)
          const giftAidPercentage = (org.settings as any)?.giftAidPercentage || 25;
          
          if (giftAidPercentage > 0) {
            const taxReliefAmount = (donationAmount * (giftAidPercentage / 100)).toFixed(2);
            donationData.taxReliefAmount = taxReliefAmount;
            // Only mark as eligible if address fields are provided
            const hasAddress = !!(donorAddress && donorTown && donorPostcode);
            donationData.giftAidEligible = hasAddress; // Only eligible if address is complete
          }
        }
      }

      console.log('[Confirm Donation] Creating donation with Gift Aid data:', {
        giftAidOptIn: giftAidOptedIn,
        hasAddress: !!(donorAddress && donorTown && donorPostcode),
        giftAidEligible: donationData.giftAidEligible,
        taxReliefAmount: donationData.taxReliefAmount
      });

      // Create donation record
      const donation = await storage.createDonation(donationData);

      // Update campaign total
      const newTotal = (parseFloat(campaign.currentAmount) + donationAmount).toString();
      await storage.updateCampaign(campaignId, {
        goalAmount: campaign.goalAmount,
        currentAmount: newTotal,
      } as any);

      // Update donor stats
      const donor = await storage.getDonor(donorId);
      if (donor) {
        const newDonorTotal = (parseFloat(donor.totalDonated) + donationAmount).toString();
        await storage.updateDonor(donorId, {
          totalDonated: newDonorTotal,
          donationCount: donor.donationCount + 1,
        } as any);
      }

      console.log('Donation confirmed and created:', stripePaymentId, {
        donationAmount,
        feeAmount: fee,
        totalCharged: totalAmount,
      });

      // Send thank you email (non-blocking - don't fail donation if email fails)
      if (donorEmail) {
        try {
          // Get organization info
          const organization = await storage.getOrganization(campaign.orgId);
          
          if (organization) {
            // Get thank you email templates
            const templates = await storage.listEmailTemplates(campaign.orgId, "donation_thank_you");
            
            // Determine donation type (for now, all donations through this flow are one-time)
            const donationType: 'one-time' | 'recurring' = 'one-time';
            
            // Select best matching template
            const selectedTemplate = selectThankYouTemplate(templates, donationAmount, donationType);
            
            // Prepare template data if template exists
            let templateData = undefined;
            if (selectedTemplate && selectedTemplate.htmlBody) {
              // Fetch campaign title if campaignId exists
              let campaignTitle = '';
              if (donation.campaignId) {
                const campaign = await storage.getCampaign(donation.campaignId);
                if (campaign) {
                  campaignTitle = campaign.title;
                }
              }
              
              // Format donation date
              const donationDate = new Date(donation.createdAt || new Date()).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });
              
              // Replace placeholders in template
              const replacePlaceholders = (text: string) => {
                return text
                  .replace(/\{\{donorName\}\}/g, donorName || 'Valued Supporter')
                  .replace(/\{\{amount\}\}/g, `${donation.currency} ${donationAmount.toFixed(2)}`)
                  .replace(/\{\{donationType\}\}/g, donationType)
                  .replace(/\{\{organizationName\}\}/g, organization.name)
                  .replace(/\{\{donationCategory\}\}/g, donation.category || 'General')
                  .replace(/\{\{campaignTitle\}\}/g, campaignTitle || 'General')
                  .replace(/\{\{date\}\}/g, donationDate);
              };
              
              templateData = {
                subject: replacePlaceholders(selectedTemplate.subject),
                htmlBody: replacePlaceholders(selectedTemplate.htmlBody),
                textBody: selectedTemplate.textBody ? replacePlaceholders(selectedTemplate.textBody) : undefined,
              };
            }
            
            // Send the email
            await sendThankYouEmail({
              to: donorEmail,
              donorName: donorName || 'Valued Supporter',
              amount: `${donation.currency} ${donationAmount.toFixed(2)}`,
              donationType,
              template: templateData,
              organizationName: organization.name,
              logoUrl: organization.logoUrl || undefined,
            });
            
            // Update donation record to mark thank you email as sent
            await storage.updateDonation(donation.id, {
              thankYouSent: true,
              thankYouSentAt: new Date(),
            } as any);
            
            console.log(`Thank you email sent successfully to ${donorEmail}`);
          }
        } catch (emailError: any) {
          // Log error but don't fail the donation
          console.error('Failed to send thank you email:', emailError.message);
        }
      }

      res.json({ success: true, donation });
    } catch (error: any) {
      console.error("Donation confirmation error:", error);
      res.status(500).json({ error: "Failed to confirm donation", details: error.message });
    }
  });

  // Confirm Livestream Donation
  app.post("/api/livestreams/:livestreamId/confirm-donation", async (req, res) => {
    try {
      const { paymentIntentId, clientSecret } = req.body;
      const livestreamIdFromUrl = req.params.livestreamId;

      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID required" });
      }

      // Retrieve the payment intent from Stripe to verify it succeeded
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "Payment not completed" });
      }

      // Validate client secret if provided (security measure)
      if (clientSecret && paymentIntent.client_secret !== clientSecret) {
        return res.status(400).json({ error: "Invalid client secret" });
      }

      const metadata = paymentIntent.metadata;
      const { livestreamId: livestreamIdFromMetadata, donorName, donorEmail, message, category, coverFees, feeAmount, giftAidOptIn, donorAddress, donorTown, donorState, donorPostcode } = metadata;
      
      // Prefer livestreamId from metadata (secure), fallback to URL path for backward compatibility
      const livestreamId = livestreamIdFromMetadata || livestreamIdFromUrl;
      
      if (!livestreamId) {
        return res.status(400).json({ error: "Livestream ID not found" });
      }
      
      const stripePaymentId = paymentIntent.id;

      // Get livestream first to get orgId
      const livestream = await storage.getLivestream(livestreamId);
      if (!livestream) {
        return res.status(404).json({ error: "Livestream not found" });
      }

      // Check if donation already exists (idempotency)
      const duplicate = await storage.getDonationByStripePaymentId(livestream.orgId, stripePaymentId);

      if (duplicate) {
        return res.json({ success: true, donation: duplicate, duplicate: true });
      }

      // Calculate amounts
      const totalAmount = paymentIntent.amount / 100;
      const fee = feeAmount ? parseFloat(feeAmount) : 0;
      const donationAmount = totalAmount - fee;

      // Process donation using the same function as campaigns
      await processDonationWithEmail({
        orgId: livestream.orgId,
        livestreamId,
        campaignId: livestream.campaignId || undefined,
        stripePaymentId,
        donorEmail,
        donorName,
        amount: donationAmount,
        currency: paymentIntent.currency.toUpperCase(),
        category: category || "general",
        message: message || undefined,
        coverFees: coverFees === "true",
        feeAmount: fee,
        donationType: "livestream",
        giftAidOptIn: giftAidOptIn === "true",
        donorAddress: donorAddress || undefined,
        donorCity: donorTown || undefined,
        donorPostcode: donorPostcode || undefined,
        donorCountry: donorState || undefined,
      });

      // Also create a livestream donation record for recent donations display
      const { insertLivestreamDonationSchema } = await import("@shared/schema");
      const livestreamDonationData = insertLivestreamDonationSchema.parse({
        livestreamId,
        orgId: livestream.orgId,
        donorName,
        donorEmail,
        amount: donationAmount.toString(),
        currency: paymentIntent.currency.toUpperCase(),
        category: category || "general",
        message: message || undefined,
        showName: true,
        showAmount: true,
        stripePaymentId,
      });
      await storage.createLivestreamDonation(livestreamDonationData);

      // Update livestream totals
      const currentTotal = parseFloat(livestream.totalRaised.toString());
      await storage.updateLivestream(livestreamId, {
        totalRaised: (currentTotal + donationAmount).toString() as any,
        donorCount: livestream.donorCount + 1,
      });

      console.log('Livestream donation confirmed and created:', stripePaymentId, {
        donationAmount,
        feeAmount: fee,
        totalCharged: totalAmount,
      });

      res.json({ success: true, donation: { id: stripePaymentId, amount: donationAmount } });
    } catch (error: any) {
      console.error("Error confirming livestream donation:", error);
      res.status(500).json({ error: "Failed to confirm donation", details: error.message });
    }
  });

  // Donors
  app.get("/api/donors", requireAuth, async (req: any, res) => {
    try {
      let orgId = req.query.orgId as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "orgId is required" });
      }
      
      // Verify user has access to this organization
      if (req.user.orgId !== orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const donors = await storage.listDonors(orgId);
      res.json(donors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donors" });
    }
  });

  app.get("/api/donors/search", requireAuth, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
      
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ error: "Search query must be at least 2 characters" });
      }
      
      const donors = await storage.searchDonors(req.user.orgId, query.trim(), limit);
      res.json(donors);
    } catch (error) {
      console.error("Donor search error:", error);
      res.status(500).json({ error: "Failed to search donors" });
    }
  });

  app.get("/api/donors/:id", requireAuth, async (req: any, res) => {
    try {
      const donor = await storage.getDonor(req.params.id);
      if (!donor) {
        return res.status(404).json({ error: "Donor not found" });
      }
      
      // Verify user has access to this donor's organization
      if (req.user.orgId !== donor.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(donor);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donor" });
    }
  });

  app.post("/api/donors", requireAuth, async (req: any, res) => {
    try {
      const data = insertDonorSchema.parse(req.body);
      
      // Verify user has access to this organization
      if (req.user.orgId !== data.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const donor = await storage.createDonor(data);
      res.status(201).json(donor);
    } catch (error) {
      res.status(400).json({ error: "Invalid donor data" });
    }
  });

  app.patch("/api/donors/:id", requireAuth, async (req: any, res) => {
    try {
      const donor = await storage.getDonor(req.params.id);
      if (!donor) {
        return res.status(404).json({ error: "Donor not found" });
      }
      
      // Verify user has access to this donor's organization
      if (req.user.orgId !== donor.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const data = insertDonorSchema.partial().parse(req.body);
      const updated = await storage.updateDonor(req.params.id, data);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: "Invalid donor data", details: error.message });
    }
  });

  app.delete("/api/donors/:id", requireAuth, async (req: any, res) => {
    try {
      const donor = await storage.getDonor(req.params.id);
      if (!donor) {
        return res.status(404).json({ error: "Donor not found" });
      }
      
      // Verify user has access to this donor's organization
      if (req.user.orgId !== donor.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deleteDonor(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete donor" });
    }
  });

  // Get comprehensive donor interactions (donations, events, livestreams, activities)
  app.get("/api/donors/:id/interactions", requireAuth, async (req: any, res) => {
    try {
      const donor = await storage.getDonor(req.params.id);
      if (!donor) {
        return res.status(404).json({ error: "Donor not found" });
      }
      
      // Verify user has access to this donor's organization
      if (req.user.orgId !== donor.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      // Fetch donations
      const donations = await db
        .select()
        .from((await import("@shared/schema")).donations)
        .where(eq((await import("@shared/schema")).donations.donorId, req.params.id))
        .orderBy(desc((await import("@shared/schema")).donations.createdAt));

      // Fetch event registrations by email
      const eventRegistrations = await db
        .select()
        .from((await import("@shared/schema")).eventRegistrations)
        .where(eq((await import("@shared/schema")).eventRegistrations.email, donor.email))
        .orderBy(desc((await import("@shared/schema")).eventRegistrations.createdAt));

      // Fetch event details for each registration
      const eventIds = eventRegistrations.map(r => r.eventId);
      const eventsList = eventIds.length > 0 
        ? await db
            .select()
            .from((await import("@shared/schema")).events)
            .where(inArray((await import("@shared/schema")).events.id, eventIds))
        : [];
      
      const eventsMap = new Map(eventsList.map(e => [e.id, e]));
      const eventRegistrationsWithDetails = eventRegistrations.map(reg => ({
        ...reg,
        event: eventsMap.get(reg.eventId)
      }));

      // Fetch livestream donations
      const livestreamDonations = await db
        .select()
        .from((await import("@shared/schema")).livestreamDonations)
        .where(eq((await import("@shared/schema")).livestreamDonations.donorId, req.params.id))
        .orderBy(desc((await import("@shared/schema")).livestreamDonations.createdAt));

      // Fetch livestream details for each donation
      const livestreamIds = livestreamDonations.map(d => d.livestreamId);
      const livestreamsList = livestreamIds.length > 0
        ? await db
            .select()
            .from((await import("@shared/schema")).livestreams)
            .where(inArray((await import("@shared/schema")).livestreams.id, livestreamIds))
        : [];
      
      const livestreamsMap = new Map(livestreamsList.map(l => [l.id, l]));
      const livestreamDonationsWithDetails = livestreamDonations.map(donation => ({
        ...donation,
        livestream: livestreamsMap.get(donation.livestreamId)
      }));

      // Fetch activity registrations by email
      const activityRegistrations = await db
        .select()
        .from((await import("@shared/schema")).activityRegistrations)
        .where(eq((await import("@shared/schema")).activityRegistrations.studentEmail, donor.email))
        .orderBy(desc((await import("@shared/schema")).activityRegistrations.createdAt));

      // Fetch activity details for each registration
      const activityIds = activityRegistrations.map(r => r.activityId);
      const activitiesList = activityIds.length > 0
        ? await db
            .select()
            .from((await import("@shared/schema")).activities)
            .where(inArray((await import("@shared/schema")).activities.id, activityIds))
        : [];
      
      const activitiesMap = new Map(activitiesList.map(a => [a.id, a]));
      const activityRegistrationsWithDetails = activityRegistrations.map(reg => ({
        ...reg,
        activity: activitiesMap.get(reg.activityId)
      }));

      res.json({
        donations,
        eventRegistrations: eventRegistrationsWithDetails,
        livestreamDonations: livestreamDonationsWithDetails,
        activityRegistrations: activityRegistrationsWithDetails,
      });
    } catch (error: any) {
      console.error("Error fetching donor interactions:", error);
      res.status(500).json({ error: "Failed to fetch donor interactions" });
    }
  });

  // Get donor tags
  app.get("/api/donors/:id/tags", requireAuth, async (req: any, res) => {
    try {
      const donor = await storage.getDonor(req.params.id);
      if (!donor) {
        return res.status(404).json({ error: "Donor not found" });
      }
      
      // Verify user has access to this donor's organization
      if (req.user.orgId !== donor.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      // Fetch donor tag assignments and join with tag data
      const tagAssignments = await db
        .select({
          id: donorTagAssignments.id,
          tagId: donorTagAssignments.tagId,
          tag: donorTags,
          createdAt: donorTagAssignments.createdAt,
        })
        .from(donorTagAssignments)
        .innerJoin(donorTags, eq(donorTagAssignments.tagId, donorTags.id))
        .where(eq(donorTagAssignments.donorId, req.params.id));

      res.json(tagAssignments);
    } catch (error: any) {
      console.error("Error fetching donor tags:", error);
      res.status(500).json({ error: "Failed to fetch donor tags" });
    }
  });

  // Assign tag to donor
  app.post("/api/donors/:id/tags", requireAuth, async (req: any, res) => {
    try {
      const donor = await storage.getDonor(req.params.id);
      if (!donor) {
        return res.status(404).json({ error: "Donor not found" });
      }
      
      // Verify user has access to this donor's organization
      if (req.user.orgId !== donor.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const { tagId } = req.body;
      
      // Verify tag belongs to same organization
      const tag = await db
        .select()
        .from(donorTags)
        .where(eq(donorTags.id, tagId))
        .limit(1);
      
      if (tag.length === 0 || tag[0].orgId !== donor.orgId) {
        return res.status(404).json({ error: "Tag not found" });
      }

      // Check if already assigned
      const existing = await db
        .select()
        .from(donorTagAssignments)
        .where(
          and(
            eq(donorTagAssignments.donorId, req.params.id),
            eq(donorTagAssignments.tagId, tagId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).json({ error: "Tag already assigned to this donor" });
      }

      // Create assignment
      const [assignment] = await db
        .insert(donorTagAssignments)
        .values({
          donorId: req.params.id,
          tagId,
        })
        .returning();

      res.json(assignment);
    } catch (error: any) {
      console.error("Error assigning tag to donor:", error);
      res.status(500).json({ error: "Failed to assign tag to donor" });
    }
  });

  // Remove tag from donor
  app.delete("/api/donors/:id/tags/:tagId", requireAuth, async (req: any, res) => {
    try {
      const donor = await storage.getDonor(req.params.id);
      if (!donor) {
        return res.status(404).json({ error: "Donor not found" });
      }
      
      // Verify user has access to this donor's organization
      if (req.user.orgId !== donor.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      await db
        .delete(donorTagAssignments)
        .where(
          and(
            eq(donorTagAssignments.donorId, req.params.id),
            eq(donorTagAssignments.tagId, req.params.tagId)
          )
        );

      res.status(204).send();
    } catch (error: any) {
      console.error("Error removing tag from donor:", error);
      res.status(500).json({ error: "Failed to remove tag from donor" });
    }
  });

  // Donor Tags management
  app.get("/api/donor-tags", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user?.orgId) {
        return res.status(403).json({ error: "No organization associated with user" });
      }

      const tags = await db
        .select()
        .from(donorTags)
        .where(eq(donorTags.orgId, user.orgId))
        .orderBy(asc(donorTags.name));

      res.json(tags);
    } catch (error) {
      console.error("Error fetching donor tags:", error);
      res.status(500).json({ error: "Failed to fetch donor tags" });
    }
  });

  app.post("/api/donor-tags", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user?.orgId) {
        return res.status(403).json({ error: "No organization associated with user" });
      }

      const data = insertDonorTagSchema.parse(req.body);
      const [tag] = await db
        .insert(donorTags)
        .values({
          ...data,
          orgId: user.orgId,
        })
        .returning();

      res.status(201).json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating donor tag:", error);
      res.status(500).json({ error: "Failed to create donor tag" });
    }
  });

  app.put("/api/donor-tags/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const [tag] = await db
        .select()
        .from(donorTags)
        .where(eq(donorTags.id, req.params.id))
        .limit(1);

      if (!tag) {
        return res.status(404).json({ error: "Tag not found" });
      }

      if (tag.orgId !== user.orgId && user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const data = insertDonorTagSchema.parse(req.body);
      const [updated] = await db
        .update(donorTags)
        .set(data)
        .where(eq(donorTags.id, req.params.id))
        .returning();

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating donor tag:", error);
      res.status(500).json({ error: "Failed to update donor tag" });
    }
  });

  app.delete("/api/donor-tags/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const [tag] = await db
        .select()
        .from(donorTags)
        .where(eq(donorTags.id, req.params.id))
        .limit(1);

      if (!tag) {
        return res.status(404).json({ error: "Tag not found" });
      }

      if (tag.orgId !== user.orgId && user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      await db
        .delete(donorTags)
        .where(eq(donorTags.id, req.params.id));

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting donor tag:", error);
      res.status(500).json({ error: "Failed to delete donor tag" });
    }
  });

  // Donations
  // Gift Aid / Tax Relief Routes - MUST come before /api/donations/:id to avoid route conflicts
  app.get("/api/donations/gift-aid", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      // Parse filter parameters
      const { startDate, endDate, status } = req.query;
      const filters: any = {
        giftAidOptIn: true, // Only show donations where donor opted in
      };

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      
      // Filter by claim status if specified
      if (status === 'claimed') {
        filters.taxReliefClaimed = true;
      } else if (status === 'pending') {
        filters.taxReliefClaimed = false;
      }

      const donations = await storage.filterDonations(user.orgId, filters);
      
      // Transform donations to include flat donor fields for frontend compatibility
      const transformedDonations = donations.map(donation => ({
        ...donation,
        donorName: donation.donor 
          ? `${donation.donor.firstName} ${donation.donor.lastName}`
          : donation.donorName || "Unknown Donor",
        donorEmail: donation.donor?.email || donation.donorEmail || "",
        // Keep existing address fields (donorAddress, donorCity, donorPostcode are already on donation)
      }));
      
      res.json(transformedDonations);
    } catch (error) {
      console.error("Error fetching Gift Aid donations:", error);
      res.status(500).json({ error: "Failed to fetch Gift Aid donations" });
    }
  });

  app.post("/api/donations/gift-aid/claim", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      const { donationIds } = req.body;
      if (!Array.isArray(donationIds) || donationIds.length === 0) {
        return res.status(400).json({ error: "Invalid donation IDs" });
      }

      // Update all selected donations as claimed
      const updatePromises = donationIds.map(async (donationId: string) => {
        const donation = await storage.getDonation(donationId);
        if (!donation || donation.orgId !== user.orgId) {
          return null;
        }

        return storage.updateDonation(donationId, {
          taxReliefClaimed: true,
          taxReliefClaimedAt: new Date(),
        });
      });

      const results = await Promise.all(updatePromises);
      const successCount = results.filter(r => r !== null).length;

      res.json({ 
        success: true, 
        claimed: successCount,
        message: `${successCount} donation(s) marked as claimed` 
      });
    } catch (error) {
      console.error("Error claiming Gift Aid:", error);
      res.status(500).json({ error: "Failed to claim Gift Aid" });
    }
  });

  app.get("/api/donations", async (req, res) => {
    try {
      let { orgId, campaignId, donorId } = req.query;
      const orgSlug = req.query.orgSlug as string;
      
      if (campaignId) {
        const donations = await storage.listDonationsByCampaign(campaignId as string);
        return res.json(donations);
      }
      
      if (donorId) {
        const donations = await storage.listDonationsByDonor(donorId as string);
        return res.json(donations);
      }
      
      // If slug provided, resolve to ID
      if (orgSlug && !orgId) {
        const org = await storage.getOrganizationBySlug(orgSlug);
        if (!org) {
          return res.status(404).json({ error: "Organization not found" });
        }
        orgId = org.id;
      }
      
      if (orgId) {
        const donations = await storage.listDonations(orgId as string);
        return res.json(donations);
      }
      
      res.status(400).json({ error: "orgId, orgSlug, campaignId, or donorId is required" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donations" });
    }
  });

  app.get("/api/donations/:id", async (req, res) => {
    try {
      const donation = await storage.getDonation(req.params.id);
      if (!donation) {
        return res.status(404).json({ error: "Donation not found" });
      }
      res.json(donation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donation" });
    }
  });

  app.patch("/api/donations/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const donation = await storage.getDonation(req.params.id);
      if (!donation) {
        return res.status(404).json({ error: "Donation not found" });
      }

      // Authorization check: eco_admin can edit any donation, org users can only edit their own
      if (user.role !== "eco_admin" && donation.orgId !== user.orgId) {
        return res.status(403).json({ error: "Not authorized to edit this donation" });
      }

      // Whitelist editable fields to prevent status manipulation
      const editableSchema = z.object({
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/).refine(val => parseFloat(val) > 0, "Amount must be positive"),
        donorName: z.string().min(1).optional(),
        donorEmail: z.string().email().optional(),
        message: z.string().optional(),
        category: z.enum(["general", "tithe", "sadaqa", "zakat", "offering"]).optional(),
        receiptUrl: z.string().url().optional().nullable(),
        notes: z.string().optional().nullable(),
      }).partial();

      const updates = editableSchema.parse(req.body);
      const updatedDonation = await storage.updateDonation(req.params.id, updates);

      // TODO: Trigger background job to recalculate campaign/donor aggregates
      // For now, this is a simple update without aggregate recalculation

      res.json(updatedDonation);
    } catch (error) {
      console.error("Error updating donation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid donation data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update donation" });
    }
  });

  app.post("/api/donations/:id/resend-thank-you", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const donation = await storage.getDonation(req.params.id);
      if (!donation) {
        return res.status(404).json({ error: "Donation not found" });
      }

      // Authorization check: eco_admin can resend for any donation, org users can only resend for their own
      if (user.role !== "eco_admin" && donation.orgId !== user.orgId) {
        return res.status(403).json({ error: "Not authorized to send email for this donation" });
      }

      if (!donation.donorEmail) {
        return res.status(400).json({ error: "No email address for this donation" });
      }

      const org = await storage.getOrganization(donation.orgId);
      
      // Validate and sanitize custom message (plain text only)
      const messageSchema = z.object({
        customMessage: z.string().max(1000).optional(),
      });
      const { customMessage } = messageSchema.parse(req.body);

      // Escape HTML to prevent injection
      const escapeHtml = (text: string) => {
        return text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      };

      // Build email template with optional custom message (escaped for safety)
      let template = undefined;
      if (customMessage) {
        const safeMessage = escapeHtml(customMessage);
        template = {
          subject: `Thank you for your ${donation.donationType || "donation"} donation to ${org?.name || "our organization"}`,
          htmlBody: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                ${org?.logo ? `
                  <div style="text-align: center; margin-bottom: 30px;">
                    <img src="${org.logo}" alt="Organization Logo" style="max-width: 200px; height: auto;">
                  </div>
                ` : ''}
                <h1 style="color: #2563eb; margin-bottom: 20px;">Thank You for Your Generous Donation!</h1>
                <p>Dear ${donation.donorName || "Friend"},</p>
                <p>We are deeply grateful for your ${donation.donationType || "donation"} donation of <strong>${donation.currency}${parseFloat(donation.amount).toFixed(2)}</strong>.</p>
                <div style="background-color: #f5f5f5; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
                </div>
                <p>Thank you for your continued support!</p>
                <p style="margin-top: 30px;">
                  With gratitude,<br>
                  ${org?.name || 'Our Team'}
                </p>
              </body>
            </html>
          `,
          textBody: `
Dear ${donation.donorName || "Friend"},

We are deeply grateful for your ${donation.donationType || "donation"} donation of ${donation.currency}${parseFloat(donation.amount).toFixed(2)}.

${customMessage}

Thank you for your continued support!

With gratitude,
${org?.name || 'Our Team'}
          `.trim(),
        };
      }

      await sendThankYouEmail({
        to: donation.donorEmail,
        donorName: donation.donorName || "Friend",
        amount: `${donation.currency}${parseFloat(donation.amount).toFixed(2)}`,
        donationType: donation.donationType || "donation",
        organizationName: org?.name,
        logoUrl: org?.logo,
        template,
      });

      // Update thankYouSent status
      await storage.updateDonation(req.params.id, {
        thankYouSent: true,
        thankYouSentAt: new Date(),
      });

      res.json({ success: true, message: "Thank you email sent successfully" });
    } catch (error) {
      console.error("Error sending thank you email:", error);
      res.status(500).json({ error: "Failed to send thank you email" });
    }
  });

  app.post("/api/donations", async (req, res) => {
    try {
      const data = insertDonationSchema.parse(req.body);
      const donation = await storage.createDonation(data);
      
      // Update campaign total
      if (donation.campaignId) {
        const campaign = await storage.getCampaign(donation.campaignId);
        if (campaign) {
          const newTotal = (parseFloat(campaign.currentAmount) + parseFloat(donation.amount)).toFixed(2);
          await storage.updateCampaign(donation.campaignId, {
            currentAmount: newTotal,
          } as any);
        }
      }
      
      // Update or create donor
      if (donation.donorEmail) {
        let donor = await storage.getDonorByEmail(donation.donorEmail, donation.orgId);
        if (donor) {
          const newTotal = (parseFloat(donor.totalDonated) + parseFloat(donation.amount)).toFixed(2);
          await storage.updateDonor(donor.id, {
            totalDonated: newTotal,
            donationCount: donor.donationCount + 1,
          } as any);
        }
      }
      
      res.status(201).json(donation);
    } catch (error) {
      res.status(400).json({ error: "Invalid donation data" });
    }
  });

  // Events
  // Public Events List (no auth required)
  // SECURITY: Only shows approved organizations + published events with safe fields
  // PERFORMANCE: Preloads organizations, fetches events per org
  app.get("/api/events/public", async (req, res) => {
    try {
      // Get approved organizations
      const allOrganizations = await storage.listOrganizations();
      const approvedOrgs = allOrganizations.filter(org => org.status === "approved");

      // Fetch events for each approved organization
      const eventsByOrg = await Promise.all(
        approvedOrgs.map(org => storage.listEvents(org.id))
      );

      // Flatten and filter events
      const now = new Date();
      const publicEvents = eventsByOrg
        .flat()
        .filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= now && event.status === "published";
        })
        .map(event => {
          const org = approvedOrgs.find(o => o.id === event.orgId);
          if (!org) return null;

          // SECURITY: Only expose public-safe fields
          return {
            id: event.id,
            title: event.title,
            slug: event.slug,
            description: event.description,
            date: event.date,
            endDate: event.endDate,
            location: event.location,
            image: event.image,
            capacity: event.capacity,
            category: event.category,
            status: event.status,
            organizationName: org.name,
            organizationLogo: org.logo,
            organizationSlug: org.slug,
          };
        })
        .filter(e => e !== null);

      res.json(publicEvents);
    } catch (error: any) {
      console.error("Error fetching public events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events", async (req, res) => {
    try {
      let orgId = req.query.orgId as string;
      const orgSlug = req.query.orgSlug as string;
      
      if (!orgId && !orgSlug) {
        return res.status(400).json({ error: "orgId or orgSlug is required" });
      }
      
      // If slug provided, resolve to ID
      if (orgSlug && !orgId) {
        const org = await storage.getOrganizationBySlug(orgSlug);
        if (!org) {
          return res.status(404).json({ error: "Organization not found" });
        }
        orgId = org.id;
      }
      
      const events = await storage.listEvents(orgId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  // AI Event Generator - Generate event title, description, and image
  app.post("/api/org/:orgId/events/ai-generate", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        console.log("Authorization failed:", { 
          userOrgId: user?.orgId, 
          paramOrgId: req.params.orgId,
          userRole: user?.role 
        });
        return res.status(403).json({ error: "Access denied" });
      }

      const { keywords } = req.body;
      if (!keywords || typeof keywords !== "string" || keywords.trim().length === 0) {
        return res.status(400).json({ error: "Keywords are required" });
      }

      // Note: Image generation will be saved to local storage

      console.log("Generating event content for keywords:", keywords);

      // Step 1: Generate title and description using ChatGPT
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const chatResponse = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert event planner for faith-based organizations. Generate professional, engaging event content."
          },
          {
            role: "user",
            content: `Create an event based on these keywords: "${keywords}". Make it inspiring, welcoming, and appropriate for a faith-based community.

Return your response in this exact format:
TITLE: [event title here]
DESCRIPTION: [2-3 paragraph description]
IMAGE_CONCEPT: [visual description for banner image]`
          }
        ],
        max_completion_tokens: 2000
      });

      const responseText = chatResponse.choices[0].message.content || "";
      
      // Parse the structured response
      const titleMatch = responseText.match(/TITLE:\s*(.+?)(?=\nDESCRIPTION:)/s);
      const descMatch = responseText.match(/DESCRIPTION:\s*(.+?)(?=\nIMAGE_CONCEPT:)/s);
      const imageMatch = responseText.match(/IMAGE_CONCEPT:\s*(.+)/s);

      const generatedContent = {
        title: titleMatch?.[1]?.trim() || keywords,
        description: descMatch?.[1]?.trim() || `Join us for ${keywords}`,
        imageConcept: imageMatch?.[1]?.trim() || keywords
      };
      console.log("Generated content:", generatedContent);

      // Step 2: Generate banner image using DALL-E
      let publicUrl: string;
      try {
        const imageResponse = await openai.images.generate({
          model: "gpt-image-1",
          prompt: `Professional, uplifting banner image for a faith-based event: ${generatedContent.imageConcept || keywords}. Warm, welcoming, community-oriented, high quality, bright natural lighting, 16:9 aspect ratio`,
          n: 1,
          size: "1536x1024"
        });

        if (!imageResponse.data || imageResponse.data.length === 0) {
          throw new Error("No image data returned from OpenAI");
        }

        // OpenAI can return either URL or base64 depending on response_format
        const imageData = imageResponse.data[0];

        if (imageData.b64_json) {
          // Base64 response - upload to storage
          const fileName = `ai-event-${Date.now()}.png`;

          // Convert base64 to buffer
          const imageBuffer = Buffer.from(imageData.b64_json, 'base64');
          const objectPath = `/objects/events/${fileName}`;

          console.log("Saving AI-generated event image to:", objectPath);

          // Upload to local storage
          await objectStorageService.saveFile(
            objectPath,
            imageBuffer,
            {
              contentType: 'image/png',
              visibility: "public",
            }
          );

          // Set ACL for public access
          const aclPolicy: ObjectAclPolicy = {
            owner: "",
            visibility: "public",
          };
          const aclResult = await objectStorageService.trySetObjectEntityAclPolicy(objectPath, aclPolicy);
          console.log("ACL set result:", aclResult);

          // Verify file exists
          try {
            const fileEntity = await objectStorageService.getObjectEntityFile(objectPath);
            console.log("File entity retrieved:", fileEntity.path);
          } catch (verifyError) {
            console.error("Failed to verify file after save:", verifyError);
            throw new Error("File was not saved correctly");
          }

          // Return the public URL (served through /api/files endpoint)
          // Pass req to buildUrl to get the correct base URL from the request
          publicUrl = buildUrl(`/api/files${objectPath}`, undefined, req);
          console.log("Generated public URL:", publicUrl);
        } else if (imageData.url) {
          // URL response - use directly (temporary, expires after 1 hour)
          // Note: In production, you should download and re-upload to your storage
          publicUrl = imageData.url;
        } else {
          throw new Error("No image URL or base64 data in OpenAI response");
        }
      } catch (imageError: any) {
        console.error("Image generation/upload error:", imageError);
        return res.status(500).json({ 
          error: "Failed to generate event image", 
          details: imageError.message 
        });
      }

      res.json({
        title: generatedContent.title || keywords,
        description: generatedContent.description || `Join us for ${keywords}`,
        imageUrl: publicUrl,
      });

    } catch (error: any) {
      console.error("AI generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate event content", 
        details: error.message 
      });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const data = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(data);
      res.status(201).json(event);
    } catch (error: any) {
      console.error("Event creation validation error:", error);
      if (error.errors) {
        return res.status(400).json({ 
          error: "Invalid event data", 
          details: error.errors 
        });
      }
      res.status(400).json({ error: "Invalid event data", details: error.message });
    }
  });

  app.patch("/api/events/:id", async (req, res) => {
    try {
      // Validate request body using partial schema (allows updating only some fields)
      const validatedData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(req.params.id, validatedData);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error: any) {
      console.error("Event update validation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid event data", 
          details: error.errors 
        });
      }
      res.status(400).json({ error: "Failed to update event", details: error.message });
    }
  });

  // Get organization slug from payment intent (for redirect after event registration)
  app.get("/api/events/get-org-slug", async (req, res) => {
    try {
      const paymentIntentId = req.query.paymentIntentId as string;
      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID required" });
      }

      let eventId: string | undefined;

      // Try to get eventId from payment intent metadata
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        eventId = paymentIntent.metadata?.eventId;
        console.log('[get-org-slug] Retrieved payment intent:', { paymentIntentId, eventId, metadata: paymentIntent.metadata });
      } catch (stripeError: any) {
        console.error('[get-org-slug] Error retrieving payment intent from Stripe:', stripeError.message);
        // Fall through to try finding by registration
      }

      // If eventId not in metadata, try to find it from the registration
      if (!eventId) {
        console.log('[get-org-slug] EventId not in payment intent metadata, searching registrations for payment intent:', paymentIntentId);
        // Query database directly for registration with this stripePaymentId
        try {
          const registration = await db.select()
            .from(eventRegistrations)
            .where(eq(eventRegistrations.stripePaymentId, paymentIntentId))
            .limit(1);
          
          if (registration.length > 0) {
            eventId = registration[0].eventId;
            console.log('[get-org-slug] Found event from registration:', eventId);
          }
        } catch (dbError: any) {
          console.error('[get-org-slug] Error querying registrations:', dbError.message);
        }
      }

      if (!eventId) {
        console.error('[get-org-slug] Could not find eventId for payment intent:', paymentIntentId);
        return res.status(404).json({ error: "Event ID not found in payment intent or registrations" });
      }

      // Get event to get orgId
      const event = await storage.getEvent(eventId);
      if (!event) {
        console.error('[get-org-slug] Event not found:', eventId);
        return res.status(404).json({ error: "Event not found" });
      }

      // Get organization to get slug
      const organization = await storage.getOrganization(event.orgId);
      if (!organization || !organization.slug) {
        console.error('[get-org-slug] Organization not found or has no slug:', event.orgId);
        return res.status(404).json({ error: "Organization not found or has no slug" });
      }

      console.log('[get-org-slug] Successfully retrieved org slug:', organization.slug);
      res.json({ orgSlug: organization.slug });
    } catch (error: any) {
      console.error("Error fetching organization slug:", error);
      res.status(500).json({ error: "Failed to fetch organization slug" });
    }
  });

  // Event Ticket Types
  app.get("/api/events/:eventId/ticket-types", async (req, res) => {
    try {
      const ticketTypes = await storage.listEventTicketTypes(req.params.eventId);
      res.json(ticketTypes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ticket types" });
    }
  });

  app.post("/api/events/:eventId/ticket-types", requireAuth, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      
      // Verify event exists and user has access
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Verify user has access to this event's organization
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== event.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Parse and validate the ticket type data
      // Convert date strings to Date objects if provided
      const bodyData: any = {
        ...req.body,
        eventId: eventId,
      };
      
      // Convert salesStart and salesEnd from strings to Date objects if provided
      if (bodyData.salesStart && typeof bodyData.salesStart === 'string') {
        bodyData.salesStart = new Date(bodyData.salesStart);
      }
      if (bodyData.salesEnd && typeof bodyData.salesEnd === 'string') {
        bodyData.salesEnd = new Date(bodyData.salesEnd);
      }
      
      const data = insertEventTicketTypeSchema.parse(bodyData);
      
      const ticketType = await storage.createEventTicketType(data);
      res.status(201).json(ticketType);
    } catch (error: any) {
      console.error("Ticket type creation error:", error);
      console.error("Request body:", req.body);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid ticket type data", 
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code
          }))
        });
      }
      res.status(400).json({ 
        error: "Failed to create ticket type", 
        details: error.message || "Unknown error" 
      });
    }
  });

  app.patch("/api/events/:eventId/ticket-types/:id", async (req, res) => {
    try {
      // Verify the ticket type belongs to this event
      const existing = await storage.getEventTicketType(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Ticket type not found" });
      }
      if (existing.eventId !== req.params.eventId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Don't allow changing the eventId
      const { eventId: _, ...updateData } = req.body;
      
      // Convert date strings to Date objects if provided
      if (updateData.salesStart && typeof updateData.salesStart === 'string') {
        updateData.salesStart = new Date(updateData.salesStart);
      }
      if (updateData.salesEnd && typeof updateData.salesEnd === 'string') {
        updateData.salesEnd = new Date(updateData.salesEnd);
      }
      
      const ticketType = await storage.updateEventTicketType(req.params.id, updateData);
      res.json(ticketType);
    } catch (error) {
      res.status(400).json({ error: "Failed to update ticket type" });
    }
  });

  app.delete("/api/events/:eventId/ticket-types/:id", async (req, res) => {
    try {
      // Verify the ticket type belongs to this event
      const existing = await storage.getEventTicketType(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Ticket type not found" });
      }
      if (existing.eventId !== req.params.eventId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.deleteEventTicketType(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete ticket type" });
    }
  });

  // Event Promo Codes
  app.get("/api/events/:eventId/promo-codes", async (req, res) => {
    try {
      const promoCodes = await storage.listEventPromoCodes(req.params.eventId);
      res.json(promoCodes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch promo codes" });
    }
  });

  app.post("/api/events/:eventId/promo-codes", async (req, res) => {
    try {
      const data = insertEventPromoCodeSchema.parse({
        ...req.body,
        eventId: req.params.eventId,
      });
      const promoCode = await storage.createEventPromoCode(data);
      res.status(201).json(promoCode);
    } catch (error) {
      res.status(400).json({ error: "Failed to create promo code" });
    }
  });

  app.patch("/api/events/:eventId/promo-codes/:id", async (req, res) => {
    try {
      // Verify the promo code belongs to this event
      const existing = await storage.getEventPromoCode(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Promo code not found" });
      }
      if (existing.eventId !== req.params.eventId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Don't allow changing the eventId
      const { eventId: _, ...updateData } = req.body;
      const promoCode = await storage.updateEventPromoCode(req.params.id, updateData);
      res.json(promoCode);
    } catch (error) {
      res.status(400).json({ error: "Failed to update promo code" });
    }
  });

  app.delete("/api/events/:eventId/promo-codes/:id", async (req, res) => {
    try {
      // Verify the promo code belongs to this event
      const existing = await storage.getEventPromoCode(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Promo code not found" });
      }
      if (existing.eventId !== req.params.eventId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.deleteEventPromoCode(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete promo code" });
    }
  });

  // Validate Promo Code
  app.post("/api/events/:eventId/validate-promo-code", async (req, res) => {
    try {
      const { code } = req.body;
      const promoCode = await storage.getEventPromoCodeByCode(code, req.params.eventId);
      
      if (!promoCode) {
        return res.status(404).json({ error: "Promo code not found" });
      }

      if (!promoCode.isActive) {
        return res.status(400).json({ error: "Promo code is not active" });
      }

      if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
        return res.status(400).json({ error: "Promo code has reached maximum uses" });
      }

      const now = new Date();
      if (promoCode.validFrom && new Date(promoCode.validFrom) > now) {
        return res.status(400).json({ error: "Promo code is not yet valid" });
      }

      if (promoCode.validUntil && new Date(promoCode.validUntil) < now) {
        return res.status(400).json({ error: "Promo code has expired" });
      }

      res.json(promoCode);
    } catch (error) {
      res.status(500).json({ error: "Failed to validate promo code" });
    }
  });

  // Event Speakers
  app.get("/api/events/:eventId/speakers", requireAuth, async (req: any, res) => {
    try {
      // Verify the event exists and belongs to the user's organization
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (event.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const speakers = await storage.listEventSpeakers(req.params.eventId);
      res.json(speakers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch speakers" });
    }
  });

  app.post("/api/events/:eventId/speakers", requireAuth, async (req: any, res) => {
    try {
      const data = insertEventSpeakerSchema.parse({
        ...req.body,
        eventId: req.params.eventId,
      });
      const speaker = await storage.createEventSpeaker(data);
      res.status(201).json(speaker);
    } catch (error) {
      res.status(400).json({ error: "Failed to create speaker" });
    }
  });

  app.patch("/api/events/:eventId/speakers/:id", requireAuth, async (req: any, res) => {
    try {
      // Verify the speaker belongs to this event
      const existing = await storage.getEventSpeaker(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Speaker not found" });
      }
      if (existing.eventId !== req.params.eventId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Don't allow changing the eventId
      const { eventId: _, ...updateData } = req.body;
      const speaker = await storage.updateEventSpeaker(req.params.id, updateData);
      res.json(speaker);
    } catch (error) {
      res.status(400).json({ error: "Failed to update speaker" });
    }
  });

  app.delete("/api/events/:eventId/speakers/:id", requireAuth, async (req: any, res) => {
    try {
      // Verify the speaker belongs to this event
      const existing = await storage.getEventSpeaker(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Speaker not found" });
      }
      if (existing.eventId !== req.params.eventId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.deleteEventSpeaker(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete speaker" });
    }
  });

  // Event Sponsors
  app.get("/api/events/:eventId/sponsors", requireAuth, async (req: any, res) => {
    try {
      // Verify the event exists and belongs to the user's organization
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (event.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const sponsors = await storage.listEventSponsors(req.params.eventId);
      res.json(sponsors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sponsors" });
    }
  });

  app.post("/api/events/:eventId/sponsors", requireAuth, async (req: any, res) => {
    try {
      const data = insertEventSponsorSchema.parse({
        ...req.body,
        eventId: req.params.eventId,
      });
      const sponsor = await storage.createEventSponsor(data);
      res.status(201).json(sponsor);
    } catch (error) {
      res.status(400).json({ error: "Failed to create sponsor" });
    }
  });

  app.patch("/api/events/:eventId/sponsors/:id", requireAuth, async (req: any, res) => {
    try {
      // Verify the sponsor belongs to this event
      const existing = await storage.getEventSponsor(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Sponsor not found" });
      }
      if (existing.eventId !== req.params.eventId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Don't allow changing the eventId
      const { eventId: _, ...updateData } = req.body;
      const sponsor = await storage.updateEventSponsor(req.params.id, updateData);
      res.json(sponsor);
    } catch (error) {
      res.status(400).json({ error: "Failed to update sponsor" });
    }
  });

  app.delete("/api/events/:eventId/sponsors/:id", requireAuth, async (req: any, res) => {
    try {
      // Verify the sponsor belongs to this event
      const existing = await storage.getEventSponsor(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Sponsor not found" });
      }
      if (existing.eventId !== req.params.eventId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.deleteEventSponsor(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete sponsor" });
    }
  });

  // AI Event Description Generator
  app.post("/api/events/generate-description", requireAuth, async (req: any, res) => {
    try {
      const { title, eventType, location, date, tone = "inspirational" } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Event title is required" });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are an expert event marketing copywriter specializing in faith-based organization events. Generate compelling event descriptions that inspire attendance and engagement.

The tone should be ${tone}. Write in a way that:
- Captures the essence and purpose of the event
- Highlights what attendees will experience or gain
- Creates excitement and urgency
- Is concise yet impactful (2-3 paragraphs max)
- Uses inclusive, welcoming language
- Ends with a clear call to action

Return ONLY the event description text, no additional commentary.`
          },
          {
            role: "user",
            content: `Generate an event description with these details:

Title: ${title}
Type: ${eventType || "in-person"}
Location: ${location || "TBD"}
Date: ${date ? new Date(date).toLocaleDateString() : "TBD"}
Tone: ${tone}

Write a compelling description that will attract attendees.`
          }
        ],
        max_completion_tokens: 512
      });

      const description = completion.choices[0].message.content || "";
      res.type("text/plain").send(description);
    } catch (error: any) {
      console.error("AI description generation error:", error);
      res.status(500).json({ error: "Failed to generate description", details: error.message });
    }
  });

  // Public Event View
  app.get("/api/events/public/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Get organization for religion field
      const organization = await storage.getOrganization(event.orgId);

      // Get registration count
      const registrations = await storage.listEventRegistrations(event.id);
      const spotsLeft = event.capacity - event.attendeeCount;

      res.json({
        ...event,
        registrationCount: registrations.length,
        spotsLeft,
        organizationReligion: organization?.religion || null,
      });
    } catch (error) {
      console.error("Failed to fetch public event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  // QR Code Generator API - serves QR codes as PNG images for email embedding
  app.get("/api/qr/:eventId", async (req, res) => {
    try {
      const { eventId } = req.params;
      
      // Verify event exists
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Generate QR code URL pointing to the event page
      const baseUrl = process.env.BASE_URL || process.env.APP_URL || `https://devportal.plegit.ai`;
      const eventUrl = `${baseUrl.replace(/\/+$/, '')}/events/${eventId}`;
      
      // Generate QR code as PNG buffer
      const qrBuffer = await QRCode.toBuffer(eventUrl, {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Set proper headers for image response
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.send(qrBuffer);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });

  // QR Code Generator for Check-in - encodes the registration QR code string for staff to scan
  app.get("/api/qr/checkin/:qrCode", async (req, res) => {
    try {
      const { qrCode } = req.params;
      
      if (!qrCode) {
        return res.status(400).json({ error: "QR code is required" });
      }

      // Generate QR code that contains the registration's unique code (e.g., EVT-D4DF4963-MK2XW8IQ)
      // When staff scan this, they'll see the code and can enter it in the check-in form
      const qrBuffer = await QRCode.toBuffer(qrCode, {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Set proper headers for image response
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.send(qrBuffer);
    } catch (error) {
      console.error("Failed to generate check-in QR code:", error);
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });

  // Event Registrations
  app.get("/api/event-registrations", async (req, res) => {
    try {
      const eventId = req.query.eventId as string;
      if (!eventId) {
        return res.status(400).json({ error: "eventId is required" });
      }
      const registrations = await storage.listEventRegistrations(eventId);
      console.log(`[API] Fetched ${registrations.length} registrations for event ${eventId}`);
      res.json(registrations);
    } catch (error) {
      console.error("[API] Error fetching event registrations:", error);
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  // Event registration payment intent
  app.post("/api/events/:eventId/register", async (req, res) => {
    try {
      const { eventId } = req.params;
      const { firstName, lastName, email, phone, ticketTypeId, ticketCount = 1, donationAmount = 0, donationCategory = "general", promoCode } = req.body;

      if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check if event has ticket types - if so, ticketTypeId is required
      const eventTicketTypes = await storage.listEventTicketTypes(eventId);
      if (eventTicketTypes.length > 0 && !ticketTypeId) {
        return res.status(400).json({ error: "Please select a ticket type" });
      }

      // Get ticket type pricing and validate availability
      let ticketPrice = parseFloat(event.price);
      let ticketType;
      if (ticketTypeId) {
        ticketType = await storage.getEventTicketType(ticketTypeId);
        if (!ticketType || ticketType.eventId !== eventId) {
          return res.status(400).json({ error: "Invalid ticket type" });
        }
        if (!ticketType.isActive) {
          return res.status(400).json({ error: "Ticket type is not available" });
        }
        // Check ticket type availability (atomic check will happen in webhook)
        if (ticketType.sold + ticketCount > ticketType.quantity) {
          return res.status(400).json({ error: "Not enough tickets of this type available" });
        }
        if (ticketCount < ticketType.minPerOrder || ticketCount > ticketType.maxPerOrder) {
          return res.status(400).json({ error: `Please select between ${ticketType.minPerOrder} and ${ticketType.maxPerOrder} tickets` });
        }
        ticketPrice = parseFloat(ticketType.price);
      }

      // Check overall event capacity (atomic check will happen in webhook, but we check here for early feedback)
      // Refresh event to get latest count
      const currentEvent = await storage.getEvent(eventId);
      if (!currentEvent) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (currentEvent.attendeeCount + ticketCount > currentEvent.capacity) {
        return res.status(400).json({ error: "Not enough spots available" });
      }

      let ticketTotal = ticketPrice * ticketCount;
      const donation = parseFloat(donationAmount.toString()) || 0;
      const totalAmount = ticketTotal + donation;

      // Generate unique QR code string for this registration (stored in DB for check-in)
      const qrCode = `EVT-${eventId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

      // For free events, create registration directly
      if (totalAmount === 0) {
        console.log('[Register] Processing free event registration:', { eventId, ticketCount });
        // Atomically increment attendee count with capacity check
        const attendeeIncremented = await storage.incrementEventAttendeeCount(eventId, ticketCount);
        if (!attendeeIncremented) {
          console.error('[Register] Event capacity exceeded for free event:', { eventId, ticketCount });
          return res.status(400).json({ error: "Event capacity exceeded" });
        }
        console.log('[Register] Attendee count incremented for free event:', { eventId, ticketCount });

        // Atomically increment ticket type sold count if applicable
        if (ticketTypeId) {
          console.log('[Register] Incrementing ticket type sold for free event:', { ticketTypeId, ticketCount });
          const soldIncremented = await storage.incrementTicketTypeSold(ticketTypeId, ticketCount);
          if (!soldIncremented) {
            // Roll back attendee count
            await storage.incrementEventAttendeeCount(eventId, -ticketCount);
            console.error('[Register] Ticket type sold out for free event:', { ticketTypeId, ticketCount });
            return res.status(400).json({ error: "Ticket type sold out" });
          }
          console.log('[Register] Ticket type sold incremented for free event:', { ticketTypeId, ticketCount });
        }

        // Create registration after atomic increments succeed
        const registration = await storage.createEventRegistration({
          eventId,
          ticketTypeId: ticketTypeId || null,
          firstName,
          lastName,
          email,
          phone: phone || "",
          ticketCount,
          totalPaid: "0",
          donationAmount: "0",
          promoCode: promoCode || null,
          qrCode,
          status: "confirmed",
        });
        
        // Verify the attendee count was updated
        const updatedEvent = await storage.getEvent(eventId);
        console.log('[Register] Free event registration created, attendee count:', { eventId, attendeeCount: updatedEvent?.attendeeCount, capacity: updatedEvent?.capacity });

        // Send ticket confirmation email for free events (don't fail registration if email fails)
        try {
          const emailContext = await buildTicketEmailContext({
            eventId,
            ticketTypeId: ticketTypeId || null,
            firstName,
            lastName,
            email,
            ticketCount,
            totalPaid: "Free",
            qrCode,
          });

          if (emailContext) {
            await sendTicketConfirmationEmail(emailContext);
            console.log('Sent free ticket confirmation email to:', email);
          }
        } catch (emailError) {
          console.error('Failed to send free ticket confirmation email:', emailError);
          // Don't fail the registration - it's already created
        }

        return res.json({ registration, requiresPayment: false });
      }

      // For paid events, create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: (event.currency || "USD").toLowerCase(),
        receipt_email: email,
        metadata: {
          eventId,
          ticketTypeId: ticketTypeId || "",
          promoCode: promoCode || "",
          firstName,
          lastName,
          email,
          phone: phone || "",
          ticketCount: ticketCount.toString(),
          ticketPrice: ticketPrice.toString(),
          donationAmount: donation.toString(),
          donationCategory: donationCategory || "general",
          totalPaid: totalAmount.toString(),
          qrCode,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        requiresPayment: true,
        qrCode,
      });
    } catch (error: any) {
      console.error("Event registration error:", error);
      res.status(500).json({ error: "Failed to process registration", details: error.message });
    }
  });

  app.post("/api/event-registrations", async (req, res) => {
    try {
      const data = insertEventRegistrationSchema.parse(req.body);
      const registration = await storage.createEventRegistration(data);
      
      // Update event attendee count
      const event = await storage.getEvent(data.eventId);
      if (event) {
        const ticketCount = data.ticketCount ?? 1;
        await storage.updateEvent(data.eventId, {
          attendeeCount: event.attendeeCount + ticketCount,
        } as any);
      }
      
      res.status(201).json(registration);
    } catch (error) {
      res.status(400).json({ error: "Invalid registration data" });
    }
  });

  // Check-in by QR code - lookup registration and optionally check them in
  app.post("/api/events/:eventId/checkin", requireAuth, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      const { qrCode } = req.body;
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      if (!qrCode) {
        return res.status(400).json({ error: "QR code is required" });
      }
      
      // Get the event
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Get user's organization to verify access
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Verify user's organization owns this event (or user is eco_admin)
      if (user.role !== "eco_admin" && event.orgId !== user.orgId) {
        return res.status(403).json({ error: "You don't have permission to check in attendees for this event" });
      }
      
      // Find registration by QR code
      const registration = await storage.getEventRegistrationByQrCode(qrCode);
      
      if (!registration) {
        return res.status(404).json({ error: "Invalid QR code - registration not found" });
      }
      
      // Verify registration belongs to this event
      if (registration.eventId !== eventId) {
        return res.status(400).json({ error: "This QR code is for a different event" });
      }
      
      // Check if already checked in
      if (registration.checkedIn) {
        return res.status(400).json({ 
          error: "Already checked in",
          registration,
          checkedInAt: registration.checkedInAt 
        });
      }
      
      // Perform check-in
      const updatedRegistration = await storage.updateEventRegistration(registration.id, {
        checkedIn: true,
        checkedInAt: new Date(),
      });
      
      res.json({
        success: true,
        message: `${registration.firstName} ${registration.lastName} checked in successfully!`,
        registration: updatedRegistration,
      });
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ error: "Failed to process check-in" });
    }
  });

  app.patch("/api/event-registrations/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get the registration to find the event
      const registration = await storage.getEventRegistration(id);
      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }
      
      // Get the event to verify organization ownership
      const event = await storage.getEvent(registration.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Get user's organization
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Verify user's organization owns this event (or user is eco_admin)
      if (user.role !== "eco_admin" && event.orgId !== user.orgId) {
        return res.status(403).json({ error: "Forbidden: You don't have permission to modify this registration" });
      }
      
      // Only allow updating check-in status
      const updates: any = {};
      
      if (req.body.checkedIn !== undefined) {
        updates.checkedIn = req.body.checkedIn;
      }
      
      // Convert checkedInAt string to Date object for Drizzle
      if (req.body.checkedInAt !== undefined) {
        updates.checkedInAt = req.body.checkedInAt ? new Date(req.body.checkedInAt) : null;
      }
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      const updatedRegistration = await storage.updateEventRegistration(id, updates);
      res.json(updatedRegistration);
    } catch (error) {
      console.error("Failed to update registration:", error);
      res.status(400).json({ error: "Failed to update registration" });
    }
  });

  // Livestreams
  app.get("/api/livestreams", requireAuth, async (req: any, res) => {
    try {
      let orgId = req.query.orgId as string;
      const orgSlug = req.query.orgSlug as string;
      
      // If no orgId or slug provided, use the user's org (for convenience)
      if (!orgId && !orgSlug) {
        orgId = req.user.orgId;
      }
      
      // If slug provided, resolve to ID
      if (orgSlug && !orgId) {
        const org = await storage.getOrganizationBySlug(orgSlug);
        if (!org) {
          return res.status(404).json({ error: "Organization not found" });
        }
        orgId = org.id;
      }
      
      // Verify user's organization matches requested organization
      if (req.user.role !== "eco_admin" && orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Forbidden: You can only view livestreams from your own organization" });
      }
      
      const livestreams = await storage.listLivestreams(orgId);
      res.json(livestreams);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch livestreams" });
    }
  });

  app.get("/api/livestreams/:id", requireAuth, async (req: any, res) => {
    try {
      const livestream = await storage.getLivestream(req.params.id);
      console.log("GET /api/livestreams/:id - Raw livestream from storage:", livestream);
      
      if (!livestream) {
        return res.status(404).json({ error: "Livestream not found" });
      }
      
      // Verify user's organization owns this livestream
      if (req.user.role !== "eco_admin" && livestream.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Forbidden: You can only view livestreams from your own organization" });
      }
      
      console.log("GET /api/livestreams/:id - Sending livestream:", JSON.stringify(livestream, null, 2));
      res.json(livestream);
    } catch (error) {
      console.error("GET /api/livestreams/:id - Error:", error);
      res.status(500).json({ error: "Failed to fetch livestream" });
    }
  });

  // Public livestream view (no auth required) - returns minimal public data only
  app.get("/api/livestreams/public/:id", async (req, res) => {
    try {
      const livestream = await storage.getLivestream(req.params.id);
      if (!livestream) {
        return res.status(404).json({ error: "Livestream not found" });
      }

      // Only show livestreams that are live or replay-available
      if (livestream.status !== "live" && livestream.status !== "ended" && !livestream.replayAvailable) {
        return res.status(404).json({ error: "Livestream not found" });
      }

      // Increment view count
      await storage.incrementLivestreamViews(req.params.id);

      // Refetch livestream to get updated view count
      const updatedLivestream = await storage.getLivestream(req.params.id);
      if (!updatedLivestream) {
        return res.status(404).json({ error: "Livestream not found" });
      }

      // Get organization for religion-based donation categories
      const organization = await storage.getOrganization(updatedLivestream.orgId);

      // Get donation stats (only for donors who opted to show)
      const donations = await storage.listLivestreamDonations(updatedLivestream.id);
      const publicDonations = donations
        .filter(d => d.showName || d.showAmount)
        .map(d => ({
          donorName: d.showName ? d.donorName : "Anonymous",
          amount: d.showAmount ? d.amount : "0",
          message: d.message,
          createdAt: d.createdAt,
        }))
        .slice(-10);
      
      // Return only public fields
      res.json({
        id: updatedLivestream.id,
        title: updatedLivestream.title,
        organizationCountry: organization?.country || null,
        organizationSettings: organization?.settings || null,
        description: updatedLivestream.description,
        thumbnailUrl: updatedLivestream.thumbnailUrl,
        platform: updatedLivestream.platform,
        videoId: updatedLivestream.videoId,
        embedUrl: updatedLivestream.embedUrl,
        scheduledStart: updatedLivestream.scheduledStart,
        scheduledEnd: updatedLivestream.scheduledEnd,
        status: updatedLivestream.status,
        totalRaised: updatedLivestream.totalRaised,
        donorCount: updatedLivestream.donorCount,
        viewCount: updatedLivestream.viewCount,
        isPaid: updatedLivestream.isPaid,
        ticketPrice: updatedLivestream.isPaid ? updatedLivestream.ticketPrice : null,
        currency: updatedLivestream.currency,
        organizationReligion: organization?.religion || null,
        recentDonations: publicDonations,
      });
    } catch (error) {
      console.error("GET /api/livestreams/public/:id - Error:", error);
      res.status(500).json({ error: "Failed to fetch livestream" });
    }
  });

  app.post("/api/livestreams", requireAuth, async (req: any, res) => {
    try {
      console.log("Creating livestream with data:", JSON.stringify(req.body, null, 2));
      const data = insertLivestreamSchema.parse(req.body);
      
      // Verify user's organization matches the livestream's organization
      if (req.user.role !== "eco_admin" && data.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Forbidden: You can only create livestreams for your own organization" });
      }
      
      const livestream = await storage.createLivestream(data);
      res.status(201).json(livestream);
    } catch (error) {
      console.error("Livestream creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid livestream data", 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(400).json({ error: "Invalid livestream data", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch("/api/livestreams/:id", requireAuth, async (req: any, res) => {
    try {
      // Get livestream to verify ownership
      const existing = await storage.getLivestream(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Livestream not found" });
      }
      
      // Verify user's organization owns this livestream
      if (req.user.role !== "eco_admin" && existing.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Forbidden: You can only update livestreams from your own organization" });
      }
      
      // Parse and validate update data (partial schema for updates)
      const updateSchema = insertLivestreamSchema.partial();
      const data = updateSchema.parse(req.body);
      
      const livestream = await storage.updateLivestream(req.params.id, data);
      res.json(livestream);
    } catch (error) {
      console.error("Livestream update error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid update data", 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(400).json({ error: "Failed to update livestream", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Livestream Donations
  app.get("/api/livestreams/:id/donations", async (req, res) => {
    try {
      const donations = await storage.listLivestreamDonations(req.params.id);
      res.json(donations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donations" });
    }
  });

  app.post("/api/livestreams/:id/donate", async (req, res) => {
    try {
      const livestreamId = req.params.id;
      
      // Get livestream to extract orgId
      const livestream = await storage.getLivestream(livestreamId);
      if (!livestream) {
        return res.status(404).json({ error: "Livestream not found" });
      }
      
      const data = insertLivestreamDonationSchema.parse({
        ...req.body,
        livestreamId,
        orgId: livestream.orgId,
      });
      
      const donation = await storage.createLivestreamDonation(data);
      
      // Update livestream totals (reuse livestream from above)
      const currentTotal = parseFloat(livestream.totalRaised.toString());
      const donationAmount = parseFloat(donation.amount.toString());
      
      await storage.updateLivestream(livestreamId, {
        totalRaised: (currentTotal + donationAmount).toString() as any,
        donorCount: livestream.donorCount + 1,
      });

      // Create donation record in main donations table and send thank-you email
      await processDonationWithEmail({
        orgId: livestream.orgId,
        livestreamId,
        campaignId: livestream.campaignId || undefined,
        eventId: undefined,
        stripePaymentId: donation.id, // Use livestream donation ID as unique identifier
        donorEmail: donation.donorEmail,
        donorName: donation.donorName,
        donorPhone: undefined,
        amount: donationAmount,
        currency: donation.currency || 'USD',
        category: req.body.category || "general",
        message: donation.message || undefined,
        donationType: "livestream",
        giftAidOptIn: req.body.giftAidOptIn || false,
        donorAddress: req.body.donorAddress,
        donorTown: req.body.donorTown,
        donorState: req.body.donorState,
        donorPostcode: req.body.donorPostcode,
      });
      
      res.status(201).json(donation);
    } catch (error) {
      res.status(400).json({ error: "Invalid donation data" });
    }
  });

  // Livestream Chat
  app.get("/api/livestreams/:id/chat", async (req, res) => {
    try {
      const livestreamId = req.params.id;
      console.log('[GET /api/livestreams/:id/chat] Fetching messages for livestream:', livestreamId);
      const messages = await storage.listLivestreamChatMessages(livestreamId);
      console.log('[GET /api/livestreams/:id/chat] Found messages:', messages.length, 'messages');
      if (messages.length > 0) {
        console.log('[GET /api/livestreams/:id/chat] Sample message:', messages[0]);
      }
      res.json(messages);
    } catch (error) {
      console.error('[GET /api/livestreams/:id/chat] Error:', error);
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/livestreams/:id/chat", async (req, res) => {
    try {
      const livestreamId = req.params.id;
      console.log('[POST /api/livestreams/:id/chat] Request:', { livestreamId, body: req.body });
      
      // Verify livestream exists
      const livestream = await storage.getLivestream(livestreamId);
      if (!livestream) {
        console.log('[POST /api/livestreams/:id/chat] Livestream not found:', livestreamId);
        return res.status(404).json({ error: "Livestream not found" });
      }
      
      const data = insertLivestreamChatMessageSchema.parse({
        ...req.body,
        livestreamId,
      });
      console.log('[POST /api/livestreams/:id/chat] Parsed data:', data);
      
      const message = await storage.createLivestreamChatMessage(data);
      console.log('[POST /api/livestreams/:id/chat] Created message:', message);
      res.status(201).json(message);
    } catch (error) {
      console.error('[POST /api/livestreams/:id/chat] Error:', error);
      res.status(400).json({ error: "Invalid chat message" });
    }
  });

  // Livestream Access (for ticketed events)
  app.post("/api/livestreams/:id/purchase-access", async (req, res) => {
    try {
      const livestreamId = req.params.id;
      const { email, firstName, lastName } = req.body;
      
      if (!email || !firstName || !lastName) {
        return res.status(400).json({ error: "Email, first name, and last name are required" });
      }
      
      const livestream = await storage.getLivestream(livestreamId);
      if (!livestream) {
        return res.status(404).json({ error: "Livestream not found" });
      }
      
      if (!livestream.isPaid) {
        // Free livestream, create access immediately
        const accessToken = randomBytes(32).toString('hex');
        const access = await storage.createLivestreamAccess({
          livestreamId,
          email,
          firstName,
          lastName,
          accessToken,
          stripePaymentId: null,
        });
        
        return res.json({ accessToken: access.accessToken });
      }
      
      // Paid livestream - create Stripe payment intent
      const amount = parseFloat(livestream.ticketPrice.toString());
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: livestream.currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        receipt_email: email,
        metadata: {
          livestreamId,
          email,
          firstName,
          lastName,
          type: 'livestream_access',
        },
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Error purchasing livestream access:", error);
      res.status(500).json({ error: "Failed to purchase access" });
    }
  });

  app.get("/api/livestreams/:id/verify-access/:token", async (req, res) => {
    try {
      const access = await storage.getLivestreamAccess(req.params.token);
      if (!access || access.livestreamId !== req.params.id) {
        return res.status(403).json({ error: "Invalid access token" });
      }
      
      res.json({ valid: true, access });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify access" });
    }
  });

  // Stripe Payment Intent
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, campaignId, livestreamId, donorName, donorEmail, giftAidOptIn, donorAddress, donorTown, donorState, donorPostcode, category, message, coverFees } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      if (!campaignId && !livestreamId) {
        return res.status(400).json({ error: "Campaign ID or Livestream ID is required" });
      }

      if (!donorName || !donorEmail) {
        return res.status(400).json({ error: "Donor name and email are required" });
      }

      let orgId: string;
      let currency: string;
      let org: any;

      // Get organization from either campaign or livestream
      if (campaignId) {
        const campaign = await storage.getCampaign(campaignId);
        if (!campaign) {
          return res.status(404).json({ error: "Campaign not found" });
        }
        orgId = campaign.orgId;
        currency = campaign.currency || "USD";
      } else if (livestreamId) {
        const livestream = await storage.getLivestream(livestreamId);
        if (!livestream) {
          return res.status(404).json({ error: "Livestream not found" });
        }
        orgId = livestream.orgId;
        currency = livestream.currency || "USD";
      } else {
        return res.status(400).json({ error: "Campaign ID or Livestream ID is required" });
      }

      // Get organization to check for connected Stripe account
      org = await storage.getOrganization(orgId);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Calculate total amount if covering fees
      let totalAmount = amount;
      let feeAmount = 0;
      if (coverFees) {
        // Stripe fee: 2.9% + $0.30 (or equivalent in other currencies)
        const fixedFee = currency.toLowerCase() === 'usd' ? 0.30 : 0.30; // Adjust for other currencies if needed
        totalAmount = (amount + fixedFee) / (1 - 0.029);
        feeAmount = totalAmount - amount;
      }

      // Payment intent configuration
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: org.currency?.toLowerCase() || currency.toLowerCase() || "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        receipt_email: donorEmail,
        metadata: {
          ...(campaignId && { campaignId }),
          ...(livestreamId && { livestreamId }),
          donorName,
          donorEmail,
          orgId,
          ...(category && { category }),
          ...(message && { message }),
          ...(coverFees && { coverFees: "true", feeAmount: feeAmount.toString() }),
          ...(giftAidOptIn && { giftAidOptIn: "true" }),
          ...(donorAddress && { donorAddress }),
          ...(donorTown && { donorTown }),
          ...(donorState && { donorState }),
          ...(donorPostcode && { donorPostcode }),
        },
      };

      // DIRECT FUND TRANSFER TO CONNECTED ACCOUNT
      // If organization has a connected Stripe account, funds go directly to them
      // Using on_behalf_of makes the payment directly on the connected account
      // This means:
      // 1. Payment is processed on behalf of the connected account
      // 2. Funds go DIRECTLY to their Stripe account (never touch platform account)
      // 3. They receive the funds immediately after payment succeeds
      // 4. They can withdraw funds to their bank account from their Stripe dashboard
      if (org.stripeAccountId && org.stripeAccountStatus === 'active') {
        paymentIntentParams.on_behalf_of = org.stripeAccountId;
        console.log(`[Payment Intent] Creating payment on behalf of connected account: ${org.stripeAccountId}`);
        console.log(`[Payment Intent] Funds will go DIRECTLY to organization's Stripe account (no platform intermediary)`);
      } else {
        console.warn(`[Payment Intent] Organization ${campaign.orgId} does not have a connected Stripe account. Payment will go to platform account.`);
      }

      // Create a PaymentIntent with Stripe
      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });


  // Stripe Webhook for payment confirmation
  app.post("/api/stripe-webhook", async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!sig) {
        return res.status(400).json({ error: "No signature" });
      }

      if (!webhookSecret) {
        console.error("STRIPE_WEBHOOK_SECRET not configured");
        return res.status(500).json({ error: "Webhook not configured" });
      }

      // Verify webhook signature using raw body captured in middleware
      // The raw body must be the exact Buffer as received from Stripe (unmodified)
      let event;
      try {
        const rawBody = (req as any).rawBody;
        if (!rawBody) {
          console.error('[Webhook] Raw body not available for webhook verification');
          return res.status(400).json({ error: "Raw body required for verification" });
        }
        
        // Ensure rawBody is a Buffer (Stripe expects Buffer or string)
        // The Buffer must be exactly as received - no modifications
        const bodyForVerification = Buffer.isBuffer(rawBody) 
          ? rawBody 
          : (typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : Buffer.from(rawBody));
        
        if (!Buffer.isBuffer(bodyForVerification)) {
          console.error('[Webhook] Raw body is not a valid Buffer');
          return res.status(400).json({ error: "Invalid raw body format" });
        }
        
        console.log('[Webhook] Verifying signature with body length:', bodyForVerification.length);
        
        event = stripe.webhooks.constructEvent(
          bodyForVerification,
          sig,
          webhookSecret
        );
        
        console.log('[Webhook] Signature verified successfully, event type:', event.type);
      } catch (err: any) {
        console.error('[Webhook] Signature verification failed:', err.message);
        console.error('[Webhook] Error details:', {
          hasRawBody: !!(req as any).rawBody,
          rawBodyType: typeof (req as any).rawBody,
          isBuffer: Buffer.isBuffer((req as any).rawBody),
          hasSignature: !!sig,
          hasSecret: !!webhookSecret
        });
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as any;
        const metadata = paymentIntent.metadata;
        const stripePaymentId = paymentIntent.id;

        console.log('[Webhook] Payment intent succeeded:', {
          paymentIntentId: stripePaymentId,
          metadata: JSON.stringify(metadata, null, 2),
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        });

        // Handle event registration payment
        if (metadata.eventId) {
          console.log('[Webhook] Processing event registration payment');
          const { eventId, ticketTypeId, promoCode, firstName, lastName, email, phone, ticketCount, totalPaid, donationAmount, donationCategory, qrCode } = metadata;
          
          // Validate required fields
          if (!eventId || !firstName || !lastName || !email || !ticketCount || !totalPaid) {
            console.error('[Webhook] Missing required metadata for event registration:', {
              eventId, firstName, lastName, email, ticketCount, totalPaid
            });
            return res.status(400).json({ error: "Missing required metadata" });
          }
          
          // Check for duplicate registration
          const registrations = await storage.listEventRegistrations(eventId);
          const duplicate = registrations.find(r => r.stripePaymentId === stripePaymentId);
          
          if (duplicate) {
            console.log('[Webhook] Duplicate event registration payment, skipping:', stripePaymentId);
            return res.json({ received: true, duplicate: true });
          }
          
          console.log('[Webhook] Creating event registration:', {
            eventId, ticketTypeId, firstName, lastName, email, ticketCount, totalPaid, donationAmount
          });

          // Atomically increment attendee count with capacity check
          const count = parseInt(ticketCount);
          console.log('[Webhook] Attempting to increment attendee count:', { eventId, count, stripePaymentId });
          const attendeeIncremented = await storage.incrementEventAttendeeCount(eventId, count);
          if (!attendeeIncremented) {
            console.error('[Webhook] Event capacity exceeded for payment:', { stripePaymentId, eventId, count });
            return res.status(400).json({ error: "Event capacity exceeded" });
          }
          console.log('[Webhook] Attendee count incremented successfully:', { eventId, count });

          // Atomically increment ticket type sold count if applicable
          if (ticketTypeId) {
            console.log('[Webhook] Attempting to increment ticket type sold:', { ticketTypeId, count });
            const soldIncremented = await storage.incrementTicketTypeSold(ticketTypeId, count);
            if (!soldIncremented) {
              // Roll back attendee count
              await storage.incrementEventAttendeeCount(eventId, -count);
              console.error('[Webhook] Ticket type sold out for payment:', { stripePaymentId, ticketTypeId, count });
              return res.status(400).json({ error: "Ticket type sold out" });
            }
            console.log('[Webhook] Ticket type sold count incremented successfully:', { ticketTypeId, count });
          }

          // Create registration after atomic increments succeed
          try {
            const registration = await storage.createEventRegistration({
              eventId,
              ticketTypeId: ticketTypeId || null,
              firstName,
              lastName,
              email,
              phone: phone || "",
              ticketCount: count,
              totalPaid,
              donationAmount: donationAmount || "0",
              promoCode: promoCode || null,
              qrCode,
              stripePaymentId,
              status: "confirmed",
            });
            console.log('[Webhook] Event registration created successfully:', { registrationId: registration.id, eventId, attendeeCount: count });
            
            // Verify the attendee count was updated by fetching the event
            const updatedEvent = await storage.getEvent(eventId);
            console.log('[Webhook] Event attendee count after registration:', { eventId, attendeeCount: updatedEvent?.attendeeCount, capacity: updatedEvent?.capacity });
          } catch (registrationError: any) {
            console.error('[Webhook] Failed to create event registration:', registrationError);
            // Roll back attendee count
            await storage.incrementEventAttendeeCount(eventId, -count);
            if (ticketTypeId) {
              await storage.incrementTicketTypeSold(ticketTypeId, -count);
            }
            throw registrationError;
          }

          // Send ticket confirmation email (don't fail webhook if email fails)
          try {
            console.log('[Webhook] Building email context for:', { eventId, email, firstName, lastName, ticketCount: count });
            const emailContext = await buildTicketEmailContext({
              eventId,
              ticketTypeId: ticketTypeId || null,
              firstName,
              lastName,
              email,
              ticketCount: count,
              totalPaid,
              qrCode,
            });

            if (emailContext) {
              console.log('[Webhook] Email context built successfully, sending email to:', email);
              await sendTicketConfirmationEmail(emailContext);
              console.log('[Webhook] Successfully sent ticket confirmation email to:', email);
            } else {
              console.error('[Webhook] Failed to build email context - buildTicketEmailContext returned null');
            }
          } catch (emailError: any) {
            console.error('[Webhook] Failed to send ticket confirmation email:', {
              error: emailError.message,
              stack: emailError.stack,
              email,
              eventId,
            });
            // Don't fail the webhook - registration is already created
          }

          // Process donation if donationAmount > 0
          const donationAmountValue = parseFloat(donationAmount || "0");
          console.log('[Webhook] Donation amount check:', { donationAmount, donationAmountValue, donationCategory });
          if (donationAmountValue > 0) {
            console.log('[Webhook] Processing event donation:', {
              donationAmountValue,
              currency: paymentIntent.currency,
              category: donationCategory || "general",
              eventId,
              email,
              donorName: `${firstName} ${lastName}`,
            });
            try {
              const event = await storage.getEvent(eventId);
              if (event) {
                console.log('[Webhook] Event found, processing donation for orgId:', event.orgId);
                const donationResult = await processDonationWithEmail({
                  orgId: event.orgId,
                  eventId,
                  campaignId: undefined,
                  livestreamId: undefined,
                  stripePaymentId: `${stripePaymentId}-event-donation`,
                  donorEmail: email,
                  donorName: `${firstName} ${lastName}`,
                  donorPhone: phone || undefined,
                  amount: donationAmountValue,
                  currency: paymentIntent.currency,
                  category: donationCategory || "general",
                  donationType: "event",
                });
                console.log('[Webhook] Event donation processed successfully:', {
                  donationId: donationResult?.donation?.id,
                  duplicate: donationResult?.duplicate,
                });
              } else {
                console.error('[Webhook] Event not found for donation processing:', eventId);
              }
            } catch (donationError: any) {
              console.error('[Webhook] Failed to process event donation:', {
                error: donationError.message,
                stack: donationError.stack,
                donationAmountValue,
                eventId,
                email,
              });
              // Don't fail the webhook - registration is already created
            }
          } else {
            console.log('[Webhook] No donation amount, skipping donation processing');
          }

          console.log('[Webhook] Event registration processed successfully:', stripePaymentId);
          return res.json({ received: true });
        }

        // Handle livestream access payment
        if (metadata.type === 'livestream_access') {
          const { livestreamId, email, firstName, lastName } = metadata;
          
          // Validate required metadata
          if (!livestreamId || !email || !firstName || !lastName) {
            console.error('Missing required livestream access metadata:', metadata);
            return res.status(400).json({ error: "Invalid payment metadata" });
          }
          
          // Verify livestream exists and is paid
          const livestream = await storage.getLivestream(livestreamId);
          if (!livestream) {
            console.error('Livestream not found for payment:', livestreamId);
            return res.status(400).json({ error: "Invalid livestream" });
          }
          
          if (!livestream.isPaid) {
            console.error('Livestream is not paid, should not have payment:', livestreamId);
            return res.status(400).json({ error: "Invalid payment for free livestream" });
          }
          
          // Validate payment amount matches ticket price
          const expectedAmount = Math.round(parseFloat(livestream.ticketPrice.toString()) * 100);
          if (paymentIntent.amount !== expectedAmount) {
            console.error('Payment amount mismatch. Expected:', expectedAmount, 'Got:', paymentIntent.amount);
            return res.status(400).json({ error: "Invalid payment amount" });
          }
          
          // Check for duplicate access
          const existingAccess = await storage.getLivestreamAccess(stripePaymentId);
          if (existingAccess) {
            console.log('Duplicate livestream access payment, skipping:', stripePaymentId);
            return res.json({ received: true, duplicate: true });
          }
          
          // Create livestream access
          const accessToken = randomBytes(32).toString('hex');
          await storage.createLivestreamAccess({
            livestreamId,
            email,
            firstName,
            lastName,
            accessToken,
            stripePaymentId,
          });
          
          console.log('Livestream access granted successfully:', stripePaymentId);
          return res.json({ received: true, accessToken });
        }

        // Handle livestream donation payment
        if (metadata.livestreamId) {
          const { livestreamId, donorName, donorEmail, message, category, coverFees, feeAmount, giftAidOptIn, donorAddress, donorTown, donorState, donorPostcode } = metadata;
          const totalAmount = paymentIntent.amount / 100;
          const fee = feeAmount ? parseFloat(feeAmount) : 0;
          const donationAmount = totalAmount - fee;

          // Get livestream
          const livestream = await storage.getLivestream(livestreamId);
          if (!livestream) {
            console.error('Livestream not found for donation:', livestreamId);
            return res.status(400).json({ error: "Livestream not found" });
          }

          // Check for duplicate donation
          const duplicate = await storage.getDonationByStripePaymentId(livestream.orgId, stripePaymentId);
          if (duplicate) {
            console.log('Duplicate livestream donation payment, skipping:', stripePaymentId);
            return res.json({ received: true, duplicate: true });
          }

          // Process donation using the same function as campaigns
          await processDonationWithEmail({
            orgId: livestream.orgId,
            livestreamId,
            campaignId: livestream.campaignId || undefined,
            stripePaymentId,
            donorEmail,
            donorName,
            amount: donationAmount,
            currency: paymentIntent.currency.toUpperCase(),
            category: category || "general",
            message: message || undefined,
            coverFees: coverFees === "true",
            feeAmount: fee,
            giftAidOptIn: giftAidOptIn === "true",
            donorAddress: donorAddress || undefined,
            donorCity: donorTown || undefined,
            donorPostcode: donorPostcode || undefined,
            donorCountry: donorState || undefined,
          });

          // Update livestream totals
          const currentTotal = parseFloat(livestream.totalRaised.toString());
          await storage.updateLivestream(livestreamId, {
            totalRaised: (currentTotal + donationAmount).toString() as any,
            donorCount: livestream.donorCount + 1,
          });

          console.log('Livestream donation processed successfully:', stripePaymentId);
          return res.json({ received: true });
        }

        // Handle campaign donation payment (including P2P participant donations)
        const { campaignId, participantId, donorName, donorEmail, message, category, coverFees, feeAmount, donationType, giftAidOptIn, donorAddress, donorTown, donorState, donorPostcode } = metadata;
        const totalAmount = paymentIntent.amount / 100; // Total charged amount in dollars
        const fee = feeAmount ? parseFloat(feeAmount) : 0;
        const donationAmount = totalAmount - fee; // Actual donation amount

        // Check for duplicate payment (idempotency)
        const existingDonations = await storage.listDonations("");
        const duplicate = existingDonations.find(
          d => d.stripePaymentId === stripePaymentId
        );

        if (duplicate) {
          console.log('Duplicate payment intent, skipping:', stripePaymentId);
          return res.json({ received: true, duplicate: true });
        }

        // Create or find donor
        const campaign = await storage.getCampaign(campaignId);
        if (campaign) {
          let donor = null;
          
          // Try to find existing donor by email
          const donors = await storage.listDonors(campaign.orgId);
          const existingDonor = donors.find(d => d.email === donorEmail);
          
          if (existingDonor) {
            donor = existingDonor;
            // Update donor stats with actual donation amount (excluding fees)
            const newTotal = (parseFloat(donor.totalDonated) + donationAmount).toString();
            await storage.updateDonor(donor.id, {
              totalDonated: newTotal,
              donationCount: donor.donationCount + 1,
            } as any);
          } else {
            // Create new donor
            const [firstName, ...lastNameParts] = donorName.split(' ');
            const lastName = lastNameParts.join(' ') || '';
            
            donor = await storage.createDonor({
              orgId: campaign.orgId,
              firstName,
              lastName,
              email: donorEmail,
            });
            
            // Update the newly created donor's stats
            await storage.updateDonor(donor.id, {
              totalDonated: donationAmount.toString(),
              donationCount: 1,
            } as any);
          }
          
          // Note: Gift Aid address information is stored in the donation record
          // The donation record is the source of truth for Gift Aid details per donation

          // Prepare donation data with Gift Aid fields
          const giftAidOptedIn = giftAidOptIn === "true";
          let donationData: any = {
            orgId: campaign.orgId,
            campaignId,
            donorId: donor.id,
            amount: donationAmount.toString(),
            currency: paymentIntent.currency.toUpperCase(),
            category: category || "general",
            coverFees: coverFees === "true",
            feeAmount: fee.toString(),
            status: "completed",
            stripePaymentId,
            donorEmail,
            donorName,
            message: message || "",
            giftAidOptIn: giftAidOptedIn,
            donorAddress: donorAddress || null,
            donorCity: donorTown || null, // Map Town to donorCity in database
            donorPostcode: donorPostcode || null,
            donorCountry: donorState || null, // Map State/City to donorCountry in database
          };

          // Calculate tax relief amount if Gift Aid opted in
          if (giftAidOptedIn) {
            const org = await storage.getOrganization(campaign.orgId);
            if (org?.country === "GB") {
              // Get Gift Aid percentage from organization settings (default to 25%)
              const giftAidPercentage = (org.settings as any)?.giftAidPercentage || 25;
              
              if (giftAidPercentage > 0) {
                const taxReliefAmount = (donationAmount * (giftAidPercentage / 100)).toFixed(2);
                donationData.taxReliefAmount = taxReliefAmount;
                // Only mark as eligible if address fields are provided
                const hasAddress = donorAddress && donorTown && donorPostcode;
                donationData.giftAidEligible = hasAddress; // Only eligible if address is complete
              }
            }
          }
          
          // Update donor with Gift Aid address information if provided
          if (giftAidOptedIn && donorAddress && donorTown && donorState && donorPostcode) {
            await storage.updateDonor(donor.id, {
              // Note: Donor table doesn't have address fields, but we can store in a notes field or extend schema
              // For now, we'll just ensure the donation has the info
            } as any);
          }

          // Create donation record with all fields
          await storage.createDonation(donationData);

          // Update campaign total with actual donation amount (excluding fees)
          const newTotal = (parseFloat(campaign.currentAmount) + donationAmount).toString();
          await storage.updateCampaign(campaignId, {
            goalAmount: campaign.goalAmount,
            currentAmount: newTotal,
          } as any);

          // If this is a P2P participant donation, update participant stats
          if (donationType === "p2p" && participantId) {
            await storage.updateP2PParticipantRaised(participantId, donationAmount.toString(), 1);
            console.log('P2P participant donation processed:', {
              participantId,
              donationAmount,
              campaignId
            });
          }

          console.log('[Webhook] Campaign donation processed successfully:', stripePaymentId, {
            donationAmount,
            feeAmount: fee,
            totalCharged: totalAmount,
            category,
            coverFees: coverFees === "true",
            isP2P: donationType === "p2p",
            participantId: participantId || null,
            giftAidOptIn: giftAidOptedIn,
            giftAidEligible: donationData.giftAidEligible,
            taxReliefAmount: donationData.taxReliefAmount,
            hasAddress: !!(donorAddress && donorTown && donorPostcode)
          });
        }
      }

      // Handle charge.succeeded - when a charge succeeds (may fire before payment_intent.succeeded)
      // We need to retrieve the payment intent from the charge to get metadata
      if (event.type === 'charge.succeeded') {
        const charge = event.data.object as any;
        const paymentIntentId = charge.payment_intent;
        
        if (paymentIntentId && typeof paymentIntentId === 'string') {
          console.log('[Webhook] Charge succeeded, retrieving payment intent:', paymentIntentId);
          
          try {
            // Retrieve the payment intent to get metadata
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            const metadata = paymentIntent.metadata;
            
            // Only process if this is an event registration and hasn't been processed yet
            if (metadata.eventId) {
              console.log('[Webhook] Processing event registration from charge.succeeded:', {
                paymentIntentId,
                eventId: metadata.eventId,
                email: metadata.email
              });
              
              // Check if registration already exists (idempotency)
              const registrations = await storage.listEventRegistrations(metadata.eventId);
              const duplicate = registrations.find(r => r.stripePaymentId === paymentIntentId);
              
              if (duplicate) {
                console.log('[Webhook] Duplicate event registration from charge.succeeded, skipping:', paymentIntentId);
                return res.json({ received: true, duplicate: true });
              }
              
              // Process the same way as payment_intent.succeeded
              const { eventId, ticketTypeId, promoCode, firstName, lastName, email, phone, ticketCount, totalPaid, donationAmount, donationCategory, qrCode } = metadata;
              
              // Validate required fields
              if (!eventId || !firstName || !lastName || !email || !ticketCount || !totalPaid) {
                console.error('[Webhook] Missing required metadata for event registration from charge:', {
                  eventId, firstName, lastName, email, ticketCount, totalPaid
                });
                return res.json({ received: true, skipped: true, reason: 'Missing metadata' });
              }
              
              const count = parseInt(ticketCount);
              
              // Atomically increment attendee count with capacity check
              console.log('[Webhook] Attempting to increment attendee count from charge.succeeded:', { eventId, count, paymentIntentId });
              const attendeeIncremented = await storage.incrementEventAttendeeCount(eventId, count);
              if (!attendeeIncremented) {
                console.error('[Webhook] Event capacity exceeded from charge:', { paymentIntentId, eventId, count });
                return res.json({ received: true, skipped: true, reason: 'Capacity exceeded' });
              }
              console.log('[Webhook] Attendee count incremented successfully from charge.succeeded:', { eventId, count });
              
              // Atomically increment ticket type sold count if applicable
              if (ticketTypeId) {
                console.log('[Webhook] Attempting to increment ticket type sold from charge.succeeded:', { ticketTypeId, count });
                const soldIncremented = await storage.incrementTicketTypeSold(ticketTypeId, count);
                if (!soldIncremented) {
                  await storage.incrementEventAttendeeCount(eventId, -count);
                  console.error('[Webhook] Ticket type sold out from charge:', { paymentIntentId, ticketTypeId, count });
                  return res.json({ received: true, skipped: true, reason: 'Ticket sold out' });
                }
                console.log('[Webhook] Ticket type sold count incremented successfully from charge.succeeded:', { ticketTypeId, count });
              }
              
              // Create registration
              try {
                const registration = await storage.createEventRegistration({
                  eventId,
                  ticketTypeId: ticketTypeId || null,
                  firstName,
                  lastName,
                  email,
                  phone: phone || "",
                  ticketCount: count,
                  totalPaid,
                  donationAmount: donationAmount || "0",
                  promoCode: promoCode || null,
                  qrCode,
                  stripePaymentId: paymentIntentId,
                  status: "confirmed",
                });
                console.log('[Webhook] Event registration created from charge.succeeded:', { registrationId: registration.id, eventId, attendeeCount: count });
                
                // Verify the attendee count was updated by fetching the event
                const updatedEvent = await storage.getEvent(eventId);
                console.log('[Webhook] Event attendee count after registration from charge.succeeded:', { eventId, attendeeCount: updatedEvent?.attendeeCount, capacity: updatedEvent?.capacity });
              } catch (registrationError: any) {
                console.error('[Webhook] Failed to create event registration from charge:', registrationError);
                await storage.incrementEventAttendeeCount(eventId, -count);
                if (ticketTypeId) {
                  await storage.incrementTicketTypeSold(ticketTypeId, -count);
                }
                return res.json({ received: true, error: 'Registration creation failed' });
              }
              
              // Send ticket confirmation email
              try {
                console.log('[Webhook] Building email context from charge.succeeded for:', { eventId, email, firstName, lastName, ticketCount: count });
                const emailContext = await buildTicketEmailContext({
                  eventId,
                  ticketTypeId: ticketTypeId || null,
                  firstName,
                  lastName,
                  email,
                  ticketCount: count,
                  totalPaid,
                  qrCode,
                });
                
                if (emailContext) {
                  console.log('[Webhook] Email context built successfully from charge.succeeded, sending email to:', email);
                  await sendTicketConfirmationEmail(emailContext);
                  console.log('[Webhook] Successfully sent ticket confirmation email from charge.succeeded to:', email);
                } else {
                  console.error('[Webhook] Failed to build email context from charge.succeeded - buildTicketEmailContext returned null');
                }
              } catch (emailError: any) {
                console.error('[Webhook] Failed to send ticket confirmation email from charge.succeeded:', {
                  error: emailError.message,
                  stack: emailError.stack,
                  email,
                  eventId,
                });
              }
              
              // Process donation if donationAmount > 0
              const donationAmountValue = parseFloat(donationAmount || "0");
              if (donationAmountValue > 0) {
                try {
                  const event = await storage.getEvent(eventId);
                  if (event) {
                    await processDonationWithEmail({
                      orgId: event.orgId,
                      eventId,
                      campaignId: undefined,
                      livestreamId: undefined,
                      stripePaymentId: `${paymentIntentId}-event-donation`,
                      donorEmail: email,
                      donorName: `${firstName} ${lastName}`,
                      donorPhone: phone || undefined,
                      amount: donationAmountValue,
                      currency: paymentIntent.currency,
                      category: donationCategory || "general",
                      donationType: "event",
                    });
                    console.log('[Webhook] Event donation processed from charge.succeeded');
                  }
                } catch (donationError: any) {
                  console.error('[Webhook] Failed to process event donation from charge.succeeded:', donationError);
                }
              }
              
              console.log('[Webhook] Event registration processed successfully from charge.succeeded:', paymentIntentId);
              return res.json({ received: true });
            }
          } catch (error: any) {
            console.error('[Webhook] Error processing charge.succeeded:', {
              error: error.message,
              paymentIntentId,
              chargeId: charge.id
            });
            // Don't fail the webhook - return success to prevent retries
            return res.json({ received: true, error: 'Processing failed' });
          }
        }
      }

      // Handle checkout.session.completed - when subscription checkout completes
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        console.log('[Webhook] Checkout session completed:', session.id);
        
        // Only process subscription checkouts
        if (session.mode === 'subscription' && session.subscription) {
          const metadata = session.metadata || {};
          const orgId = metadata.orgId;
          const planId = metadata.planId;
          const billingCycle = metadata.billingCycle;
          
          if (!orgId || !planId || !billingCycle) {
            console.error('[Webhook] Missing required metadata in checkout session:', { orgId, planId, billingCycle });
          } else {
            // Fetch the subscription from Stripe to get full details
            try {
              const subscription = await stripe.subscriptions.retrieve(session.subscription);
              
              // Get or create organization subscription
              const existingSubscription = await storage.getOrganizationSubscription(orgId);
              
              // Helper function to safely convert Stripe timestamp to Date
              const toDate = (timestamp: number | null | undefined, fieldName: string = 'unknown'): Date | null => {
                if (timestamp === null || timestamp === undefined) {
                  return null;
                }
                if (typeof timestamp !== 'number') {
                  console.warn(`[Webhook] Invalid timestamp type for ${fieldName}:`, typeof timestamp, timestamp);
                  return null;
                }
                if (timestamp <= 0) {
                  console.warn(`[Webhook] Invalid timestamp value for ${fieldName}:`, timestamp);
                  return null;
                }
                const date = new Date(timestamp * 1000);
                if (isNaN(date.getTime())) {
                  console.warn(`[Webhook] Invalid date created from timestamp for ${fieldName}:`, timestamp);
                  return null;
                }
                return date;
              };
              
              // Validate required period dates - these are essential for subscriptions
              const periodStart = toDate(subscription.current_period_start, 'current_period_start');
              const periodEnd = toDate(subscription.current_period_end, 'current_period_end');
              
              // Build subscription data with validated dates
              const subscriptionData: any = {
                planId,
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                status: subscription.status,
                billingCycle,
                cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
              };
              
              // Always set period dates (use fallbacks if invalid)
              if (periodStart && periodEnd) {
                subscriptionData.currentPeriodStart = periodStart;
                subscriptionData.currentPeriodEnd = periodEnd;
              } else {
                console.warn('[Webhook] Invalid period dates, using fallbacks:', {
                  current_period_start: subscription.current_period_start,
                  current_period_end: subscription.current_period_end
                });
                const now = new Date();
                subscriptionData.currentPeriodStart = periodStart || now;
                subscriptionData.currentPeriodEnd = periodEnd || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
              }
              
              // Add optional dates only if they exist and are valid
              const canceledAt = toDate(subscription.canceled_at, 'canceled_at');
              if (canceledAt) {
                subscriptionData.canceledAt = canceledAt;
              }
              
              const trialStart = toDate(subscription.trial_start, 'trial_start');
              if (trialStart) {
                subscriptionData.trialStart = trialStart;
              }
              
              const trialEnd = toDate(subscription.trial_end, 'trial_end');
              if (trialEnd) {
                subscriptionData.trialEnd = trialEnd;
              }

              if (existingSubscription) {
                // Update existing subscription (preserve memberCount)
                await storage.updateOrganizationSubscription(orgId, subscriptionData);
                console.log('[Webhook] Updated subscription for org:', orgId, 'plan:', planId, 'status:', subscription.status);
              } else {
                // Create new subscription
                await storage.createOrganizationSubscription({
                  orgId,
                  ...subscriptionData,
                  memberCount: 0,
                });
                console.log('[Webhook] Created subscription for org:', orgId, 'plan:', planId, 'status:', subscription.status);
              }
            } catch (error) {
              console.error('[Webhook] Error processing checkout session:', error);
            }
          }
        }
      }

      // Handle customer.subscription.created and customer.subscription.updated
      if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as any;
        console.log('[Webhook] Subscription event:', event.type, subscription.id);
        console.log('[Webhook] Subscription data:', {
          id: subscription.id,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          canceled_at: subscription.canceled_at,
          trial_start: subscription.trial_start,
          trial_end: subscription.trial_end,
          metadata: subscription.metadata
        });
        
        const metadata = subscription.metadata || {};
        const orgId = metadata.orgId;
        const planId = metadata.planId;
        const billingCycle = metadata.billingCycle;
        
        if (!orgId || !planId || !billingCycle) {
          console.error('[Webhook] Missing required metadata in subscription:', { orgId, planId, billingCycle });
        } else {
          // Validate organization exists
          const org = await storage.getOrganization(orgId);
          if (!org) {
            console.error('[Webhook] Organization not found:', orgId);
          } else {
            // Get the plan to validate it exists
            const plan = await storage.getSubscriptionPlan(planId);
            if (!plan) {
              console.error('[Webhook] Plan not found:', planId);
            } else {
              // Get or create organization subscription
              const existingSubscription = await storage.getOrganizationSubscription(orgId);
              
              // Helper function to safely convert Stripe timestamp to Date
              const toDate = (timestamp: number | null | undefined, fieldName: string = 'unknown'): Date | null => {
                if (timestamp === null || timestamp === undefined) {
                  return null;
                }
                if (typeof timestamp !== 'number') {
                  console.warn(`[Webhook] Invalid timestamp type for ${fieldName}:`, typeof timestamp, timestamp);
                  return null;
                }
                if (timestamp <= 0) {
                  console.warn(`[Webhook] Invalid timestamp value for ${fieldName}:`, timestamp);
                  return null;
                }
                const date = new Date(timestamp * 1000);
                if (isNaN(date.getTime())) {
                  console.warn(`[Webhook] Invalid date created from timestamp for ${fieldName}:`, timestamp);
                  return null;
                }
                return date;
              };
              
              // Validate required period dates - these are essential for subscriptions
              const periodStart = toDate(subscription.current_period_start, 'current_period_start');
              const periodEnd = toDate(subscription.current_period_end, 'current_period_end');
              
              // Build subscription data with validated dates
              const subscriptionData: any = {
                planId,
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                status: subscription.status,
                billingCycle,
                cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
              };
              
              // Always set period dates (use fallbacks if invalid)
              if (periodStart && periodEnd) {
                subscriptionData.currentPeriodStart = periodStart;
                subscriptionData.currentPeriodEnd = periodEnd;
              } else {
                console.warn('[Webhook] Invalid period dates, using fallbacks:', {
                  current_period_start: subscription.current_period_start,
                  current_period_end: subscription.current_period_end
                });
                const now = new Date();
                subscriptionData.currentPeriodStart = periodStart || now;
                subscriptionData.currentPeriodEnd = periodEnd || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
              }
              
              // Add optional dates only if they exist and are valid
              const canceledAt = toDate(subscription.canceled_at, 'canceled_at');
              if (canceledAt) {
                subscriptionData.canceledAt = canceledAt;
              }
              
              const trialStart = toDate(subscription.trial_start, 'trial_start');
              if (trialStart) {
                subscriptionData.trialStart = trialStart;
              }
              
              const trialEnd = toDate(subscription.trial_end, 'trial_end');
              if (trialEnd) {
                subscriptionData.trialEnd = trialEnd;
              }

              if (existingSubscription) {
                // Update existing subscription (preserve memberCount)
                await storage.updateOrganizationSubscription(orgId, subscriptionData);
                console.log('[Webhook] Updated subscription for org:', orgId, 'plan:', planId, 'status:', subscription.status);
              } else {
                // Create new subscription
                await storage.createOrganizationSubscription({
                  orgId,
                  ...subscriptionData,
                  memberCount: 0,
                });
                console.log('[Webhook] Created subscription for org:', orgId, 'plan:', planId, 'status:', subscription.status);
              }
            }
          }
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("[Webhook] Unhandled webhook error:", error);
      console.error("[Webhook] Error stack:", error?.stack);
      console.error("[Webhook] Error details:", {
        message: error?.message,
        type: error?.type,
        code: error?.code
      });
      // Return 200 to prevent Stripe from retrying (we'll handle manually if needed)
      // But log the error so we can debug
      res.status(200).json({ 
        received: true, 
        error: "Webhook processing failed",
        message: error?.message 
      });
    }
  });

  // ObjectStorageService is already initialized as singleton

  // Organization Registrations
  app.post("/api/registrations", async (req, res) => {
    try {
      const data = insertOrganizationRegistrationSchema.parse(req.body);
      const registration = await storage.createOrganizationRegistration(data);
      res.status(201).json(registration);
    } catch (error) {
      console.error("Error creating registration:", error);
      res.status(400).json({ error: "Invalid registration data" });
    }
  });

  app.get("/api/registrations/:id", async (req, res) => {
    try {
      const registration = await storage.getOrganizationRegistration(req.params.id);
      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      // Access control: Only allow access to draft registrations or if authenticated as admin/owner
      const userId = req.session?.userId;
      const isAdmin = userId && (await storage.getUser(userId))?.role === "eco_admin";
      const isOwner = userId && registration.userId === userId;

      // Allow draft registrations (pre-authentication) or authenticated admins/owners
      if (registration.status !== "draft" && !isAdmin && !isOwner) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(registration);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch registration" });
    }
  });

  app.patch("/api/registrations/:id", async (req, res) => {
    try {
      const registration = await storage.getOrganizationRegistration(req.params.id);
      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      // Access control: Only allow updates to draft registrations or if authenticated as admin/owner
      const userId = req.session?.userId;
      const isAdmin = userId && (await storage.getUser(userId))?.role === "eco_admin";
      const isOwner = userId && registration.userId === userId;

      // Only allow updates during draft phase or by authenticated admins/owners
      if (registration.status !== "draft" && !isAdmin && !isOwner) {
        return res.status(403).json({ error: "Cannot modify registration after submission" });
      }

      // For draft registrations, only allow specific fields to be updated (prevent status/userId tampering)
      if (registration.status === "draft") {
        const allowedFields = [
          "charityName",
          "contactFirstName",
          "contactLastName",
          "contactEmail",
          "contactPhone",
          "street",
          "city",
          "state",
          "zip",
          "country",
          "timezone",
          "currency",
          "dateFormat",
          "incorporationDocUrl",
          "currentStep"
        ];
        
        // Filter to only include allowed fields (ignoring any extra fields sent by frontend)
        const safeUpdate: any = {};
        for (const field of allowedFields) {
          if (req.body[field] !== undefined) {
            safeUpdate[field] = req.body[field];
          }
        }

        const updated = await storage.updateOrganizationRegistration(req.params.id, safeUpdate);
        res.json(updated);
      } else {
        // Admins/owners can update any field after draft (with validation)
        const updated = await storage.updateOrganizationRegistration(req.params.id, req.body);
        res.json(updated);
      }
    } catch (error) {
      console.error("Error updating registration:", error);
      res.status(400).json({ error: "Failed to update registration" });
    }
  });

  app.post("/api/registrations/:id/submit", async (req, res) => {
    try {
      const registration = await storage.getOrganizationRegistration(req.params.id);
      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      // Validate required fields before submission
      if (!registration.charityName || !registration.contactEmail || !registration.contactFirstName || 
          !registration.contactLastName || !registration.street || !registration.city || 
          !registration.state || !registration.zip || !registration.country || !registration.incorporationDocUrl) {
        return res.status(400).json({ error: "All required fields must be completed before submission" });
      }

      const submittedAt = new Date();
      const updated = await storage.updateOrganizationRegistration(req.params.id, {
        status: "submitted",
        submittedAt,
      } as any);

      // Send notification to admin team
      const adminEmail = process.env.ECO_ADMIN_EMAIL || "admin@plegit.app";
      const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
      
      try {
        await sendNewRegistrationNotification(
          adminEmail,
          {
            charityName: registration.charityName!,
            contactFirstName: registration.contactFirstName!,
            contactLastName: registration.contactLastName!,
            contactEmail: registration.contactEmail!,
            country: registration.country!,
            submittedAt,
          },
          req.params.id,
          baseUrl
        );
      } catch (emailError) {
        // Log error but don't fail the submission
        console.error("Failed to send admin notification email:", emailError);
      }

      res.json(updated);
    } catch (error) {
      console.error("Error submitting registration:", error);
      res.status(500).json({ error: "Failed to submit registration" });
    }
  });

  // File Upload Routes - Protected, requires registration ID ownership
  app.get("/api/upload/url", async (req, res) => {
    try {
      const registrationId = req.query.registrationId as string;
      
      if (!registrationId) {
        return res.status(400).json({ error: "registrationId is required" });
      }

      // Verify registration exists and is in draft or submitted state
      const registration = await storage.getOrganizationRegistration(registrationId);
      if (!registration || (registration.status !== "draft" && registration.status !== "submitted")) {
        return res.status(403).json({ error: "Invalid registration ID or registration already processed" });
      }

      // Generate a unique object path for upload
      const objectId = randomUUID();
      const objectPath = `/objects/uploads/${objectId}`;
      
      // Return the upload endpoint URL with objectPath, ownerId, and visibility as query parameters
      // Pass req to detect protocol and prevent mixed content errors
      const uploadUrl = buildUrl('/api/files/upload', {
        objectPath,
        ownerId: registrationId,
        visibility: 'private'
      }, req);
      
      res.json({ 
        uploadUrl,
        objectPath, // Also return for client reference
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.post("/api/files/set-acl", async (req, res) => {
    try {
      const { filePath, ownerId, visibility } = req.body;
      
      if (!filePath || !ownerId || !visibility) {
        return res.status(400).json({ error: "filePath, ownerId, and visibility are required" });
      }

      // Verify the ownerId matches a valid registration
      const registration = await storage.getOrganizationRegistration(ownerId);
      if (!registration || (registration.status !== "draft" && registration.status !== "submitted")) {
        return res.status(403).json({ error: "Invalid owner ID or unauthorized" });
      }

      // Extract the actual object path from URL if a full URL was provided
      // The frontend might send:
      // 1. The upload endpoint URL: "http://devportal.plegit.ai/api/files/upload" (wrong - this is what we're getting)
      // 2. The file URL: "http://devportal.plegit.ai/api/files/objects/uploads/..." (correct)
      // 3. The path: "/objects/uploads/..." (correct)
      let normalizedFilePath = filePath;
      
      // If it's the upload endpoint URL, we can't extract the path from it
      // In this case, since the upload already set the ACL, we can just return success
      // But we need to get the actual file path from the most recent upload for this registration
      if (filePath.includes('/api/files/upload') && !filePath.includes('/objects/')) {
        console.log("Frontend sent upload endpoint URL instead of file path. Looking up most recent upload for registration:", ownerId);
        
        // The upload endpoint already sets ACL if ownerId is provided, so this is redundant
        // But we need to return a valid path for the frontend
        // Try to find the most recently uploaded file for this registration
        // Since we can't easily query this, we'll return success and let the frontend use the path from upload response
        return res.json({ 
          path: null,
          message: "ACL was already set during file upload. Please use the 'path' field from the upload response.",
          skipped: true,
          note: "The upload response includes a 'path' field that should be used instead of 'uploadURL'"
        });
      }
      
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        // Extract path after /api/files
        const apiFilesIndex = filePath.indexOf('/api/files');
        if (apiFilesIndex !== -1) {
          normalizedFilePath = filePath.substring(apiFilesIndex + '/api/files'.length);
          // Remove any leading/trailing slashes
          normalizedFilePath = normalizedFilePath.replace(/^\/+|\/+$/g, '');
          normalizedFilePath = '/' + normalizedFilePath;
        } else {
          // Try to extract from URL path directly
          try {
            const url = new URL(filePath);
            normalizedFilePath = url.pathname;
          } catch {
            // If URL parsing fails, try to find /objects/ in the string
            const objectsIndex = filePath.indexOf('/objects/');
            if (objectsIndex !== -1) {
              normalizedFilePath = filePath.substring(objectsIndex);
            }
          }
        }
      }
      
      // Ensure path starts with /objects/
      if (!normalizedFilePath.startsWith("/objects/")) {
        // If it doesn't start with /objects/, it might be just the filename or relative path
        // Try to construct the full path
        if (normalizedFilePath.startsWith("/")) {
          normalizedFilePath = `/objects${normalizedFilePath}`;
        } else {
          normalizedFilePath = `/objects/${normalizedFilePath}`;
        }
      }

      console.log("Setting ACL - Original filePath:", filePath);
      console.log("Setting ACL - Normalized filePath:", normalizedFilePath);
      
      // The upload endpoint already sets ACL if ownerId is provided, so this might be redundant
      // But we'll still handle it for cases where ACL needs to be updated
      
      // Verify the file exists by trying to get it
      try {
        // This will throw ObjectNotFoundError if file doesn't exist
        await objectStorageService.getObjectEntityFile(normalizedFilePath);
        console.log("File verified to exist at object path:", normalizedFilePath);
      } catch (err: any) {
        console.error("File NOT found at object path:", normalizedFilePath);
        console.error("Error:", err);
        
        // Try to construct the expected local path for debugging
        const storageDir = process.env.STORAGE_DIR || process.env.LOCAL_STORAGE_DIR || "./storage";
        const relativePath = normalizedFilePath.replace("/objects/", "");
        const expectedLocalPath = `${storageDir}/private/${relativePath}`;
        console.error("Expected local file path:", expectedLocalPath);
        
        return res.status(404).json({ 
          error: "File not found", 
          objectPath: normalizedFilePath,
          expectedLocalPath: expectedLocalPath,
          message: "The uploaded file could not be found. Please try uploading again."
        });
      }

      const aclPolicy: ObjectAclPolicy = {
        owner: ownerId,
        visibility: visibility as "public" | "private",
      };

      const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(normalizedFilePath, aclPolicy);
      console.log("ACL set successfully for path:", normalizedPath);
      res.json({ path: normalizedPath });
    } catch (error) {
      console.error("Error setting ACL:", error);
      console.error("Request body:", req.body);
      res.status(500).json({ error: "Failed to set file ACL", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // File Upload Endpoint
  // Public endpoint - no authentication required (for registration uploads)
  const uploadHandler = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  }).single('file');

  app.post("/api/files/upload", uploadHandler, async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { objectPath, visibility, ownerId } = req.body;
      
      if (!objectPath) {
        return res.status(400).json({ error: "objectPath is required" });
      }

      // Ensure objectPath starts with /objects/
      const normalizedPath = objectPath.startsWith("/objects/") 
        ? objectPath 
        : `/objects/${objectPath}`;

      // Save file to local storage
      const savedPath = await objectStorageService.saveFile(
        normalizedPath,
        req.file.buffer,
        {
          contentType: req.file.mimetype,
          visibility: (visibility as "public" | "private") || "private",
        }
      );

      // Set ACL if ownerId provided
      if (ownerId) {
        const aclPolicy: ObjectAclPolicy = {
          owner: ownerId,
          visibility: (visibility as "public" | "private") || "private",
        };
        await objectStorageService.trySetObjectEntityAclPolicy(savedPath, aclPolicy);
      }

      // Return the file URL
      const fileUrl = buildUrl(`/api/files${savedPath}`);

      res.json({ 
        path: savedPath,
        url: fileUrl 
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Also handle PUT requests for file uploads (raw binary data from Uppy/AWS S3)
  app.put("/api/files/upload", async (req: any, res) => {
    try {
      // Get the raw body buffer that was captured by middleware before JSON parsing
      const fileBuffer = req.rawBodyBuffer;

      if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
        console.error("[File Upload] No file buffer provided");
        res.status(400).json({ error: "No file provided" });
        return;
      }

      // Get objectPath and other metadata from query params
      const objectPath = req.query.objectPath as string;
      const visibility = (req.query.visibility as string) || 'private';
      const ownerId = req.query.ownerId as string;
      
      console.log("[File Upload] PUT request received:", { 
        objectPath, 
        visibility, 
        ownerId, 
        fileSize: fileBuffer.length 
      });
      
      if (!objectPath) {
        console.error("[File Upload] Missing objectPath");
        res.status(400).json({ error: "objectPath is required as query parameter" });
        return;
      }

      // Ensure objectPath starts with /objects/
      const normalizedPath = objectPath.startsWith("/objects/") 
        ? objectPath 
        : `/objects/${objectPath}`;

      // Get content type from headers
      const contentType = req.headers['content-type'] || 'application/octet-stream';

      // Save file to local storage
      const savedPath = await objectStorageService.saveFile(
        normalizedPath,
        fileBuffer,
        {
          contentType: contentType,
          visibility: visibility as "public" | "private",
        }
      );

      console.log("[File Upload] File saved to:", savedPath);

      // Set ACL if ownerId provided
      if (ownerId) {
        const aclPolicy: ObjectAclPolicy = {
          owner: ownerId,
          visibility: visibility as "public" | "private",
        };
        await objectStorageService.trySetObjectEntityAclPolicy(savedPath, aclPolicy);
        console.log("[File Upload] ACL set for owner:", ownerId);
      }

      // Return the file URL (Uppy expects uploadURL in response)
      const fileUrl = buildUrl(`/api/files${savedPath}`, undefined, req);

      const responseData = { 
        path: savedPath, // This is what should be used for set-acl
        url: fileUrl,
        uploadURL: fileUrl // Uppy expects this field, but frontend should use 'path' for set-acl
      };

      console.log("[File Upload] PUT request successful, returning:", JSON.stringify(responseData));
      
      // Ensure proper headers for JSON response and CORS
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // Send response
      res.status(200).json(responseData);
    } catch (error) {
      console.error("[File Upload] Error uploading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: "Failed to upload file", 
          details: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  });

  // File Download Endpoint
  app.get("/api/files/*", async (req, res) => {
    try {
      // Extract the path after /api/files/
      // Express wildcard routes: use req.path or extract from req.url
      const fullPath = req.path; // This will be like "/api/files/objects/events/file.png"
      const filePath = fullPath.replace(/^\/api\/files/, ""); // Remove /api/files prefix
      
      // Ensure path starts with /objects/
      if (!filePath.startsWith("/objects/")) {
        console.error("Invalid file path requested:", filePath);
        return res.status(400).json({ error: "Invalid file path" });
      }
      
      console.log("File download request:", { fullPath, filePath });

      const objectFile = await objectStorageService.getObjectEntityFile(filePath);
      
      // Check access permission
      const userId = (req as any).session?.userId;
      
      // Eco-admin users have full access to all files
      let canAccess = false;
      if (userId) {
        const user = await storage.getUser(userId);
        if (user?.role === "eco_admin") {
          canAccess = true;
        } else {
          // For non-eco-admin users, check ACL permissions
          canAccess = await objectStorageService.canAccessObjectEntity({
            userId,
            objectFile,
            requestedPermission: ObjectPermission.READ,
          });
        }
      } else {
        // For unauthenticated users, check if file is public
        canAccess = await objectStorageService.canAccessObjectEntity({
          userId: undefined,
          objectFile,
          requestedPermission: ObjectPermission.READ,
        });
      }

      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      console.error("Error downloading file:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  // Campaign Image Upload
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  app.post("/api/campaigns/upload-image", requireAuth, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const fileName = `campaign-${Date.now()}-${req.file.originalname}`;
      const objectPath = `/objects/campaigns/${fileName}`;

      // Save file to local storage as public
      await objectStorageService.saveFile(
        objectPath,
        req.file.buffer,
        {
          contentType: req.file.mimetype,
          visibility: "public",
        }
      );

      // Set ACL for public access
      const aclPolicy: ObjectAclPolicy = {
        owner: req.user.id,
        visibility: "public",
      };
      await objectStorageService.trySetObjectEntityAclPolicy(objectPath, aclPolicy);

      // Return the public URL
      const publicUrl = buildUrl(`/api/files${objectPath}`);
      res.json({ url: publicUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  app.post("/api/events/upload-image", requireAuth, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const fileName = `event-${Date.now()}-${req.file.originalname}`;
      const objectPath = `/objects/events/${fileName}`;

      // Save file to local storage as public
      await objectStorageService.saveFile(
        objectPath,
        req.file.buffer,
        {
          contentType: req.file.mimetype,
          visibility: "public",
        }
      );

      // Set ACL for public access
      const aclPolicy: ObjectAclPolicy = {
        owner: req.user.id,
        visibility: "public",
      };
      await objectStorageService.trySetObjectEntityAclPolicy(objectPath, aclPolicy);

      // Return the public URL
      const publicUrl = buildUrl(`/api/files${objectPath}`);
      res.json({ url: publicUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Organization Logo/Asset Upload Route
  app.post("/api/org/:orgId/upload", requireAuth, upload.single('file'), async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const { type } = req.body;

      // Verify org access
      if (req.user.orgId !== orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const fileType = type || 'general';
      const fileName = `${fileType}-${Date.now()}-${req.file.originalname}`;
      const objectPath = `/objects/organizations/${orgId}/${fileName}`;

      // Save file to local storage as public
      await objectStorageService.saveFile(
        objectPath,
        req.file.buffer,
        {
          contentType: req.file.mimetype,
          visibility: "public",
        }
      );

      // Set ACL for public access
      const aclPolicy: ObjectAclPolicy = {
        owner: req.user.id,
        visibility: "public",
      };
      await objectStorageService.trySetObjectEntityAclPolicy(objectPath, aclPolicy);

      // Return the public URL
      const publicUrl = buildUrl(`/api/files${objectPath}`);
      res.json({ url: publicUrl });
    } catch (error) {
      console.error("Error uploading organization file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // ==================== P2P FUNDRAISING ROUTES ====================
  
  // Public P2P Settings - Get public-safe P2P settings for a campaign
  app.get("/api/public/p2p/campaigns/:campaignId/settings", async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign || campaign.status !== "active") {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const settings = await storage.getP2PCampaignSettings(req.params.campaignId);
      if (!settings) {
        return res.json({ isEnabled: false, allowSelfSignup: false });
      }

      // Only return public-safe settings
      res.json({
        isEnabled: settings.isEnabled || false,
        allowSelfSignup: settings.allowSelfSignup || false,
      });
    } catch (error) {
      console.error("Error fetching public P2P settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Public P2P Signup - Allow supporters to create their own fundraiser
  app.post("/api/public/p2p/campaigns/:campaignId/signup", async (req, res) => {
    try {
      const { firstName, lastName, email, goal, story } = req.body;

      if (!firstName || !lastName || !email || !goal) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get campaign
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign || campaign.status !== "active") {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Check P2P settings
      const settings = await storage.getP2PCampaignSettings(req.params.campaignId);
      if (!settings?.isEnabled || !settings?.allowSelfSignup) {
        return res.status(403).json({ error: "P2P fundraising is not enabled for this campaign" });
      }

      // Generate unique slug
      const baseSlug = `${firstName}-${lastName}-${campaign.id.slice(0, 8)}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      let slug = baseSlug;
      let counter = 1;
      
      // Ensure slug is unique
      while (await storage.getP2PParticipantBySlug(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create participant
      const participant = await storage.createP2PParticipant({
        campaignId: campaign.id,
        orgId: campaign.orgId,
        firstName,
        lastName,
        email,
        slug,
        bio: story || null,
        goalAmount: String(parseFloat(goal)),
        status: settings.requireApproval ? 'pending' : 'active',
      });

      res.status(201).json({
        id: participant.id,
        slug: participant.slug,
        status: participant.status,
      });
    } catch (error: any) {
      console.error("Error creating P2P participant signup:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create fundraiser" });
    }
  });
  
  // P2P Campaign Settings - Get settings for a campaign (authenticated)
  app.get("/api/p2p/campaigns/:campaignId/settings", requireAuth, async (req: any, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Verify org ownership
      if (campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const settings = await storage.getP2PCampaignSettings(req.params.campaignId);
      res.json(settings || null);
    } catch (error) {
      console.error("Error fetching P2P settings:", error);
      res.status(500).json({ error: "Failed to fetch P2P settings" });
    }
  });

  // P2P Campaign Settings - Create or update settings
  app.post("/api/p2p/campaigns/:campaignId/settings", requireAuth, async (req: any, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Verify org ownership
      if (campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validated = insertP2PCampaignSettingsSchema.parse({
        ...req.body,
        campaignId: req.params.campaignId,
        orgId: req.user.orgId
      });

      // Check if settings exist
      const existing = await storage.getP2PCampaignSettings(req.params.campaignId);
      let settings;
      
      if (existing) {
        settings = await storage.updateP2PCampaignSettings(req.params.campaignId, validated);
      } else {
        settings = await storage.createP2PCampaignSettings(validated);
      }

      res.json(settings);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error saving P2P settings:", error);
      res.status(500).json({ error: "Failed to save P2P settings" });
    }
  });

  // P2P Participants - List all participants for a campaign (with optional stats)
  app.get("/api/p2p/campaigns/:campaignId/participants", requireAuth, async (req: any, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Verify org ownership
      if (campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const withStats = req.query.stats === 'true';
      const participants = withStats
        ? await storage.listP2PParticipantsWithStats(req.params.campaignId)
        : await storage.listP2PParticipants(req.params.campaignId);

      res.json(participants);
    } catch (error) {
      console.error("Error fetching P2P participants:", error);
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  // P2P Participants - Get single participant
  app.get("/api/p2p/participants/:id", requireAuth, async (req: any, res) => {
    try {
      const participant = await storage.getP2PParticipant(req.params.id);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      // Verify org ownership via campaign
      const campaign = await storage.getCampaign(participant.campaignId);
      if (!campaign || campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(participant);
    } catch (error) {
      console.error("Error fetching P2P participant:", error);
      res.status(500).json({ error: "Failed to fetch participant" });
    }
  });

  // P2P Participants - Create new participant
  app.post("/api/p2p/campaigns/:campaignId/participants", requireAuth, async (req: any, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Verify org ownership
      if (campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Split name into firstName and lastName
      const nameParts = req.body.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

      // Generate unique slug from name
      const baseSlug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const slug = `${baseSlug}-${Date.now()}`;

      const validated = insertP2PParticipantSchema.parse({
        campaignId: req.params.campaignId,
        orgId: req.user.orgId,
        firstName,
        lastName,
        email: req.body.email,
        slug,
        bio: req.body.story || null,
        goalAmount: String(parseFloat(req.body.goal)),
        status: 'active',
      });

      const participant = await storage.createP2PParticipant(validated);
      res.status(201).json(participant);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error creating P2P participant:", error);
      res.status(500).json({ error: "Failed to create participant" });
    }
  });

  // P2P Participants - Update participant
  app.patch("/api/p2p/participants/:id", requireAuth, async (req: any, res) => {
    try {
      const participant = await storage.getP2PParticipant(req.params.id);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      // Verify org ownership via campaign
      const campaign = await storage.getCampaign(participant.campaignId);
      if (!campaign || campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Sanitize update to exclude protected fields
      const { campaignId, id, createdBy, createdAt, deletedAt, ...updateData } = req.body;

      const updated = await storage.updateP2PParticipant(req.params.id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating P2P participant:", error);
      res.status(500).json({ error: "Failed to update participant" });
    }
  });

  // P2P Participants - Soft delete participant
  app.delete("/api/p2p/participants/:id", requireAuth, async (req: any, res) => {
    try {
      const participant = await storage.getP2PParticipant(req.params.id);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      // Verify org ownership via campaign
      const campaign = await storage.getCampaign(participant.campaignId);
      if (!campaign || campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.softDeleteP2PParticipant(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting P2P participant:", error);
      res.status(500).json({ error: "Failed to delete participant" });
    }
  });

  // P2P Invitations - List invitations for a campaign
  app.get("/api/p2p/campaigns/:campaignId/invitations", requireAuth, async (req: any, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Verify org ownership
      if (campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const invitations = await storage.listP2PInvitations(req.params.campaignId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching P2P invitations:", error);
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  // P2P Invitations - Create invitation
  app.post("/api/p2p/campaigns/:campaignId/invitations", requireAuth, async (req: any, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Verify org ownership
      if (campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Generate unique invitation token
      const token = randomBytes(32).toString('hex');
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const validated = insertP2PInvitationSchema.parse({
        campaignId: req.params.campaignId,
        invitedBy: req.user.id,
        email: req.body.email,
        token,
        status: 'pending',
        expiresAt,
      });

      const invitation = await storage.createP2PInvitation(validated);
      
      // TODO: Send invitation email here using resend integration (use req.body.name and req.body.message)
      
      res.status(201).json(invitation);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error creating P2P invitation:", error);
      res.status(500).json({ error: "Failed to create invitation" });
    }
  });

  // P2P Invitations - Get by token (public endpoint)
  app.get("/api/public/p2p/invitations/:token", async (req, res) => {
    try {
      const invitation = await storage.getP2PInvitationByToken(req.params.token);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found or expired" });
      }

      // Check if already accepted
      if (invitation.acceptedAt) {
        return res.status(400).json({ error: "Invitation already accepted" });
      }

      // Return invitation with campaign details
      const campaign = await storage.getCampaign(invitation.campaignId);
      res.json({ invitation, campaign });
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ error: "Failed to fetch invitation" });
    }
  });

  // P2P Invitations - Accept invitation (public endpoint)
  app.post("/api/public/p2p/invitations/:token/accept", async (req, res) => {
    try {
      const invitation = await storage.getP2PInvitationByToken(req.params.token);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found or expired" });
      }

      if (invitation.acceptedAt) {
        return res.status(400).json({ error: "Invitation already accepted" });
      }

      // Mark invitation as accepted
      await storage.updateP2PInvitation(invitation.id, {
        acceptedAt: new Date()
      });

      // Create participant from invitation
      const baseSlug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const slug = `${baseSlug}-${Date.now()}`;

      const participant = await storage.createP2PParticipant({
        campaignId: invitation.campaignId,
        name: req.body.name,
        email: invitation.email,
        slug,
        goal: req.body.goal || "0",
        story: req.body.story || "",
        avatarUrl: req.body.avatarUrl,
        createdBy: null // Public signup, no user ID
      });

      res.status(201).json({ participant, invitation });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error accepting invitation:", error);
      res.status(500).json({ error: "Failed to accept invitation" });
    }
  });

  // P2P Milestones - List milestones for a campaign
  app.get("/api/p2p/campaigns/:campaignId/milestones", requireAuth, async (req: any, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Verify org ownership
      if (campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const milestones = await storage.listP2PMilestones(req.params.campaignId);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching P2P milestones:", error);
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  // P2P Milestones - Create milestone
  app.post("/api/p2p/campaigns/:campaignId/milestones", requireAuth, async (req: any, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Verify org ownership
      if (campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validated = insertP2PMilestoneSchema.parse({
        ...req.body,
        campaignId: req.params.campaignId
      });

      const milestone = await storage.createP2PMilestone(validated);
      res.status(201).json(milestone);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error creating P2P milestone:", error);
      res.status(500).json({ error: "Failed to create milestone" });
    }
  });

  // P2P Milestones - Update milestone
  app.patch("/api/p2p/milestones/:id", requireAuth, async (req: any, res) => {
    try {
      const milestone = await storage.getP2PMilestone(req.params.id);
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }

      // Verify org ownership via campaign
      const campaign = await storage.getCampaign(milestone.campaignId);
      if (!campaign || campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { campaignId, id, ...updateData } = req.body;
      const updated = await storage.updateP2PMilestone(req.params.id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating P2P milestone:", error);
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });

  // P2P Milestones - Delete milestone
  app.delete("/api/p2p/milestones/:id", requireAuth, async (req: any, res) => {
    try {
      const milestone = await storage.getP2PMilestone(req.params.id);
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }

      // Verify org ownership via campaign
      const campaign = await storage.getCampaign(milestone.campaignId);
      if (!campaign || campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteP2PMilestone(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting P2P milestone:", error);
      res.status(500).json({ error: "Failed to delete milestone" });
    }
  });

  // P2P Chat - List messages for a campaign
  app.get("/api/p2p/campaigns/:campaignId/chat", async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const messages = await storage.listP2PChatMessages(req.params.campaignId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching P2P chat messages:", error);
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  // P2P Chat - Post message
  app.post("/api/p2p/campaigns/:campaignId/chat", async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const validated = insertP2PChatMessageSchema.parse({
        ...req.body,
        campaignId: req.params.campaignId
      });

      const message = await storage.createP2PChatMessage(validated);
      res.status(201).json(message);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error posting P2P chat message:", error);
      res.status(500).json({ error: "Failed to post chat message" });
    }
  });

  // P2P Documents - List documents for a campaign
  app.get("/api/p2p/campaigns/:campaignId/documents", requireAuth, async (req: any, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Verify org ownership
      if (campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const documents = await storage.listP2PDocuments(req.params.campaignId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching P2P documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // P2P Documents - Create document
  app.post("/api/p2p/campaigns/:campaignId/documents", requireAuth, async (req: any, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Verify org ownership
      if (campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validated = insertP2PDocumentSchema.parse({
        ...req.body,
        campaignId: req.params.campaignId,
        uploadedBy: req.user.id
      });

      const document = await storage.createP2PDocument(validated);
      res.status(201).json(document);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error creating P2P document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  // P2P Documents - Update document
  app.patch("/api/p2p/documents/:id", requireAuth, async (req: any, res) => {
    try {
      const document = await storage.getP2PDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Verify org ownership via campaign
      const campaign = await storage.getCampaign(document.campaignId);
      if (!campaign || campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { campaignId, id, uploadedBy, ...updateData } = req.body;
      const updated = await storage.updateP2PDocument(req.params.id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating P2P document:", error);
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  // P2P Documents - Soft delete document
  app.delete("/api/p2p/documents/:id", requireAuth, async (req: any, res) => {
    try {
      const document = await storage.getP2PDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Verify org ownership via campaign
      const campaign = await storage.getCampaign(document.campaignId);
      if (!campaign || campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.softDeleteP2PDocument(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting P2P document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // P2P Documents - Increment downloads
  app.post("/api/p2p/documents/:id/download", async (req, res) => {
    try {
      const document = await storage.getP2PDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      await storage.incrementP2PDocumentDownloads(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error incrementing document downloads:", error);
      res.status(500).json({ error: "Failed to increment downloads" });
    }
  });

  // P2P Gamification Badges - List badges for organization/campaign
  app.get("/api/p2p/badges", requireAuth, async (req: any, res) => {
    try {
      const campaignId = req.query.campaignId as string | undefined;
      const badges = await storage.listP2PGamificationBadges(req.user.orgId, campaignId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching P2P badges:", error);
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  // P2P Gamification Badges - Create badge
  app.post("/api/p2p/badges", requireAuth, async (req: any, res) => {
    try {
      const validated = insertP2PGamificationBadgeSchema.parse({
        ...req.body,
        orgId: req.user.orgId
      });

      const badge = await storage.createP2PGamificationBadge(validated);
      res.status(201).json(badge);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error creating P2P badge:", error);
      res.status(500).json({ error: "Failed to create badge" });
    }
  });

  // P2P Gamification Badges - Update badge
  app.patch("/api/p2p/badges/:id", requireAuth, async (req: any, res) => {
    try {
      const badge = await storage.getP2PGamificationBadge(req.params.id);
      if (!badge) {
        return res.status(404).json({ error: "Badge not found" });
      }

      // Verify org ownership
      if (badge.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { orgId, id, ...updateData } = req.body;
      const updated = await storage.updateP2PGamificationBadge(req.params.id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating P2P badge:", error);
      res.status(500).json({ error: "Failed to update badge" });
    }
  });

  // P2P Gamification Badges - Delete badge
  app.delete("/api/p2p/badges/:id", requireAuth, async (req: any, res) => {
    try {
      const badge = await storage.getP2PGamificationBadge(req.params.id);
      if (!badge) {
        return res.status(404).json({ error: "Badge not found" });
      }

      // Verify org ownership
      if (badge.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteP2PGamificationBadge(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting P2P badge:", error);
      res.status(500).json({ error: "Failed to delete badge" });
    }
  });

  // P2P Participant Badges - Award badge to participant
  app.post("/api/p2p/participants/:participantId/badges", requireAuth, async (req: any, res) => {
    try {
      const participant = await storage.getP2PParticipant(req.params.participantId);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      // Verify org ownership via campaign
      const campaign = await storage.getCampaign(participant.campaignId);
      if (!campaign || campaign.orgId !== req.user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validated = insertP2PParticipantBadgeSchema.parse({
        ...req.body,
        participantId: req.params.participantId
      });

      const participantBadge = await storage.createP2PParticipantBadge(validated);
      res.status(201).json(participantBadge);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error awarding P2P badge:", error);
      res.status(500).json({ error: "Failed to award badge" });
    }
  });

  // Public endpoint - Get participant by slug for fundraising page
  app.get("/api/public/p2p/participants/:slug", async (req, res) => {
    try {
      const participant = await storage.getP2PParticipantBySlug(req.params.slug);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      // Only show active participants
      if (participant.status !== "active") {
        return res.status(404).json({ error: "Participant not found" });
      }

      // Get campaign details
      const campaign = await storage.getCampaign(participant.campaignId);
      if (!campaign || campaign.status !== "active") {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Get organization details
      const organization = await storage.getOrganization(campaign.orgId);
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Get participant badges
      const badges = await storage.listP2PParticipantBadges(participant.id);

      res.json({ 
        participant, 
        campaign: {
          ...campaign,
          organization: {
            id: organization.id,
            name: organization.name,
            logo: organization.logo,
            slug: organization.slug,
            religion: organization.religion,
            country: organization.country,
          },
        }, 
        badges 
      });
    } catch (error) {
      console.error("Error fetching public participant:", error);
      res.status(500).json({ error: "Failed to fetch participant" });
    }
  });

  // Public endpoint - Donate to P2P participant
  app.post("/api/p2p/participants/:participantId/donate", async (req, res) => {
    try {
      const { amount, donorName, donorEmail, message, coverFees, totalAmount, category } = req.body;

      if (!amount || !donorName || !donorEmail || !totalAmount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get participant
      const participant = await storage.getP2PParticipant(req.params.participantId);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      // Get campaign
      const campaign = await storage.getCampaign(participant.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Only accept donations for active campaigns and participants
      if (campaign.status !== "active" || participant.status !== "active") {
        return res.status(400).json({ error: "This fundraiser is not accepting donations" });
      }

      // Get organization
      const org = await storage.getOrganization(campaign.orgId);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Calculate fee amount
      const donationAmount = parseFloat(amount);
      const total = parseFloat(totalAmount);
      const feeAmount = total - donationAmount;

      // Create or get donor
      let donor = await storage.getDonorByEmail(donorEmail, campaign.orgId);
      if (!donor) {
        const [firstName, ...lastNameParts] = donorName.split(" ");
        donor = await storage.createDonor({
          orgId: campaign.orgId,
          firstName,
          lastName: lastNameParts.join(" ") || "",
          email: donorEmail,
        });
      }

      // Create Stripe payment intent for one-time donations
      const paymentIntentParams: any = {
        amount: Math.round(total * 100), // Convert to cents
        currency: (campaign.currency || "USD").toLowerCase(),
        metadata: {
          orgId: campaign.orgId,
          campaignId: campaign.id,
          participantId: participant.id, // Key field for P2P attribution
          donorId: donor.id,
          donorEmail,
          donorName,
          message: message || "",
          category: category || "general",
          coverFees: coverFees ? "true" : "false",
          feeAmount: feeAmount.toFixed(2),
          donationType: "p2p", // Mark as P2P donation
        },
      };

      // DIRECT FUND TRANSFER TO CONNECTED ACCOUNT
      if (org.stripeAccountId && org.stripeAccountStatus === 'active') {
        paymentIntentParams.on_behalf_of = org.stripeAccountId;
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Error creating P2P participant donation:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // ==================== END P2P ROUTES ====================

  // Admin Routes - Registration Review
  app.get("/api/admin/registrations", async (req, res) => {
    try {
      // Check if user is admin (Eco level)
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "eco_admin") {
        return res.status(403).json({ error: "Forbidden - Eco Admin access required" });
      }

      const status = req.query.status as string | undefined;
      const registrations = await storage.listOrganizationRegistrations(status);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  app.post("/api/admin/registrations/:id/approve", async (req, res) => {
    try {
      // Check if user is admin
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "eco_admin") {
        return res.status(403).json({ error: "Forbidden - Eco Admin access required" });
      }

      const registration = await storage.getOrganizationRegistration(req.params.id);
      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      if (registration.status !== "submitted") {
        return res.status(400).json({ error: "Only submitted registrations can be approved" });
      }

      // Create organization (handle slug conflicts)
      let orgSlug = registration.charityName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let organization = await storage.getOrganizationBySlug(orgSlug);
      
      // If organization with this slug exists, add a unique suffix
      if (organization) {
        const timestamp = Date.now();
        orgSlug = `${orgSlug}-${timestamp}`;
        console.log(`⚠️ Organization slug conflict, using: ${orgSlug}`);
      }
      
      organization = await storage.createOrganization({
        name: registration.charityName,
        slug: orgSlug,
        email: registration.contactEmail!,
        phone: registration.contactPhone || null,
        street: registration.street || null,
        city: registration.city || null,
        state: registration.state || null,
        zip: registration.zip || null,
        country: registration.country || null,
        currency: registration.currency || "USD",
        timezone: registration.timezone || "America/New_York",
        dateFormat: registration.dateFormat || "MM/DD/YYYY",
        religion: registration.religion || null,
        status: "approved",
        incorporationDocUrl: registration.incorporationDocUrl || null,
        settings: {},
      });

      // Create FREE tier subscription for the new organization
      const freePlan = await storage.getSubscriptionPlanByTierCode("free");
      if (freePlan) {
        await storage.createOrganizationSubscription({
          orgId: organization.id,
          planId: freePlan.id,
          billingCycle: "monthly",
          memberCount: 0,
          status: "active",
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          currentPeriodStart: new Date(),
          currentPeriodEnd: null,
        });
        console.log(`✓ Created FREE tier subscription for organization ${organization.name}`);
      }

      // NOTE: No modules are automatically enabled during approval.
      // Organizations start with a FREE plan and must upgrade to a paid plan
      // before they can enable any marketplace modules (including campaigns/fundraising).
      // Modules can only be enabled via the /api/org/:orgId/modules endpoint which requires a paid subscription.

      // Seed default email template for the new organization
      try {
        await seedDefaultEmailTemplate(organization.id);
        console.log(`✓ Created default email template for organization ${organization.name}`);
      } catch (error) {
        console.error(`Failed to create default email template for ${organization.name}:`, error);
      }

      // Check if user already exists (might have been created for another purpose)
      let newUser = await storage.getUserByEmail(registration.contactEmail!);
      
      if (newUser) {
        // Don't link eco_admin users to organizations - they're platform administrators
        if (newUser.role === "eco_admin") {
          return res.status(400).json({ 
            error: "This email belongs to an eco-admin account and cannot be used for organization registration. Please use a different email address." 
          });
        }
        
        // User exists - check if they already have an organization
        if (newUser.orgId && newUser.orgId !== organization.id) {
          return res.status(400).json({ 
            error: "This email is already registered to another organization" 
          });
        }
        
        // Update existing user to link them to this organization
        newUser = await storage.updateUser(newUser.id, {
          firstName: registration.contactFirstName!,
          lastName: registration.contactLastName!,
          orgId: organization.id,
          role: "org_admin",
        }) || newUser;
        
        console.log(`✓ Linked existing user ${newUser.email} to organization ${organization.name}`);
      } else {
        // Create new user account
        newUser = await storage.createUser({
          email: registration.contactEmail!,
          firstName: registration.contactFirstName!,
          lastName: registration.contactLastName!,
          orgId: organization.id,
          role: "org_admin",
          passwordHash: null, // Will be set via password setup email
        });
        
        console.log(`✓ Created new user ${newUser.email} for organization ${organization.name}`);
      }

      // Check and queue auto-upgrade after user creation
      await memberCountService.checkAndQueueAutoUpgrade(organization.id).catch(err => {
        console.error("Error checking auto-upgrade:", err);
      });

      // Generate password setup token
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      await storage.createAuthToken({
        userId: newUser.id,
        token,
        type: "password_setup",
        expiresAt,
      });

      // Send approval email with password setup link
      // Normalize baseUrl to remove trailing slash
      let baseUrl = process.env.BASE_URL || process.env.APP_URL || `http://localhost:5000`;
      baseUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
      
      try {
        await sendApprovalEmail(
          registration.contactEmail!,
          registration.charityName,
          token,
          baseUrl
        );
        console.log(`✅ Approval email sent successfully to ${registration.contactEmail}`);
      } catch (emailError) {
        console.error("❌ Failed to send approval email:", emailError);
        console.log(`⚠️ Organization approved but email failed. Password setup link: ${baseUrl}/setup-password?token=${token}`);
        // Continue with approval even if email fails - admin can manually share the link
      }

      // Update registration status
      const updatedRegistration = await storage.updateOrganizationRegistration(req.params.id, {
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: userId,
      } as any);

      res.json({ 
        registration: updatedRegistration,
        organization,
        user: { ...newUser, passwordHash: undefined }, // Don't send password hash
      });
    } catch (error) {
      console.error("Error approving registration:", error);
      res.status(500).json({ error: "Failed to approve registration" });
    }
  });

  app.post("/api/admin/registrations/:id/reject", async (req, res) => {
    try {
      // Check if user is admin
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "eco_admin") {
        return res.status(403).json({ error: "Forbidden - Eco Admin access required" });
      }

      const registration = await storage.getOrganizationRegistration(req.params.id);
      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      if (registration.status !== "submitted") {
        return res.status(400).json({ error: "Only submitted registrations can be rejected" });
      }

      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ error: "Rejection reason is required" });
      }

      // Send rejection email
      await sendRejectionEmail(
        registration.contactEmail!,
        registration.charityName,
        reason
      );

      // Update registration status
      const updatedRegistration = await storage.updateOrganizationRegistration(req.params.id, {
        status: "rejected",
        reviewedAt: new Date(),
        reviewedBy: userId,
        rejectionReason: reason,
      } as any);

      res.json(updatedRegistration);
    } catch (error) {
      console.error("Error rejecting registration:", error);
      res.status(500).json({ error: "Failed to reject registration" });
    }
  });

  // Authentication Routes
  app.post("/api/auth/setup-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      // Get auth token
      const authToken = await storage.getAuthToken(token);
      if (!authToken) {
        return res.status(404).json({ error: "Invalid or expired token" });
      }

      // Check if token is expired or already used
      if (authToken.usedAt) {
        return res.status(400).json({ error: "Token has already been used" });
      }

      if (new Date() > authToken.expiresAt) {
        return res.status(400).json({ error: "Token has expired" });
      }

      if (authToken.type !== "password_setup") {
        return res.status(400).json({ error: "Invalid token type" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Update user with password
      const user = await storage.updateUser(authToken.userId, {
        passwordHash,
        passwordSetAt: new Date(),
      } as any);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Mark token as used
      await storage.markAuthTokenUsed(authToken.id);

      // Create session
      (req as any).session.userId = user.id;
      (req as any).session.save((err: any) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }
        res.json({ 
          message: "Password set successfully",
          user: { ...user, passwordHash: undefined },
        });
      });
    } catch (error) {
      console.error("Error setting up password:", error);
      res.status(500).json({ error: "Failed to setup password" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, audience } = req.body;

      console.log("Login attempt for email:", email, "audience:", audience);

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Get user by email
      const user = await storage.getUserByEmail(email);
      console.log("User found:", user ? `ID: ${user.id}, Email: ${user.email}, Role: ${user.role}` : "NOT FOUND");
      
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check if password is set
      if (!user.passwordHash) {
        console.log("Password hash is null for user:", user.email);
        return res.status(401).json({ error: "Password not set. Please check your email for setup instructions." });
      }

      // Verify password
      console.log("Verifying password for user:", user.email);
      const isValid = await bcrypt.compare(password, user.passwordHash);
      console.log("Password valid:", isValid);
      
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Validate audience against user role
      if (audience) {
        if (audience === "eco_admin" && user.role !== "eco_admin") {
          return res.status(403).json({ 
            error: "Access denied. This portal is for Eco Admin team members only." 
          });
        }
        if (audience === "org_portal" && user.role === "eco_admin") {
          return res.status(403).json({ 
            error: "Eco Admin users must use the admin portal at /eco-admin/login" 
          });
        }
      }

      // Create session with audience metadata
      // Ensure session is initialized
      if (!(req as any).session) {
        console.error("[Login] Session not initialized");
        return res.status(500).json({ error: "Session not available" });
      }

      // Regenerate session ID for security (creates new session)
      await new Promise<void>((resolve, reject) => {
        (req as any).session.regenerate((err: any) => {
          if (err) {
            console.error("[Login] Error regenerating session:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      // Set session data after regeneration
      (req as any).session.userId = user.id;
      (req as any).session.audience = audience || (user.role === "eco_admin" ? "eco_admin" : "org_portal");
      
      console.log("[Login] Setting session - userId:", user.id, "audience:", (req as any).session.audience, "sessionID:", (req as any).sessionID);
      
      // Save session and wait for it to complete
      await new Promise<void>((resolve, reject) => {
      (req as any).session.save((err: any) => {
        if (err) {
            console.error("[Login] Error saving session:", err);
            reject(err);
          } else {
            console.log("[Login] Session saved successfully, userId:", (req as any).session.userId, "sessionID:", (req as any).sessionID);
            resolve();
          }
        });
      });

        res.json({ 
          message: "Login successful",
          user: { ...user, passwordHash: undefined },
      });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      (req as any).session.destroy((err: any) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ error: "Failed to logout" });
        }
        res.json({ message: "Logout successful" });
      });
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  app.get("/api/auth/session", async (req, res) => {
    try {
      const cookies = req.headers.cookie;
      console.log("[Session] Request cookies:", cookies);
      const userId = (req as any).session?.userId;
      console.log("[Session] Checking session, userId:", userId, "sessionID:", (req as any).sessionID);
      if (!userId) {
        console.log("[Session] No userId in session, returning 401");
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Include audience from session for portal-specific access control
      const audience = (req as any).session?.audience || (user.role === "eco_admin" ? "eco_admin" : "org_portal");

      res.json({ 
        user: { ...user, passwordHash: undefined },
        audience 
      });
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.get("/api/auth/verify-token", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      const authToken = await storage.getAuthToken(token as string);
      if (!authToken) {
        return res.status(404).json({ error: "Invalid token" });
      }

      if (authToken.usedAt) {
        return res.status(400).json({ error: "Token has already been used", valid: false });
      }

      if (new Date() > authToken.expiresAt) {
        return res.status(400).json({ error: "Token has expired", valid: false });
      }

      res.json({ valid: true, type: authToken.type });
    } catch (error) {
      console.error("Error verifying token:", error);
      res.status(500).json({ error: "Failed to verify token" });
    }
  });

  // =============== MARKETPLACE ROUTES ===============
  
  // Eco Admin - Marketplace Module Management
  app.get("/api/admin/marketplace/modules", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const modules = await storage.listMarketplaceModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching marketplace modules:", error);
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  app.post("/api/admin/marketplace/modules", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const data = insertMarketplaceModuleSchema.parse(req.body);
      const module = await storage.createMarketplaceModule(data);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(400).json({ error: "Failed to create module" });
    }
  });

  app.patch("/api/admin/marketplace/modules/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const data = insertMarketplaceModuleSchema.partial().parse(req.body);
      const module = await storage.updateMarketplaceModule(req.params.id, data);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      res.json(module);
    } catch (error) {
      console.error("Error updating module:", error);
      res.status(400).json({ error: "Failed to update module" });
    }
  });

  app.delete("/api/admin/marketplace/modules/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteMarketplaceModule(req.params.id);
      res.json({ message: "Module deleted successfully" });
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ error: "Failed to delete module" });
    }
  });

  // Eco Admin - Get Module Pricing
  app.get("/api/admin/marketplace/pricing/:moduleId", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const pricing = await storage.listModulePricing(req.params.moduleId);
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching module pricing:", error);
      res.status(500).json({ error: "Failed to fetch module pricing" });
    }
  });

  // Eco Admin - Create Module Pricing
  app.post("/api/admin/marketplace/pricing", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const data = insertModulePricingSchema.parse(req.body);
      const pricing = await storage.createModulePricing(data);
      res.status(201).json(pricing);
    } catch (error) {
      console.error("Error creating module pricing:", error);
      res.status(400).json({ error: "Failed to create module pricing" });
    }
  });

  // Eco Admin - Update Module Pricing
  app.patch("/api/admin/marketplace/pricing/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const data = insertModulePricingSchema.partial().parse(req.body);
      const pricing = await storage.updateModulePricing(req.params.id, data);
      if (!pricing) {
        return res.status(404).json({ error: "Module pricing not found" });
      }
      res.json(pricing);
    } catch (error) {
      console.error("Error updating module pricing:", error);
      res.status(400).json({ error: "Failed to update module pricing" });
    }
  });

  // Eco Admin - Delete Module Pricing
  app.delete("/api/admin/marketplace/pricing/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteModulePricing(req.params.id);
      res.json({ message: "Module pricing deleted successfully" });
    } catch (error) {
      console.error("Error deleting module pricing:", error);
      res.status(500).json({ error: "Failed to delete module pricing" });
    }
  });

  // Eco Admin - Initialize Stripe Products and Prices
  app.post("/api/admin/stripe/initialize", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      await stripeSubscriptionService.createOrUpdateProductsAndPrices();
      res.json({ message: "Stripe products and prices initialized successfully" });
    } catch (error) {
      console.error("Error initializing Stripe:", error);
      res.status(500).json({ error: "Failed to initialize Stripe products and prices" });
    }
  });

  // Admin - Get Subscription Plans
  app.get("/api/admin/subscription-plans", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const plans = await storage.listSubscriptionPlans(true);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  // Admin - Get Country Pricing
  app.get("/api/admin/country-pricing", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const pricing = await storage.listCountryPricing();
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching country pricing:", error);
      res.status(500).json({ error: "Failed to fetch country pricing" });
    }
  });

  // Admin - Create Country Pricing
  app.post("/api/admin/country-pricing", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const data = req.body;
      const pricing = await storage.createCountryPricing(data);
      res.status(201).json(pricing);
    } catch (error) {
      console.error("Error creating country pricing:", error);
      res.status(400).json({ error: "Failed to create country pricing" });
    }
  });

  // Admin - Update Country Pricing
  app.patch("/api/admin/country-pricing/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const data = req.body;
      const pricing = await storage.updateCountryPricing(req.params.id, data);
      if (!pricing) {
        return res.status(404).json({ error: "Country pricing not found" });
      }
      res.json(pricing);
    } catch (error) {
      console.error("Error updating country pricing:", error);
      res.status(400).json({ error: "Failed to update country pricing" });
    }
  });

  // Organization - Marketplace Browsing with country-specific pricing
  app.get("/api/marketplace/modules", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.orgId) {
        return res.status(403).json({ error: "User not associated with an organization" });
      }

      // Get organization to determine country and currency
      const org = await storage.getOrganization(user.orgId);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Get all active modules
      const modules = await storage.listMarketplaceModules(true);

      // Get pricing for organization's country (if country is configured)
      let currencyPricing: any[] = [];
      if (org.country && org.currency) {
        const allPricing = await storage.listModulePricingByCountry(org.country);
        // Filter pricing to match organization's currency
        currencyPricing = allPricing.filter(p => p.currency === org.currency);
      }

      // Create a map of moduleId -> { monthly, yearly } pricing
      const pricingMap = new Map<string, { monthly: any; yearly: any }>();
      for (const pricing of currencyPricing) {
        if (!pricingMap.has(pricing.moduleId)) {
          pricingMap.set(pricing.moduleId, { monthly: null, yearly: null });
        }
        const moduleEntry = pricingMap.get(pricing.moduleId)!;
        if (pricing.billingPeriod === "monthly") {
          moduleEntry.monthly = {
            price: pricing.price,
            currency: pricing.currency,
            billingPeriod: pricing.billingPeriod,
          };
        } else if (pricing.billingPeriod === "yearly") {
          moduleEntry.yearly = {
            price: pricing.price,
            currency: pricing.currency,
            billingPeriod: pricing.billingPeriod,
          };
        }
      }

      // Attach pricing to modules (both monthly and yearly options)
      const modulesWithPricing = modules.map(module => {
        const pricingOptions = pricingMap.get(module.id);
        return {
          ...module,
          pricing: pricingOptions?.monthly || pricingOptions?.yearly || null, // fallback for legacy
          pricingOptions: pricingOptions || null, // new: contains both monthly and yearly
        };
      });

      res.json(modulesWithPricing);
    } catch (error) {
      console.error("Error fetching marketplace:", error);
      res.status(500).json({ error: "Failed to fetch marketplace" });
    }
  });

  // Organization - Get Enabled Modules
  app.get("/api/org/:orgId/modules", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      // Check if user is admin or belongs to the org
      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const orgModules = await storage.listOrganizationModules(req.params.orgId);
      
      // Fetch full module details
      const modulesWithDetails = await Promise.all(
        orgModules.map(async (om) => {
          const module = await storage.getMarketplaceModule(om.moduleId);
          return {
            ...om,
            module,
          };
        })
      );

      res.json(modulesWithDetails);
    } catch (error) {
      console.error("Error fetching organization modules:", error);
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  // Organization - Enable Module
  app.post("/api/org/:orgId/modules", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      // Check if user is admin or belongs to the org
      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if organization is on a paid plan (not free)
      // Modules can only be enabled for organizations with paid subscriptions
      const subscription = await storage.getOrganizationSubscription(req.params.orgId);
      if (!subscription) {
        return res.status(403).json({ 
          error: "Marketplace modules require a paid subscription",
          code: "NO_SUBSCRIPTION",
          message: "Upgrade to a paid plan to unlock marketplace modules and expand your organization's capabilities."
        });
      }
      
        const plan = await storage.getSubscriptionPlan(subscription.planId);
      if (!plan || plan.tierCode.toLowerCase() === "free") {
          return res.status(403).json({ 
            error: "Marketplace modules require a paid subscription",
            code: "FREE_PLAN_RESTRICTION",
            message: "Upgrade to a paid plan to unlock marketplace modules and expand your organization's capabilities."
          });
      }

      const { moduleId } = req.body;
      if (!moduleId) {
        return res.status(400).json({ error: "moduleId is required" });
      }

      // Check if module is already enabled
      const existing = await storage.getOrganizationModule(req.params.orgId, moduleId);
      if (existing) {
        return res.status(400).json({ error: "Module already enabled" });
      }

      // Modules are now included with paid plans - no separate billing
      const data = insertOrganizationModuleSchema.parse({
        orgId: req.params.orgId,
        moduleId,
        enabledBy: userId,
        status: "active",
        billingPeriod: "monthly", // Keep for compatibility but no separate billing
        nextBillingDate: null,
      });

      const orgModule = await storage.enableOrganizationModule(data);

      res.status(201).json(orgModule);
    } catch (error) {
      console.error("Error enabling module:", error);
      res.status(400).json({ error: "Failed to enable module" });
    }
  });

  // Organization - Disable Module
  app.delete("/api/org/:orgId/modules/:moduleId", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      // Check if user is admin or belongs to the org
      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if module is a default module (cannot be disabled)
      const module = await storage.getMarketplaceModule(req.params.moduleId);
      if (module?.isDefault) {
        return res.status(400).json({ error: "Cannot disable default modules" });
      }

      await storage.disableOrganizationModule(req.params.orgId, req.params.moduleId);
      res.json({ message: "Module disabled successfully" });
    } catch (error) {
      console.error("Error disabling module:", error);
      res.status(500).json({ error: "Failed to disable module" });
    }
  });

  // NOTE: Subscription routes (including create-checkout and cancel) are registered earlier 
  // (before /api/org/:orgId) to ensure proper route matching - see lines 621-970 for definitions
  // Duplicate routes removed from this location

  // Stripe Webhook Handler - Process subscription lifecycle events
  app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      return res.status(400).send('Missing stripe-signature header');
    }

    let event;
    try {
      // Verify webhook signature (requires STRIPE_WEBHOOK_SECRET env var)
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured');
        return res.status(500).send('Webhook secret not configured');
      }
      
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // Handle different event types
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as any;
          const orgId = subscription.metadata?.orgId;
          const planId = subscription.metadata?.planId;
          const billingCycle = subscription.metadata?.billingCycle;
          
          if (!orgId || !planId || !billingCycle) {
            console.error('Missing required metadata in subscription:', { orgId, planId, billingCycle });
            break;
          }

          // Validate organization exists
          const org = await storage.getOrganization(orgId);
          if (!org) {
            console.error('Organization not found:', orgId);
            break;
          }

          // Get the plan to validate it exists
          const plan = await storage.getSubscriptionPlan(planId);
          if (!plan) {
            console.error('Plan not found:', planId);
            break;
          }

          // Get or create organization subscription
          const existingSubscription = await storage.getOrganizationSubscription(orgId);
          const subscriptionData = {
            planId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer,
            status: subscription.status,
            billingCycle,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
            canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          };

          if (existingSubscription) {
            // Update existing subscription
            await storage.updateOrganizationSubscription(existingSubscription.id, subscriptionData);
            console.log(`Updated subscription for org ${orgId}: ${subscription.status}`);
          } else {
            // Create new subscription (shouldn't happen in normal flow, but handles edge cases)
            await storage.createOrganizationSubscription({
              orgId,
              memberCount: 0, // Will be updated by member count refresh
              ...subscriptionData,
            });
            console.log(`Created subscription for org ${orgId}: ${subscription.status}`);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          const orgId = subscription.metadata?.orgId;
          
          if (!orgId) {
            console.error('Missing orgId in subscription metadata');
            break;
          }

          // Get FREE tier plan
          const plans = await storage.listSubscriptionPlans(true);
          const freePlan = plans.find(p => p.tierCode === 'free');
          
          if (!freePlan) {
            console.error('FREE plan not found');
            break;
          }

          // Downgrade to FREE tier
          const existingSubscription = await storage.getOrganizationSubscription(orgId);
          if (existingSubscription) {
            await storage.updateOrganizationSubscription(existingSubscription.id, {
              planId: freePlan.id,
              status: 'canceled',
              stripeSubscriptionId: null,
              canceledAt: new Date(),
            });
            
            console.log(`Downgraded org ${orgId} to FREE tier after subscription cancellation`);
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as any;
          const subscriptionId = invoice.subscription;
          
          if (!subscriptionId) break;

          // Find organization by Stripe subscription ID
          const orgs = await storage.listOrganizations();
          const org = orgs.find(o => {
            // We'll need to check organization_subscriptions for the stripe subscription ID
            return false; // Placeholder - would need to query subscriptions
          });

          // Log successful payment
          console.log(`Payment succeeded for subscription ${subscriptionId}: ${invoice.amount_paid / 100} ${invoice.currency}`);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Webhook processing failed');
    }
  });

  // NOTE: Subscription cancel route is registered earlier (before /api/org/:orgId) 
  // to ensure proper route matching - see line 989 for the actual route definition

  // Prayer Settings Routes
  app.get("/api/org/:orgId/prayer-settings", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      // Check if user belongs to the org
      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const settings = await storage.getPrayerSettings(req.params.orgId);
      res.json(settings || null);
    } catch (error) {
      console.error("Error fetching prayer settings:", error);
      res.status(500).json({ error: "Failed to fetch prayer settings" });
    }
  });

  app.post("/api/org/:orgId/prayer-settings", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      // Check if user belongs to the org
      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if settings already exist
      const existing = await storage.getPrayerSettings(req.params.orgId);
      if (existing) {
        return res.status(400).json({ error: "Prayer settings already exist. Use PATCH to update." });
      }

      const { city, country, latitude, longitude, calculationMethod, timezone } = req.body;
      
      if (!city || !country || !timezone) {
        return res.status(400).json({ error: "city, country, and timezone are required" });
      }

      const settings = await storage.createPrayerSettings({
        orgId: req.params.orgId,
        city,
        country,
        latitude: latitude || null,
        longitude: longitude || null,
        calculationMethod: calculationMethod || 2,
        timezone,
      });

      res.status(201).json(settings);
    } catch (error) {
      console.error("Error creating prayer settings:", error);
      res.status(400).json({ error: "Failed to create prayer settings" });
    }
  });

  app.patch("/api/org/:orgId/prayer-settings", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      // Check if user belongs to the org
      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Validate and sanitize input data - convert empty strings to null for optional numeric fields
      const { city, country, latitude, longitude, calculationMethod, timezone } = req.body;
      
      // Convert empty strings to null for optional decimal fields
      const updateData: any = {
        city,
        country,
        latitude: latitude === "" || latitude === null || latitude === undefined ? null : latitude,
        longitude: longitude === "" || longitude === null || longitude === undefined ? null : longitude,
        calculationMethod,
        timezone,
      };

      // Validate using schema
      const validatedData = insertPrayerSettingsSchema.partial().parse(updateData);

      const settings = await storage.updatePrayerSettings(req.params.orgId, validatedData);

      if (!settings) {
        return res.status(404).json({ error: "Prayer settings not found" });
      }

      res.json(settings);
    } catch (error) {
      console.error("Error updating prayer settings:", error);
      res.status(400).json({ error: "Failed to update prayer settings" });
    }
  });

  // Fetch prayer times from AlAdhan API
  app.get("/api/org/:orgId/prayer-times", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      // Check if user belongs to the org
      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const settings = await storage.getPrayerSettings(req.params.orgId);
      if (!settings) {
        return res.status(404).json({ error: "Prayer settings not configured. Please set your location first." });
      }

      // Check if we have cached prayer times from today
      const today = new Date().toISOString().split('T')[0];
      const lastFetched = settings.lastFetched ? new Date(settings.lastFetched).toISOString().split('T')[0] : null;

      if (lastFetched === today && settings.cachedPrayerTimes && Object.keys(settings.cachedPrayerTimes as object).length > 0) {
        // Return cached times
        return res.json(settings.cachedPrayerTimes);
      }

      // Fetch from AlAdhan API
      const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(settings.city)}&country=${encodeURIComponent(settings.country)}&method=${settings.calculationMethod}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`AlAdhan API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code !== 200 || !data.data || !data.data.timings) {
        throw new Error("Invalid response from AlAdhan API");
      }

      const timings = data.data.timings;
      const prayerTimes = {
        fajr: timings.Fajr,
        sunrise: timings.Sunrise,
        dhuhr: timings.Dhuhr,
        asr: timings.Asr,
        maghrib: timings.Maghrib,
        isha: timings.Isha,
        date: data.data.date.readable,
        hijriDate: data.data.date.hijri.date,
      };

      // Cache the prayer times
      await storage.updatePrayerSettings(req.params.orgId, {
        cachedPrayerTimes: prayerTimes as any,
        lastFetched: new Date(),
      });

      res.json(prayerTimes);
    } catch (error) {
      console.error("Error fetching prayer times:", error);
      res.status(500).json({ error: "Failed to fetch prayer times" });
    }
  });

  // Prayer Wall / Prayer Requests Routes

  // Helper function for AI moderation
  async function moderatePrayerRequest(requestText: string, orgId: string) {
    try {
      const org = await storage.getOrganization(orgId);
      
      const prompt = `You are a content moderator for a faith-based organization's prayer wall. Analyze this prayer request for:
1. Inappropriate content (profanity, hate speech, spam, solicitation)
2. Suggested category (health, family, financial, spiritual, guidance, thanksgiving, other)
3. Sentiment (positive, neutral, concerned)

Prayer request: "${requestText}"

Organization religion: ${org?.religion || 'General'}

Respond in JSON format:
{
  "isAppropriate": true/false,
  "flagReason": "reason if flagged, null otherwise",
  "suggestedCategory": "category",
  "sentiment": "sentiment",
  "moderationNotes": "brief notes for admin"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");
      return result;
    } catch (error) {
      console.error("AI moderation error:", error);
      return {
        isAppropriate: true,
        flagReason: null,
        suggestedCategory: "other",
        sentiment: "neutral",
        moderationNotes: "AI moderation unavailable",
      };
    }
  }

  // Public: Get approved prayer requests for an organization
  app.get("/api/prayer-requests", async (req, res) => {
    try {
      let orgId = req.query.orgId as string;
      const orgSlug = req.query.orgSlug as string;

      if (!orgId && !orgSlug) {
        return res.status(400).json({ error: "orgId or orgSlug is required" });
      }

      if (!orgId && orgSlug) {
        const org = await storage.getOrganizationBySlug(orgSlug);
        if (!org) {
          return res.status(404).json({ error: "Organization not found" });
        }
        orgId = org.id;
      }

      // Only return approved and public prayer requests
      const requests = await db
        .select()
        .from(prayerRequests)
        .where(
          and(
            eq(prayerRequests.orgId, orgId),
            eq(prayerRequests.status, "approved"),
            eq(prayerRequests.isPublic, true)
          )
        )
        .orderBy(desc(prayerRequests.isPinned), desc(prayerRequests.createdAt));

      res.json(requests);
    } catch (error) {
      console.error("Error fetching prayer requests:", error);
      res.status(500).json({ error: "Failed to fetch prayer requests" });
    }
  });

  // Public: Submit a new prayer request (with AI moderation)
  app.post("/api/prayer-requests", async (req, res) => {
    try {
      console.log("Prayer request submission received:", req.body);
      const { orgId, submitterName, submitterEmail, requestText, isAnonymous, isPublic } = req.body;

      if (!orgId || !requestText) {
        console.error("Missing required fields:", { orgId, requestText });
        return res.status(400).json({ error: "orgId and requestText are required" });
      }

      // Verify organization exists
      console.log("Verifying organization:", orgId);
      const org = await storage.getOrganization(orgId);
      if (!org) {
        console.error("Organization not found:", orgId);
        return res.status(404).json({ error: "Organization not found" });
      }

      // Run AI moderation
      console.log("Running AI moderation for prayer request");
      const moderation = await moderatePrayerRequest(requestText, orgId);
      console.log("AI moderation result:", moderation);

      console.log("Parsing prayer request data with schema");
      const data = insertPrayerRequestSchema.parse({
        orgId,
        submitterName: isAnonymous ? null : submitterName,
        submitterEmail: isAnonymous ? null : submitterEmail,
        isAnonymous: isAnonymous || false,
        requestText,
        category: moderation.suggestedCategory,
        status: "pending",
        moderationStatus: moderation.isAppropriate ? "approved" : "flagged",
        moderationNotes: moderation.moderationNotes,
        aiSuggestions: moderation,
        isPublic: isPublic !== false,
      });

      console.log("Inserting prayer request into database");
      const prayerRequest = await db.insert(prayerRequests).values(data).returning();
      console.log("Prayer request created successfully:", prayerRequest[0].id);

      res.status(201).json(prayerRequest[0]);
    } catch (error) {
      console.error("Error creating prayer request:", error);
      console.error("Error details:", error instanceof Error ? error.message : error);
      res.status(400).json({ error: "Failed to create prayer request" });
    }
  });

  // Public: Increment prayer count
  app.patch("/api/prayer-requests/:id/pray", async (req, res) => {
    try {
      const request = await db
        .select()
        .from(prayerRequests)
        .where(eq(prayerRequests.id, req.params.id))
        .limit(1);

      if (!request || request.length === 0) {
        return res.status(404).json({ error: "Prayer request not found" });
      }

      const updated = await db
        .update(prayerRequests)
        .set({
          prayerCount: (request[0].prayerCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(prayerRequests.id, req.params.id))
        .returning();

      res.json(updated[0]);
    } catch (error) {
      console.error("Error incrementing prayer count:", error);
      res.status(500).json({ error: "Failed to update prayer count" });
    }
  });

  // Admin: Get all prayer requests for organization
  app.get("/api/org/:orgId/prayer-requests", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const status = req.query.status as string;
      const moderationStatus = req.query.moderationStatus as string;

      let whereConditions: any[] = [eq(prayerRequests.orgId, req.params.orgId)];

      if (status) {
        whereConditions.push(eq(prayerRequests.status, status));
      }

      if (moderationStatus) {
        whereConditions.push(eq(prayerRequests.moderationStatus, moderationStatus));
      }

      const requests = await db
        .select()
        .from(prayerRequests)
        .where(and(...whereConditions))
        .orderBy(desc(prayerRequests.createdAt));

      res.json(requests);
    } catch (error) {
      console.error("Error fetching prayer requests:", error);
      res.status(500).json({ error: "Failed to fetch prayer requests" });
    }
  });

  // Admin: Approve prayer request
  app.patch("/api/org/:orgId/prayer-requests/:id/approve", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const request = await db
        .select()
        .from(prayerRequests)
        .where(eq(prayerRequests.id, req.params.id))
        .limit(1);

      if (!request || request.length === 0 || request[0].orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Prayer request not found" });
      }

      const updated = await db
        .update(prayerRequests)
        .set({
          status: "approved",
          moderationStatus: "approved",
          reviewedBy: userId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(prayerRequests.id, req.params.id))
        .returning();

      res.json(updated[0]);
    } catch (error) {
      console.error("Error approving prayer request:", error);
      res.status(500).json({ error: "Failed to approve prayer request" });
    }
  });

  // Admin: Decline prayer request
  app.patch("/api/org/:orgId/prayer-requests/:id/decline", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const request = await db
        .select()
        .from(prayerRequests)
        .where(eq(prayerRequests.id, req.params.id))
        .limit(1);

      if (!request || request.length === 0 || request[0].orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Prayer request not found" });
      }

      const { reason } = req.body;

      const updated = await db
        .update(prayerRequests)
        .set({
          status: "declined",
          moderationNotes: reason || request[0].moderationNotes,
          reviewedBy: userId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(prayerRequests.id, req.params.id))
        .returning();

      res.json(updated[0]);
    } catch (error) {
      console.error("Error declining prayer request:", error);
      res.status(500).json({ error: "Failed to decline prayer request" });
    }
  });

  // Admin: Mark prayer request as answered
  app.patch("/api/org/:orgId/prayer-requests/:id/answer", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const request = await db
        .select()
        .from(prayerRequests)
        .where(eq(prayerRequests.id, req.params.id))
        .limit(1);

      if (!request || request.length === 0 || request[0].orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Prayer request not found" });
      }

      const { answeredNote } = req.body;

      const updated = await db
        .update(prayerRequests)
        .set({
          status: "answered",
          isAnswered: true,
          answeredAt: new Date(),
          answeredNote: answeredNote || null,
          updatedAt: new Date(),
        })
        .where(eq(prayerRequests.id, req.params.id))
        .returning();

      res.json(updated[0]);
    } catch (error) {
      console.error("Error marking prayer request as answered:", error);
      res.status(500).json({ error: "Failed to mark prayer as answered" });
    }
  });

  // Admin: Pin/unpin prayer request
  app.patch("/api/org/:orgId/prayer-requests/:id/pin", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const request = await db
        .select()
        .from(prayerRequests)
        .where(eq(prayerRequests.id, req.params.id))
        .limit(1);

      if (!request || request.length === 0 || request[0].orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Prayer request not found" });
      }

      const { isPinned } = req.body;

      const updated = await db
        .update(prayerRequests)
        .set({
          isPinned: isPinned !== undefined ? isPinned : !request[0].isPinned,
          updatedAt: new Date(),
        })
        .where(eq(prayerRequests.id, req.params.id))
        .returning();

      res.json(updated[0]);
    } catch (error) {
      console.error("Error pinning/unpinning prayer request:", error);
      res.status(500).json({ error: "Failed to update pin status" });
    }
  });

  // Admin: Delete prayer request
  app.delete("/api/org/:orgId/prayer-requests/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const request = await db
        .select()
        .from(prayerRequests)
        .where(eq(prayerRequests.id, req.params.id))
        .limit(1);

      if (!request || request.length === 0 || request[0].orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Prayer request not found" });
      }

      await db.delete(prayerRequests).where(eq(prayerRequests.id, req.params.id));

      res.json({ message: "Prayer request deleted successfully" });
    } catch (error) {
      console.error("Error deleting prayer request:", error);
      res.status(500).json({ error: "Failed to delete prayer request" });
    }
  });

  // Landing Page Routes
  app.get("/api/org/:orgId/landing-page", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      // Check if user belongs to the org
      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const landingPage = await storage.getLandingPageByOrgId(req.params.orgId);
      res.json(landingPage || null);
    } catch (error) {
      console.error("Error fetching landing page:", error);
      res.status(500).json({ error: "Failed to fetch landing page" });
    }
  });

  app.post("/api/org/:orgId/landing-page", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      // Check if user belongs to the org
      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if landing page already exists for this org
      const existing = await storage.getLandingPageByOrgId(req.params.orgId);
      if (existing) {
        return res.status(409).json({ error: "Landing page already exists for this organization" });
      }

      // Validate request body with drizzle-zod schema
      const validatedData = insertLandingPageSchema.parse({
        ...req.body,
        orgId: req.params.orgId,
        isPublished: false,
      });

      const landingPage = await storage.createLandingPage(validatedData);

      res.status(201).json(landingPage);
    } catch (error) {
      console.error("Error creating landing page:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(400).json({ error: "Failed to create landing page" });
    }
  });

  app.patch("/api/org/:orgId/landing-page", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      // Check if user belongs to the org
      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const existingPage = await storage.getLandingPageByOrgId(req.params.orgId);
      if (!existingPage) {
        return res.status(404).json({ error: "Landing page not found" });
      }

      // Validate partial update with drizzle-zod schema
      const validatedData = insertLandingPageSchema.partial().parse({
        ...req.body,
        orgId: req.params.orgId,
      });

      const landingPage = await storage.updateLandingPage(existingPage.id, validatedData);

      res.json(landingPage);
    } catch (error) {
      console.error("Error updating landing page:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(400).json({ error: "Failed to update landing page" });
    }
  });

  app.post("/api/org/:orgId/landing-page/publish", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      // Check if user belongs to the org
      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const existingPage = await storage.getLandingPageByOrgId(req.params.orgId);
      if (!existingPage) {
        return res.status(404).json({ error: "Landing page not found" });
      }

      const landingPage = await storage.publishLandingPage(existingPage.id);
      res.json(landingPage);
    } catch (error) {
      console.error("Error publishing landing page:", error);
      res.status(500).json({ error: "Failed to publish landing page" });
    }
  });

  app.post("/api/org/:orgId/landing-page/unpublish", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      // Check if user belongs to the org
      if (user.role !== "eco_admin" && user.orgId !== req.params.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const existingPage = await storage.getLandingPageByOrgId(req.params.orgId);
      if (!existingPage) {
        return res.status(404).json({ error: "Landing page not found" });
      }

      const landingPage = await storage.unpublishLandingPage(existingPage.id);
      res.json(landingPage);
    } catch (error) {
      console.error("Error unpublishing landing page:", error);
      res.status(500).json({ error: "Failed to unpublish landing page" });
    }
  });

  // Configure multer for landing page image uploads
  const landingPageImageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  app.post("/api/org/:orgId/landing-page/upload-image", landingPageImageUpload.single('image'), async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const fileName = `landing-page-${Date.now()}-${req.file.originalname}`;
      const objectPath = `/objects/landing-pages/${fileName}`;

      // Save file to local storage as private
      await objectStorageService.saveFile(
        objectPath,
        req.file.buffer,
        {
          contentType: req.file.mimetype,
          visibility: "private",
        }
      );

      // Set ACL for private access
      const aclPolicy: ObjectAclPolicy = {
        owner: user.id,
        visibility: "private",
      };
      await objectStorageService.trySetObjectEntityAclPolicy(objectPath, aclPolicy);

      // Return the file URL
      const fileUrl = buildUrl(`/api/files${objectPath}`);
      res.json({ url: fileUrl });
    } catch (error) {
      console.error("Error uploading landing page image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Public landing page API - no auth required
  app.get("/api/public/landing-page/:slug", async (req, res) => {
    try {
      const landingPage = await storage.getLandingPageBySlug(req.params.slug);
      
      if (!landingPage) {
        return res.status(404).json({ error: "Landing page not found" });
      }

      if (!landingPage.isPublished) {
        return res.status(403).json({ error: "This landing page is not published" });
      }

      // Fetch all data needed for the landing page
      const org = await storage.getOrganization(landingPage.orgId);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const settings = landingPage.settings as any || {};
      
      // Fetch data based on what's enabled in settings
      let campaigns: any[] = [];
      let events: any[] = [];
      let livestreams: any[] = [];
      let prayerTimes: any = null;
      let sermons: any[] = [];
      let volunteers: any[] = [];
      let activities: any[] = [];

      if (settings.showCampaigns) {
        campaigns = await storage.listCampaigns(landingPage.orgId);
        // Only show active campaigns
        campaigns = campaigns.filter((c: any) => c.status === 'active');
      }

      if (settings.showEvents) {
        events = await storage.listEvents(landingPage.orgId);
        // Only show upcoming/active events
        events = events.filter((e: any) => {
          const eventDate = new Date(e.startDate);
          return eventDate >= new Date() || e.status === 'active';
        });
      }

      if (settings.showLivestreams) {
        livestreams = await storage.listLivestreams(landingPage.orgId);
        // Only show upcoming or live livestreams
        livestreams = livestreams.filter((l: any) => l.status === 'upcoming' || l.status === 'live');
      }

      if (settings.showPrayerTimes) {
        try {
          prayerTimes = await storage.getPrayerSettings(landingPage.orgId);
        } catch (error) {
          console.error("Error fetching prayer times:", error);
        }
      }

      if (settings.showSermons) {
        try {
          sermons = await storage.listSermons(landingPage.orgId);
          // Only show published sermons, limit to 6 recent ones
          sermons = sermons
            .filter((s: any) => s.status === 'published')
            .slice(0, 6);
        } catch (error) {
          console.error("Error fetching sermons:", error);
        }
      }

      if (settings.showVolunteers) {
        try {
          volunteers = await storage.listVolunteers(landingPage.orgId);
          // Only show active volunteers
          volunteers = volunteers.filter((v: any) => v.status === 'active');
        } catch (error) {
          console.error("Error fetching volunteers:", error);
        }
      }

      if (settings.showActivities) {
        try {
          activities = await storage.listActivities(landingPage.orgId);
          // Only show published activities
          activities = activities.filter((a: any) => a.isPublished);
        } catch (error) {
          console.error("Error fetching activities:", error);
        }
      }

      res.json({
        ...landingPage,
        organization: org,
        campaigns,
        events,
        livestreams,
        prayerTimes,
        sermons,
        volunteers,
        activities,
      });
    } catch (error) {
      console.error("Error fetching public landing page:", error);
      res.status(500).json({ error: "Failed to fetch landing page" });
    }
  });

  // Donations Routes
  app.get("/api/org/:orgId/donations", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Parse filter parameters
      const { donationType, startDate, endDate, donorId, minAmount, maxAmount, giftAidOptIn, giftAidEligible, taxReliefClaimed } = req.query;

      const filters: any = {};
      if (donationType) filters.donationType = donationType as string;
      if (donorId) filters.donorId = donorId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (minAmount) filters.minAmount = minAmount as string;
      if (maxAmount) filters.maxAmount = maxAmount as string;
      if (giftAidOptIn !== undefined) filters.giftAidOptIn = giftAidOptIn === 'true';
      if (giftAidEligible !== undefined) filters.giftAidEligible = giftAidEligible === 'true';
      if (taxReliefClaimed !== undefined) filters.taxReliefClaimed = taxReliefClaimed === 'true';

      const donations = await storage.filterDonations(req.params.orgId, filters);
      res.json(donations);
    } catch (error) {
      console.error("Error fetching donations:", error);
      res.status(500).json({ error: "Failed to fetch donations" });
    }
  });

  app.post("/api/org/:orgId/donations", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Extract sendThankYou before validation (it's not part of the schema)
      const { sendThankYou, ...donationRequestData } = req.body;
      const shouldSendThankYou = sendThankYou === true;

      // Map frontend field names to database field names
      const donationRequestDataMapped = {
        ...donationRequestData,
        // Map donorTown -> donorCity, donorState -> donorCountry for database
        donorCity: donationRequestData.donorTown || donationRequestData.donorCity,
        donorCountry: donationRequestData.donorState || donationRequestData.donorCountry,
      };
      // Remove the frontend field names if they exist
      delete donationRequestDataMapped.donorTown;
      delete donationRequestDataMapped.donorState;
      
      const validatedData = insertDonationSchema.parse({
        ...donationRequestDataMapped,
        orgId: req.params.orgId,
      });

      // Calculate tax relief amount if Gift Aid opted in
      let donationData = { ...validatedData };
      console.log('[Gift Aid Debug] giftAidOptIn:', validatedData.giftAidOptIn);
      if (validatedData.giftAidOptIn) {
        const org = await storage.getOrganization(req.params.orgId);
        console.log('[Gift Aid Debug] Organization country:', org?.country);
        if (org?.country) {
          // Get Gift Aid percentage from organization settings (default to 25%)
          const giftAidPercentage = (org.settings as any)?.giftAidPercentage || 25;
          console.log('[Gift Aid Debug] Gift Aid percentage from settings:', giftAidPercentage);
          
          if (giftAidPercentage > 0) {
            const amount = parseFloat(validatedData.amount);
            const taxReliefAmount = (amount * (giftAidPercentage / 100)).toFixed(2);
            console.log('[Gift Aid Debug] Calculated tax relief:', taxReliefAmount, 'from amount:', amount, 'using percentage:', giftAidPercentage);
            donationData = {
              ...donationData,
              taxReliefAmount,
              giftAidEligible: true, // Auto-mark as eligible if they opted in and provided address
            };
          } else {
            console.log('[Gift Aid Debug] Gift Aid percentage is 0');
          }
        } else {
          console.log('[Gift Aid Debug] No organization country found');
        }
      } else {
        console.log('[Gift Aid Debug] Gift Aid not opted in');
      }

      let donation = await storage.createDonation(donationData);

      // Send thank you email if requested
      if (shouldSendThankYou && validatedData.donorId) {
        try {
          const donor = await storage.getDonor(validatedData.donorId);
          const org = await storage.getOrganization(req.params.orgId);
          
          if (donor && org) {
            await sendThankYouEmail({
              to: donor.email,
              donorName: `${donor.firstName} ${donor.lastName}`,
              amount: `${validatedData.currency} ${parseFloat(validatedData.amount).toFixed(2)}`,
              donationType: validatedData.donationType,
              organizationName: org.name,
              logoUrl: org.logoUrl || undefined,
            });

            // Update donation to mark thank you as sent
            const thankYouSentAt = new Date();
            await db.update(donations)
              .set({ 
                thankYouSent: true, 
                thankYouSentAt 
              })
              .where(eq(donations.id, donation.id));
            
            // Update the response object to include the new flags
            donation = {
              ...donation,
              thankYouSent: true,
              thankYouSentAt,
            };
          }
        } catch (emailError) {
          console.error("Error sending thank you email:", emailError);
          // Don't fail the donation creation if email fails
        }
      }

      res.json(donation);
    } catch (error) {
      console.error("Error creating donation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create donation" });
    }
  });

  app.patch("/api/org/:orgId/donations/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const donation = await storage.getDonation(req.params.id);
      if (!donation || donation.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Donation not found" });
      }

      const validatedData = insertDonationSchema.partial().parse(req.body);
      const updatedDonation = await storage.updateDonation(req.params.id, validatedData);

      res.json(updatedDonation);
    } catch (error) {
      console.error("Error updating donation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update donation" });
    }
  });

  app.delete("/api/org/:orgId/donations/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const donation = await storage.getDonation(req.params.id);
      if (!donation || donation.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Donation not found" });
      }

      await storage.deleteDonation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting donation:", error);
      res.status(500).json({ error: "Failed to delete donation" });
    }
  });

  // Receipt upload route
  const receiptUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for receipts
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/', 'application/pdf'];
      if (allowedTypes.some(type => file.mimetype.startsWith(type))) {
        cb(null, true);
      } else {
        cb(new Error('Only image and PDF files are allowed'));
      }
    }
  });

  app.post("/api/org/:orgId/donations/upload-receipt", receiptUpload.single('receipt'), async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No receipt file provided" });
      }

      const fileName = `receipt-${Date.now()}-${req.file.originalname}`;
      const objectPath = `/objects/receipts/${fileName}`;

      // Save file to local storage as private
      await objectStorageService.saveFile(
        objectPath,
        req.file.buffer,
        {
          contentType: req.file.mimetype,
          visibility: "private",
        }
      );

      // Set ACL for private access
      const aclPolicy: ObjectAclPolicy = {
        owner: user.id,
        visibility: "private",
      };
      await objectStorageService.trySetObjectEntityAclPolicy(objectPath, aclPolicy);

      // Return the file URL
      const fileUrl = buildUrl(`/api/files${objectPath}`);
      res.json({ url: fileUrl });
    } catch (error) {
      console.error("Error uploading receipt:", error);
      res.status(500).json({ error: "Failed to upload receipt" });
    }
  });

  // Note: File serving is handled by the unified /api/files/* route above

  // Email Templates Routes
  app.get("/api/org/:orgId/email-templates", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { templateType } = req.query;
      const templates = await storage.listEmailTemplates(
        req.params.orgId,
        templateType as string | undefined
      );
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ error: "Failed to fetch email templates" });
    }
  });

  app.get("/api/org/:orgId/email-templates/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const template = await storage.getEmailTemplate(req.params.id);
      if (!template || template.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Email template not found" });
      }

      res.json(template);
    } catch (error) {
      console.error("Error fetching email template:", error);
      res.status(500).json({ error: "Failed to fetch email template" });
    }
  });

  app.post("/api/org/:orgId/email-templates", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      console.log('Creating email template - request body:', JSON.stringify(req.body, null, 2));

      const validatedData = insertEmailTemplateSchema.parse({
        ...req.body,
        orgId: req.params.orgId,
      });

      console.log('Validated data:', JSON.stringify(validatedData, null, 2));

      const template = await storage.createEmailTemplate(validatedData);
      console.log('Created template:', JSON.stringify(template, null, 2));
      res.json(template);
    } catch (error) {
      console.error("Error creating email template:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create email template" });
    }
  });

  app.patch("/api/org/:orgId/email-templates/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const template = await storage.getEmailTemplate(req.params.id);
      if (!template || template.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Email template not found" });
      }

      const validatedData = insertEmailTemplateSchema.partial().parse(req.body);
      const updatedTemplate = await storage.updateEmailTemplate(req.params.id, validatedData);

      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating email template:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update email template" });
    }
  });

  app.delete("/api/org/:orgId/email-templates/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const template = await storage.getEmailTemplate(req.params.id);
      if (!template || template.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Email template not found" });
      }

      // Prevent deletion of default templates
      if (template.isDefault) {
        return res.status(400).json({ 
          error: "Cannot delete default template. You can edit it, but default templates cannot be removed." 
        });
      }

      await storage.deleteEmailTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting email template:", error);
      res.status(500).json({ error: "Failed to delete email template" });
    }
  });

  app.post("/api/org/:orgId/email-templates/:id/set-default", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const template = await storage.getEmailTemplate(req.params.id);
      if (!template || template.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Email template not found" });
      }

      await storage.setDefaultEmailTemplate(req.params.id, template.templateType, req.params.orgId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default email template:", error);
      res.status(500).json({ error: "Failed to set default template" });
    }
  });

  // Member Tags Routes
  app.get("/api/org/:orgId/member-tags", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const tags = await storage.listMemberTags(req.params.orgId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching member tags:", error);
      res.status(500).json({ error: "Failed to fetch member tags" });
    }
  });

  app.post("/api/org/:orgId/member-tags", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validatedData = insertMemberTagSchema.parse({
        ...req.body,
        orgId: req.params.orgId,
      });

      const tag = await storage.createMemberTag(validatedData);
      res.json(tag);
    } catch (error) {
      console.error("Error creating member tag:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create member tag" });
    }
  });

  app.patch("/api/org/:orgId/member-tags/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const tag = await storage.getMemberTag(req.params.id);
      if (!tag || tag.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Member tag not found" });
      }

      const validatedData = insertMemberTagSchema.partial().parse(req.body);
      const updatedTag = await storage.updateMemberTag(req.params.id, validatedData);

      res.json(updatedTag);
    } catch (error) {
      console.error("Error updating member tag:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update member tag" });
    }
  });

  app.delete("/api/org/:orgId/member-tags/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const tag = await storage.getMemberTag(req.params.id);
      if (!tag || tag.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Member tag not found" });
      }

      await storage.deleteMemberTag(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting member tag:", error);
      res.status(500).json({ error: "Failed to delete member tag" });
    }
  });

  // Member Tag Assignments Routes
  app.post("/api/org/:orgId/members/:memberId/tags", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { tagId } = req.body;
      if (!tagId) {
        return res.status(400).json({ error: "tagId is required" });
      }

      const assignment = await storage.assignTagToMember(
        req.params.orgId,
        req.params.memberId,
        tagId
      );
      res.json(assignment);
    } catch (error) {
      console.error("Error assigning tag to member:", error);
      res.status(500).json({ error: "Failed to assign tag to member" });
    }
  });

  app.delete("/api/org/:orgId/members/:memberId/tags/:tagId", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.removeTagFromMember(req.params.memberId, req.params.tagId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing tag from member:", error);
      res.status(500).json({ error: "Failed to remove tag from member" });
    }
  });

  app.get("/api/org/:orgId/members/:memberId/tags", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const tags = await storage.getMemberTags(req.params.memberId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching member tags:", error);
      res.status(500).json({ error: "Failed to fetch member tags" });
    }
  });

  app.get("/api/org/:orgId/tags/:tagId/members", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const members = await storage.getMembersByTag(req.params.tagId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching members by tag:", error);
      res.status(500).json({ error: "Failed to fetch members by tag" });
    }
  });

  // Email Campaigns Routes
  app.get("/api/org/:orgId/email-campaigns", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { status } = req.query;
      const campaigns = await storage.listEmailCampaigns(
        req.params.orgId,
        status as string | undefined
      );
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching email campaigns:", error);
      res.status(500).json({ error: "Failed to fetch email campaigns" });
    }
  });

  app.post("/api/org/:orgId/email-campaigns", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validatedData = insertEmailCampaignSchema.parse({
        ...req.body,
        orgId: req.params.orgId,
      });

      const campaign = await storage.createEmailCampaign(validatedData);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating email campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create email campaign" });
    }
  });

  app.get("/api/org/:orgId/email-campaigns/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const campaign = await storage.getEmailCampaign(req.params.id);
      if (!campaign || campaign.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Email campaign not found" });
      }

      res.json(campaign);
    } catch (error) {
      console.error("Error fetching email campaign:", error);
      res.status(500).json({ error: "Failed to fetch email campaign" });
    }
  });

  app.patch("/api/org/:orgId/email-campaigns/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const campaign = await storage.getEmailCampaign(req.params.id);
      if (!campaign || campaign.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Email campaign not found" });
      }

      const validatedData = insertEmailCampaignSchema.partial().parse(req.body);
      const updatedCampaign = await storage.updateEmailCampaign(req.params.id, validatedData);

      res.json(updatedCampaign);
    } catch (error) {
      console.error("Error updating email campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update email campaign" });
    }
  });

  app.delete("/api/org/:orgId/email-campaigns/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const campaign = await storage.getEmailCampaign(req.params.id);
      if (!campaign || campaign.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Email campaign not found" });
      }

      await storage.deleteEmailCampaign(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting email campaign:", error);
      res.status(500).json({ error: "Failed to delete email campaign" });
    }
  });

  app.post("/api/org/:orgId/email-campaigns/:id/send", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const campaign = await storage.getEmailCampaign(req.params.id);
      if (!campaign || campaign.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Email campaign not found" });
      }

      // Send campaign asynchronously (don't await to respond quickly)
      sendCampaign(req.params.id, storage).catch((error) => {
        console.error("Error in background email send:", error);
      });

      res.json({ message: "Campaign queued for sending", "data-testid": "success-campaign-queued" });
    } catch (error) {
      console.error("Error sending email campaign:", error);
      res.status(500).json({ error: "Failed to queue campaign for sending" });
    }
  });

  // Members API Routes
  app.get("/api/org/:orgId/members", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Query users table directly filtered by orgId
      const members = await db.select().from(users).where(eq(users.orgId, req.params.orgId));

      const membersWithTags = await Promise.all(
        members.map(async (member) => ({
          ...member,
          tags: await storage.getMemberTags(member.id),
        }))
      );

      res.json(membersWithTags);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  // Email Unsubscribe Route (Public - No Auth)
  app.post("/api/email/unsubscribe/:token", async (req, res) => {
    try {
      const { token } = req.params;

      // Find recipient by unsubscribe token
      const recipient = await storage.getRecipientByToken(token);
      if (!recipient) {
        return res.status(404).json({ 
          error: "Invalid unsubscribe link",
          "data-testid": "error-invalid-token"
        });
      }

      // Update recipient: set unsubscribedAt and status
      await storage.updateEmailRecipient(recipient.id, {
        unsubscribedAt: new Date(),
        status: 'unsubscribed'
      });

      // Update user: set emailOptedOut to true
      const user = await storage.getUserByEmail(recipient.email);
      if (user) {
        await storage.updateUser(user.id, {
          emailOptedOut: true
        });
      }

      // Increment campaign unsubscribedCount
      const campaign = await storage.getEmailCampaign(recipient.campaignId);
      if (campaign) {
        await storage.updateCampaignStats(recipient.campaignId, {
          unsubscribedCount: (campaign.unsubscribedCount || 0) + 1
        });
      }

      // Create email event for unsubscribe
      await storage.createEmailEvent({
        campaignId: recipient.campaignId,
        recipientId: recipient.id,
        resendEmailId: recipient.resendEmailId,
        eventType: 'unsubscribed',
        email: recipient.email,
        metadata: {}
      });

      res.json({ 
        message: "You have been successfully unsubscribed from our emails",
        "data-testid": "success-unsubscribed"
      });
    } catch (error) {
      console.error("Error processing unsubscribe:", error);
      res.status(500).json({ 
        error: "Failed to process unsubscribe request",
        "data-testid": "error-unsubscribe-failed"
      });
    }
  });

  // Resend Webhook Route (Public - No Auth)
  app.post("/api/webhooks/resend", async (req, res) => {
    try {
      const payload = req.body;
      console.log("Received Resend webhook:", JSON.stringify(payload, null, 2));

      // Extract event data
      const { type, data } = payload;
      if (!type || !data) {
        console.error("Invalid webhook payload: missing type or data");
        return res.status(400).json({ error: "Invalid webhook payload" });
      }

      const { email_id: resendEmailId, to } = data;
      const recipientEmail = Array.isArray(to) ? to[0] : to;

      if (!resendEmailId) {
        console.error("Invalid webhook payload: missing email_id");
        return res.status(400).json({ error: "Missing email_id in webhook payload" });
      }

      // Find recipient by resendEmailId
      const recipient = await storage.getRecipientByResendId(resendEmailId);
      if (!recipient) {
        console.log(`Recipient not found for resendEmailId: ${resendEmailId}`);
        // Return 200 to prevent Resend from retrying
        return res.status(200).json({ message: "Recipient not found, ignored" });
      }

      const campaign = await storage.getEmailCampaign(recipient.campaignId);
      if (!campaign) {
        console.log(`Campaign not found for recipient: ${recipient.id}`);
        return res.status(200).json({ message: "Campaign not found, ignored" });
      }

      // Handle different event types
      switch (type) {
        case 'email.delivered':
          await storage.updateEmailRecipient(recipient.id, {
            deliveredAt: new Date(),
            status: 'delivered'
          });
          await storage.updateCampaignStats(campaign.id, {
            deliveredCount: (campaign.deliveredCount || 0) + 1
          });
          await storage.createEmailEvent({
            campaignId: campaign.id,
            recipientId: recipient.id,
            resendEmailId,
            eventType: 'delivered',
            email: recipientEmail,
            metadata: data
          });
          console.log(`Email delivered to ${recipientEmail}`);
          break;

        case 'email.bounced':
          await storage.updateEmailRecipient(recipient.id, {
            bouncedAt: new Date(),
            status: 'bounced',
            errorMessage: data.reason || 'Email bounced'
          });
          await storage.updateCampaignStats(campaign.id, {
            bouncedCount: (campaign.bouncedCount || 0) + 1
          });
          await storage.createEmailEvent({
            campaignId: campaign.id,
            recipientId: recipient.id,
            resendEmailId,
            eventType: 'bounced',
            email: recipientEmail,
            metadata: data
          });
          console.log(`Email bounced for ${recipientEmail}: ${data.reason || 'Unknown reason'}`);
          break;

        case 'email.opened':
          // Only update if not already opened
          if (!recipient.openedAt) {
            await storage.updateEmailRecipient(recipient.id, {
              openedAt: new Date()
            });
            await storage.updateCampaignStats(campaign.id, {
              openedCount: (campaign.openedCount || 0) + 1
            });
          }
          await storage.createEmailEvent({
            campaignId: campaign.id,
            recipientId: recipient.id,
            resendEmailId,
            eventType: 'opened',
            email: recipientEmail,
            metadata: data
          });
          console.log(`Email opened by ${recipientEmail}`);
          break;

        case 'email.clicked':
          // Only update if not already clicked
          if (!recipient.clickedAt) {
            await storage.updateEmailRecipient(recipient.id, {
              clickedAt: new Date()
            });
            await storage.updateCampaignStats(campaign.id, {
              clickedCount: (campaign.clickedCount || 0) + 1
            });
          }
          await storage.createEmailEvent({
            campaignId: campaign.id,
            recipientId: recipient.id,
            resendEmailId,
            eventType: 'clicked',
            email: recipientEmail,
            metadata: data
          });
          console.log(`Email link clicked by ${recipientEmail}`);
          break;

        case 'email.complained':
          await storage.createEmailEvent({
            campaignId: campaign.id,
            recipientId: recipient.id,
            resendEmailId,
            eventType: 'complained',
            email: recipientEmail,
            metadata: data
          });
          console.log(`Email complaint from ${recipientEmail}`);
          break;

        default:
          console.log(`Unhandled webhook event type: ${type}`);
      }

      res.status(200).json({ message: "Webhook processed successfully" });
    } catch (error) {
      console.error("Error processing Resend webhook:", error);
      // Return 200 to prevent Resend from retrying on our internal errors
      res.status(200).json({ message: "Webhook processing failed, but acknowledged" });
    }
  });

  // Email Metrics Dashboard Route
  app.get("/api/org/:orgId/email-metrics", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get all sent campaigns for this organization
      const allCampaigns = await storage.listEmailCampaigns(req.params.orgId);
      const sentCampaigns = allCampaigns.filter(c => c.status === 'sent');

      // Calculate aggregate metrics
      const totalCampaignsSent = sentCampaigns.length;
      const totalEmailsSent = sentCampaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
      const totalOpened = sentCampaigns.reduce((sum, c) => sum + (c.openedCount || 0), 0);
      const totalClicked = sentCampaigns.reduce((sum, c) => sum + (c.clickedCount || 0), 0);
      const totalBounced = sentCampaigns.reduce((sum, c) => sum + (c.bouncedCount || 0), 0);

      // Calculate percentages
      const overallOpenRate = totalEmailsSent > 0 
        ? ((totalOpened / totalEmailsSent) * 100).toFixed(2) 
        : '0.00';
      const overallClickRate = totalEmailsSent > 0 
        ? ((totalClicked / totalEmailsSent) * 100).toFixed(2) 
        : '0.00';
      const overallBounceRate = totalEmailsSent > 0 
        ? ((totalBounced / totalEmailsSent) * 100).toFixed(2) 
        : '0.00';

      // Get recent campaign performance (last 10 campaigns)
      const recentCampaigns = sentCampaigns
        .sort((a, b) => {
          const dateA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
          const dateB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 10)
        .map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          sentAt: campaign.sentAt,
          sentCount: campaign.sentCount || 0,
          deliveredCount: campaign.deliveredCount || 0,
          openedCount: campaign.openedCount || 0,
          clickedCount: campaign.clickedCount || 0,
          bouncedCount: campaign.bouncedCount || 0,
          unsubscribedCount: campaign.unsubscribedCount || 0,
          openRate: campaign.sentCount > 0 
            ? (((campaign.openedCount || 0) / campaign.sentCount) * 100).toFixed(2) 
            : '0.00',
          clickRate: campaign.sentCount > 0 
            ? (((campaign.clickedCount || 0) / campaign.sentCount) * 100).toFixed(2) 
            : '0.00',
          bounceRate: campaign.sentCount > 0 
            ? (((campaign.bouncedCount || 0) / campaign.sentCount) * 100).toFixed(2) 
            : '0.00',
        }));

      res.json({
        totalCampaignsSent,
        totalEmailsSent,
        overallOpenRate,
        overallClickRate,
        overallBounceRate,
        recentCampaigns,
        "data-testid": "email-metrics-data"
      });
    } catch (error) {
      console.error("Error fetching email metrics:", error);
      res.status(500).json({ 
        error: "Failed to fetch email metrics",
        "data-testid": "error-metrics-failed"
      });
    }
  });

  // Sermon Library Routes
  app.get("/api/org/:orgId/sermons", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { categoryId, speaker, platform, status, startDate, endDate, isFeatured, search } = req.query;

      let sermons;
      if (search) {
        sermons = await storage.searchSermons(req.params.orgId, search as string);
      } else if (categoryId || speaker || platform || status || startDate || endDate || isFeatured !== undefined) {
        sermons = await storage.filterSermons(req.params.orgId, {
          categoryId: categoryId as string,
          speaker: speaker as string,
          platform: platform as string,
          status: status as string,
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
          isFeatured: isFeatured === 'true',
        });
      } else {
        sermons = await storage.listSermons(req.params.orgId);
      }

      // Get tags for each sermon
      const sermonsWithTags = await Promise.all(
        sermons.map(async (sermon) => ({
          ...sermon,
          tags: await storage.getSermonTags(sermon.id),
        }))
      );

      res.json(sermonsWithTags);
    } catch (error) {
      console.error("Error fetching sermons:", error);
      res.status(500).json({ error: "Failed to fetch sermons" });
    }
  });

  app.get("/api/org/:orgId/sermons/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const sermon = await storage.getSermon(req.params.id);
      if (!sermon || sermon.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Sermon not found" });
      }

      const tags = await storage.getSermonTags(sermon.id);
      res.json({ ...sermon, tags });
    } catch (error) {
      console.error("Error fetching sermon:", error);
      res.status(500).json({ error: "Failed to fetch sermon" });
    }
  });

  app.post("/api/org/:orgId/sermons", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const insertData = insertSermonSchema.parse({
        ...req.body,
        orgId: req.params.orgId,
      });

      const sermon = await storage.createSermon(insertData);

      // Handle tags if provided
      if (req.body.tagIds && Array.isArray(req.body.tagIds)) {
        for (const tagId of req.body.tagIds) {
          await storage.addTagToSermon(sermon.id, tagId);
        }
      }

      const tags = await storage.getSermonTags(sermon.id);
      res.json({ ...sermon, tags });
    } catch (error) {
      console.error("Error creating sermon:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid sermon data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create sermon" });
    }
  });

  app.patch("/api/org/:orgId/sermons/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const sermon = await storage.getSermon(req.params.id);
      if (!sermon || sermon.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Sermon not found" });
      }

      const updateData = insertSermonSchema.partial().parse(req.body);
      const updatedSermon = await storage.updateSermon(req.params.id, updateData);

      // Handle tag updates if provided
      if (req.body.tagIds && Array.isArray(req.body.tagIds)) {
        // Remove all existing tags
        const currentTags = await storage.getSermonTags(sermon.id);
        for (const tag of currentTags) {
          await storage.removeTagFromSermon(sermon.id, tag.id);
        }

        // Add new tags
        for (const tagId of req.body.tagIds) {
          await storage.addTagToSermon(sermon.id, tagId);
        }
      }

      const tags = await storage.getSermonTags(sermon.id);
      res.json({ ...updatedSermon, tags });
    } catch (error) {
      console.error("Error updating sermon:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid sermon data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update sermon" });
    }
  });

  app.delete("/api/org/:orgId/sermons/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const sermon = await storage.getSermon(req.params.id);
      if (!sermon || sermon.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Sermon not found" });
      }

      await storage.deleteSermon(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting sermon:", error);
      res.status(500).json({ error: "Failed to delete sermon" });
    }
  });

  app.post("/api/org/:orgId/sermons/:id/view", async (req, res) => {
    try {
      const sermon = await storage.getSermon(req.params.id);
      if (!sermon || sermon.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Sermon not found" });
      }

      await storage.incrementSermonViews(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error incrementing sermon views:", error);
      res.status(500).json({ error: "Failed to increment views" });
    }
  });

  // Sermon Categories Routes
  app.get("/api/org/:orgId/sermon-categories", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const categories = await storage.listSermonCategories(req.params.orgId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching sermon categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/org/:orgId/sermon-categories", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const insertData = insertSermonCategorySchema.parse({
        ...req.body,
        orgId: req.params.orgId,
      });

      const category = await storage.createSermonCategory(insertData);
      res.json(category);
    } catch (error) {
      console.error("Error creating sermon category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid category data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.patch("/api/org/:orgId/sermon-categories/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const category = await storage.getSermonCategory(req.params.id);
      if (!category || category.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Category not found" });
      }

      const updateData = insertSermonCategorySchema.partial().parse(req.body);
      const updatedCategory = await storage.updateSermonCategory(req.params.id, updateData);
      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating sermon category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid category data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/org/:orgId/sermon-categories/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const category = await storage.getSermonCategory(req.params.id);
      if (!category || category.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Category not found" });
      }

      await storage.deleteSermonCategory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting sermon category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Sermon Tags Routes
  app.get("/api/org/:orgId/sermon-tags", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const tags = await storage.listSermonTags(req.params.orgId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching sermon tags:", error);
      res.status(500).json({ error: "Failed to fetch tags" });
    }
  });

  app.post("/api/org/:orgId/sermon-tags", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const insertData = insertSermonTagSchema.parse({
        ...req.body,
        orgId: req.params.orgId,
      });

      const tag = await storage.createSermonTag(insertData);
      res.json(tag);
    } catch (error) {
      console.error("Error creating sermon tag:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid tag data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create tag" });
    }
  });

  app.patch("/api/org/:orgId/sermon-tags/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const tag = await storage.getSermonTag(req.params.id);
      if (!tag || tag.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Tag not found" });
      }

      const updateData = insertSermonTagSchema.partial().parse(req.body);
      const updatedTag = await storage.updateSermonTag(req.params.id, updateData);
      res.json(updatedTag);
    } catch (error) {
      console.error("Error updating sermon tag:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid tag data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update tag" });
    }
  });

  app.delete("/api/org/:orgId/sermon-tags/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== "eco_admin" && user.orgId !== req.params.orgId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const tag = await storage.getSermonTag(req.params.id);
      if (!tag || tag.orgId !== req.params.orgId) {
        return res.status(404).json({ error: "Tag not found" });
      }

      await storage.deleteSermonTag(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting sermon tag:", error);
      res.status(500).json({ error: "Failed to delete tag" });
    }
  });

  // AI Chatbot Route (Public - no auth required)
  app.post("/api/public/chat", async (req, res) => {
    try {
      const { message, orgSlug, conversationHistory } = req.body;
      
      if (!message || !orgSlug) {
        return res.status(400).json({ error: "Message and organization slug are required" });
      }

      // Get organization details for context
      // Try case-insensitive lookup first, then exact match
      const org = await storage.getOrganizationBySlug(orgSlug) || 
                  await storage.getOrganizationBySlug(orgSlug.toLowerCase()) ||
                  await storage.getOrganizationBySlug(orgSlug.trim());
      
      if (!org) {
        console.error(`Organization not found for slug: "${orgSlug}"`);
        // Try to find organizations with similar slugs for debugging
        const allOrgs = await storage.listOrganizations();
        const similarSlugs = allOrgs
          .filter(o => o.slug && (o.slug.toLowerCase().includes(orgSlug.toLowerCase()) || orgSlug.toLowerCase().includes(o.slug?.toLowerCase() || '')))
          .map(o => o.slug)
          .slice(0, 5);
        console.error(`Available organization slugs (similar):`, similarSlugs);
        return res.status(404).json({ 
          error: "Organization not found",
          providedSlug: orgSlug,
          suggestion: similarSlugs.length > 0 ? `Did you mean: ${similarSlugs[0]}?` : undefined
        });
      }

      // Build comprehensive organization context using modular context builder
      const orgContext = await buildOrgChatContext(org.id);
      console.log("🤖 AI Chat - Organization Context Length:", orgContext.length);
      console.log("🤖 AI Chat - Context Preview:", orgContext.substring(0, 200));

      // Build system prompt with enhanced context
      const systemPrompt = `You are a helpful AI assistant for ${org.name}, a ${org.religion || 'faith-based'} organization. 

Your role is to help members and visitors with questions about:
- Donations and giving (recurring gifts, impact, donation tips)
- Active campaigns and fundraising progress
- Upcoming events and registration
- Classes and activities
- Volunteer opportunities
- Beneficiary support and community impact
- Livestream schedules
- Sermons and spiritual content
- General information about the organization

Organization Profile:
- Name: ${org.name}
- Location: ${org.city ? `${org.city}, ${org.state || ''} ${org.country || ''}` : 'Not specified'}
- Contact: ${org.email}${org.phone ? `\n- Phone: ${org.phone}` : ''}

${orgContext}

Donation Tips:
- Emphasize the impact of recurring donations (monthly giving provides predictable support)
- Mention that covering fees ensures 100% of the donation reaches the organization
- For campaign-specific questions, highlight days remaining and progress percentage to create urgency
- Reference upcoming events and opportunities to get involved

Guidelines:
- Be warm, welcoming, and compassionate
- Provide specific information from the context above when available
- Keep responses concise but informative (aim for under 150 words)
- Encourage engagement and participation in campaigns, events, and volunteering
- For questions beyond the information provided, direct them to contact the organization at ${org.email}
- Respect the faith tradition and values of the organization

Answer the user's question helpfully and naturally using the information provided above.`;

      // Prepare messages for OpenAI
      const messages = [
        { role: "system", content: systemPrompt },
        ...(conversationHistory || []),
        { role: "user", content: message }
      ];

      // Call OpenAI API - the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const completion = await openai.chat.completions.create({
        model: "gpt-5",
        messages: messages as any,
        max_completion_tokens: 800,
      });

      const assistantMessage = completion.choices[0].message.content;

      res.json({
        message: assistantMessage,
        conversationHistory: [
          ...(conversationHistory || []),
          { role: "user", content: message },
          { role: "assistant", content: assistantMessage }
        ]
      });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ 
        error: "Failed to process chat message",
        message: "I'm having trouble connecting right now. Please try again or contact us directly."
      });
    }
  });

  // Eco Admin - Team Management Routes
  app.get("/api/eco-admin/team", requireAuth, requireRole("eco_admin"), async (req, res) => {
    try{
      // Get all eco_admin users
      const teamMembers = await db.select().from(users).where(eq(users.role, "eco_admin"));
      res.json(teamMembers.map(u => ({ ...u, passwordHash: undefined })));
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.post("/api/eco-admin/team", requireAuth, requireRole("eco_admin"), async (req, res) => {
    try {
      // Create user with null password - will be set via email
      const data = insertUserSchema.parse({ 
        ...req.body, 
        role: "eco_admin",
        passwordHash: null
      });
      const newMember = await storage.createUser(data);

      // Generate password setup token
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      await storage.createAuthToken({
        userId: newMember.id,
        token,
        type: "password_setup",
        expiresAt,
      });

      // Send invitation email with password setup link
      // Normalize baseUrl to remove trailing slash
      let baseUrl = process.env.BASE_URL || process.env.APP_URL || `http://localhost:5000`;
      baseUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
      
      try {
        await sendTeamAdminInvitation(
          newMember.email,
          newMember.firstName,
          newMember.lastName,
          token,
          baseUrl
        );
        console.log(`✅ Team admin invitation email sent successfully to ${newMember.email}`);
      } catch (emailError) {
        console.error("❌ Failed to send team admin invitation email:", emailError);
        console.log(`⚠️ Team member created but email failed. Password setup link: ${baseUrl}/setup-password?token=${token}`);
      }

      res.status(201).json({ ...newMember, passwordHash: undefined });
    } catch (error) {
      console.error("Error creating team member:", error);
      res.status(400).json({ error: "Failed to create team member" });
    }
  });

  app.patch("/api/eco-admin/team/:id", requireAuth, requireRole("eco_admin"), async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Only allow updating safe fields (email, firstName, lastName)
      const allowedFieldsSchema = z.object({
        email: z.string().email("Invalid email address").optional(),
        firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
        lastName: z.string().min(2, "Last name must be at least 2 characters").optional(),
      });
      
      const data = allowedFieldsSchema.parse(req.body);
      
      // Get the user to check if they exist and are an eco_admin
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      if (existingUser.role !== "eco_admin") {
        return res.status(400).json({ error: "Can only update eco admin team members" });
      }

      // Update the user with only safe fields
      const updatedUser = await storage.updateUser(userId, data);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "Team member not found" });
      }

      res.json({ ...updatedUser, passwordHash: undefined });
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(400).json({ error: "Failed to update team member" });
    }
  });

  app.delete("/api/eco-admin/team/:id", requireAuth, requireRole("eco_admin"), async (req: any, res) => {
    try {
      const userId = req.params.id;
      
      // Prevent self-deletion
      if (userId === req.user.id) {
        return res.status(400).json({ error: "Cannot disable your own account" });
      }
      
      // Get the user to check if they exist and are an eco_admin
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      if (existingUser.role !== "eco_admin") {
        return res.status(400).json({ error: "Can only disable eco admin team members" });
      }

      // Soft delete by updating status (if status field exists) or actually delete
      // For now, let's actually delete the user
      await storage.deleteUser(userId);
      
      res.json({ message: "Team member disabled successfully" });
    } catch (error) {
      console.error("Error disabling team member:", error);
      res.status(500).json({ error: "Failed to disable team member" });
    }
  });

  // Eco Admin - Partner Management Routes
  app.get("/api/eco-admin/partners", requireAuth, requireRole("eco_admin"), async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const partners = await storage.listPartners(status);
      res.json(partners);
    } catch (error) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  app.post("/api/eco-admin/partners", requireAuth, requireRole("eco_admin"), async (req: any, res) => {
    try {
      const data = insertPartnerSchema.parse({ ...req.body, createdBy: req.user.id });
      const partner = await storage.createPartner(data);
      res.status(201).json(partner);
    } catch (error) {
      console.error("Error creating partner:", error);
      res.status(400).json({ error: "Failed to create partner" });
    }
  });

  app.patch("/api/eco-admin/partners/:id", requireAuth, requireRole("eco_admin"), async (req, res) => {
    try {
      const data = insertPartnerSchema.partial().parse(req.body);
      const partner = await storage.updatePartner(req.params.id, data);
      if (!partner) {
        return res.status(404).json({ error: "Partner not found" });
      }
      res.json(partner);
    } catch (error) {
      console.error("Error updating partner:", error);
      res.status(400).json({ error: "Failed to update partner" });
    }
  });

  // Eco Admin - Referral Code Routes
  app.get("/api/eco-admin/referral-codes", requireAuth, requireRole("eco_admin"), async (req, res) => {
    try {
      const partnerId = req.query.partnerId as string | undefined;
      const codes = await storage.listReferralCodes(partnerId);
      res.json(codes);
    } catch (error) {
      console.error("Error fetching referral codes:", error);
      res.status(500).json({ error: "Failed to fetch referral codes" });
    }
  });

  app.post("/api/eco-admin/referral-codes", requireAuth, requireRole("eco_admin"), async (req, res) => {
    try {
      const data = insertReferralCodeSchema.parse(req.body);
      const code = await storage.createReferralCode(data);
      res.status(201).json(code);
    } catch (error) {
      console.error("Error creating referral code:", error);
      res.status(400).json({ error: "Failed to create referral code" });
    }
  });

  app.patch("/api/eco-admin/referral-codes/:id", requireAuth, requireRole("eco_admin"), async (req, res) => {
    try {
      const data = insertReferralCodeSchema.partial().parse(req.body);
      const code = await storage.updateReferralCode(req.params.id, data);
      if (!code) {
        return res.status(404).json({ error: "Referral code not found" });
      }
      res.json(code);
    } catch (error) {
      console.error("Error updating referral code:", error);
      res.status(400).json({ error: "Failed to update referral code" });
    }
  });

  // Eco Admin - Revenue Monitoring Routes
  app.get("/api/eco-admin/revenue/overview", requireAuth, requireRole("eco_admin"), async (req, res) => {
    try {
      const activeSubscriptions = await storage.listActiveSubscriptions();
      
      // Calculate revenue metrics
      const monthlyRevenue = activeSubscriptions
        .filter(s => s.billingPeriod === "monthly")
        .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
      
      const yearlyRevenue = activeSubscriptions
        .filter(s => s.billingPeriod === "yearly")
        .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
      
      const totalActiveSubscriptions = activeSubscriptions.length;
      const allSubscriptions = await storage.listSubscriptions();
      
      res.json({
        monthlyRecurringRevenue: monthlyRevenue,
        yearlyRecurringRevenue: yearlyRevenue,
        totalActiveSubscriptions,
        totalSubscriptions: allSubscriptions.length,
        revenueByPeriod: {
          monthly: monthlyRevenue,
          yearly: yearlyRevenue / 12, // normalized to monthly
        },
      });
    } catch (error) {
      console.error("Error fetching revenue overview:", error);
      res.status(500).json({ error: "Failed to fetch revenue data" });
    }
  });

  app.get("/api/eco-admin/subscriptions", requireAuth, requireRole("eco_admin"), async (req, res) => {
    try {
      const orgId = req.query.orgId as string | undefined;
      const subscriptions = await storage.listSubscriptions(orgId);
      
      // Enrich with organization and module details
      const enrichedSubscriptions = await Promise.all(
        subscriptions.map(async (sub) => {
          const org = await storage.getOrganization(sub.orgId);
          const module = await storage.getMarketplaceModule(sub.moduleId);
          return {
            ...sub,
            organization: org ? { id: org.id, name: org.name } : null,
            module: module ? { id: module.id, title: module.title } : null,
          };
        })
      );

      res.json(enrichedSubscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Contacts Routes
  app.get("/api/contacts", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user?.orgId) {
        return res.status(403).json({ error: "No organization associated with user" });
      }

      const query = req.query.q as string | undefined;
      const contacts = query 
        ? await storage.searchContacts(user.orgId, query)
        : await storage.listContacts(user.orgId);
      
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.get("/api/contacts/:id", requireAuth, async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      const user = (req as any).user;
      if (contact.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(contact);
    } catch (error) {
      console.error("Error fetching contact:", error);
      res.status(500).json({ error: "Failed to fetch contact" });
    }
  });

  app.post("/api/contacts", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user?.orgId) {
        return res.status(403).json({ error: "No organization associated with user" });
      }

      const data = insertContactSchema.parse(req.body);
      const contact = await storage.createContact({
        ...data,
        orgId: user.orgId,
      });

      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating contact:", error);
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  app.put("/api/contacts/:id", requireAuth, async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      const user = (req as any).user;
      if (contact.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const data = insertContactSchema.partial().parse(req.body);
      const updatedContact = await storage.updateContact(req.params.id, data);

      res.json(updatedContact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating contact:", error);
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", requireAuth, async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      const user = (req as any).user;
      if (contact.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteContact(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // Contact Tags Routes
  app.get("/api/contact-tags", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user?.orgId) {
        return res.status(403).json({ error: "No organization associated with user" });
      }

      const tags = await storage.listContactTags(user.orgId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching contact tags:", error);
      res.status(500).json({ error: "Failed to fetch contact tags" });
    }
  });

  app.post("/api/contact-tags", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user?.orgId) {
        return res.status(403).json({ error: "No organization associated with user" });
      }

      const data = insertContactTagSchema.parse(req.body);
      const tag = await storage.createContactTag({
        ...data,
        orgId: user.orgId,
      });

      res.status(201).json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating contact tag:", error);
      res.status(500).json({ error: "Failed to create contact tag" });
    }
  });

  app.put("/api/contact-tags/:id", requireAuth, async (req, res) => {
    try {
      const tag = await storage.getContactTag(req.params.id);
      if (!tag) {
        return res.status(404).json({ error: "Tag not found" });
      }

      const user = (req as any).user;
      if (tag.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const data = insertContactTagSchema.partial().parse(req.body);
      const updatedTag = await storage.updateContactTag(req.params.id, data);

      res.json(updatedTag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating contact tag:", error);
      res.status(500).json({ error: "Failed to update contact tag" });
    }
  });

  app.delete("/api/contact-tags/:id", requireAuth, async (req, res) => {
    try {
      const tag = await storage.getContactTag(req.params.id);
      if (!tag) {
        return res.status(404).json({ error: "Tag not found" });
      }

      const user = (req as any).user;
      if (tag.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteContactTag(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contact tag:", error);
      res.status(500).json({ error: "Failed to delete contact tag" });
    }
  });

  // Contact Tag Assignment Routes
  app.get("/api/contacts/:id/tags", requireAuth, async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      const user = (req as any).user;
      if (contact.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const tags = await storage.getContactTags(req.params.id);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching contact tags:", error);
      res.status(500).json({ error: "Failed to fetch contact tags" });
    }
  });

  app.post("/api/contacts/:id/tags", requireAuth, async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      const user = (req as any).user;
      if (contact.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { tagId } = req.body;
      if (!tagId) {
        return res.status(400).json({ error: "tagId is required" });
      }

      const tag = await storage.getContactTag(tagId);
      if (!tag || tag.orgId !== user.orgId) {
        return res.status(404).json({ error: "Tag not found" });
      }

      const assignment = await storage.addTagToContact(req.params.id, tagId);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error adding tag to contact:", error);
      res.status(500).json({ error: "Failed to add tag to contact" });
    }
  });

  app.delete("/api/contacts/:id/tags/:tagId", requireAuth, async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      const user = (req as any).user;
      if (contact.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.removeTagFromContact(req.params.id, req.params.tagId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing tag from contact:", error);
      res.status(500).json({ error: "Failed to remove tag from contact" });
    }
  });

  // Contact Activities Routes
  app.get("/api/contacts/:id/activities", requireAuth, async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      const user = (req as any).user;
      if (contact.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const activities = await storage.listContactActivities(req.params.id);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching contact activities:", error);
      res.status(500).json({ error: "Failed to fetch contact activities" });
    }
  });

  app.post("/api/contacts/:id/activities", requireAuth, async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      const user = (req as any).user;
      if (contact.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const data = insertContactActivitySchema.parse(req.body);
      const activity = await storage.createContactActivity({
        ...data,
        contactId: req.params.id,
        orgId: contact.orgId,
        userId: user.id,
      });

      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating contact activity:", error);
      res.status(500).json({ error: "Failed to create contact activity" });
    }
  });

  // Beneficiary Routes
  app.get("/api/org/:orgId/beneficiaries", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (req.params.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { search, type, status, urgencyLevel, tags } = req.query;

      let beneficiaries;
      if (search) {
        beneficiaries = await storage.searchBeneficiaries(req.params.orgId, search as string);
      } else if (type || status || urgencyLevel || tags) {
        beneficiaries = await storage.filterBeneficiaries(req.params.orgId, {
          type: type as string,
          status: status as string,
          urgencyLevel: urgencyLevel as string,
          tags: tags ? (tags as string).split(',') : undefined,
        });
      } else {
        beneficiaries = await storage.listBeneficiaries(req.params.orgId);
      }

      res.json(beneficiaries);
    } catch (error) {
      console.error("Error fetching beneficiaries:", error);
      res.status(500).json({ error: "Failed to fetch beneficiaries" });
    }
  });

  app.get("/api/org/:orgId/beneficiaries/:id", requireAuth, async (req, res) => {
    try {
      const beneficiary = await storage.getBeneficiary(req.params.id);
      if (!beneficiary) {
        return res.status(404).json({ error: "Beneficiary not found" });
      }

      const user = (req as any).user;
      if (beneficiary.orgId !== user.orgId || req.params.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(beneficiary);
    } catch (error) {
      console.error("Error fetching beneficiary:", error);
      res.status(500).json({ error: "Failed to fetch beneficiary" });
    }
  });

  app.post("/api/org/:orgId/beneficiaries", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (req.params.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validated = insertBeneficiarySchema.parse(req.body);
      const beneficiary = await storage.createBeneficiary({
        ...validated,
        orgId: req.params.orgId,
      });

      res.status(201).json(beneficiary);
    } catch (error) {
      console.error("Error creating beneficiary:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create beneficiary" });
    }
  });

  app.patch("/api/org/:orgId/beneficiaries/:id", requireAuth, async (req, res) => {
    try {
      const beneficiary = await storage.getBeneficiary(req.params.id);
      if (!beneficiary) {
        return res.status(404).json({ error: "Beneficiary not found" });
      }

      const user = (req as any).user;
      if (beneficiary.orgId !== user.orgId || req.params.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validated = insertBeneficiarySchema.partial().parse(req.body);
      const updated = await storage.updateBeneficiary(req.params.id, validated);
      res.json(updated);
    } catch (error) {
      console.error("Error updating beneficiary:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update beneficiary" });
    }
  });

  app.delete("/api/org/:orgId/beneficiaries/:id", requireAuth, async (req, res) => {
    try {
      const beneficiary = await storage.getBeneficiary(req.params.id);
      if (!beneficiary) {
        return res.status(404).json({ error: "Beneficiary not found" });
      }

      const user = (req as any).user;
      if (beneficiary.orgId !== user.orgId || req.params.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteBeneficiary(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting beneficiary:", error);
      res.status(500).json({ error: "Failed to delete beneficiary" });
    }
  });

  // Beneficiary Photo Upload
  app.post("/api/org/:orgId/beneficiaries/:id/upload-photo", requireAuth, upload.single('photo'), async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      const beneficiary = await storage.getBeneficiary(id);
      
      if (!beneficiary) {
        return res.status(404).json({ error: "Beneficiary not found" });
      }

      if (req.user.orgId !== beneficiary.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No photo file provided" });
      }

      const fileName = `beneficiary-${id}-${Date.now()}-${req.file.originalname}`;
      const objectPath = `/objects/beneficiaries/${fileName}`;

      // Save file to local storage as public
      await objectStorageService.saveFile(
        objectPath,
        req.file.buffer,
        {
          contentType: req.file.mimetype,
          visibility: "public",
        }
      );

      // Set ACL for public access
      const aclPolicy: ObjectAclPolicy = {
        owner: req.user.id,
        visibility: "public",
      };
      await objectStorageService.trySetObjectEntityAclPolicy(objectPath, aclPolicy);

      // Return the public URL
      const publicUrl = buildUrl(`/api/files${objectPath}`);
      
      // Update beneficiary with new photo URL
      await storage.updateBeneficiary(id, { photoUrl: publicUrl });

      res.json({ url: publicUrl });
    } catch (error) {
      console.error("Error uploading beneficiary photo:", error);
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  // Beneficiary Donations Routes
  app.get("/api/beneficiaries/:beneficiaryId/donations", requireAuth, async (req, res) => {
    try {
      const beneficiary = await storage.getBeneficiary(req.params.beneficiaryId);
      if (!beneficiary) {
        return res.status(404).json({ error: "Beneficiary not found" });
      }

      const user = (req as any).user;
      if (beneficiary.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const donations = await storage.listBeneficiaryDonations(req.params.beneficiaryId);
      res.json(donations);
    } catch (error) {
      console.error("Error fetching beneficiary donations:", error);
      res.status(500).json({ error: "Failed to fetch beneficiary donations" });
    }
  });

  app.post("/api/beneficiaries/:beneficiaryId/donations", requireAuth, async (req, res) => {
    try {
      const beneficiary = await storage.getBeneficiary(req.params.beneficiaryId);
      if (!beneficiary) {
        return res.status(404).json({ error: "Beneficiary not found" });
      }

      const user = (req as any).user;
      if (beneficiary.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validated = insertBeneficiaryDonationSchema.parse(req.body);
      const donation = await storage.createBeneficiaryDonation({
        ...validated,
        beneficiaryId: req.params.beneficiaryId,
        orgId: beneficiary.orgId,
      });

      res.status(201).json(donation);
    } catch (error) {
      console.error("Error creating beneficiary donation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create beneficiary donation" });
    }
  });

  app.patch("/api/beneficiary-donations/:id", requireAuth, async (req, res) => {
    try {
      const donation = await storage.getBeneficiaryDonation(req.params.id);
      if (!donation) {
        return res.status(404).json({ error: "Donation not found" });
      }

      const user = (req as any).user;
      if (donation.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validated = insertBeneficiaryDonationSchema.partial().parse(req.body);
      const updated = await storage.updateBeneficiaryDonation(req.params.id, validated);
      res.json(updated);
    } catch (error) {
      console.error("Error updating beneficiary donation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update beneficiary donation" });
    }
  });

  app.delete("/api/beneficiary-donations/:id", requireAuth, async (req, res) => {
    try {
      const donation = await storage.getBeneficiaryDonation(req.params.id);
      if (!donation) {
        return res.status(404).json({ error: "Donation not found" });
      }

      const user = (req as any).user;
      if (donation.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteBeneficiaryDonation(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting beneficiary donation:", error);
      res.status(500).json({ error: "Failed to delete beneficiary donation" });
    }
  });

  // Beneficiary Communications Routes
  app.get("/api/beneficiaries/:beneficiaryId/communications", requireAuth, async (req, res) => {
    try {
      const beneficiary = await storage.getBeneficiary(req.params.beneficiaryId);
      if (!beneficiary) {
        return res.status(404).json({ error: "Beneficiary not found" });
      }

      const user = (req as any).user;
      if (beneficiary.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const communications = await storage.listBeneficiaryCommunications(req.params.beneficiaryId);
      res.json(communications);
    } catch (error) {
      console.error("Error fetching beneficiary communications:", error);
      res.status(500).json({ error: "Failed to fetch beneficiary communications" });
    }
  });

  app.post("/api/beneficiaries/:beneficiaryId/communications", requireAuth, async (req, res) => {
    try {
      const beneficiary = await storage.getBeneficiary(req.params.beneficiaryId);
      if (!beneficiary) {
        return res.status(404).json({ error: "Beneficiary not found" });
      }

      const user = (req as any).user;
      if (beneficiary.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const communication = await storage.createBeneficiaryCommunication({
        ...req.body,
        beneficiaryId: req.params.beneficiaryId,
        orgId: beneficiary.orgId,
      });

      res.status(201).json(communication);
    } catch (error) {
      console.error("Error creating beneficiary communication:", error);
      res.status(500).json({ error: "Failed to create beneficiary communication" });
    }
  });

  app.patch("/api/beneficiary-communications/:id", requireAuth, async (req, res) => {
    try {
      const communication = await storage.getBeneficiaryCommunication(req.params.id);
      if (!communication) {
        return res.status(404).json({ error: "Communication not found" });
      }

      const user = (req as any).user;
      if (communication.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updated = await storage.updateBeneficiaryCommunication(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating beneficiary communication:", error);
      res.status(500).json({ error: "Failed to update beneficiary communication" });
    }
  });

  app.delete("/api/beneficiary-communications/:id", requireAuth, async (req, res) => {
    try {
      const communication = await storage.getBeneficiaryCommunication(req.params.id);
      if (!communication) {
        return res.status(404).json({ error: "Communication not found" });
      }

      const user = (req as any).user;
      if (communication.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteBeneficiaryCommunication(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting beneficiary communication:", error);
      res.status(500).json({ error: "Failed to delete beneficiary communication" });
    }
  });

  // Activities Routes
  app.get("/api/activities", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const activities = await storage.listActivities(user.orgId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.get("/api/activities/public/:orgId", async (req, res) => {
    try {
      const activities = await storage.listPublishedActivities(req.params.orgId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching public activities:", error);
      res.status(500).json({ error: "Failed to fetch public activities" });
    }
  });

  app.get("/api/activities/:id", requireAuth, async (req, res) => {
    try {
      const activity = await storage.getActivity(req.params.id);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      const user = (req as any).user;
      if (activity.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  app.post("/api/activities", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity({
        ...validatedData,
        orgId: user.orgId,
      });
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error creating activity:", error);
      res.status(500).json({ error: "Failed to create activity" });
    }
  });

  app.patch("/api/activities/:id", requireAuth, async (req, res) => {
    try {
      const activity = await storage.getActivity(req.params.id);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      const user = (req as any).user;
      if (activity.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validatedData = insertActivitySchema.partial().parse(req.body);
      const updated = await storage.updateActivity(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating activity:", error);
      res.status(500).json({ error: "Failed to update activity" });
    }
  });

  app.delete("/api/activities/:id", requireAuth, async (req, res) => {
    try {
      const activity = await storage.getActivity(req.params.id);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      const user = (req as any).user;
      if (activity.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteActivity(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting activity:", error);
      res.status(500).json({ error: "Failed to delete activity" });
    }
  });

  // Activity Sessions Routes
  app.get("/api/activities/:activityId/sessions", requireAuth, async (req, res) => {
    try {
      const activity = await storage.getActivity(req.params.activityId);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      const user = (req as any).user;
      if (activity.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const sessions = await storage.listActivitySessions(req.params.activityId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching activity sessions:", error);
      res.status(500).json({ error: "Failed to fetch activity sessions" });
    }
  });

  app.post("/api/activities/:activityId/sessions", requireAuth, async (req, res) => {
    try {
      const activity = await storage.getActivity(req.params.activityId);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      const user = (req as any).user;
      if (activity.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validatedData = insertActivitySessionSchema.parse(req.body);
      const session = await storage.createActivitySession({
        ...validatedData,
        activityId: req.params.activityId,
        orgId: activity.orgId,
      });

      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error creating activity session:", error);
      res.status(500).json({ error: "Failed to create activity session" });
    }
  });

  app.patch("/api/activity-sessions/:id", requireAuth, async (req, res) => {
    try {
      const session = await storage.getActivitySession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const user = (req as any).user;
      if (session.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updated = await storage.updateActivitySession(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating activity session:", error);
      res.status(500).json({ error: "Failed to update activity session" });
    }
  });

  app.delete("/api/activity-sessions/:id", requireAuth, async (req, res) => {
    try {
      const session = await storage.getActivitySession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const user = (req as any).user;
      if (session.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteActivitySession(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting activity session:", error);
      res.status(500).json({ error: "Failed to delete activity session" });
    }
  });

  // Activity Registrations Routes
  app.get("/api/activities/:activityId/registrations", requireAuth, async (req, res) => {
    try {
      const activity = await storage.getActivity(req.params.activityId);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      const user = (req as any).user;
      if (activity.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const registrations = await storage.listActivityRegistrations(req.params.activityId);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching activity registrations:", error);
      res.status(500).json({ error: "Failed to fetch activity registrations" });
    }
  });

  app.post("/api/activities/:activityId/register", async (req, res) => {
    try {
      const activity = await storage.getActivity(req.params.activityId);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      if (!activity.isPublished) {
        return res.status(403).json({ error: "Activity is not published" });
      }

      const existingRegistration = await storage.getRegistrationByEmail(
        req.params.activityId,
        req.body.studentEmail
      );

      if (existingRegistration) {
        return res.status(400).json({ error: "Already registered for this activity" });
      }

      if (activity.maxStudents && activity.currentStudents >= activity.maxStudents) {
        return res.status(400).json({ error: "Activity is full" });
      }

      const { stripePaymentIntentId, ...registrationData } = req.body;

      if (activity.isPaid && parseFloat(activity.price) > 0) {
        if (!stripePaymentIntentId) {
          return res.status(400).json({ error: "Payment required for paid activity" });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
        
        if (paymentIntent.status !== "succeeded") {
          return res.status(400).json({ error: "Payment not completed" });
        }

        registrationData.stripePaymentId = stripePaymentIntentId;
      }

      const registration = await storage.createActivityRegistration({
        ...registrationData,
        activityId: req.params.activityId,
        orgId: activity.orgId,
        status: "confirmed",
      });

      await storage.incrementActivityStudentCount(req.params.activityId, 1);

      res.status(201).json(registration);
    } catch (error) {
      console.error("Error creating activity registration:", error);
      res.status(500).json({ error: "Failed to create activity registration" });
    }
  });

  app.patch("/api/activity-registrations/:id", requireAuth, async (req, res) => {
    try {
      const registration = await storage.getActivityRegistration(req.params.id);
      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      const user = (req as any).user;
      if (registration.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updated = await storage.updateActivityRegistration(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating activity registration:", error);
      res.status(500).json({ error: "Failed to update activity registration" });
    }
  });

  app.delete("/api/activity-registrations/:id", requireAuth, async (req, res) => {
    try {
      const registration = await storage.getActivityRegistration(req.params.id);
      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      const user = (req as any).user;
      if (registration.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteActivityRegistration(req.params.id);
      await storage.incrementActivityStudentCount(registration.activityId, -1);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting activity registration:", error);
      res.status(500).json({ error: "Failed to delete activity registration" });
    }
  });

  // Activity Payments - Filter by date
  app.get("/api/org/:orgId/activity-payments", requireAuth, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const { startDate, endDate, activityId } = req.query;

      if (req.user.orgId !== orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      // Build conditions
      const conditions = [eq(activityRegistrations.orgId, orgId)];
      if (activityId) {
        conditions.push(eq(activityRegistrations.activityId, activityId as string));
      }
      if (startDate) {
        conditions.push(gte(activityRegistrations.createdAt, new Date(startDate as string)));
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        conditions.push(lte(activityRegistrations.createdAt, end));
      }

      // Get registrations
      const registrations = await db
        .select()
        .from(activityRegistrations)
        .where(and(...conditions))
        .orderBy(desc(activityRegistrations.createdAt));

      // Get activity details for each registration
      const activityIds = [...new Set(registrations.map(r => r.activityId))];
      const activitiesList = activityIds.length > 0
        ? await db.select().from(activities).where(inArray(activities.id, activityIds))
        : [];
      const activitiesMap = new Map(activitiesList.map(a => [a.id, a]));

      // Enrich registrations with activity details
      const enriched = registrations.map(reg => ({
        ...reg,
        activity: activitiesMap.get(reg.activityId) ? {
          id: activitiesMap.get(reg.activityId)!.id,
          title: activitiesMap.get(reg.activityId)!.title,
          price: activitiesMap.get(reg.activityId)!.price,
          currency: activitiesMap.get(reg.activityId)!.currency,
        } : undefined,
      }));

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching activity payments:", error);
      res.status(500).json({ error: "Failed to fetch activity payments" });
    }
  });

  // Activity Attendance Routes
  app.get("/api/activities/:activityId/attendance", requireAuth, async (req, res) => {
    try {
      const activity = await storage.getActivity(req.params.activityId);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      const user = (req as any).user;
      if (activity.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const sessionDate = req.query.sessionDate ? new Date(req.query.sessionDate as string) : undefined;
      const attendance = await storage.listActivityAttendance(req.params.activityId, sessionDate);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching activity attendance:", error);
      res.status(500).json({ error: "Failed to fetch activity attendance" });
    }
  });

  app.get("/api/activity-registrations/:registrationId/attendance", requireAuth, async (req, res) => {
    try {
      const registration = await storage.getActivityRegistration(req.params.registrationId);
      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      const user = (req as any).user;
      if (registration.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const attendance = await storage.listRegistrationAttendance(req.params.registrationId);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching registration attendance:", error);
      res.status(500).json({ error: "Failed to fetch registration attendance" });
    }
  });

  app.post("/api/activity-attendance", requireAuth, async (req, res) => {
    try {
      const registration = await storage.getActivityRegistration(req.body.registrationId);
      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      const user = (req as any).user;
      if (registration.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const attendance = await storage.createActivityAttendance({
        ...req.body,
        activityId: registration.activityId,
        orgId: registration.orgId,
      });

      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error creating activity attendance:", error);
      res.status(500).json({ error: "Failed to create activity attendance" });
    }
  });

  app.patch("/api/activity-attendance/:id", requireAuth, async (req, res) => {
    try {
      const attendance = await storage.getActivityAttendance(req.params.id);
      if (!attendance) {
        return res.status(404).json({ error: "Attendance record not found" });
      }

      const user = (req as any).user;
      if (attendance.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updated = await storage.updateActivityAttendance(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating activity attendance:", error);
      res.status(500).json({ error: "Failed to update activity attendance" });
    }
  });

  app.delete("/api/activity-attendance/:id", requireAuth, async (req, res) => {
    try {
      const attendance = await storage.getActivityAttendance(req.params.id);
      if (!attendance) {
        return res.status(404).json({ error: "Attendance record not found" });
      }

      const user = (req as any).user;
      if (attendance.orgId !== user.orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteActivityAttendance(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting activity attendance:", error);
      res.status(500).json({ error: "Failed to delete activity attendance" });
    }
  });

  app.post("/api/activities/:activityId/payment-intent", async (req, res) => {
    try {
      const activity = await storage.getActivity(req.params.activityId);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      if (!activity.isPaid || !activity.price || parseFloat(activity.price) <= 0) {
        return res.status(400).json({ error: "Activity is not a paid activity" });
      }

      const org = await storage.getOrganization(activity.orgId);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const amountInCents = Math.round(parseFloat(activity.price) * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: activity.currency?.toLowerCase() || org.currency?.toLowerCase() || "usd",
        metadata: {
          activityId: activity.id,
          activityTitle: activity.title,
          orgId: activity.orgId,
          orgName: org.name,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Volunteer Management Routes
  app.get("/api/org/:orgId/volunteers", requireAuth, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const { search, status, team, skills, state, country } = req.query;

      if (req.user.orgId !== orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      let volunteers;
      if (search) {
        volunteers = await storage.searchVolunteers(orgId, search as string);
      } else if (status || team || skills || state || country) {
        volunteers = await storage.filterVolunteers(orgId, {
          status: status as string,
          team: team as string,
          skills: skills ? (Array.isArray(skills) ? skills as string[] : [skills as string]) : undefined,
          state: state as string,
          country: country as string,
        });
      } else {
        volunteers = await storage.listVolunteers(orgId);
      }

      res.json(volunteers);
    } catch (error) {
      console.error("Error fetching volunteers:", error);
      res.status(500).json({ error: "Failed to fetch volunteers" });
    }
  });

  app.get("/api/org/:orgId/volunteers/:id", requireAuth, async (req: any, res) => {
    try {
      const volunteer = await storage.getVolunteer(req.params.id);
      if (!volunteer) {
        return res.status(404).json({ error: "Volunteer not found" });
      }

      if (req.user.orgId !== volunteer.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(volunteer);
    } catch (error) {
      console.error("Error fetching volunteer:", error);
      res.status(500).json({ error: "Failed to fetch volunteer" });
    }
  });

  app.post("/api/org/:orgId/volunteers", requireAuth, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const data = insertVolunteerSchema.parse({ ...req.body, orgId });

      if (req.user.orgId !== orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const volunteer = await storage.createVolunteer(data);
      res.status(201).json(volunteer);
    } catch (error: any) {
      console.error("Error creating volunteer:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid volunteer data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create volunteer" });
    }
  });

  app.patch("/api/org/:orgId/volunteers/:id", requireAuth, async (req: any, res) => {
    try {
      const volunteer = await storage.getVolunteer(req.params.id);
      if (!volunteer) {
        return res.status(404).json({ error: "Volunteer not found" });
      }

      if (req.user.orgId !== volunteer.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const updated = await storage.updateVolunteer(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating volunteer:", error);
      res.status(500).json({ error: "Failed to update volunteer" });
    }
  });

  app.delete("/api/org/:orgId/volunteers/:id", requireAuth, async (req: any, res) => {
    try {
      const volunteer = await storage.getVolunteer(req.params.id);
      if (!volunteer) {
        return res.status(404).json({ error: "Volunteer not found" });
      }

      if (req.user.orgId !== volunteer.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteVolunteer(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting volunteer:", error);
      res.status(500).json({ error: "Failed to delete volunteer" });
    }
  });

  // Volunteer Team Management Routes
  app.get("/api/org/:orgId/volunteer-teams", requireAuth, async (req: any, res) => {
    try {
      const { orgId } = req.params;

      if (req.user.orgId !== orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get all volunteers for this organization
      const allVolunteers = await storage.listVolunteers(orgId);
      
      // Extract all unique team names from all volunteers
      const teamSet = new Set<string>();
      allVolunteers.forEach(volunteer => {
        if (volunteer.teams && Array.isArray(volunteer.teams)) {
          volunteer.teams.forEach(team => {
            if (team && typeof team === 'string' && team.trim()) {
              teamSet.add(team.trim());
            }
          });
        }
      });

      // Convert to sorted array
      const teams = Array.from(teamSet).sort();
      
      res.json(teams);
    } catch (error) {
      console.error("Error fetching volunteer teams:", error);
      res.status(500).json({ error: "Failed to fetch volunteer teams" });
    }
  });

  app.post("/api/org/:orgId/volunteer-teams", requireAuth, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const { name } = req.body;

      if (req.user.orgId !== orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      // Validate team name
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: "Team name is required" });
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ error: "Team name cannot be empty" });
      }

      // Check if team already exists
      const allVolunteers = await storage.listVolunteers(orgId);
      const existingTeams = new Set<string>();
      allVolunteers.forEach(volunteer => {
        if (volunteer.teams && Array.isArray(volunteer.teams)) {
          volunteer.teams.forEach(team => {
            if (team && typeof team === 'string') {
              existingTeams.add(team.trim().toLowerCase());
            }
          });
        }
      });

      if (existingTeams.has(trimmedName.toLowerCase())) {
        return res.status(400).json({ error: "Team name already exists" });
      }

      // Return the team name (teams are stored as strings in volunteer records, not as separate entities)
      res.status(201).json({ name: trimmedName });
    } catch (error) {
      console.error("Error creating volunteer team:", error);
      res.status(500).json({ error: "Failed to create volunteer team" });
    }
  });

  // Volunteer Photo Upload
  app.post("/api/org/:orgId/volunteers/:id/upload-photo", requireAuth, upload.single('photo'), async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      const volunteer = await storage.getVolunteer(id);
      
      if (!volunteer) {
        return res.status(404).json({ error: "Volunteer not found" });
      }

      if (req.user.orgId !== volunteer.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No photo file provided" });
      }

      const fileName = `volunteer-${id}-${Date.now()}-${req.file.originalname}`;
      const objectPath = `/objects/volunteers/${fileName}`;

      // Save file to local storage as public
      await objectStorageService.saveFile(
        objectPath,
        req.file.buffer,
        {
          contentType: req.file.mimetype,
          visibility: "public",
        }
      );

      // Set ACL for public access
      const aclPolicy: ObjectAclPolicy = {
        owner: req.user.id,
        visibility: "public",
      };
      await objectStorageService.trySetObjectEntityAclPolicy(objectPath, aclPolicy);

      // Return the public URL
      const publicUrl = buildUrl(`/api/files${objectPath}`);
      
      // Update volunteer with new photo URL
      await storage.updateVolunteer(id, { photoUrl: publicUrl });

      res.json({ url: publicUrl });
    } catch (error) {
      console.error("Error uploading volunteer photo:", error);
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  // Volunteer Shift Routes
  app.get("/api/org/:orgId/volunteer-shifts", requireAuth, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const { volunteerId } = req.query;

      if (req.user.orgId !== orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const shifts = await storage.listVolunteerShifts(orgId, volunteerId as string);
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching volunteer shifts:", error);
      res.status(500).json({ error: "Failed to fetch volunteer shifts" });
    }
  });

  app.get("/api/org/:orgId/volunteer-shifts/:id", requireAuth, async (req: any, res) => {
    try {
      const shift = await storage.getVolunteerShift(req.params.id);
      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }

      if (req.user.orgId !== shift.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(shift);
    } catch (error) {
      console.error("Error fetching volunteer shift:", error);
      res.status(500).json({ error: "Failed to fetch volunteer shift" });
    }
  });

  app.post("/api/org/:orgId/volunteer-shifts", requireAuth, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const data = insertVolunteerShiftSchema.parse({ ...req.body, orgId });

      if (req.user.orgId !== orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const shift = await storage.createVolunteerShift(data);
      res.status(201).json(shift);
    } catch (error: any) {
      console.error("Error creating volunteer shift:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid shift data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create volunteer shift" });
    }
  });

  app.patch("/api/org/:orgId/volunteer-shifts/:id", requireAuth, async (req: any, res) => {
    try {
      const shift = await storage.getVolunteerShift(req.params.id);
      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }

      if (req.user.orgId !== shift.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const updated = await storage.updateVolunteerShift(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating volunteer shift:", error);
      res.status(500).json({ error: "Failed to update volunteer shift" });
    }
  });

  app.delete("/api/org/:orgId/volunteer-shifts/:id", requireAuth, async (req: any, res) => {
    try {
      const shift = await storage.getVolunteerShift(req.params.id);
      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }

      if (req.user.orgId !== shift.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteVolunteerShift(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting volunteer shift:", error);
      res.status(500).json({ error: "Failed to delete volunteer shift" });
    }
  });

  // Volunteer Hour Routes
  app.get("/api/org/:orgId/volunteer-hours", requireAuth, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const { volunteerId } = req.query;

      if (req.user.orgId !== orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const hours = await storage.listVolunteerHours(orgId, volunteerId as string);
      res.json(hours);
    } catch (error) {
      console.error("Error fetching volunteer hours:", error);
      res.status(500).json({ error: "Failed to fetch volunteer hours" });
    }
  });

  app.get("/api/org/:orgId/volunteer-hours/:id", requireAuth, async (req: any, res) => {
    try {
      const hour = await storage.getVolunteerHour(req.params.id);
      if (!hour) {
        return res.status(404).json({ error: "Hour record not found" });
      }

      if (req.user.orgId !== hour.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(hour);
    } catch (error) {
      console.error("Error fetching volunteer hour:", error);
      res.status(500).json({ error: "Failed to fetch volunteer hour" });
    }
  });

  app.post("/api/org/:orgId/volunteer-hours", requireAuth, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const data = insertVolunteerHourSchema.parse({ ...req.body, orgId });

      if (req.user.orgId !== orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const hour = await storage.createVolunteerHour(data);
      res.status(201).json(hour);
    } catch (error: any) {
      console.error("Error creating volunteer hour:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid hour data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create volunteer hour" });
    }
  });

  app.patch("/api/org/:orgId/volunteer-hours/:id", requireAuth, async (req: any, res) => {
    try {
      const hour = await storage.getVolunteerHour(req.params.id);
      if (!hour) {
        return res.status(404).json({ error: "Hour record not found" });
      }

      if (req.user.orgId !== hour.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const updated = await storage.updateVolunteerHour(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating volunteer hour:", error);
      res.status(500).json({ error: "Failed to update volunteer hour" });
    }
  });

  app.delete("/api/org/:orgId/volunteer-hours/:id", requireAuth, async (req: any, res) => {
    try {
      const hour = await storage.getVolunteerHour(req.params.id);
      if (!hour) {
        return res.status(404).json({ error: "Hour record not found" });
      }

      if (req.user.orgId !== hour.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteVolunteerHour(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting volunteer hour:", error);
      res.status(500).json({ error: "Failed to delete volunteer hour" });
    }
  });

  app.post("/api/org/:orgId/volunteer-hours/:id/approve", requireAuth, async (req: any, res) => {
    try {
      const hour = await storage.getVolunteerHour(req.params.id);
      if (!hour) {
        return res.status(404).json({ error: "Hour record not found" });
      }

      if (req.user.orgId !== hour.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const updated = await storage.approveVolunteerHour(req.params.id, req.user.id);
      res.json(updated);
    } catch (error) {
      console.error("Error approving volunteer hour:", error);
      res.status(500).json({ error: "Failed to approve volunteer hour" });
    }
  });

  // Seed subscription data (temporary - no auth for initial setup)
  app.post("/api/admin/seed-subscriptions", async (req, res) => {
    try {
      // TODO: Re-enable eco_admin check after initial setup
      // const userId = (req as any).session?.userId;
      // if (!userId) {
      //   return res.status(401).json({ error: "Not authenticated" });
      // }
      // const user = await storage.getUser(userId);
      // if (!user || user.role !== "eco_admin") {
      //   return res.status(403).json({ error: "Only Eco-Admins can seed subscription data" });
      // }

      await seedSubscriptionData();
      res.json({ message: "Subscription data seeded successfully" });
    } catch (error) {
      console.error("Error seeding subscription data:", error);
      res.status(500).json({ error: "Failed to seed subscription data" });
    }
  });

  // Analytics Routes
  app.get("/api/org/:orgId/analytics/donations", requireAuth, async (req: any, res) => {
    try {
      if (req.user.orgId !== req.params.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      const { from, to } = req.query;
      const dateRange = analytics.resolveDateRange(from as string, to as string);
      const data = await analytics.getDonationsAnalytics(req.params.orgId, dateRange);
      res.json(data);
    } catch (error) {
      console.error("Error fetching donations analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/org/:orgId/analytics/campaigns", requireAuth, async (req: any, res) => {
    try {
      if (req.user.orgId !== req.params.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      const { from, to } = req.query;
      const dateRange = analytics.resolveDateRange(from as string, to as string);
      const data = await analytics.getCampaignsAnalytics(req.params.orgId, dateRange);
      res.json(data);
    } catch (error) {
      console.error("Error fetching campaigns analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/org/:orgId/analytics/events", requireAuth, async (req: any, res) => {
    try {
      if (req.user.orgId !== req.params.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      const { from, to } = req.query;
      const dateRange = analytics.resolveDateRange(from as string, to as string);
      const data = await analytics.getEventsAnalytics(req.params.orgId, dateRange);
      res.json(data);
    } catch (error) {
      console.error("Error fetching events analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/org/:orgId/analytics/volunteers", requireAuth, async (req: any, res) => {
    try {
      if (req.user.orgId !== req.params.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      const { from, to } = req.query;
      const dateRange = analytics.resolveDateRange(from as string, to as string);
      const data = await analytics.getVolunteersAnalytics(req.params.orgId, dateRange);
      res.json(data);
    } catch (error) {
      console.error("Error fetching volunteers analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/org/:orgId/analytics/beneficiaries", requireAuth, async (req: any, res) => {
    try {
      if (req.user.orgId !== req.params.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      const { from, to } = req.query;
      const dateRange = analytics.resolveDateRange(from as string, to as string);
      const data = await analytics.getBeneficiariesAnalytics(req.params.orgId, dateRange);
      res.json(data);
    } catch (error) {
      console.error("Error fetching beneficiaries analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/org/:orgId/analytics/activities", requireAuth, async (req: any, res) => {
    try {
      if (req.user.orgId !== req.params.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      const { from, to } = req.query;
      const dateRange = analytics.resolveDateRange(from as string, to as string);
      const data = await analytics.getActivitiesAnalytics(req.params.orgId, dateRange);
      res.json(data);
    } catch (error) {
      console.error("Error fetching activities analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/org/:orgId/analytics/recent-activity", requireAuth, async (req: any, res) => {
    try {
      if (req.user.orgId !== req.params.orgId && req.user.role !== "eco_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      const { from, to } = req.query;
      const dateRange = analytics.resolveDateRange(from as string, to as string);
      const data = await analytics.getRecentActivity(req.params.orgId, dateRange);
      res.json(data);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
