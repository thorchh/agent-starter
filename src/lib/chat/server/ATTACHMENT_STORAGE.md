# Attachment Storage System

## Overview

This directory contains a **local file-based attachment storage system** for development purposes. It persists uploaded files (images, PDFs, etc.) to disk so they survive page refreshes.

⚠️ **This is a temporary solution for local development only.** For production, you should upgrade to a proper blob storage service (S3, Cloudflare R2, etc.).

## Architecture

### File Structure

```
.chats/
├── {chatId}.json                    # Chat messages with metadata
└── attachments/
    └── {chatId}/
        ├── a1b2c3d4.pdf            # Stored files (hash-based names)
        ├── e5f6g7h8.png
        └── i9j0k1l2.jpg
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. UPLOAD (Client → Server)                                     │
│    User attaches file → converted to data URL (base64)          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. SAVE (Server)                                                │
│    • Extract file data from data URL                            │
│    • Generate hash-based filename (e.g., a1b2c3d4.pdf)          │
│    • Save to .chats/attachments/{chatId}/                       │
│    • Store reference: stored://attachments/{chatId}/a1b2c3d4.pdf│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. PERSIST (Disk)                                               │
│    JSON file stores lightweight reference instead of full data: │
│    {                                                             │
│      "type": "file",                                             │
│      "url": "stored://attachments/abc123/a1b2c3d4.pdf",         │
│      "filename": "document.pdf",                                 │
│      "mediaType": "application/pdf"                              │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. LOAD (Server)                                                │
│    • Read chat JSON from disk                                   │
│    • Detect stored:// references                                │
│    • Load file from .chats/attachments/                         │
│    • Convert back to data URL for client                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. RENDER (Client)                                              │
│    • Receives data URL                                          │
│    • Renders image preview or file icon                         │
│    • User sees attachment just like before refresh              │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. `attachmentStore.ts`
Core utilities for saving/loading files to/from disk.

**Key Functions:**
- `saveAttachment(chatId, dataUrl, filename, mediaType)` - Saves file to disk, returns metadata
- `loadAttachment(relativePath)` - Loads file from disk, returns data URL
- `deleteAttachments(chatId)` - Deletes all attachments for a chat
- `isStoredAttachmentUrl(url)` - Checks if URL is a stored:// reference
- `pathToStoredUrl(path)` / `storedUrlToPath(url)` - Converts between formats

### 2. `fileChatStore.ts`
Chat persistence with integrated attachment handling.

**Key Functions:**
- `saveChat({id, messages})` - Saves chat, extracts and persists attachments
- `loadChat(id)` - Loads chat, restores attachments from disk
- `deleteChat(id)` - Deletes chat and associated attachments

**Modified Functions:**
- `sanitizeMessagesForPersistence(chatId, messages)` - Now saves files instead of omitting them

### 3. `MessageParts.tsx`
Client component that renders attachments.

**No changes needed** - Component already handles data URLs correctly. Only shows "omitted" placeholder if file URL starts with `omitted://`.

## URL Schemes

| Scheme | Meaning | Where Used |
|--------|---------|------------|
| `data:image/png;base64,...` | Actual file data (base64) | Client-side, in-memory, API responses |
| `stored://attachments/{chatId}/{file}` | Reference to stored file | Persisted JSON files on disk |
| `omitted://attachment` | File data was stripped | Legacy/fallback when storage fails |
| `local-storage://omitted` | File stripped from localStorage | Client-side fallback |

## Limitations (Local File Storage)

⚠️ **This implementation is NOT production-ready:**

1. **Ephemeral on serverless platforms** - Vercel, Netlify, AWS Lambda have read-only filesystems
2. **No CDN** - Files served directly from server, no edge caching
3. **No access control** - Files stored locally, no per-user permissions
4. **No deduplication** - Same file uploaded twice = stored twice
5. **No cleanup** - Old files persist even if chat is deleted (partial cleanup implemented)
6. **Data URL overhead** - Large files converted to base64 on every load (increases response size by ~33%)

## Upgrade Path: Local Files → Blob Storage

### Option A: AWS S3 / Cloudflare R2 / Azure Blob

**Changes Required:**

1. **Update `saveAttachment()` in `attachmentStore.ts`:**
   ```typescript
   // OLD: Write to local filesystem
   writeFileSync(filePath, buffer);

   // NEW: Upload to S3
   await s3Client.send(new PutObjectCommand({
     Bucket: process.env.S3_BUCKET,
     Key: `attachments/${chatId}/${storedFilename}`,
     Body: buffer,
     ContentType: mediaType,
   }));
   ```

2. **Update `loadAttachment()` in `attachmentStore.ts`:**
   ```typescript
   // OLD: Read from local filesystem
   const buffer = readFileSync(fullPath);

   // NEW: Download from S3 (or return signed URL)
   const response = await s3Client.send(new GetObjectCommand({
     Bucket: process.env.S3_BUCKET,
     Key: relativePath,
   }));
   const buffer = await streamToBuffer(response.Body);

   // OR: Return signed URL instead of data URL
   return await getSignedUrl(s3Client, new GetObjectCommand({
     Bucket: process.env.S3_BUCKET,
     Key: relativePath,
     Expires: 3600, // 1 hour
   }));
   ```

3. **Update `deleteAttachments()` in `attachmentStore.ts`:**
   ```typescript
   // OLD: Delete local files
   unlinkSync(join(chatAttachmentsDir, file));

   // NEW: Delete from S3
   await s3Client.send(new DeleteObjectCommand({
     Bucket: process.env.S3_BUCKET,
     Key: `attachments/${chatId}/${file}`,
   }));
   ```

4. **Optional: Create API endpoint to serve files**
   ```typescript
   // src/app/api/attachments/[chatId]/[filename]/route.ts
   export async function GET(
     request: Request,
     { params }: { params: { chatId: string; filename: string } }
   ) {
     const url = await getSignedUrl(/* ... */);
     return Response.redirect(url);
   }
   ```

5. **Update `loadChat()` to return signed URLs instead of data URLs:**
   ```typescript
   // OLD: Return data URL
   url: dataUrl

   // NEW: Return API URL
   url: `/api/attachments/${chatId}/${filename}`
   ```

### Option B: Database BLOB Storage (PostgreSQL, etc.)

**Changes Required:**

1. **Create attachments table:**
   ```sql
   CREATE TABLE attachments (
     id UUID PRIMARY KEY,
     chat_id VARCHAR(255) NOT NULL,
     filename VARCHAR(255),
     media_type VARCHAR(100),
     data BYTEA NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   CREATE INDEX idx_attachments_chat_id ON attachments(chat_id);
   ```

2. **Update `saveAttachment()` to insert into DB:**
   ```typescript
   const id = generateId();
   await db.query(
     'INSERT INTO attachments (id, chat_id, filename, media_type, data) VALUES ($1, $2, $3, $4, $5)',
     [id, chatId, filename, mediaType, buffer]
   );
   return { path: `db://${id}`, filename, mediaType, size: buffer.length };
   ```

3. **Update `loadAttachment()` to query from DB:**
   ```typescript
   const result = await db.query('SELECT data, media_type FROM attachments WHERE id = $1', [id]);
   const buffer = result.rows[0].data;
   const mediaType = result.rows[0].media_type;
   return `data:${mediaType};base64,${buffer.toString('base64')}`;
   ```

### Option C: Vercel Blob (Easiest for Vercel Deployments)

**Changes Required:**

1. **Install Vercel Blob SDK:**
   ```bash
   npm install @vercel/blob
   ```

2. **Update `saveAttachment()`:**
   ```typescript
   import { put } from '@vercel/blob';

   const blob = await put(`attachments/${chatId}/${storedFilename}`, buffer, {
     access: 'private',
     contentType: mediaType,
   });

   return { path: blob.url, filename, mediaType, size: buffer.length };
   ```

3. **Update `loadAttachment()`:**
   ```typescript
   // Vercel Blob URLs can be used directly - no conversion needed!
   return relativePath; // Already a full URL
   ```

## Migration Strategy

When upgrading to blob storage:

1. **Parallel operation:** Run both local and cloud storage during migration
2. **Backfill old files:** Script to upload existing `.chats/attachments/` to S3
3. **Switch flag:** Environment variable to toggle between local/cloud
4. **Gradual rollout:** Test with new chats first, then migrate old chats

Example feature flag:
```typescript
const USE_BLOB_STORAGE = process.env.BLOB_STORAGE_ENABLED === 'true';

export function saveAttachment(...) {
  if (USE_BLOB_STORAGE) {
    return saveToS3(...);
  } else {
    return saveToLocalDisk(...);
  }
}
```

## Testing

Test cases to verify attachment persistence:

1. ✅ Upload image → Send message → Refresh page → Image still visible
2. ✅ Upload PDF → Send message → Refresh page → PDF icon still visible
3. ✅ Upload multiple files → All persist
4. ✅ Delete chat → Associated files deleted from disk
5. ✅ Large file (>5MB) → Saved and restored correctly
6. ✅ Special characters in filename → Handled correctly (hashing prevents issues)

## Security Considerations

### Current Implementation (Local Dev)
- ✅ Files stored locally, not exposed via HTTP
- ✅ Hash-based filenames prevent directory traversal
- ⚠️ No access control (any user can see any file if they guess the path)
- ⚠️ No virus scanning
- ⚠️ No file size limits enforced server-side

### Production Upgrades Needed
- [ ] Add per-user access control (check if user owns the chat)
- [ ] Implement virus/malware scanning (ClamAV, VirusTotal API)
- [ ] Enforce file size limits (e.g., 10MB max)
- [ ] Add rate limiting on uploads
- [ ] Use signed URLs with expiration (S3 presigned URLs)
- [ ] Add Content Security Policy headers
- [ ] Scan for malicious files (executables, scripts)

## Performance Considerations

### Current (Data URLs)
- ❌ Large files bloat API responses (+33% size due to base64)
- ❌ No caching (data URL changes on every load)
- ❌ Slow for multiple/large attachments

### With Signed URLs (Recommended)
- ✅ API responses stay small (just URLs)
- ✅ Browser can cache files
- ✅ CDN can serve files from edge locations
- ✅ Parallel downloads (browser fetches files separately)

## Monitoring & Observability

Add these metrics when upgrading to production:

- **Storage usage:** Total bytes stored per user/chat
- **Upload failures:** Track failed saves
- **Load failures:** Track missing files (broken references)
- **Performance:** Track upload/download latency
- **Costs:** Monitor S3/blob storage costs per user

## Related Files

- `/src/lib/chat/server/attachmentStore.ts` - Core storage utilities
- `/src/lib/chat/server/fileChatStore.ts` - Chat persistence with attachments
- `/src/lib/chat/constants.ts` - Defines `OMITTED_ATTACHMENT_URL`
- `/src/components/chat/MessageParts.tsx` - Renders attachments in UI
- `/src/components/ai-elements/prompt-input.tsx` - Handles file uploads
- `/.chats/` - Storage directory (gitignored)

## FAQ

**Q: Why not use localStorage for files?**
A: localStorage has a ~5-10MB limit, which fills quickly with images/PDFs. Files are also stripped on page refresh in the current implementation.

**Q: Why hash filenames instead of using original names?**
A: Prevents collisions, avoids special character issues, and provides content deduplication (same file = same hash).

**Q: What happens if disk storage fails?**
A: Files fall back to `OMITTED_ATTACHMENT_URL` and user sees "Content not persisted" message.

**Q: Can I use this in production?**
A: **No.** This only works on persistent filesystems (local dev, VPS). Vercel/Netlify have ephemeral filesystems. Upgrade to S3/blob storage first.

**Q: How do I migrate existing chats to blob storage?**
A: Run a migration script that reads `.chats/attachments/`, uploads to S3, and updates JSON references from `stored://` to S3 URLs.

---

**Next Steps:**
1. Test the current implementation in local dev
2. Choose a blob storage provider (S3, R2, Vercel Blob)
3. Implement the upgrade path outlined above
4. Add access control and security measures
5. Deploy to production with monitoring
