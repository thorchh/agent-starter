import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  unlinkSync,
  rmdirSync,
} from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

// ============================================================================
// CONFIGURATION
// ============================================================================

const CHATS_DIR = join(process.cwd(), ".chats");
const ATTACHMENTS_DIR = join(CHATS_DIR, "attachments");

// ============================================================================
// OVERVIEW
// ============================================================================

/**
 * Local file-based attachment storage for development.
 *
 * ⚠️ TEMPORARY SOLUTION - NOT PRODUCTION READY
 * This stores file attachments on the local filesystem. It works great for
 * local development but will NOT work on serverless platforms (Vercel, Netlify)
 * which have ephemeral/read-only filesystems.
 *
 * UPGRADE PATH:
 * When moving to production, replace this with a blob storage service:
 * - AWS S3 / Cloudflare R2 / Azure Blob Storage
 * - Vercel Blob (easiest for Vercel deployments)
 * - PostgreSQL BYTEA columns (for small files)
 *
 * See ATTACHMENT_STORAGE.md for detailed upgrade instructions.
 *
 * DIRECTORY STRUCTURE:
 * .chats/
 * └── attachments/
 *     └── {chatId}/
 *         ├── {contentHash1}.pdf
 *         ├── {contentHash2}.png
 *         └── {contentHash3}.jpg
 *
 * URL SCHEMES:
 * - data:image/png;base64,... → Actual file data (client-side, in-memory)
 * - stored://attachments/{chatId}/{file} → Reference to stored file (persisted JSON)
 * - omitted://attachment → File was stripped (fallback)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface StoredAttachment {
  /** Relative path to the stored file (e.g., "attachments/abc123/file_hash.pdf") */
  path: string;
  /** Original filename provided by user */
  filename: string;
  /** MIME type (e.g., "image/png", "application/pdf") */
  mediaType: string;
  /** File size in bytes */
  size: number;
}

// ============================================================================
// INTERNAL UTILITIES
// ============================================================================

/**
 * Initialize the attachments directory if it doesn't exist
 */
function ensureAttachmentsDir(chatId: string): string {
  if (!existsSync(ATTACHMENTS_DIR)) {
    mkdirSync(ATTACHMENTS_DIR, { recursive: true });
  }

  const chatAttachmentsDir = join(ATTACHMENTS_DIR, chatId);
  if (!existsSync(chatAttachmentsDir)) {
    mkdirSync(chatAttachmentsDir, { recursive: true });
  }

  return chatAttachmentsDir;
}

/**
 * Extract file extension from filename or mediaType.
 *
 * UPGRADE NOTE: When using S3/blob storage, you might want to preserve
 * original extensions for better content-type detection.
 */
function getFileExtension(filename: string | undefined, mediaType: string | undefined): string {
  // Try to get extension from filename
  if (filename?.includes(".")) {
    const parts = filename.split(".");
    return parts[parts.length - 1] || "bin";
  }

  // Fall back to mediaType
  if (mediaType) {
    const typeMap: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/gif": "gif",
      "image/webp": "webp",
      "application/pdf": "pdf",
      "text/plain": "txt",
      "text/html": "html",
      "text/markdown": "md",
      "application/json": "json",
    };
    return typeMap[mediaType] || "bin";
  }

  return "bin";
}

/**
 * Convert a data URL to a Buffer.
 *
 * UPGRADE NOTE: When using blob storage, you'll still need this function
 * to extract the binary data before uploading to S3/R2.
 */
function dataUrlToBuffer(dataUrl: string): Buffer | null {
  try {
    // Data URL format: data:[<mediatype>][;base64],<data>
    // Don't use regex on huge strings - just find the comma
    const commaIndex = dataUrl.indexOf(",");
    if (commaIndex === -1) return null;

    const header = dataUrl.substring(0, commaIndex);
    if (!header.startsWith("data:") || !header.includes("base64")) return null;

    const base64Data = dataUrl.substring(commaIndex + 1);
    if (!base64Data) return null;

    return Buffer.from(base64Data, "base64");
  } catch (error) {
    console.error("[attachmentStore] Failed to convert data URL to buffer:", error);
    return null;
  }
}

// ============================================================================
// PUBLIC API - STORAGE OPERATIONS
// ============================================================================

/**
 * Save a file attachment to disk and return metadata.
 *
 * CURRENT IMPLEMENTATION:
 * - Writes file to .chats/attachments/{chatId}/{hash}.{ext}
 * - Uses SHA-256 hash of content for filename (deduplication + collision prevention)
 * - Returns relative path for storage in JSON
 *
 * UPGRADE PATH TO S3/BLOB STORAGE:
 * Replace the writeFileSync call with:
 * ```typescript
 * await s3Client.send(new PutObjectCommand({
 *   Bucket: process.env.S3_BUCKET,
 *   Key: `attachments/${chatId}/${storedFilename}`,
 *   Body: buffer,
 *   ContentType: mediaType,
 * }));
 * ```
 * The rest of the function can stay the same!
 */
export function saveAttachment(
  chatId: string,
  fileUrl: string,
  filename: string | undefined,
  mediaType: string | undefined
): StoredAttachment | null {
  try {
    // Only handle data URLs for now
    if (!fileUrl.startsWith("data:")) {
      return null;
    }

    const buffer = dataUrlToBuffer(fileUrl);
    if (!buffer) {
      return null;
    }

    // Generate a hash-based filename to avoid collisions
    const hash = createHash("sha256").update(buffer).digest("hex").substring(0, 16);
    const ext = getFileExtension(filename, mediaType);
    const storedFilename = `${hash}.${ext}`;

    // Ensure directory exists
    const chatAttachmentsDir = ensureAttachmentsDir(chatId);

    // Write file to disk
    const filePath = join(chatAttachmentsDir, storedFilename);
    writeFileSync(filePath, buffer);

    // Return metadata
    const relativePath = join("attachments", chatId, storedFilename);
    return {
      path: relativePath,
      filename: filename || storedFilename,
      mediaType: mediaType || "application/octet-stream",
      size: buffer.length,
    };
  } catch (error) {
    console.error("[attachmentStore] Failed to save attachment:", filename, error);
    return null;
  }
}

/**
 * Load an attachment from disk and return as a data URL.
 *
 * CURRENT IMPLEMENTATION:
 * - Reads file from .chats/attachments/
 * - Converts to base64 data URL
 * - Returns full data URL for client
 *
 * UPGRADE PATH TO S3/BLOB STORAGE:
 * Option 1 - Signed URLs (RECOMMENDED):
 * ```typescript
 * return await getSignedUrl(s3Client, new GetObjectCommand({
 *   Bucket: process.env.S3_BUCKET,
 *   Key: relativePath,
 *   Expires: 3600, // 1 hour
 * }));
 * ```
 * This returns a temporary URL that the client can fetch directly from S3.
 * Much faster and cheaper than proxying through your server!
 *
 * Option 2 - Proxy through server:
 * Download from S3 and convert to data URL (same as current, but fetches from S3)
 */
export function loadAttachment(relativePath: string): string | null {
  try {
    const fullPath = join(CHATS_DIR, relativePath);

    if (!existsSync(fullPath)) {
      return null;
    }

    const buffer = readFileSync(fullPath);

    // Detect media type from file extension
    const ext = relativePath.split(".").pop()?.toLowerCase() || "";
    const mediaTypeMap: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      pdf: "application/pdf",
      txt: "text/plain",
      html: "text/html",
      md: "text/markdown",
      json: "application/json",
    };
    const mediaType = mediaTypeMap[ext] || "application/octet-stream";

    // Convert to data URL
    const base64 = buffer.toString("base64");
    return `data:${mediaType};base64,${base64}`;
  } catch (error) {
    console.error("[attachmentStore] Failed to load attachment:", error);
    return null;
  }
}

/**
 * Delete all attachments for a chat.
 *
 * CURRENT IMPLEMENTATION:
 * - Deletes all files in .chats/attachments/{chatId}/
 * - Removes the directory
 *
 * UPGRADE PATH TO S3/BLOB STORAGE:
 * ```typescript
 * const objects = await s3Client.send(new ListObjectsV2Command({
 *   Bucket: process.env.S3_BUCKET,
 *   Prefix: `attachments/${chatId}/`,
 * }));
 *
 * await s3Client.send(new DeleteObjectsCommand({
 *   Bucket: process.env.S3_BUCKET,
 *   Delete: {
 *     Objects: objects.Contents?.map(obj => ({ Key: obj.Key })) || [],
 *   },
 * }));
 * ```
 */
export function deleteAttachments(chatId: string): void {
  try {
    const chatAttachmentsDir = join(ATTACHMENTS_DIR, chatId);

    if (!existsSync(chatAttachmentsDir)) {
      return;
    }

    // Delete all files in the directory
    const files = readdirSync(chatAttachmentsDir);
    for (const file of files) {
      unlinkSync(join(chatAttachmentsDir, file));
    }

    // Remove the directory
    try {
      rmdirSync(chatAttachmentsDir);
    } catch {
      // Directory might not be empty or already deleted
    }
  } catch (error) {
    console.error("[attachmentStore] Failed to delete attachments:", error);
  }
}

// ============================================================================
// PUBLIC API - URL UTILITIES
// ============================================================================

/**
 * Check if a URL is a stored attachment reference.
 *
 * Used to detect if a file part needs to be loaded from disk/storage.
 *
 * UPGRADE NOTE: No changes needed when upgrading to S3. The stored:// scheme
 * is just a placeholder that gets replaced during load/save operations.
 */
export function isStoredAttachmentUrl(url: string): boolean {
  return url.startsWith("stored://attachments/");
}

/**
 * Convert a stored attachment URL to a relative path.
 *
 * Example: stored://attachments/chatId/file.ext -> attachments/chatId/file.ext
 *
 * UPGRADE NOTE: When using S3, this becomes the S3 object key.
 */
export function storedUrlToPath(url: string): string {
  return url.replace("stored://", "");
}

/**
 * Convert a relative path to a stored attachment URL.
 *
 * Example: attachments/chatId/file.ext -> stored://attachments/chatId/file.ext
 *
 * UPGRADE NOTE: No changes needed. This is just for JSON persistence.
 */
export function pathToStoredUrl(path: string): string {
  return `stored://${path}`;
}
