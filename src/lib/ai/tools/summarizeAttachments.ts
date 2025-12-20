import { tool } from "ai";
import { z } from "zod/v3";

/**
 * Attachment summary tool.
 *
 * In AI SDK UI messages, attachments are represented as `file` parts. Some
 * models/providers can see and use images directly; others may not.
 *
 * This tool is a safe baseline: it summarizes metadata that the model can
 * reliably provide (filenames, media types, counts). For true file analysis,
 * you’ll later add:
 * - file upload storage
 * - content extraction
 * - OCR / vision pipelines
 */
export const summarizeAttachments = tool({
  description:
    "Summarize attached files (metadata only). Useful when the user sends attachments.",
  inputSchema: z.object({
    files: z
      .array(
        z.object({
          filename: z.string().optional(),
          mediaType: z.string(),
        })
      )
      .describe("List of attached files (filename/mediaType)."),
  }),
  execute: async ({ files }) => {
    const countsByType = files.reduce<Record<string, number>>((acc, f) => {
      acc[f.mediaType] = (acc[f.mediaType] ?? 0) + 1;
      return acc;
    }, {});

    return {
      count: files.length,
      filenames: files.map((f) => f.filename).filter(Boolean),
      countsByType,
      note: "Metadata only. Add real file processing later.",
    };
  },
});


