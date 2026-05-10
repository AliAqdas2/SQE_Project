import { describe, it, expect, beforeEach, vi } from "vitest";
import { resolveDateRange } from "../analytics";
import { subDays } from "date-fns";

describe("Analytics Module", () => {
  describe("resolveDateRange", () => {
    it("should use current date as 'to' when not provided", () => {
      const result = resolveDateRange();
      const now = new Date();
      
      expect(result.to.getDate()).toBe(now.getDate());
      expect(result.to.getMonth()).toBe(now.getMonth());
      expect(result.to.getFullYear()).toBe(now.getFullYear());
    });

    it("should default to 30 days ago as 'from' when not provided", () => {
      const result = resolveDateRange();
      const expected = subDays(new Date(), 30);
      
      expect(result.from.getDate()).toBe(expected.getDate());
      expect(result.from.getMonth()).toBe(expected.getMonth());
    });

    it("should parse provided date strings correctly", () => {
      const from = "2024-01-01";
      const to = "2024-01-31";
      
      const result = resolveDateRange(from, to);
      
      expect(result.from.toISOString()).toContain("2024-01-01");
      expect(result.to.toISOString()).toContain("2024-01-31");
    });

    it("should handle ISO date strings with timestamps", () => {
      const from = "2024-06-15T10:30:00Z";
      const to = "2024-06-20T15:45:00Z";
      
      const result = resolveDateRange(from, to);
      
      expect(result.from.toISOString()).toBe("2024-06-15T10:30:00.000Z");
      expect(result.to.toISOString()).toBe("2024-06-20T15:45:00.000Z");
    });

    it("should handle partial date inputs (only 'to' provided)", () => {
      const to = "2024-12-31";
      const result = resolveDateRange(undefined, to);
      
      expect(result.to.toISOString()).toContain("2024-12-31");
      expect(result.from < result.to).toBe(true);
    });
  });
});
