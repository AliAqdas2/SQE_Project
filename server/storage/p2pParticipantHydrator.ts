import { db } from "../db";
import { p2pParticipants, p2pParticipantMilestones, p2pParticipantBadges } from "@shared/schema";
import { eq, and, isNull, desc, sql, inArray } from "drizzle-orm";
import type { P2PParticipantWithStats } from "@shared/schema";

export async function hydrateParticipants(
  campaignId: string,
  participantIds?: string[]
): Promise<P2PParticipantWithStats[]> {
  // Query ALL campaign participants with global ranks using window function
  const allParticipantsWithRanks = await db
    .select({
      id: p2pParticipants.id,
      campaignId: p2pParticipants.campaignId,
      orgId: p2pParticipants.orgId,
      donorId: p2pParticipants.donorId,
      userId: p2pParticipants.userId,
      firstName: p2pParticipants.firstName,
      lastName: p2pParticipants.lastName,
      email: p2pParticipants.email,
      slug: p2pParticipants.slug,
      avatarUrl: p2pParticipants.avatarUrl,
      bio: p2pParticipants.bio,
      goalAmount: p2pParticipants.goalAmount,
      raisedAmount: p2pParticipants.raisedAmount,
      donationCount: p2pParticipants.donationCount,
      role: p2pParticipants.role,
      status: p2pParticipants.status,
      deletedAt: p2pParticipants.deletedAt,
      joinedAt: p2pParticipants.joinedAt,
      lastActive: p2pParticipants.lastActive,
      createdAt: p2pParticipants.createdAt,
      rank: sql<number>`RANK() OVER (ORDER BY CAST(${p2pParticipants.raisedAmount} AS NUMERIC) DESC)`.as('rank')
    })
    .from(p2pParticipants)
    .where(
      and(
        eq(p2pParticipants.campaignId, campaignId),
        isNull(p2pParticipants.deletedAt)
      )
    );

  // Filter to requested IDs in application code (preserves global ranks)
  const participantsWithRanks = participantIds
    ? allParticipantsWithRanks.filter(p => participantIds.includes(p.id))
    : allParticipantsWithRanks;

  if (participantsWithRanks.length === 0) {
    return [];
  }

  const rankMap = new Map(participantsWithRanks.map(p => [p.id, p.rank]));

  const queriedIds = participantIds || participantsWithRanks.map(p => p.id);

  // Get milestone counts for queried participants
  const milestoneCounts = await db.select({
    participantId: p2pParticipantMilestones.participantId,
    count: sql<number>`count(*)`.as('count')
  })
  .from(p2pParticipantMilestones)
  .where(
    and(
      eq(p2pParticipantMilestones.isCompleted, true),
      inArray(p2pParticipantMilestones.participantId, queriedIds)
    )
  )
  .groupBy(p2pParticipantMilestones.participantId);

  // Get badge counts for queried participants
  const badgeCounts = await db.select({
    participantId: p2pParticipantBadges.participantId,
    count: sql<number>`count(*)`.as('count')
  })
  .from(p2pParticipantBadges)
  .where(inArray(p2pParticipantBadges.participantId, queriedIds))
  .groupBy(p2pParticipantBadges.participantId);

  // Build maps for quick lookup
  const milestoneMap = new Map(milestoneCounts.map(m => [m.participantId, Number(m.count)]));
  const badgeMap = new Map(badgeCounts.map(b => [b.participantId, Number(b.count)]));

  // Hydrate participants with stats
  return participantsWithRanks.map((p) => {
    const goalAmount = parseFloat(p.goalAmount);
    const raisedAmount = parseFloat(p.raisedAmount);
    const percentOfGoal = goalAmount > 0 ? Math.round((raisedAmount / goalAmount) * 100) : 0;

    return {
      ...p,
      percentOfGoal,
      raisedAmount: p.raisedAmount,
      rank: p.rank,
      donationCount: p.donationCount,
      milestonesCompleted: milestoneMap.get(p.id) || 0,
      badgesUnlocked: badgeMap.get(p.id) || 0,
      lastDonationAt: null,
    };
  });
}
