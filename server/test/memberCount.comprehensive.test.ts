import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemberCountService } from "../memberCount";

// Mock dependencies
vi.mock("../storage", () => ({
  storage: {
    getOrganizationSubscription: vi.fn(),
    updateOrganizationSubscription: vi.fn(),
    getSubscriptionPlan: vi.fn(),
    listSubscriptionPlans: vi.fn(),
    getOrganization: vi.fn(),
    listOrganizations: vi.fn(),
  },
}));

vi.mock("../db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    })),
  },
}));

vi.mock("../email", () => ({
  sendTierUpgradeEmail: vi.fn(),
}));

describe("MemberCountService - Business Logic", () => {
  let service: MemberCountService;

  beforeEach(() => {
    service = new MemberCountService();
    vi.clearAllMocks();
  });

  describe("Member Count Logic", () => {
    it("should return zero for organization with no members", async () => {
      const { db } = await import("../db");
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      } as any);

      const count = await service.getActiveMemberCount("org-123");

      expect(count).toBe(0);
    });

    it("should count all users for organization", async () => {
      const { db } = await import("../db");
      const mockUsers = [
        { id: "1", email: "user1@test.com", orgId: "org-123" },
        { id: "2", email: "user2@test.com", orgId: "org-123" },
        { id: "3", email: "user3@test.com", orgId: "org-123" },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve(mockUsers)),
        })),
      } as any);

      const count = await service.getActiveMemberCount("org-123");

      expect(count).toBe(3);
    });
  });

  describe("Tier Upgrade Logic", () => {
    it("should not upgrade when member count is within plan limits", async () => {
      const { storage } = await import("../storage");

      vi.mocked(storage.getOrganizationSubscription).mockResolvedValue({
        id: "sub-1",
        orgId: "org-123",
        planId: "plan-basic",
        memberCount: 5,
        status: "active",
      } as any);

      vi.mocked(storage.getSubscriptionPlan).mockResolvedValue({
        id: "plan-basic",
        name: "Basic",
        minMembers: 1,
        maxMembers: 10,
      } as any);

      const { db } = await import("../db");
      const mockUsers = Array(5).fill(null).map((_, i) => ({
        id: `user-${i}`,
        email: `user${i}@test.com`,
        orgId: "org-123",
      }));

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve(mockUsers)),
        })),
      } as any);

      const result = await service.checkAndPerformAutoUpgrade("org-123");

      expect(result.upgraded).toBe(false);
      // Note: updateOrganizationSubscription is called to update memberCount even if no upgrade
      expect(storage.updateOrganizationSubscription).toHaveBeenCalledWith(
        "sub-1",
        expect.objectContaining({ memberCount: 5 })
      );
    });

    it("should upgrade when member count exceeds plan maximum", async () => {
      const { storage } = await import("../storage");

      vi.mocked(storage.getOrganizationSubscription).mockResolvedValue({
        id: "sub-1",
        orgId: "org-123",
        planId: "plan-basic",
        memberCount: 15,
        status: "active",
      } as any);

      vi.mocked(storage.getSubscriptionPlan).mockResolvedValue({
        id: "plan-basic",
        name: "Basic",
        minMembers: 1,
        maxMembers: 10,
      } as any);

      vi.mocked(storage.listSubscriptionPlans).mockResolvedValue([
        { id: "plan-basic", name: "Basic", minMembers: 1, maxMembers: 10 },
        { id: "plan-pro", name: "Professional", minMembers: 11, maxMembers: 50 },
      ] as any);

      const { db } = await import("../db");
      const mockUsers = Array(15).fill(null).map((_, i) => ({
        id: `user-${i}`,
        email: `user${i}@test.com`,
        orgId: "org-123",
      }));

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve(mockUsers)),
        })),
      } as any);

      vi.mocked(storage.getOrganization).mockResolvedValue({
        id: "org-123",
        name: "Test Org",
        email: "admin@testorg.com",
      } as any);

      const result = await service.checkAndPerformAutoUpgrade("org-123");

      expect(result.upgraded).toBe(true);
      expect(result.previousPlan).toBe("Basic");
      expect(result.newPlan).toBe("Professional");
      expect(storage.updateOrganizationSubscription).toHaveBeenCalledWith(
        "sub-1",
        expect.objectContaining({
          planId: "plan-pro",
          autoUpgradeQueued: false,
        })
      );
    });

    it("should not upgrade if no suitable plan exists for member count", async () => {
      const { storage } = await import("../storage");

      vi.mocked(storage.getOrganizationSubscription).mockResolvedValue({
        id: "sub-1",
        orgId: "org-123",
        planId: "plan-pro",
        memberCount: 100,
        status: "active",
      } as any);

      vi.mocked(storage.getSubscriptionPlan).mockResolvedValue({
        id: "plan-pro",
        name: "Professional",
        minMembers: 11,
        maxMembers: 50,
      } as any);

      // No enterprise plan available
      vi.mocked(storage.listSubscriptionPlans).mockResolvedValue([
        { id: "plan-basic", name: "Basic", minMembers: 1, maxMembers: 10 },
        { id: "plan-pro", name: "Professional", minMembers: 11, maxMembers: 50 },
      ] as any);

      const { db } = await import("../db");
      const mockUsers = Array(100).fill(null).map((_, i) => ({
        id: `user-${i}`,
        email: `user${i}@test.com`,
        orgId: "org-123",
      }));

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve(mockUsers)),
        })),
      } as any);

      const result = await service.checkAndPerformAutoUpgrade("org-123");

      expect(result.upgraded).toBe(false);
    });

    it("should not upgrade if no subscription exists", async () => {
      const { storage } = await import("../storage");

      vi.mocked(storage.getOrganizationSubscription).mockResolvedValue(null);

      const result = await service.checkAndPerformAutoUpgrade("org-123");

      expect(result.upgraded).toBe(false);
    });
  });

  describe("Tier Recommendation Logic", () => {
    it("should recommend correct tier based on member count", async () => {
      const { storage } = await import("../storage");

      vi.mocked(storage.listSubscriptionPlans).mockResolvedValue([
        { id: "plan-basic", name: "Basic", minMembers: 1, maxMembers: 10 },
        { id: "plan-pro", name: "Professional", minMembers: 11, maxMembers: 50 },
        { id: "plan-enterprise", name: "Enterprise", minMembers: 51, maxMembers: null },
      ] as any);

      const basicTier = await service.getRecommendedTier(5);
      expect(basicTier.name).toBe("Basic");

      const proTier = await service.getRecommendedTier(25);
      expect(proTier.name).toBe("Professional");

      const enterpriseTier = await service.getRecommendedTier(100);
      expect(enterpriseTier.name).toBe("Enterprise");
    });

    it("should default to enterprise tier if member count exceeds all tiers", async () => {
      const { storage } = await import("../storage");

      vi.mocked(storage.listSubscriptionPlans).mockResolvedValue([
        { id: "plan-basic", name: "Basic", minMembers: 1, maxMembers: 10 },
        { id: "plan-pro", name: "Professional", minMembers: 11, maxMembers: 50 },
      ] as any);

      const tier = await service.getRecommendedTier(200);

      expect(tier.name).toBe("Professional"); // Last available tier
    });
  });

  describe("Tier Usage Percentage", () => {
    it("should calculate correct usage percentage for active subscription", async () => {
      const { storage } = await import("../storage");

      vi.mocked(storage.getOrganizationSubscription).mockResolvedValue({
        id: "sub-1",
        orgId: "org-123",
        planId: "plan-basic",
        memberCount: 8,
        status: "active",
      } as any);

      vi.mocked(storage.getSubscriptionPlan).mockResolvedValue({
        id: "plan-basic",
        name: "Basic",
        minMembers: 1,
        maxMembers: 10,
      } as any);

      const percentage = await service.getTierUsagePercentage("org-123");

      expect(percentage).toBe(80); // 8/10 = 80%
    });

    it("should return 0% for enterprise tier with no max members", async () => {
      const { storage } = await import("../storage");

      vi.mocked(storage.getOrganizationSubscription).mockResolvedValue({
        id: "sub-1",
        orgId: "org-123",
        planId: "plan-enterprise",
        memberCount: 150,
        status: "active",
      } as any);

      vi.mocked(storage.getSubscriptionPlan).mockResolvedValue({
        id: "plan-enterprise",
        name: "Enterprise",
        minMembers: 51,
        maxMembers: null, // No limit
      } as any);

      const percentage = await service.getTierUsagePercentage("org-123");

      expect(percentage).toBe(0); // No limit = 0%
    });

    it("should cap usage percentage at 100%", async () => {
      const { storage } = await import("../storage");

      vi.mocked(storage.getOrganizationSubscription).mockResolvedValue({
        id: "sub-1",
        orgId: "org-123",
        planId: "plan-basic",
        memberCount: 15, // Exceeds max
        status: "active",
      } as any);

      vi.mocked(storage.getSubscriptionPlan).mockResolvedValue({
        id: "plan-basic",
        name: "Basic",
        minMembers: 1,
        maxMembers: 10,
      } as any);

      const percentage = await service.getTierUsagePercentage("org-123");

      expect(percentage).toBe(100); // Capped at 100%
    });

    it("should return 0% if no subscription exists", async () => {
      const { storage } = await import("../storage");

      vi.mocked(storage.getOrganizationSubscription).mockResolvedValue(null);

      const percentage = await service.getTierUsagePercentage("org-123");

      expect(percentage).toBe(0);
    });
  });

  describe("Legacy Compatibility", () => {
    it("checkAndQueueAutoUpgrade should call new method and return boolean", async () => {
      const { storage } = await import("../storage");

      vi.mocked(storage.getOrganizationSubscription).mockResolvedValue({
        id: "sub-1",
        orgId: "org-123",
        planId: "plan-basic",
        memberCount: 5,
        status: "active",
      } as any);

      vi.mocked(storage.getSubscriptionPlan).mockResolvedValue({
        id: "plan-basic",
        name: "Basic",
        minMembers: 1,
        maxMembers: 10,
      } as any);

      const { db } = await import("../db");
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve(Array(5).fill({}))),
        })),
      } as any);

      const result = await service.checkAndQueueAutoUpgrade("org-123");

      expect(typeof result).toBe("boolean");
      expect(result).toBe(false);
    });
  });
});
