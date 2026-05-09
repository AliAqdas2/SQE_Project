import { randomBytes } from 'crypto';
import type { EmailCampaign, EmailRecipient, InsertEmailRecipient, User } from '@shared/schema';
import { db } from './db';
import { users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

function generateUnsubscribeToken(): string {
  return randomBytes(32).toString('hex');
}

async function buildRecipientList(
  campaign: EmailCampaign,
  storage: unknown
): Promise<Array<{ email: string; firstName?: string; lastName?: string }>> {
  const s = storage as {
    getMembersByTag: (tagId: string) => Promise<User[]>;
  };

  if (campaign.recipientType === 'custom') {
    const recipientEmails = campaign.recipientEmails as
      | Array<{ email: string; firstName?: string; lastName?: string }>
      | undefined;
    return recipientEmails || [];
  }

  let allUsers: User[] = [];

  if (campaign.recipientType === 'all_members') {
    const orgUsers = await db
      .select()
      .from(users)
      .where(and(eq(users.orgId, campaign.orgId), eq(users.emailOptedOut, false)));
    allUsers = orgUsers;
  } else if (campaign.recipientType === 'by_tags') {
    const recipientTags = campaign.recipientTags as string[];
    if (!recipientTags || recipientTags.length === 0) {
      return [];
    }

    const usersMap = new Map<string, User>();

    for (const tagId of recipientTags) {
      const taggedUsers = await s.getMembersByTag(tagId);
      for (const user of taggedUsers) {
        if (!user.emailOptedOut) {
          usersMap.set(user.id, user);
        }
      }
    }

    allUsers = Array.from(usersMap.values());
  }

  return allUsers.map((user) => ({
    email: user.email,
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
  }));
}

async function sendBatch(
  recipientRecords: EmailRecipient[],
  campaign: EmailCampaign,
  storage: unknown
): Promise<void> {
  const s = storage as {
    updateEmailRecipient: (
      id: string,
      updates: Partial<{
        status: string;
        resendEmailId: string | null;
        sentAt: Date | null;
        errorMessage: string | null;
      }>
    ) => Promise<unknown>;
    getEmailCampaign: (id: string) => Promise<EmailCampaign | undefined>;
    updateCampaignStats: (campaignId: string, stats: { sentCount?: number }) => Promise<unknown>;
  };

  for (const recipient of recipientRecords) {
    await s.updateEmailRecipient(recipient.id, {
      status: 'sent',
      resendEmailId: null,
      sentAt: new Date(),
    });

    const currentCampaign = await s.getEmailCampaign(campaign.id);
    if (currentCampaign) {
      await s.updateCampaignStats(campaign.id, {
        sentCount: (currentCampaign.sentCount || 0) + 1,
      });
    }
  }
}

export async function sendCampaign(campaignId: string, storage: unknown): Promise<void> {
  const s = storage as {
    getEmailCampaign: (id: string) => Promise<EmailCampaign | undefined>;
    updateEmailCampaign: (id: string, updates: Partial<EmailCampaign>) => Promise<unknown>;
    createEmailRecipient: (recipient: InsertEmailRecipient) => Promise<EmailRecipient>;
    updateCampaignStats: (campaignId: string, stats: { totalRecipients?: number }) => Promise<unknown>;
  };

  try {
    const campaign = await s.getEmailCampaign(campaignId);

    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new Error(
        `Campaign status must be 'draft' or 'scheduled', but is '${campaign.status}'`
      );
    }

    await s.updateEmailCampaign(campaignId, {
      status: 'sending',
    });

    const recipientList = await buildRecipientList(campaign, storage);

    if (recipientList.length === 0) {
      console.warn(`Campaign ${campaignId} has no recipients`);
      await s.updateEmailCampaign(campaignId, {
        status: 'sent',
        sentAt: new Date(),
        totalRecipients: 0,
      } as Partial<EmailCampaign>);
      return;
    }

    const recipientRecords: EmailRecipient[] = [];
    for (const recipientData of recipientList) {
      const recipient: InsertEmailRecipient = {
        campaignId: campaign.id,
        email: recipientData.email,
        firstName: recipientData.firstName || null,
        lastName: recipientData.lastName || null,
        status: 'pending',
        unsubscribeToken: generateUnsubscribeToken(),
      };

      const created = await s.createEmailRecipient(recipient);
      recipientRecords.push(created);
    }

    await s.updateCampaignStats(campaignId, {
      totalRecipients: recipientRecords.length,
    });

    const BATCH_SIZE = 100;
    for (let i = 0; i < recipientRecords.length; i += BATCH_SIZE) {
      const batch = recipientRecords.slice(i, i + BATCH_SIZE);
      await sendBatch(batch, campaign, storage);
    }

    const finalCampaign = await s.getEmailCampaign(campaignId);
    await s.updateEmailCampaign(campaignId, {
      status: 'sent',
      sentAt: new Date(),
    });

    console.log(
      `[email disabled] Campaign ${campaignId} marked sent for ${finalCampaign?.sentCount || 0} recipients`
    );
  } catch (error: unknown) {
    console.error('Error processing campaign:', error);
    await s.updateEmailCampaign(campaignId, {
      status: 'failed',
    } as Partial<EmailCampaign>);
    throw error;
  }
}
