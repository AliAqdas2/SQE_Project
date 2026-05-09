import { db } from "../db";
import { 
  campaigns, donations, events, volunteers, volunteerHours, beneficiaries, 
  beneficiaryDonations, activities, landingPages, sermons, donors, eventRegistrations, organizations
} from "@shared/schema.js";
import { eq, and, gte, desc, asc, sql, count, sum, inArray } from "drizzle-orm";
import { subDays } from "date-fns";

// Constants for data limits
const MAX_CAMPAIGNS = 5;
const MAX_EVENTS = 5;
const MAX_SERMONS = 3;
const MAX_ACTIVITIES = 5;

// Helper functions for formatting
function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  }).format(amount);
}

function relativeDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";
  if (diffDays > 0 && diffDays <= 7) return `in ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface OrgContext {
  orgName: string;
  donations: string;
  campaigns: string;
  events: string;
  activities: string;
  volunteers: string;
  beneficiaries: string;
  sermons: string;
  aboutUs: string;
}

export async function buildOrgChatContext(orgId: string): Promise<string> {
  // Run all data fetching in parallel
  const [
    donationsData,
    campaignsData,
    eventsData,
    activitiesData,
    volunteersData,
    beneficiariesData,
    sermonsData,
    landingPageData,
    orgData
  ] = await Promise.allSettled([
    fetchDonationsContext(orgId),
    fetchCampaignsContext(orgId),
    fetchEventsContext(orgId),
    fetchActivitiesContext(orgId),
    fetchVolunteersContext(orgId),
    fetchBeneficiariesContext(orgId),
    fetchSermonsContext(orgId),
    fetchLandingPageContext(orgId),
    // Get org name
    db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1)
  ]);

  // Build context string from successful fetches
  const parts: string[] = [];

  if (donationsData.status === 'fulfilled' && donationsData.value) {
    parts.push(donationsData.value);
  }
  
  if (campaignsData.status === 'fulfilled' && campaignsData.value) {
    parts.push(campaignsData.value);
  }
  
  if (eventsData.status === 'fulfilled' && eventsData.value) {
    parts.push(eventsData.value);
  }
  
  if (activitiesData.status === 'fulfilled' && activitiesData.value) {
    parts.push(activitiesData.value);
  }
  
  if (volunteersData.status === 'fulfilled' && volunteersData.value) {
    parts.push(volunteersData.value);
  }
  
  if (beneficiariesData.status === 'fulfilled' && beneficiariesData.value) {
    parts.push(beneficiariesData.value);
  }
  
  if (sermonsData.status === 'fulfilled' && sermonsData.value) {
    parts.push(sermonsData.value);
  }
  
  if (landingPageData.status === 'fulfilled' && landingPageData.value) {
    parts.push(landingPageData.value);
  }

  // If no data was fetched, return a minimal message
  if (parts.length === 0) {
    return "Currently no additional information available. Please contact us for more details.";
  }

  return parts.join("\n\n");
}

async function fetchDonationsContext(orgId: string): Promise<string> {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const ninetyDaysAgo = subDays(now, 90);

  // Get 30-day and 90-day donation stats (no PII - aggregated only)
  const [thirtyDayStats] = await db
    .select({
      total: sum(donations.amount),
      count: count(),
    })
    .from(donations)
    .where(and(
      eq(donations.orgId, orgId),
      gte(donations.createdAt, thirtyDaysAgo)
    ));

  const [ninetyDayStats] = await db
    .select({
      total: sum(donations.amount),
      count: count(),
    })
    .from(donations)
    .where(and(
      eq(donations.orgId, orgId),
      gte(donations.createdAt, ninetyDaysAgo)
    ));

  // Get recurring vs one-time breakdown
  const [recurringStats] = await db
    .select({
      recurring: count(),
    })
    .from(donations)
    .where(and(
      eq(donations.orgId, orgId),
      eq(donations.recurring, true),
      gte(donations.createdAt, thirtyDaysAgo)
    ));

  const thirtyDayTotal = Number(thirtyDayStats?.total || 0);
  const thirtyDayCount = Number(thirtyDayStats?.count || 0);
  const ninetyDayTotal = Number(ninetyDayStats?.total || 0);
  const ninetyDayCount = Number(ninetyDayStats?.count || 0);
  const recurringCount = Number(recurringStats?.recurring || 0);
  const oneTimeCount = thirtyDayCount - recurringCount;

  const avgGift = thirtyDayCount > 0 ? thirtyDayTotal / thirtyDayCount : 0;

  let context = `Recent Donations:\n`;
  context += `- Last 30 days: ${formatCurrency(thirtyDayTotal)} from ${thirtyDayCount} donations (avg ${formatCurrency(avgGift)})\n`;
  context += `- Last 90 days: ${formatCurrency(ninetyDayTotal)} from ${ninetyDayCount} donations\n`;
  
  if (thirtyDayCount > 0) {
    context += `- Donation types: ${recurringCount} recurring, ${oneTimeCount} one-time\n`;
  }

  // Donation tip: Suggest recurring donations if low percentage
  if (thirtyDayCount > 0) {
    const recurringPercent = (recurringCount / thirtyDayCount) * 100;
    if (recurringPercent < 20) {
      context += `\nDonation Tip: Only ${recurringPercent.toFixed(0)}% of recent donations are recurring. Encouraging monthly giving can provide stable funding.`;
    }
  }

  return context;
}

async function fetchCampaignsContext(orgId: string): Promise<string> {
  const activeCampaigns = await db
    .select()
    .from(campaigns)
    .where(and(
      eq(campaigns.orgId, orgId),
      eq(campaigns.status, 'active')
    ))
    .limit(MAX_CAMPAIGNS);

  if (activeCampaigns.length === 0) {
    return "No active fundraising campaigns currently.";
  }

  let context = `Active Campaigns:\n`;
  
  for (const campaign of activeCampaigns) {
    const goalAmount = Number(campaign.goalAmount);
    const currentAmount = Number(campaign.currentAmount || 0);
    const progress = goalAmount > 0 ? (currentAmount / goalAmount) * 100 : 0;
    
    context += `- ${campaign.title}: `;
    context += `${formatCurrency(currentAmount)} raised of ${formatCurrency(goalAmount)} goal (${progress.toFixed(0)}%)`;
    
    if (campaign.endDate) {
      const daysLeft = Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft > 0 && daysLeft <= 30) {
        context += ` - ${daysLeft} days remaining`;
      }
    }
    
    if (campaign.description) {
      context += `. ${campaign.description.substring(0, 100)}`;
    }
    context += `\n`;
  }

  return context;
}

async function fetchEventsContext(orgId: string): Promise<string> {
  const upcomingEvents = await db
    .select()
    .from(events)
    .where(and(
      eq(events.orgId, orgId),
      eq(events.status, 'published'),
      gte(events.date, new Date())
    ))
    .orderBy(asc(events.date))
    .limit(MAX_EVENTS);

  if (upcomingEvents.length === 0) {
    return "No upcoming events scheduled.";
  }

  let context = `Upcoming Events:\n`;
  
  for (const event of upcomingEvents) {
    // Get registration count with org scoping for security
    const [regStats] = await db
      .select({ count: count() })
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(and(
        eq(eventRegistrations.eventId, event.id),
        eq(events.orgId, orgId)
      ));

    const regCount = Number(regStats?.count || 0);
    
    context += `- ${event.title} on ${relativeDate(new Date(event.date))}`;
    
    if (event.time) {
      context += ` at ${event.time}`;
    }
    
    if (event.location) {
      context += ` (${event.location})`;
    }
    
    if (regCount > 0) {
      context += ` - ${regCount} registered`;
    }
    
    if (event.capacity && regCount >= event.capacity) {
      context += ` - SOLD OUT`;
    }
    
    context += `\n`;
  }

  return context;
}

async function fetchActivitiesContext(orgId: string): Promise<string> {
  // Get only active activities (filter by status and optionally by date)
  const now = new Date();
  const activeActivities = await db
    .select()
    .from(activities)
    .where(and(
      eq(activities.orgId, orgId),
      eq(activities.status, 'active'),
      // Only include activities that haven't ended yet (if endDate is set)
      sql`(${activities.endDate} IS NULL OR ${activities.endDate} >= ${now})`
    ))
    .limit(MAX_ACTIVITIES);

  if (activeActivities.length === 0) {
    return "No active classes or activities available.";
  }

  let context = `Classes & Activities:\n`;
  
  for (const activity of activeActivities) {
    context += `- ${activity.title}`;
    
    if (activity.teacherName) {
      context += ` (taught by ${activity.teacherName})`;
    }
    
    if (activity.scheduleType) {
      context += ` - ${activity.scheduleType}`;
    }
    
    if (activity.price && Number(activity.price) > 0) {
      context += ` - ${activity.currency} ${Number(activity.price).toFixed(2)}`;
    } else {
      context += ` - Free`;
    }
    
    context += `\n`;
  }

  return context;
}

async function fetchVolunteersContext(orgId: string): Promise<string> {
  // Get total active volunteers
  const [volunteerStats] = await db
    .select({ count: count() })
    .from(volunteers)
    .where(and(
      eq(volunteers.orgId, orgId),
      eq(volunteers.status, 'active')
    ));

  const volunteerCount = Number(volunteerStats?.count || 0);

  // Get total hours in last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30);
  const [hoursStats] = await db
    .select({ total: sum(volunteerHours.hoursWorked) })
    .from(volunteerHours)
    .innerJoin(volunteers, eq(volunteerHours.volunteerId, volunteers.id))
    .where(and(
      eq(volunteers.orgId, orgId),
      gte(volunteerHours.date, thirtyDaysAgo)
    ));

  const totalHours = Number(hoursStats?.total || 0);

  if (volunteerCount === 0) {
    return "We are building our volunteer program. New volunteers are welcome!";
  }

  let context = `Volunteer Program:\n`;
  context += `- ${volunteerCount} active volunteers\n`;
  
  if (totalHours > 0) {
    context += `- ${totalHours.toFixed(0)} volunteer hours contributed in the last 30 days\n`;
  }
  
  context += `- Always looking for dedicated volunteers to support our mission`;

  return context;
}

async function fetchBeneficiariesContext(orgId: string): Promise<string> {
  // Get total beneficiaries
  const [beneficiaryStats] = await db
    .select({ count: count() })
    .from(beneficiaries)
    .where(eq(beneficiaries.orgId, orgId));

  const beneficiaryCount = Number(beneficiaryStats?.count || 0);

  // Get total support distributed in last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30);
  const [supportStats] = await db
    .select({ total: sum(beneficiaryDonations.amount) })
    .from(beneficiaryDonations)
    .innerJoin(beneficiaries, eq(beneficiaryDonations.beneficiaryId, beneficiaries.id))
    .where(and(
      eq(beneficiaries.orgId, orgId),
      gte(beneficiaryDonations.deliveryDate, thirtyDaysAgo)
    ));

  const totalSupport = Number(supportStats?.total || 0);

  if (beneficiaryCount === 0) {
    return "Our programs support individuals and families in need within our community.";
  }

  let context = `Community Impact:\n`;
  context += `- Supporting ${beneficiaryCount} beneficiaries\n`;
  
  if (totalSupport > 0) {
    context += `- ${formatCurrency(totalSupport)} in support distributed in the last 30 days\n`;
  }
  
  context += `- Your donations directly help those we serve`;

  return context;
}

async function fetchSermonsContext(orgId: string): Promise<string> {
  const recentSermons = await db
    .select()
    .from(sermons)
    .where(and(
      eq(sermons.orgId, orgId),
      eq(sermons.status, 'published')
    ))
    .orderBy(desc(sermons.sermonDate))
    .limit(MAX_SERMONS);

  if (recentSermons.length === 0) {
    return "Check our website for sermon recordings and teachings.";
  }

  let context = `Recent Sermons:\n`;
  
  for (const sermon of recentSermons) {
    context += `- "${sermon.title}"`;
    
    if (sermon.speaker) {
      context += ` by ${sermon.speaker}`;
    }
    
    context += ` (${relativeDate(new Date(sermon.sermonDate))})`;
    
    if (sermon.scripture) {
      context += ` - ${sermon.scripture}`;
    }
    
    context += `\n`;
  }

  return context;
}

async function fetchLandingPageContext(orgId: string): Promise<string> {
  const [landingPage] = await db
    .select()
    .from(landingPages)
    .where(eq(landingPages.orgId, orgId))
    .limit(1);

  if (!landingPage || !landingPage.aboutUs) {
    return "Learn more about our mission and values on our website.";
  }

  // Truncate to 300 characters to keep context concise
  const aboutUs = landingPage.aboutUs.substring(0, 300);
  return `About Us: ${aboutUs}${landingPage.aboutUs.length > 300 ? '...' : ''}`;
}
