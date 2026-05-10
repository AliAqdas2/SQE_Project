import { db } from "./db";
import { donations, campaigns, events, eventRegistrations, volunteers, volunteerHours, beneficiaries, beneficiaryDonations, activities, activityRegistrations } from "@shared/schema";
import { eq, and, gte, lte, sql, count, sum, desc, inArray } from "drizzle-orm";
import { format, subDays, differenceInCalendarDays } from "date-fns";

interface DateRange {
  from: Date;
  to: Date;
}

// Normalize date range with defaults
export function resolveDateRange(from?: string, to?: string): DateRange {
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : subDays(toDate, 30);
  return { from: fromDate, to: toDate };
}

// Donations Analytics
export async function getDonationsAnalytics(orgId: string, dateRange: DateRange) {
  // Get current period donations
  const currentPeriodDonations = await db
    .select({
      totalAmount: sum(donations.amount),
      count: count(),
    })
    .from(donations)
    .where(
      and(
        eq(donations.orgId, orgId),
        gte(donations.createdAt, dateRange.from),
        lte(donations.createdAt, dateRange.to)
      )
    );

  // Get unique donors
  const uniqueDonors = await db
    .select({
      count: sql<number>`COUNT(DISTINCT ${donations.donorEmail})`,
    })
    .from(donations)
    .where(
      and(
        eq(donations.orgId, orgId),
        gte(donations.createdAt, dateRange.from),
        lte(donations.createdAt, dateRange.to)
      )
    );

  // Get previous period for comparison (exclusive upper bound to avoid double-counting)
  // Use differenceInCalendarDays + 1 to account for inclusive ranges
  const daysDiff = differenceInCalendarDays(dateRange.to, dateRange.from) + 1;
  const prevFrom = subDays(dateRange.from, daysDiff);
  const prevTo = dateRange.from; // Exclusive upper bound

  const previousPeriodDonations = await db
    .select({
      totalAmount: sum(donations.amount),
    })
    .from(donations)
    .where(
      and(
        eq(donations.orgId, orgId),
        gte(donations.createdAt, prevFrom),
        sql`${donations.createdAt} < ${prevTo}` // Exclusive to avoid double-counting
      )
    );

  // Get daily timeline
  const timeline = await db
    .select({
      date: sql<string>`DATE(${donations.createdAt})`,
      amount: sum(donations.amount),
      count: count(),
    })
    .from(donations)
    .where(
      and(
        eq(donations.orgId, orgId),
        gte(donations.createdAt, dateRange.from),
        lte(donations.createdAt, dateRange.to)
      )
    )
    .groupBy(sql`DATE(${donations.createdAt})`)
    .orderBy(sql`DATE(${donations.createdAt})`);

  const totalAmount = Number(currentPeriodDonations[0]?.totalAmount || 0);
  const donationCount = Number(currentPeriodDonations[0]?.count || 0); // Cast count to number
  const prevAmount = Number(previousPeriodDonations[0]?.totalAmount || 0);
  const percentChange = prevAmount > 0 ? ((totalAmount - prevAmount) / prevAmount) * 100 : 0;

  return {
    totalAmount,
    donationCount,
    averageDonation: donationCount > 0 ? totalAmount / donationCount : 0,
    uniqueDonors: Number(uniqueDonors[0]?.count || 0),
    percentChange,
    timeline: timeline.map((t) => ({
      date: t.date,
      amount: Number(t.amount || 0),
      count: Number(t.count || 0), // Cast count to number
    })),
  };
}

// Campaigns Analytics
export async function getCampaignsAnalytics(orgId: string, dateRange: DateRange) {
  // Get currently active campaigns (regardless of when they were created)
  // This provides a snapshot of active campaigns within the date range
  const activeCampaigns = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.orgId, orgId),
        eq(campaigns.status, "active")
      )
    );

  // Explicitly cast decimal fields to numbers (they come as strings from Drizzle)
  const totalGoal = activeCampaigns.reduce((sum, c) => sum + Number(c.goalAmount ?? 0), 0);
  const totalRaised = activeCampaigns.reduce((sum, c) => sum + Number(c.currentAmount ?? 0), 0);
  const completionRate = totalGoal > 0 ? (totalRaised / totalGoal) * 100 : 0;

  const topCampaigns = activeCampaigns
    .map((c) => ({
      id: c.id,
      title: c.title,
      goalAmount: Number(c.goalAmount ?? 0),
      currentAmount: Number(c.currentAmount ?? 0),
      percentage: Number(c.goalAmount ?? 0) > 0 ? (Number(c.currentAmount ?? 0) / Number(c.goalAmount ?? 0)) * 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return {
    activeCampaigns: activeCampaigns.length,
    totalGoal,
    totalRaised,
    completionRate,
    topCampaigns,
  };
}

// Events Analytics
export async function getEventsAnalytics(orgId: string, dateRange: DateRange) {
  // Get events that start within or overlap the date range
  const upcomingEvents = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.orgId, orgId),
        gte(events.date, dateRange.from),
        lte(events.date, dateRange.to)
      )
    );

  const eventIds = upcomingEvents.map((e) => e.id);

  // Get registrations for these events using inArray for proper parameterization
  const registrations = eventIds.length > 0 
    ? await db
        .select({
          eventId: eventRegistrations.eventId,
          count: count(),
          totalRevenue: sum(eventRegistrations.totalPaid),
        })
        .from(eventRegistrations)
        .where(inArray(eventRegistrations.eventId, eventIds))
        .groupBy(eventRegistrations.eventId)
    : [];

  // Cast count and revenue to numbers (counts are strings, sums can be null)
  const totalRegistrations = registrations.reduce((sum, r) => sum + Number(r.count ?? 0), 0);
  const totalRevenue = registrations.reduce((sum, r) => sum + Number(r.totalRevenue ?? 0), 0);

  const eventsWithCounts = upcomingEvents.map((event) => {
    const reg = registrations.find((r) => r.eventId === event.id);
    return {
      id: event.id,
      title: event.title,
      date: event.date.toISOString(),
      registrationCount: Number(reg?.count || 0),
    };
  });

  return {
    upcomingEvents: upcomingEvents.length,
    totalRegistrations,
    totalRevenue,
    events: eventsWithCounts,
  };
}

// Volunteers Analytics
export async function getVolunteersAnalytics(orgId: string, dateRange: DateRange) {
  // Get all volunteers for the org
  const allVolunteers = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.orgId, orgId));

  const volunteerIds = allVolunteers.map((v) => v.id);
  const activeVolunteers = allVolunteers.filter((v) => v.status === "active");

  // New volunteers created during date range
  const newVolunteers = await db
    .select()
    .from(volunteers)
    .where(
      and(
        eq(volunteers.orgId, orgId),
        gte(volunteers.createdAt, dateRange.from),
        lte(volunteers.createdAt, dateRange.to)
      )
    );

  // Hours logged during date range - use inArray for proper parameterization
  const hours = volunteerIds.length > 0
    ? await db
        .select({
          totalHours: sum(volunteerHours.hoursWorked),
        })
        .from(volunteerHours)
        .where(
          and(
            inArray(volunteerHours.volunteerId, volunteerIds),
            gte(volunteerHours.date, dateRange.from),
            lte(volunteerHours.date, dateRange.to)
          )
        )
    : [{ totalHours: null }];

  // Handle nullable sum - coalesce to 0 to avoid NaN
  const totalHours = Number(hours[0]?.totalHours ?? 0);
  const averageHoursPerVolunteer = activeVolunteers.length > 0 ? totalHours / activeVolunteers.length : 0;

  return {
    activeVolunteers: activeVolunteers.length,
    totalHours,
    averageHoursPerVolunteer,
    newVolunteers: newVolunteers.length,
  };
}

// Beneficiaries Analytics
export async function getBeneficiariesAnalytics(orgId: string, dateRange: DateRange) {
  const allBeneficiaries = await db
    .select()
    .from(beneficiaries)
    .where(eq(beneficiaries.orgId, orgId));

  const beneficiaryIds = allBeneficiaries.map((b) => b.id);

  // New beneficiaries created during date range
  const newBeneficiaries = await db
    .select()
    .from(beneficiaries)
    .where(
      and(
        eq(beneficiaries.orgId, orgId),
        gte(beneficiaries.createdAt, dateRange.from),
        lte(beneficiaries.createdAt, dateRange.to)
      )
    );

  // Support distributed during date range - use inArray for proper parameterization
  const supportData = beneficiaryIds.length > 0
    ? await db
        .select({
          beneficiaryId: beneficiaryDonations.beneficiaryId,
          totalAmount: sum(beneficiaryDonations.amount),
        })
        .from(beneficiaryDonations)
        .where(
          and(
            inArray(beneficiaryDonations.beneficiaryId, beneficiaryIds),
            gte(beneficiaryDonations.deliveryDate, dateRange.from),
            lte(beneficiaryDonations.deliveryDate, dateRange.to)
          )
        )
        .groupBy(beneficiaryDonations.beneficiaryId)
    : [];

  // Handle nullable sums - use nullish coalescing to avoid NaN
  const totalDistributed = supportData.reduce((sum, s) => sum + Number(s.totalAmount ?? 0), 0);

  return {
    totalBeneficiaries: allBeneficiaries.length,
    newBeneficiaries: newBeneficiaries.length,
    totalDistributed,
    supported: supportData.length,
  };
}

// Activities Analytics
export async function getActivitiesAnalytics(orgId: string, dateRange: DateRange) {
  // Get activities created during date range
  const activeActivities = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.orgId, orgId),
        eq(activities.status, "active"),
        gte(activities.createdAt, dateRange.from),
        lte(activities.createdAt, dateRange.to)
      )
    );

  const activityIds = activeActivities.map((a) => a.id);

  // Get enrollments for these activities using inArray
  const enrollments = activityIds.length > 0
    ? await db
        .select({
          count: count(),
        })
        .from(activityRegistrations)
        .where(inArray(activityRegistrations.activityId, activityIds))
    : [{ count: 0 }];

  return {
    activeActivities: activeActivities.length,
    totalEnrollments: Number(enrollments[0]?.count || 0),
    averageAttendance: 85, // Placeholder - would need attendance tracking
    revenue: activeActivities.filter((a) => !a.isFree).length * 50, // Placeholder calculation
  };
}

// Recent Activity Feed
export async function getRecentActivity(orgId: string, dateRange: DateRange) {
  // Get recent donations
  const recentDonations = await db
    .select({
      id: donations.id,
      createdAt: donations.createdAt,
      amount: donations.amount,
      donorName: donations.donorName,
    })
    .from(donations)
    .where(
      and(
        eq(donations.orgId, orgId),
        gte(donations.createdAt, dateRange.from),
        lte(donations.createdAt, dateRange.to)
      )
    )
    .orderBy(desc(donations.createdAt))
    .limit(10);

  const activities = recentDonations.map((d) => ({
    id: d.id,
    type: "donation" as const,
    description: `${d.donorName} donated $${Number(d.amount).toFixed(2)}`,
    timestamp: d.createdAt.toISOString(),
    metadata: { amount: Number(d.amount), donorName: d.donorName },
  }));

  return {
    activities,
  };
}
