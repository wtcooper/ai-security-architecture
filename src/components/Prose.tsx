import type { ExternalReference, Paragraph } from "@/lib/types";

/**
 * CoSAI prose arrives as an array of paragraphs; a nested array is a bullet list.
 * Inline `{{ref:some-id}}` placeholders resolve against the entity's externalReferences
 * and render as numbered citation links.
 */
export function Prose({
  blocks,
  refs = [],
  className = "",
  size = "base",
}: {
  blocks?: Paragraph[];
  refs?: ExternalReference[];
  className?: string;
  size?: "base" | "sm";
}) {
  if (!blocks?.length) return null;
  const byId = new Map(refs.map((r) => [r.id, r]));
  const order = new Map(refs.map((r, i) => [r.id, i + 1]));
  const text = size === "sm" ? "text-[13.5px] leading-[1.65]" : "text-[15px] leading-[1.7]";

  return (
    <div className={`prose-tight text-ink-2 ${text} ${className}`}>
      {blocks.map((block, i) =>
        Array.isArray(block) ? (
          <ul key={i} className="mt-2 space-y-1.5 pl-4">
            {block.map((item, j) => (
              <li key={j} className="list-disc marker:text-ink-3">
                {renderRefs(item, byId, order)}
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>{renderRefs(block, byId, order)}</p>
        ),
      )}
    </div>
  );
}

function renderRefs(
  text: string,
  byId: Map<string, ExternalReference>,
  order: Map<string, number>,
) {
  const parts = text.split(/(\{\{ref:[^}]+\}\})/g);
  return parts.map((part, i) => {
    const match = part.match(/^\{\{ref:([^}]+)\}\}$/);
    if (!match) return <span key={i}>{part}</span>;
    const ref = byId.get(match[1]);
    if (!ref) return null;
    return (
      <a
        key={i}
        href={ref.url}
        target="_blank"
        rel="noreferrer"
        title={ref.title}
        className="align-super text-[0.68em] font-medium text-introduced hover:underline"
      >
        [{order.get(match[1]) ?? "•"}]
      </a>
    );
  });
}

/** Collapses CoSAI prose to a single short line, for cards and list rows. */
export function firstLine(blocks?: Paragraph[], max = 180): string {
  const first = blocks?.find((b): b is string => typeof b === "string");
  if (!first) return "";
  const clean = first.replace(/\{\{ref:[^}]+\}\}/g, "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}
