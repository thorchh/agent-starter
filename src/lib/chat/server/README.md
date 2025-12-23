# Chat Server Module

This directory contains server-side chat persistence and file attachment storage.

⚠️ **Development-only implementation** - Requires upgrade for production deployment.

## Quick Links

- **[ATTACHMENT_STORAGE.md](./ATTACHMENT_STORAGE.md)** - Comprehensive guide to attachment system and upgrade path
- **[attachmentStore.ts](./attachmentStore.ts)** - File storage utilities (save/load/delete)
- **[fileChatStore.ts](./fileChatStore.ts)** - Chat persistence with integrated attachments

## Overview

### What This Does

Provides local file-based persistence for:
- Chat messages (`.chats/{id}.json`)
- File attachments (`.chats/attachments/{id}/`)

### Architecture

```
User uploads PDF
       ↓
Converted to data URL (base64)
       ↓
Server receives message with file
       ↓
fileChatStore.saveChat()
       ↓
attachmentStore.saveAttachment()
  → Extracts binary data
  → Saves to .chats/attachments/{chatId}/{hash}.pdf
  → Returns stored://attachments/{chatId}/{hash}.pdf
       ↓
JSON stored with reference (lightweight)
       ↓
User refreshes page
       ↓
fileChatStore.loadChat()
       ↓
attachmentStore.loadAttachment()
  → Reads file from disk
  → Converts to data URL
       ↓
Client renders attachment (same as before refresh!)
```

## Files

### Core Implementation

| File | Purpose | Upgrade Needed? |
|------|---------|-----------------|
| `fileChatStore.ts` | Chat CRUD + attachment integration | ✅ Yes - Move to DB |
| `attachmentStore.ts` | File storage utilities | ✅ Yes - Move to S3/blob |
| `ATTACHMENT_STORAGE.md` | Documentation & upgrade guide | ℹ️ Reference only |

### Related Files (Outside This Directory)

| File | Purpose |
|------|---------|
| `/src/lib/chat/constants.ts` | Defines `OMITTED_ATTACHMENT_URL` |
| `/src/app/api/chat/route.ts` | Chat API endpoint (uses fileChatStore) |
| `/src/components/chat/MessageParts.tsx` | Renders attachments in UI |

## Why This Needs Upgrading

### Current Limitations

❌ **Serverless platforms**: Vercel/Netlify have ephemeral filesystems
❌ **No CDN**: Files served directly from server, slow for distant users
❌ **No access control**: Anyone with a path can access files
❌ **Data URL overhead**: Large files bloat API responses by 33%
❌ **No scalability**: Single server disk fills up

### Production Requirements

✅ **Persistent storage**: S3, Cloudflare R2, Azure Blob
✅ **Database**: PostgreSQL, MongoDB, etc. for chat messages
✅ **Access control**: Verify user owns chat before serving files
✅ **Signed URLs**: Time-limited access, served from CDN
✅ **Virus scanning**: ClamAV, VirusTotal integration

## Upgrade Checklist

When moving to production, you need to:

- [ ] Choose blob storage provider (S3, R2, Vercel Blob)
- [ ] Update `attachmentStore.ts` to use blob API instead of filesystem
- [ ] Choose database for chat messages (PostgreSQL recommended)
- [ ] Update `fileChatStore.ts` to use database instead of JSON files
- [ ] Create API endpoint for serving attachments (`/api/attachments/[chatId]/[filename]`)
- [ ] Update `loadChat()` to return signed URLs instead of data URLs
- [ ] Add access control (verify user owns chat)
- [ ] Implement virus scanning for uploads
- [ ] Add rate limiting and file size limits
- [ ] Set up monitoring for storage costs and failures

See **[ATTACHMENT_STORAGE.md](./ATTACHMENT_STORAGE.md)** for detailed upgrade instructions with code examples.

## Quick Start (Local Dev)

The system works out of the box for local development:

1. User uploads a file in the chat UI
2. File is automatically saved to `.chats/attachments/{chatId}/`
3. On page refresh, file is loaded from disk
4. User sees the attachment just like before

No configuration needed! 🎉

## Environment Variables (For Production Upgrade)

When upgrading, you'll need:

```env
# S3 / Blob Storage
S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# OR Vercel Blob (easier)
BLOB_READ_WRITE_TOKEN=...

# Database
DATABASE_URL=postgresql://...

# Security
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=image/*,application/pdf,text/*
```

## Testing Locally

Test that attachments persist:

```bash
# 1. Start dev server
npm run dev

# 2. Open http://localhost:3000
# 3. Upload an image/PDF in chat
# 4. Send message
# 5. Refresh page (Cmd+R or F5)
# 6. Verify attachment is still visible ✅

# 7. Check filesystem
ls -lh .chats/attachments/  # Should see chatId directories
```

## Migration Strategy

Recommended approach for upgrading:

1. **Phase 1** - Set up blob storage
   - Create S3 bucket / Vercel Blob space
   - Test file upload/download
   - Keep local storage as fallback

2. **Phase 2** - Parallel operation
   - Feature flag: `USE_BLOB_STORAGE=true/false`
   - New chats use blob storage
   - Old chats use local storage

3. **Phase 3** - Backfill
   - Script to upload existing `.chats/attachments/` to S3
   - Update JSON references

4. **Phase 4** - Database migration
   - Set up PostgreSQL/MongoDB
   - Migrate chat JSONs to database rows
   - Keep files as-is (already in S3)

5. **Phase 5** - Cleanup
   - Remove local storage code
   - Delete `.chats/` directory
   - Remove feature flags

## Common Issues

### Issue: "File not found" after page refresh
**Cause**: File wasn't saved to disk (storage failure)
**Fix**: Check console for errors, verify `.chats/` directory is writable

### Issue: Large files make app slow
**Cause**: Data URLs bloat API responses
**Fix**: Upgrade to signed URLs (see ATTACHMENT_STORAGE.md)

### Issue: Files lost after deployment to Vercel
**Cause**: Vercel has ephemeral filesystem
**Fix**: Must upgrade to S3/blob storage (see upgrade checklist)

### Issue: "Attachment content isn't persisted" message
**Cause**: File URL is `omitted://` (storage failed or file deleted)
**Fix**: Check if `.chats/attachments/{chatId}/` exists and contains files

## Performance Tips

### Current (Local Dev)
- Small files (<1MB): Works fine
- Large files (>5MB): Slow, bloats responses
- Multiple files: Sequential loading, slow

### After Upgrade (Production)
- Use signed URLs (not data URLs)
- Enable CDN (CloudFront for S3)
- Implement lazy loading
- Add image optimization (resize, compress)
- Consider thumbnails for previews

## Security Considerations

### Current (Local Dev)
⚠️ Minimal security - **DO NOT use in production as-is**

### Production Upgrades Needed
1. **Authentication**: Verify user owns chat before access
2. **Signed URLs**: Time-limited access tokens
3. **Virus scanning**: Scan uploads for malware
4. **File type validation**: Reject executables, scripts
5. **Size limits**: Prevent abuse (10MB recommended)
6. **Rate limiting**: Prevent upload spam
7. **CORS**: Restrict which origins can upload

Example access control:
```typescript
// Before serving attachment
const chat = await db.chats.findOne({ id: chatId });
if (chat.userId !== request.userId) {
  throw new Error("Unauthorized");
}
```

## Questions?

- Read **[ATTACHMENT_STORAGE.md](./ATTACHMENT_STORAGE.md)** for detailed documentation
- Check code comments in `attachmentStore.ts` and `fileChatStore.ts`
- See upgrade examples for S3, Vercel Blob, and PostgreSQL
