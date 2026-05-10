import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendTierUpgradeEmail } from "./email";

export class MemberCountService {
  async getActiveMemberCount(orgId: string): Promise<number> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.orgId, orgId));

    return result.length;
  }

  async updateOrganizationMemberCount(orgId: string): Promise<number> {
    const memberCount = await this.getActiveMemberCount(orgId);
    
    const subscription = await storage.getOrganizationSubscription(orgId);
    if (subscription) {
      await storage.updateOrganizationSubscription(subscription.id, {
        memberCount,
      });
    }

    return memberCount;
  }

  async checkAndPerformAutoUpgrade(orgId: string): Promise<{ upgraded: boolean; previousPlan?: string; newPlan?: string }> {
    const currentMemberCount = await this.updateOrganizationMemberCount(orgId);
    
    const subscription = await storage.getOrganizationSubscription(orgId);
    if (!subscription) {
      return { upgraded: false };
    }

    const currentPlan = await storage.getSubscriptionPlan(subscription.planId);
    if (!currentPlan) {
      return { upgraded: false };
    }

    // Check if member count exceeds current plan's max
    if (currentPlan.maxMembers && currentMemberCount > currentPlan.maxMembers) {
      const allPlans = await storage.listSubscriptionPlans(true);
      
      // Find the appropriate plan for the current member count
      const nextPlan = allPlans.find(
        (p) => p.minMembers <= currentMemberCount && (!p.maxMembers || currentMemberCount <= p.maxMembers)
      );

      if (nextPlan && nextPlan.id !== currentPlan.id) {
        // Perform the upgrade
        await storage.updateOrganizationSubscription(subscription.id, {
          planId: nextPlan.id,
          autoUpgradeQueued: false,
        });

        console.log(
          `Auto-upgrade performed for org ${orgId}: ${currentPlan.name} -> ${nextPlan.name} (${currentMemberCount} members)`
        );

        // Send email notification
        try {
          await this.sendUpgradeNotification(
            orgId,
            currentPlan.name,
            nextPlan.name,
            currentMemberCount
          );
        } catch (emailError) {
          console.error("Failed to send tier upgrade email:", emailError);
        }

        return { 
          upgraded: true, 
          previousPlan: currentPlan.name, 
          newPlan: nextPlan.name 
        };
      }
    }

    return { upgraded: false };
  }

  // Legacy method for backward compatibility - now calls the new method
  async checkAndQueueAutoUpgrade(orgId: string): Promise<boolean> {
    const result = await this.checkAndPerformAutoUpgrade(orgId);
    return result.upgraded;
  }

  private async sendUpgradeNotification(
    orgId: string,
    previousPlanName: string,
    newPlanName: string,
    memberCount: number
  ): Promise<void> {
    // Get the organization details
    const organization = await storage.getOrganization(orgId);
    if (!organization) {
      console.error("Cannot send upgrade email: Organization not found");
      return;
    }

    // Get the organization admin (first user with org_admin role for this org)
    const orgUsers = await db
      .select()
      .from(users)
      .where(eq(users.orgId, orgId));
    
    const orgAdmin = orgUsers.find(u => u.role === "org_admin") || orgUsers[0];
    
    // Use org admin email if available, otherwise fall back to organization's contact email
    const recipientEmail = orgAdmin?.email || organization.email;
    
    if (!recipientEmail) {
      console.error("Cannot send upgrade email: No email address found for organization or admin");
      return;
    }

    // Determine base URL for the email links
    const baseUrl = process.env.BASE_URL || process.env.APP_URL || "https://plegit.app";

    await sendTierUpgradeEmail(
      recipientEmail,
      organization.name,
      previousPlanName,
      newPlanName,
      memberCount,
      baseUrl
    );

    console.log(`Tier upgrade email sent to ${recipientEmail} for org ${organization.name}`);
  }

  async getRecommendedTier(memberCount: number): Promise<any> {
    const plans = await storage.listSubscriptionPlans(true);
    
    const recommended = plans.find(
      (p) => p.minMembers <= memberCount && (!p.maxMembers || memberCount <= p.maxMembers)
    );

    return recommended || plans[plans.length - 1]; // Default to enterprise if exceeds all tiers
  }

  async getTierUsagePercentage(orgId: string): Promise<number> {
    const subscription = await storage.getOrganizationSubscription(orgId);
    if (!subscription) {
      return 0;
    }

    const currentPlan = await storage.getSubscriptionPlan(subscription.planId);
    if (!currentPlan || !currentPlan.maxMembers) {
      return 0; // Enterprise tier has no limit
    }

    const memberCount = subscription.memberCount;
    const percentage = (memberCount / currentPlan.maxMembers) * 100;

    return Math.min(percentage, 100);
  }

  // Batch check and upgrade all organizations that need it
  async checkAllOrganizationsForUpgrade(): Promise<{ orgId: string; previousPlan: string; newPlan: string }[]> {
    const upgrades: { orgId: string; previousPlan: string; newPlan: string }[] = [];
    
    // Get all organizations with subscriptions
    const organizations = await storage.listOrganizations();
    
    for (const org of organizations) {
      try {
        const result = await this.checkAndPerformAutoUpgrade(org.id);
        if (result.upgraded && result.previousPlan && result.newPlan) {
          upgrades.push({
            orgId: org.id,
            previousPlan: result.previousPlan,
            newPlan: result.newPlan,
          });
        }
      } catch (error) {
        console.error(`Error checking upgrade for org ${org.id}:`, error);
      }
    }

    return upgrades;
  }
}

export const memberCountService = new MemberCountService();
