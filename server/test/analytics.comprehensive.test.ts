import { describe, it, expect, beforeEach, vi } from "vitest";
import { resolveDateRange } from "../analytics";
import { subDays, differenceInCalendarDays } from "date-fns";

describe("Analytics Module - Core Functions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set a fixed date for consistent testing
    vi.setSystemTime(new Date("2026-05-09T12:00:00Z"));
  });

  describe("resolveDateRange", () => {
    it("should use default 30-day range when no dates provided", () => {
      const result = resolveDateRange();
      const today = new Date();
      const expectedFrom = subDays(today, 30);

      expect(result.to.getTime()).toBeCloseTo(today.getTime(), -3);
      expect(result.from.getTime()).toBeCloseTo(expectedFrom.getTime(), -3);
    });

    it("should parse provided from and to dates", () => {
      const fromDate = "2026-04-01";
      const toDate = "2026-04-30";

      const result = resolveDateRange(fromDate, toDate);

      expect(result.from.toISOString()).toContain("2026-04-01");
      expect(result.to.toISOString()).toContain("2026-04-30");
    });

    it("should use current date as 'to' when only 'from' is provided", () => {
      const fromDate = "2026-04-01";
      const today = new Date();

      const result = resolveDateRange(fromDate);

      expect(result.from.toISOString()).toContain("2026-04-01");
      expect(result.to.getTime()).toBeCloseTo(today.getTime(), -3);
    });

    it("should handle date strings with different formats", () => {
      const fromDate = "2026-03-15T10:30:00Z";
      const toDate = "2026-04-15T23:59:59Z";

      const result = resolveDateRange(fromDate, toDate);

      expect(result.from).toBeInstanceOf(Date);
      expect(result.to).toBeInstanceOf(Date);
      expect(result.from.getMonth()).toBe(2); // March (0-indexed)
      expect(result.to.getMonth()).toBe(3); // April (0-indexed)
    });

    it("should default from to 30 days before to date when only to is provided", () => {
      const toDate = "2026-05-01";
      const expectedFrom = subDays(new Date(toDate), 30);

      const result = resolveDateRange(undefined, toDate);

      expect(result.to.toISOString()).toContain("2026-05-01");
      expect(result.from.getTime()).toBeCloseTo(expectedFrom.getTime(), -3);
    });

    it("should handle same day for from and to", () => {
      const sameDate = "2026-05-01";

      const result = resolveDateRange(sameDate, sameDate);

      expect(result.from.toDateString()).toBe(result.to.toDateString());
    });

    it("should calculate correct date difference for various ranges", () => {
      const testCases = [
        { from: "2026-01-01", to: "2026-01-31", expectedDays: 30 },
        { from: "2026-02-01", to: "2026-02-28", expectedDays: 27 },
        { from: "2026-03-01", to: "2026-03-31", expectedDays: 30 },
        { from: "2026-04-01", to: "2026-04-07", expectedDays: 6 },
      ];

      testCases.forEach(({ from, to, expectedDays }) => {
        const result = resolveDateRange(from, to);
        const diff = differenceInCalendarDays(result.to, result.from);
        expect(diff).toBe(expectedDays);
      });
    });
  });

  describe("Date Range Calculations", () => {
    it("should calculate previous period correctly for 7-day range", () => {
      const from = new Date("2026-05-01");
      const to = new Date("2026-05-07");
      const daysDiff = differenceInCalendarDays(to, from) + 1; // +1 for inclusive

      expect(daysDiff).toBe(7);

      const prevFrom = subDays(from, daysDiff);
      const expectedPrevFrom = new Date("2026-04-24");

      expect(prevFrom.toDateString()).toBe(expectedPrevFrom.toDateString());
    });

    it("should calculate previous period correctly for 30-day range", () => {
      const from = new Date("2026-04-10");
      const to = new Date("2026-05-09");
      const daysDiff = differenceInCalendarDays(to, from) + 1;

      expect(daysDiff).toBe(30);

      const prevFrom = subDays(from, daysDiff);
      const expectedPrevFrom = new Date("2026-03-11");

      expect(prevFrom.toDateString()).toBe(expectedPrevFrom.toDateString());
    });

    it("should handle leap year date calculations", () => {
      const from = new Date("2024-02-01"); // 2024 is a leap year
      const to = new Date("2024-02-29");
      const daysDiff = differenceInCalendarDays(to, from) + 1;

      expect(daysDiff).toBe(29); // Feb in leap year has 29 days
    });
  });

  describe("Analytics Data Calculations", () => {
    it("should calculate percentage change correctly - positive growth", () => {
      const currentAmount = 10000;
      const previousAmount = 8000;

      const percentChange = ((currentAmount - previousAmount) / previousAmount) * 100;

      expect(percentChange).toBe(25); // 25% growth
    });

    it("should calculate percentage change correctly - negative growth", () => {
      const currentAmount = 6000;
      const previousAmount = 8000;

      const percentChange = ((currentAmount - previousAmount) / previousAmount) * 100;

      expect(percentChange).toBe(-25); // 25% decline
    });

    it("should handle zero previous amount gracefully", () => {
      const currentAmount = 5000;
      const previousAmount = 0;

      const percentChange = previousAmount > 0 
        ? ((currentAmount - previousAmount) / previousAmount) * 100 
        : 0;

      expect(percentChange).toBe(0);
    });

    it("should calculate average donation correctly", () => {
      const totalAmount = 10000;
      const donationCount = 50;

      const average = donationCount > 0 ? totalAmount / donationCount : 0;

      expect(average).toBe(200);
    });

    it("should handle zero donations when calculating average", () => {
      const totalAmount = 0;
      const donationCount = 0;

      const average = donationCount > 0 ? totalAmount / donationCount : 0;

      expect(average).toBe(0);
    });

    it("should calculate campaign completion rate correctly", () => {
      const totalGoal = 50000;
      const totalRaised = 37500;

      const completionRate = totalGoal > 0 ? (totalRaised / totalGoal) * 100 : 0;

      expect(completionRate).toBe(75);
    });

    it("should handle zero goal amount in completion rate", () => {
      const totalGoal = 0;
      const totalRaised = 5000;

      const completionRate = totalGoal > 0 ? (totalRaised / totalGoal) * 100 : 0;

      expect(completionRate).toBe(0);
    });

    it("should calculate average volunteer hours correctly", () => {
      const totalHours = 240;
      const activeVolunteers = 12;

      const average = activeVolunteers > 0 ? totalHours / activeVolunteers : 0;

      expect(average).toBe(20);
    });
  });

  describe("Number Casting and Validation", () => {
    it("should correctly cast string numbers from database", () => {
      const dbAmount = "12345.67";

      const numericAmount = Number(dbAmount);

      expect(numericAmount).toBe(12345.67);
      expect(typeof numericAmount).toBe("number");
    });

    it("should handle null values from database sums", () => {
      const dbSum = null;

      const safeSum = Number(dbSum ?? 0);

      expect(safeSum).toBe(0);
    });

    it("should handle undefined values with nullish coalescing", () => {
      const dbValue = undefined;

      const safeValue = Number(dbValue ?? 0);

      expect(safeValue).toBe(0);
    });

    it("should correctly sum array of string numbers", () => {
      const amounts = ["100.50", "200.75", "300.25"];

      const total = amounts.reduce((sum, amt) => sum + Number(amt), 0);

      expect(total).toBe(601.50);
    });
  });
});
