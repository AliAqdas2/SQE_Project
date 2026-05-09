import { Resend } from 'resend';
import { randomBytes } from 'crypto';
import { renderEmailHTML } from './emailRenderer';
import type { EmailCampaign, EmailRecipient, InsertEmailRecipient, User } from '@shared/schema';
import { db } from './db';
import { users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Get Resend credentials from environment variables
function getCredentials() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@plegit.app';

  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  return {
    apiKey,
    fromEmail
  };
}

// Get Resend client using environment variables
function getResendClient() {
  const { apiKey, fromEmail } = getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

function generateUnsubscribeToken(): string {
  return randomBytes(32).toString('hex');
}

async function buildRecipientList(
  campaign: EmailCampaign,
  storage: any
): Promise<Array<{email: string; firstName?: string; lastName?: string;}>> {
  if (campaign.recipientType === 'custom') {
    const recipientEmails = campaign.recipientEmails as Array<{email: string; firstName?: string; lastName?: string;}>;
    return recipientEmails || [];
  }
  
  let allUsers: User[] = [];
  
  if (campaign.recipientType === 'all_members') {
    const orgUsers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.orgId, campaign.orgId),
          eq(users.emailOptedOut, false)
        )
      );
    allUsers = orgUsers;
  } else if (campaign.recipientType === 'by_tags') {
    const recipientTags = campaign.recipientTags as string[];
    if (!recipientTags || recipientTags.length === 0) {
      return [];
    }
    
    const usersMap = new Map<string, User>();
    
    for (const tagId of recipientTags) {
      const taggedUsers = await storage.getMembersByTag(tagId);
      for (const user of taggedUsers) {
        if (!user.emailOptedOut) {
          usersMap.set(user.id, user);
        }
      }
    }
    
    allUsers = Array.from(usersMap.values());
  }
  
  return allUsers.map(user => ({
    email: user.email,
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
  }));
}

async function sendBatch(
  recipientRecords: EmailRecipient[],
  campaign: EmailCampaign,
  storage: any
): Promise<void> {
  const { client, fromEmail } = getResendClient();
  
  for (const recipient of recipientRecords) {
    try {
      const emailHtml = await renderEmailHTML(
        campaign.blocks as any[],
        {
          firstName: recipient.firstName || '',
          lastName: recipient.lastName || '',
          email: recipient.email,
        },
        recipient.unsubscribeToken
      );
      
      const result = await client.emails.send({
        from: fromEmail,
        to: recipient.email,
        subject: campaign.subject,
        html: emailHtml,
      });
      
      if (result.error) {
        console.error('Error sending email to', recipient.email, result.error);
        await storage.updateEmailRecipient(recipient.id, {
          status: 'failed',
          errorMessage: result.error.message || 'Unknown error',
        });
      } else {
        const resendEmailId = result.data?.id || null;
        await storage.updateEmailRecipient(recipient.id, {
          status: 'sent',
          resendEmailId,
          sentAt: new Date(),
        });
        
        const currentCampaign = await storage.getEmailCampaign(campaign.id);
        if (currentCampaign) {
          await storage.updateCampaignStats(campaign.id, {
            sentCount: (currentCampaign.sentCount || 0) + 1,
          });
        }
      }
    } catch (error: any) {
      console.error('Exception sending email to', recipient.email, error);
      await storage.updateEmailRecipient(recipient.id, {
        status: 'failed',
        errorMessage: error.message || 'Unknown exception',
      });
    }
  }
}

export async function sendCampaign(
  campaignId: string,
  storage: any
): Promise<void> {
  try {
    const campaign = await storage.getEmailCampaign(campaignId);
    
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new Error(`Campaign status must be 'draft' or 'scheduled', but is '${campaign.status}'`);
    }
    
    await storage.updateEmailCampaign(campaignId, {
      status: 'sending',
    });
    
    const recipientList = await buildRecipientList(campaign, storage);
    
    if (recipientList.length === 0) {
      console.warn(`Campaign ${campaignId} has no recipients`);
      await storage.updateEmailCampaign(campaignId, {
        status: 'sent',
        sentAt: new Date(),
        totalRecipients: 0,
      });
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
      
      const created = await storage.createEmailRecipient(recipient);
      recipientRecords.push(created);
    }
    
    await storage.updateCampaignStats(campaignId, {
      totalRecipients: recipientRecords.length,
    });
    
    const BATCH_SIZE = 100;
    for (let i = 0; i < recipientRecords.length; i += BATCH_SIZE) {
      const batch = recipientRecords.slice(i, i + BATCH_SIZE);
      await sendBatch(batch, campaign, storage);
    }
    
    const finalCampaign = await storage.getEmailCampaign(campaignId);
    await storage.updateEmailCampaign(campaignId, {
      status: 'sent',
      sentAt: new Date(),
    });
    
    console.log(`Campaign ${campaignId} sent to ${finalCampaign?.sentCount || 0} recipients`);
  } catch (error: any) {
    console.error('Error sending campaign:', error);
    await storage.updateEmailCampaign(campaignId, {
      status: 'failed',
    });
    throw error;
  }
}
