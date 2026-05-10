import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemberCountService } from "../memberCount";

// Mock dependencies
vi.mock("../db");
vi.mock("../storage");
vi.mock("../email");

describe("Member Count Service", () => {
  let memberCountService: MemberCountService;

  beforeEach(() => {
    memberCountService = new MemberCountService();
    vi.clearAllMocks();
  });

  describe("getTierUsagePercentage", () => {
    it("should return 0 when no subscription exists", async () => {
      const { storage } = await import("../storage");
      vi.mocked(storage.getOrganizationSubscription).mockResolvedValue(null);

      const percentage = await memberCountService.getTierUsagePercentage("org123");

      expect(percentage).toBe(0);
    });

    it("should return 0 for enterprise tier with no max members", async () => {
      const { storage } = await import("../storage");
      
      vi.mocked(storage.getOrganizationSubscription).mockResolvedValue({
        id: "sub1",
        orgId: "org123",
        planId: "plan-enterprise",
        memberCount: 100,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        createdAt: new Date(),
      } as any);

      vi.mocked(storage.getSubscriptionPlan).mockResolvedValue({
        id: "plan-enterprise",
        name: "Enterprise",
        minMembers: 51,
        maxMembers: null,
        monthlyPrice: "299.00",
        features: [],
        tier: "enterprise",
        isActive: true,
        createdAt: new Date(),
      } as any);

      const percentage = await memberCountService.getTierUsagePercentage("org123");

      expect(percentage).toBe(0);
    });

    it("should calculate percentage correctly", async () => {
      const { storage } = await import("../storage");
      
      vi.mocked(storage.getOrganizationSubscription).mockResolvedValue({
        id: "sub1",
        orgId: "org123",
        planId: "plan-starter",
        memberCount: 8,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        createdAt: new Date(),
      } as any);

      vi.mocked(storage.getSubscriptionPlan).mockResolvedValue({
        id: "plan-starter",
        name: "Starter",
        minMembers: 1,
        maxMembers: 10,
        monthlyPrice: "29.00",
        features: [],
        tier: "starter",
        isActive: true,
        createdAt: new Date(),
      } as any);

      const percentage = await memberCountService.getTierUsagePercentage("org123");

      expect(percentage).toBe(80);
    });

    it("should cap percentage at 100%", async () => {
      const { storage } = await import("../storage");
      
      vi.mocked(storage.getOrganizationSubscription).mockResolvedValue({
        id: "sub1",
        orgId: "org123",
        planId: "plan-starter",
        memberCount: 15,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        createdAt: new Date(),
      } as any);

      vi.mocked(storage.getSubscriptionPlan).mockResolvedValue({
        id: "plan-starter",
        name: "Starter",
        minMembers: 1,
        maxMembers: 10,
        monthlyPrice: "29.00",
        features: [],
        tier: "starter",
        isActive: true,
        createdAt: new Date(),
      } as any);

      const percentage = await memberCountService.getTierUsagePercentage("org123");

      expect(percentage).toBe(100);
    });
  });

  describe("getRecommendedTier", () => {
    it("should recommend correct tier for member count", async () => {
      const { storage } = await import("../storage");
      
      const plans = [
        {
          id: "plan1",
          name: "Starter",
          minMembers: 1,
          maxMembers: 10,
          tier: "starter",
        },
        {
          id: "plan2",
          name: "Growth",
          minMembers: 11,
          maxMembers: 50,
          tier: "growth",
        },
        {
          id: "plan3",
          name: "Enterprise",
          minMembers: 51,
          maxMembers: null,
          tier: "enterprise",
        },
      ];

      vi.mocked(storage.listSubscriptionPlans).mockResolvedValue(plans as any);

      const recommended = await memberCountService.getRecommendedTier(25);

      expect(recommended.name).toBe("Growth");
      expect(recommended.minMembers).toBe(11);
      expect(recommended.maxMembers).toBe(50);
    });

    it("should recommend enterprise for very high member count", async () => {
      const { storage } = await import("../storage");
      
      const plans = [
        {
          id: "plan1",
          name: "Starter",
          minMembers: 1,
          maxMembers: 10,
          tier: "starter",
        },
        {
          id: "plan2",
          name: "Enterprise",
          minMembers: 11,
          maxMembers: null,
          tier: "enterprise",
        },
      ];

      vi.mocked(storage.listSubscriptionPlans).mockResolvedValue(plans as any);

      const recommended = await memberCountService.getRecommendedTier(1000);

      expect(recommended.name).toBe("Enterprise");
    });
  });
});
