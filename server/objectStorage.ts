// Local file system storage implementation
import 'dotenv/config';
import { Response } from "express";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// Local file system interface (replaces Google Cloud Storage File)
export interface LocalFile {
  path: string;
  metadata?: {
    contentType?: string;
    size?: number;
  };
}

// The object storage service using local file system
export class ObjectStorageService {
  private storageBaseDir: string;

  constructor() {
    // Get storage directory from environment variable
    const storageDir = process.env.STORAGE_DIR || process.env.LOCAL_STORAGE_DIR || "./storage";
    this.storageBaseDir = path.resolve(storageDir);
    
    // Ensure storage directory exists
    this.ensureStorageDir();
  }

  private async ensureStorageDir() {
    try {
      await fs.mkdir(this.storageBaseDir, { recursive: true });
      // Create subdirectories
      await fs.mkdir(path.join(this.storageBaseDir, "uploads"), { recursive: true });
      await fs.mkdir(path.join(this.storageBaseDir, "public"), { recursive: true });
      await fs.mkdir(path.join(this.storageBaseDir, "private"), { recursive: true });
      await fs.mkdir(path.join(this.storageBaseDir, "metadata"), { recursive: true });
    } catch (error) {
      console.error("Error creating storage directories:", error);
    }
  }

  // Gets the private object directory path
  getPrivateObjectDir(): string {
    return "/objects";
  }

  // Converts object path (/objects/...) to local file system path
  private objectPathToLocalPath(objectPath: string): string {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const relativePath = objectPath.slice("/objects/".length);
    return path.join(this.storageBaseDir, "private", relativePath);
  }

  // Converts local file path to object path
  private localPathToObjectPath(localPath: string): string {
    const relativePath = path.relative(this.storageBaseDir, localPath);
    if (relativePath.startsWith("private/")) {
      return "/objects/" + relativePath.slice("private/".length);
    }
    return "/objects/" + relativePath;
  }

  // Downloads an object to the response
  async downloadObject(file: LocalFile, res: Response, cacheTtlSec: number = 3600) {
    try {
      const filePath = file.path;
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        throw new ObjectNotFoundError();
      }

      // Get file stats
      const stats = await fs.stat(filePath);
      const contentType = file.metadata?.contentType || "application/octet-stream";
      
      // Get ACL policy to determine if public
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";

      // Set appropriate headers
      res.set({
        "Content-Type": contentType,
        "Content-Length": stats.size.toString(),
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
      });

      // Read and stream the file
      const fileBuffer = await fs.readFile(filePath);
      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        if (error instanceof ObjectNotFoundError) {
          res.status(404).json({ error: "File not found" });
        } else {
          res.status(500).json({ error: "Error downloading file" });
        }
      }
    }
  }

  // Gets the upload URL for an object entity (returns a path for upload endpoint)
  async getObjectEntityUploadURL(): Promise<string> {
    const objectId = randomUUID();
    const objectPath = `/objects/uploads/${objectId}`;
    return objectPath;
  }

  // Gets the object entity file from the object path
  async getObjectEntityFile(objectPath: string): Promise<LocalFile> {
    const localPath = this.objectPathToLocalPath(objectPath);
    
    // Check if file exists
    try {
      await fs.access(localPath);
    } catch {
      throw new ObjectNotFoundError();
    }

    // Get file stats for metadata
    const stats = await fs.stat(localPath);
    
    return {
      path: localPath,
      metadata: {
        size: stats.size,
        contentType: await this.getContentType(localPath),
      },
    };
  }

  // Get content type from file extension
  private async getContentType(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.json': 'application/json',
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  // Normalize object entity path
  normalizeObjectEntityPath(rawPath: string): string {
    // If it's already an object path, return as is
    if (rawPath.startsWith("/objects/")) {
      return rawPath;
    }

    // If it's a full URL, extract the path
    if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
      const url = new URL(rawPath);
      const urlPath = url.pathname;
      
      // If it's from our API endpoint, convert to object path
      if (urlPath.startsWith("/api/files/objects/")) {
        return urlPath.slice("/api/files".length);
      }
      
      // Otherwise, try to extract object path
      if (urlPath.startsWith("/objects/")) {
        return urlPath;
      }
    }

    // If it's a local path, try to convert
    if (rawPath.includes("objects")) {
      const parts = rawPath.split("objects");
      if (parts.length > 1) {
        return "/objects" + parts[1];
      }
    }

    return rawPath;
  }

  // Tries to set the ACL policy for the object entity and return the normalized path
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/objects/")) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  // Checks if the user can access the object entity
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: LocalFile;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }

  // Save file to local storage
  async saveFile(
    objectPath: string,
    buffer: Buffer,
    options?: {
      contentType?: string;
      visibility?: "public" | "private";
    }
  ): Promise<string> {
    const localPath = this.objectPathToLocalPath(objectPath);
    
    // Ensure directory exists
    const dir = path.dirname(localPath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(localPath, buffer);

    // Set ACL if provided
    if (options?.visibility) {
      const aclPolicy: ObjectAclPolicy = {
        owner: "", // Will be set by caller
        visibility: options.visibility,
      };
      await setObjectAclPolicy({ path: localPath }, aclPolicy);
    }

    return objectPath;
  }

  // Delete file from local storage
  async deleteFile(objectPath: string): Promise<void> {
    const localPath = this.objectPathToLocalPath(objectPath);
    
    try {
      await fs.unlink(localPath);
      // Also delete metadata file if it exists
      const metadataPath = this.getMetadataPath(localPath);
      try {
        await fs.unlink(metadataPath);
      } catch {
        // Metadata file might not exist, ignore
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  // Get metadata file path
  private getMetadataPath(filePath: string): string {
    const relativePath = path.relative(this.storageBaseDir, filePath);
    return path.join(this.storageBaseDir, "metadata", relativePath + ".meta.json");
  }
}

// Export singleton instance
export const objectStorageService = new ObjectStorageService();
