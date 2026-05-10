import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  setObjectAclPolicy,
  getObjectAclPolicy,
  canAccessObject,
  ObjectPermission,
  type ObjectAclPolicy,
  type LocalFile,
} from "../objectAcl";
import { promises as fs } from "fs";
import path from "path";

// Mock filesystem operations
vi.mock("fs", () => ({
  promises: {
    access: vi.fn(),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
  },
}));

describe("Object ACL Module - Access Control Logic", () => {
  const mockStorageDir = "./test-storage";
  const testFilePath = path.join(mockStorageDir, "private", "test-file.pdf");
  const testFile: LocalFile = {
    path: testFilePath,
    metadata: {
      contentType: "application/pdf",
      size: 1024,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STORAGE_DIR = mockStorageDir;
  });

  afterEach(() => {
    delete process.env.STORAGE_DIR;
  });

  describe("setObjectAclPolicy", () => {
    it("should set ACL policy for a valid object", async () => {
      const policy: ObjectAclPolicy = {
        owner: "user-123",
        visibility: "private",
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await setObjectAclPolicy(testFile, policy);

      expect(fs.access).toHaveBeenCalledWith(testFilePath);
      expect(fs.mkdir).toHaveBeenCalled();
      
      const writeFileCall = vi.mocked(fs.writeFile).mock.calls[0];
      expect(writeFileCall[0]).toContain(".meta.json");
      expect(writeFileCall[1]).toContain("user-123");
      expect(writeFileCall[1]).toContain("private");
      expect(writeFileCall[2]).toBe("utf-8");
    });

    it("should throw error if object does not exist", async () => {
      const policy: ObjectAclPolicy = {
        owner: "user-123",
        visibility: "public",
      };

      vi.mocked(fs.access).mockRejectedValue(new Error("File not found"));

      await expect(setObjectAclPolicy(testFile, policy)).rejects.toThrow(
        "Object not found"
      );
    });

    it("should create metadata directory if it doesn't exist", async () => {
      const policy: ObjectAclPolicy = {
        owner: "user-456",
        visibility: "private",
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await setObjectAclPolicy(testFile, policy);

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true }
      );
    });

    it("should serialize policy as formatted JSON", async () => {
      const policy: ObjectAclPolicy = {
        owner: "user-789",
        visibility: "public",
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await setObjectAclPolicy(testFile, policy);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringMatching(/\{\s+"owner".*\s+"visibility"/),
        "utf-8"
      );
    });
  });

  describe("getObjectAclPolicy", () => {
    it("should return ACL policy for existing metadata", async () => {
      const expectedPolicy: ObjectAclPolicy = {
        owner: "user-123",
        visibility: "private",
      };

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(expectedPolicy)
      );

      const policy = await getObjectAclPolicy(testFile);

      expect(policy).toEqual(expectedPolicy);
      expect(policy?.owner).toBe("user-123");
      expect(policy?.visibility).toBe("private");
    });

    it("should return null if metadata file does not exist", async () => {
      vi.mocked(fs.readFile).mockRejectedValue(
        new Error("ENOENT: no such file or directory")
      );

      const policy = await getObjectAclPolicy(testFile);

      expect(policy).toBeNull();
    });

    it("should return null if metadata file is invalid JSON", async () => {
      vi.mocked(fs.readFile).mockResolvedValue("invalid json {");

      const policy = await getObjectAclPolicy(testFile);

      expect(policy).toBeNull();
    });

    it("should parse public visibility correctly", async () => {
      const publicPolicy: ObjectAclPolicy = {
        owner: "user-456",
        visibility: "public",
      };

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(publicPolicy)
      );

      const policy = await getObjectAclPolicy(testFile);

      expect(policy?.visibility).toBe("public");
    });
  });

  describe("canAccessObject - Public Access", () => {
    it("should allow read access to public objects without user", async () => {
      const publicPolicy: ObjectAclPolicy = {
        owner: "user-123",
        visibility: "public",
      };

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(publicPolicy)
      );

      const canAccess = await canAccessObject({
        objectFile: testFile,
        requestedPermission: ObjectPermission.READ,
      });

      expect(canAccess).toBe(true);
    });

    it("should deny write access to public objects without user", async () => {
      const publicPolicy: ObjectAclPolicy = {
        owner: "user-123",
        visibility: "public",
      };

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(publicPolicy)
      );

      const canAccess = await canAccessObject({
        objectFile: testFile,
        requestedPermission: ObjectPermission.WRITE,
      });

      expect(canAccess).toBe(false);
    });

    it("should allow read access to public objects with any user", async () => {
      const publicPolicy: ObjectAclPolicy = {
        owner: "user-123",
        visibility: "public",
      };

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(publicPolicy)
      );

      const canAccess = await canAccessObject({
        userId: "user-456", // Different user
        objectFile: testFile,
        requestedPermission: ObjectPermission.READ,
      });

      expect(canAccess).toBe(true);
    });
  });

  describe("canAccessObject - Private Access", () => {
    it("should deny access to private objects without user", async () => {
      const privatePolicy: ObjectAclPolicy = {
        owner: "user-123",
        visibility: "private",
      };

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(privatePolicy)
      );

      const canAccess = await canAccessObject({
        objectFile: testFile,
        requestedPermission: ObjectPermission.READ,
      });

      expect(canAccess).toBe(false);
    });

    it("should allow owner full access to private objects", async () => {
      const privatePolicy: ObjectAclPolicy = {
        owner: "user-123",
        visibility: "private",
      };

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(privatePolicy)
      );

      const canRead = await canAccessObject({
        userId: "user-123",
        objectFile: testFile,
        requestedPermission: ObjectPermission.READ,
      });

      const canWrite = await canAccessObject({
        userId: "user-123",
        objectFile: testFile,
        requestedPermission: ObjectPermission.WRITE,
      });

      expect(canRead).toBe(true);
      expect(canWrite).toBe(true);
    });

    it("should deny non-owner access to private objects", async () => {
      const privatePolicy: ObjectAclPolicy = {
        owner: "user-123",
        visibility: "private",
      };

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(privatePolicy)
      );

      const canAccess = await canAccessObject({
        userId: "user-456", // Different user
        objectFile: testFile,
        requestedPermission: ObjectPermission.READ,
      });

      expect(canAccess).toBe(false);
    });
  });

  describe("canAccessObject - No Policy", () => {
    it("should deny access when no ACL policy exists", async () => {
      vi.mocked(fs.readFile).mockRejectedValue(
        new Error("ENOENT: no such file or directory")
      );

      const canAccess = await canAccessObject({
        userId: "user-123",
        objectFile: testFile,
        requestedPermission: ObjectPermission.READ,
      });

      expect(canAccess).toBe(false);
    });

    it("should deny access to object without policy even for read", async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error("Not found"));

      const canRead = await canAccessObject({
        objectFile: testFile,
        requestedPermission: ObjectPermission.READ,
      });

      const canWrite = await canAccessObject({
        objectFile: testFile,
        requestedPermission: ObjectPermission.WRITE,
      });

      expect(canRead).toBe(false);
      expect(canWrite).toBe(false);
    });
  });

  describe("Permission Types", () => {
    it("should distinguish between READ and WRITE permissions", () => {
      expect(ObjectPermission.READ).toBe("read");
      expect(ObjectPermission.WRITE).toBe("write");
      expect(ObjectPermission.READ).not.toBe(ObjectPermission.WRITE);
    });

    it("should allow owner to have both READ and WRITE permissions", async () => {
      const policy: ObjectAclPolicy = {
        owner: "user-123",
        visibility: "private",
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(policy));

      const canRead = await canAccessObject({
        userId: "user-123",
        objectFile: testFile,
        requestedPermission: ObjectPermission.READ,
      });

      const canWrite = await canAccessObject({
        userId: "user-123",
        objectFile: testFile,
        requestedPermission: ObjectPermission.WRITE,
      });

      expect(canRead).toBe(true);
      expect(canWrite).toBe(true);
    });
  });
});
