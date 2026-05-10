import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import {
  setObjectAclPolicy,
  getObjectAclPolicy,
  canAccessObject,
  ObjectAclPolicy,
  ObjectPermission,
} from "../objectAcl";

describe("Object ACL Module", () => {
  const testStorageDir = "./test-storage";
  const testFile = path.join(testStorageDir, "test-file.txt");
  const testMetadataDir = path.join(testStorageDir, "metadata");

  beforeEach(async () => {
    // Setup test environment
    process.env.STORAGE_DIR = testStorageDir;
    await fs.mkdir(testStorageDir, { recursive: true });
    await fs.writeFile(testFile, "test content");
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(testStorageDir, { recursive: true, force: true });
  });

  describe("setObjectAclPolicy", () => {
    it("should set ACL policy for a file", async () => {
      const policy: ObjectAclPolicy = {
        owner: "user123",
        visibility: "private",
      };

      await setObjectAclPolicy({ path: testFile }, policy);

      const metadataPath = path.join(testMetadataDir, "test-file.txt.meta.json");
      const exists = await fs.access(metadataPath).then(() => true).catch(() => false);
      
      expect(exists).toBe(true);
    });

    it("should throw error for non-existent file", async () => {
      const policy: ObjectAclPolicy = {
        owner: "user123",
        visibility: "public",
      };

      await expect(
        setObjectAclPolicy({ path: path.join(testStorageDir, "nonexistent.txt") }, policy)
      ).rejects.toThrow("Object not found");
    });

    it("should create metadata directory if it doesn't exist", async () => {
      const policy: ObjectAclPolicy = {
        owner: "admin",
        visibility: "public",
      };

      await setObjectAclPolicy({ path: testFile }, policy);

      const metadataDirExists = await fs.access(testMetadataDir).then(() => true).catch(() => false);
      expect(metadataDirExists).toBe(true);
    });
  });

  describe("getObjectAclPolicy", () => {
    it("should retrieve ACL policy for a file", async () => {
      const policy: ObjectAclPolicy = {
        owner: "user456",
        visibility: "private",
      };

      await setObjectAclPolicy({ path: testFile }, policy);
      const retrieved = await getObjectAclPolicy({ path: testFile });

      expect(retrieved).toEqual(policy);
    });

    it("should return null for file without ACL policy", async () => {
      const retrieved = await getObjectAclPolicy({ path: testFile });
      expect(retrieved).toBeNull();
    });

    it("should return null for invalid metadata file", async () => {
      const metadataPath = path.join(testMetadataDir, "test-file.txt.meta.json");
      await fs.mkdir(testMetadataDir, { recursive: true });
      await fs.writeFile(metadataPath, "invalid json content");

      const retrieved = await getObjectAclPolicy({ path: testFile });
      expect(retrieved).toBeNull();
    });
  });

  describe("canAccessObject", () => {
    it("should allow owner to read private object", async () => {
      const policy: ObjectAclPolicy = {
        owner: "user789",
        visibility: "private",
      };

      await setObjectAclPolicy({ path: testFile }, policy);

      const canAccess = await canAccessObject({
        objectFile: { path: testFile },
        userId: "user789",
        requestedPermission: ObjectPermission.READ,
      });

      expect(canAccess).toBe(true);
    });

    it("should allow anyone to read public object", async () => {
      const policy: ObjectAclPolicy = {
        owner: "admin",
        visibility: "public",
      };

      await setObjectAclPolicy({ path: testFile }, policy);

      const canAccess = await canAccessObject({
        objectFile: { path: testFile },
        userId: "randomuser",
        requestedPermission: ObjectPermission.READ,
      });

      expect(canAccess).toBe(true);
    });

    it("should deny non-owner access to private object", async () => {
      const policy: ObjectAclPolicy = {
        owner: "user123",
        visibility: "private",
      };

      await setObjectAclPolicy({ path: testFile }, policy);

      const canAccess = await canAccessObject({
        objectFile: { path: testFile },
        userId: "hacker",
        requestedPermission: ObjectPermission.READ,
      });

      expect(canAccess).toBe(false);
    });

    it("should only allow owner to write to object", async () => {
      const policy: ObjectAclPolicy = {
        owner: "user456",
        visibility: "public",
      };

      await setObjectAclPolicy({ path: testFile }, policy);

      const ownerCanWrite = await canAccessObject({
        objectFile: { path: testFile },
        userId: "user456",
        requestedPermission: ObjectPermission.WRITE,
      });

      const otherCanWrite = await canAccessObject({
        objectFile: { path: testFile },
        userId: "other",
        requestedPermission: ObjectPermission.WRITE,
      });

      expect(ownerCanWrite).toBe(true);
      expect(otherCanWrite).toBe(false);
    });
  });
});
