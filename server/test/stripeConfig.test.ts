import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isStripeApiConfigured, resolveStripeSecretKey } from "../stripeConfig";

describe("Stripe Configuration Module", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isStripeApiConfigured", () => {
    it("should return true when STRIPE_SECRET_KEY is set", () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_12345";
      
      expect(isStripeApiConfigured()).toBe(true);
    });

    it("should return true when TESTING_STRIPE_SECRET_KEY is set", () => {
      process.env.TESTING_STRIPE_SECRET_KEY = "sk_test_67890";
      
      expect(isStripeApiConfigured()).toBe(true);
    });

    it("should return false when no Stripe key is set", () => {
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.TESTING_STRIPE_SECRET_KEY;
      
      expect(isStripeApiConfigured()).toBe(false);
    });

    it("should return false for empty string key", () => {
      process.env.STRIPE_SECRET_KEY = "";
      
      expect(isStripeApiConfigured()).toBe(false);
    });

    it("should return false for whitespace-only key", () => {
      process.env.STRIPE_SECRET_KEY = "   ";
      
      expect(isStripeApiConfigured()).toBe(false);
    });
  });

  describe("resolveStripeSecretKey", () => {
    it("should return TESTING_STRIPE_SECRET_KEY when set", () => {
      process.env.TESTING_STRIPE_SECRET_KEY = "sk_test_testing";
      process.env.STRIPE_SECRET_KEY = "sk_test_normal";
      
      expect(resolveStripeSecretKey()).toBe("sk_test_testing");
    });

    it("should return STRIPE_SECRET_KEY when TESTING key not set", () => {
      delete process.env.TESTING_STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = "sk_test_production";
      
      expect(resolveStripeSecretKey()).toBe("sk_test_production");
    });

    it("should trim whitespace from keys", () => {
      process.env.STRIPE_SECRET_KEY = "  sk_test_trimmed  ";
      
      expect(resolveStripeSecretKey()).toBe("sk_test_trimmed");
    });

    it("should throw error in production without key", () => {
      process.env.NODE_ENV = "production";
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.TESTING_STRIPE_SECRET_KEY;
      
      expect(() => resolveStripeSecretKey()).toThrow("Missing Stripe secret");
    });

    it("should return placeholder in development without key", () => {
      process.env.NODE_ENV = "development";
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.TESTING_STRIPE_SECRET_KEY;
      
      const result = resolveStripeSecretKey();
      
      expect(result).toContain("plegit_dev");
    });

    it("should handle test environment without key", () => {
      process.env.NODE_ENV = "test";
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.TESTING_STRIPE_SECRET_KEY;
      
      const result = resolveStripeSecretKey();
      
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
