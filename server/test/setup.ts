import { vi } from "vitest";

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.STORAGE_DIR = "./test-storage";
process.env.BASE_URL = "http://localhost:5000";

// Mock database connection
vi.mock("../db", () => ({
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock storage
vi.mock("../storage", () => ({
  storage: {
    getOrganization: vi.fn(),
    getOrganizationSubscription: vi.fn(),
    updateOrganizationSubscription: vi.fn(),
    getSubscriptionPlan: vi.fn(),
    listSubscriptionPlans: vi.fn(),
    listOrganizations: vi.fn(),
    getMembersByTag: vi.fn(),
  },
}));
