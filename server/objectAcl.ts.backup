// Local file system ACL implementation
import { promises as fs } from "fs";
import path from "path";

const ACL_POLICY_METADATA_KEY = "custom:aclPolicy";

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
}

// Local file interface
export interface LocalFile {
  path: string;
  metadata?: {
    contentType?: string;
    size?: number;
  };
}

// Get metadata file path for a given file
function getMetadataPath(filePath: string): string {
  // Extract storage base directory (assuming it's in storage/private or storage/public)
  const storageBaseDir = process.env.STORAGE_DIR || process.env.LOCAL_STORAGE_DIR || "./storage";
  const resolvedBaseDir = path.resolve(storageBaseDir);
  
  // Get relative path from storage base
  const relativePath = path.relative(resolvedBaseDir, filePath);
  
  // Create metadata path in metadata directory
  return path.join(resolvedBaseDir, "metadata", relativePath + ".meta.json");
}

// Sets the ACL policy to the object metadata file
export async function setObjectAclPolicy(
  objectFile: LocalFile,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  const filePath = objectFile.path;
  
  // Check if file exists
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`Object not found: ${filePath}`);
  }

  // Save metadata to separate JSON file
  const metadataPath = getMetadataPath(filePath);
  const metadataDir = path.dirname(metadataPath);
  
  // Ensure metadata directory exists
  await fs.mkdir(metadataDir, { recursive: true });

  // Save ACL policy
  await fs.writeFile(
    metadataPath,
    JSON.stringify(aclPolicy, null, 2),
    "utf-8"
  );
}

// Gets the ACL policy from the object metadata file
export async function getObjectAclPolicy(
  objectFile: LocalFile,
): Promise<ObjectAclPolicy | null> {
  const metadataPath = getMetadataPath(objectFile.path);
  
  try {
    const metadataContent = await fs.readFile(metadataPath, "utf-8");
    return JSON.parse(metadataContent) as ObjectAclPolicy;
  } catch (error) {
    // Metadata file doesn't exist or is invalid
    return null;
  }
}

// Checks if the user can access the object
export async function canAccessObject({
  userId,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  objectFile: LocalFile;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    // If no ACL policy, default to private (no access)
    return false;
  }

  // Public objects are always accessible for read
  if (
    aclPolicy.visibility === "public" &&
    requestedPermission === ObjectPermission.READ
  ) {
    return true;
  }

  // Access control requires the user id
  if (!userId) {
    return false;
  }

  // The owner of the object can always access it
  if (aclPolicy.owner === userId) {
    return true;
  }

  return false;
}
