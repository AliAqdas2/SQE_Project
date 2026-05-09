import * as cron from 'node-cron';
import { storage } from './storage';
import { sendCampaign } from './emailSender';
import { sendSubscriptionRenewalReminder } from './resendEmail';

let schedulerTask: ReturnType<typeof cron.schedule> | null = null;

export function startEmailScheduler() {
  // Only start scheduler if we're using the database (not MemStorage)
  // Check if DATABASE_URL environment variable exists
  if (!process.env.DATABASE_URL) {
    console.log('Email scheduler not started - using MemStorage (no DATABASE_URL)');
    return;
  }

  if (schedulerTask) {
    console.log('Email scheduler already running');
    return;
  }

  // Run every 5 minutes to check for scheduled campaigns and renewal reminders
  schedulerTask = cron.schedule('*/5 * * * *', async () => {
    try {
      await checkScheduledCampaigns();
      await checkSubscriptionRenewalReminders();
    } catch (error) {
      console.error('Error in email scheduler:', error);
    }
  });

  console.log('Email scheduler started - checking every 5 minutes');
}

export function stopEmailScheduler() {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    console.log('Email scheduler stopped');
  }
}

async function checkScheduledCampaigns() {
  const now = new Date();
  
  try {
    // Get all scheduled campaigns that are ready to be sent
    const scheduledCampaigns = await storage.getScheduledCampaignsToSend(now);
    
    for (const campaign of scheduledCampaigns) {
      try {
        console.log(`Sending scheduled campaign ${campaign.id}`);
        
        // Send the campaign
        await sendCampaign(campaign.id, storage);
        
        console.log(`Successfully sent scheduled campaign ${campaign.id}`);
      } catch (error) {
        console.error(`Error sending campaign ${campaign.id}:`, error);
        // Continue with next campaign even if one fails
      }
    }
  } catch (error) {
    console.error('Error checking scheduled campaigns:', error);
  }
}

async function checkSubscriptionRenewalReminders() {
  const now = new Date();
  // Calculate date 7 days from now
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  // Set both dates to start of day for comparison
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const endOfTargetDay = new Date(sevenDaysFromNow.setHours(23, 59, 59, 999));
  
  try {
    // Get all organizations
    const organizations = await storage.listOrganizations();
    
    for (const org of organizations) {
      try {
        // Get organization's subscription
        const subscription = await storage.getOrganizationSubscription(org.id);
        
        if (!subscription || !subscription.currentPeriodEnd || subscription.status === 'canceled') {
          continue;
        }
        
        // Get the plan details
        const plan = await storage.getSubscriptionPlan(subscription.planId);
        if (!plan || plan.tierCode === 'free') {
          continue; // Skip FREE tier
        }
        
        // Check if renewal date is exactly 7 days from now
        const renewalDate = new Date(subscription.currentPeriodEnd);
        const renewalDateStart = new Date(renewalDate.setHours(0, 0, 0, 0));
        
        // Only send if renewal is 7 days from now
        if (renewalDateStart.getTime() < startOfToday.getTime() || renewalDateStart.getTime() > endOfTargetDay.getTime()) {
          continue;
        }
        
        // Get country pricing for amount
        const countryPricing = await storage.listCountryPricing(org.country || 'GB');
        const pricing = countryPricing.find(p => p.tierCode === plan.tierCode);
        
        if (!pricing) {
          console.warn(`No pricing found for ${plan.tierCode} in ${org.country}`);
          continue;
        }
        
        // Check if we already sent a reminder for this renewal period
        if (
          subscription.lastRenewalReminderForPeriodEnd &&
          subscription.currentPeriodEnd &&
          subscription.lastRenewalReminderForPeriodEnd.getTime() === subscription.currentPeriodEnd.getTime()
        ) {
          // Already sent reminder for this renewal period
          continue;
        }
        
        // Determine billing cycle and amount
        const billingCycle = subscription.billingCycle || 'monthly';
        const amount = billingCycle === 'monthly' ? pricing.monthlyPrice : pricing.yearlyPrice;
        
        // Use organization email (primary contact)
        if (!org.email) {
          console.warn(`No email found for organization ${org.id}`);
          continue;
        }
        
        // Send renewal reminder
        await sendSubscriptionRenewalReminder({
          to: org.email,
          organizationName: org.name,
          planName: plan.name,
          amount: parseFloat(amount).toFixed(2),
          currency: pricing.currency,
          renewalDate: renewalDate.toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          }),
          billingCycle: billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1),
          logoUrl: org.logoUrl || undefined,
        });
        
        // Update subscription with reminder tracking
        await storage.updateOrganizationSubscription(subscription.id, {
          lastRenewalReminderSentAt: new Date(),
          lastRenewalReminderForPeriodEnd: subscription.currentPeriodEnd,
        });
        
        console.log(`Sent renewal reminder for org ${org.id} (${org.name}) - renews on ${renewalDate.toLocaleDateString()}`);
      } catch (error) {
        console.error(`Error sending renewal reminder for org ${org.id}:`, error);
        // Continue with next organization even if one fails
      }
    }
  } catch (error) {
    console.error('Error checking subscription renewal reminders:', error);
  }
}
