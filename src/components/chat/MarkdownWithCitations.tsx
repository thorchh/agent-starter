"use client";

import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationSource,
} from "@/components/ai-elements/inline-citation";
import { Streamdown } from "streamdown";
import { Fragment, memo, useMemo } from "react";

export type CitationSource = {
  title: string;
  url: string;
};

export type MarkdownWithCitationsProps = {
  markdown: string;
  sources: CitationSource[];
};

/**
 * Render Markdown + `[1]`-style inline citations.
 *
 * This is intentionally simple:
 * - We tokenize the markdown string on `[n]` markers.
 * - Each plain chunk is rendered with Streamdown.
 * - Each citation marker becomes an AI Elements `InlineCitation` popover.
 *
 * Tradeoff: splitting markdown can theoretically break formatting if a citation
 * appears inside an open markdown construct. For a starter template, this is a
 * practical "works well in practice" approach.
 */
export const MarkdownWithCitations = memo(
  ({ markdown, sources }: MarkdownWithCitationsProps) => {
    const tokens = useMemo(() => {
      const parts: Array<
        | { type: "markdown"; text: string }
        | { type: "citation"; index: number }
      > = [];

      const re = /\[(\d+)\]/g;
      let last = 0;
      let match: RegExpExecArray | null;

      while ((match = re.exec(markdown)) !== null) {
        const start = match.index;
        const end = re.lastIndex;

        if (start > last) {
          parts.push({ type: "markdown", text: markdown.slice(last, start) });
        }

        const n = Number(match[1]);
        if (Number.isFinite(n) && n > 0) {
          parts.push({ type: "citation", index: n - 1 });
        } else {
          parts.push({ type: "markdown", text: markdown.slice(start, end) });
        }

        last = end;
      }

      if (last < markdown.length) {
        parts.push({ type: "markdown", text: markdown.slice(last) });
      }

      return parts;
    }, [markdown]);

    return (
      <span className="inline">
        {tokens.map((t, i) => {
          if (t.type === "markdown") {
            if (!t.text) return null;
            return (
              <Fragment key={`md-${i}`}>
                <Streamdown className="inline [&>p]:inline [&>p]:m-0">{t.text}</Streamdown>
              </Fragment>
            );
          }

          const source = sources[t.index];
          if (!source) {
            return (
              <Fragment key={`cite-miss-${i}`}>
                <span className="text-muted-foreground">[{t.index + 1}]</span>
              </Fragment>
            );
          }

          return (
            <InlineCitation key={`cite-${i}`}>
              <InlineCitationCard>
                <InlineCitationCardTrigger sources={[source.url]} />
                <InlineCitationCardBody>
                  <div className="p-4">
                    <InlineCitationSource
                      title={source.title}
                      url={source.url}
                    />
                  </div>
                </InlineCitationCardBody>
              </InlineCitationCard>
            </InlineCitation>
          );
        })}
      </span>
    );
  }
);

MarkdownWithCitations.displayName = "MarkdownWithCitations";


