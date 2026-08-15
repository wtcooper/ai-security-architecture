import Link from "next/link";
import { Chip } from "@/components/Chips";
import { surfaceById } from "@/lib/data";
import type { Archetype } from "@/lib/types";

/**
 * "Seen in these architectures" — the link back from the taxonomy into the drawings.
 *
 * The taxonomy pages answer what a thing is; this answers where it actually shows up. Rendered on
 * risks, controls, capabilities, components and personas so every entity in the framework has a
 * route down to the architectures that instantiate it, which is the whole point of the tab
 * existing below the others.
 */
export function ArchetypeLinks({
  archetypes,
  label = "Seen in these architectures",
  empty,
}: {
  archetypes: Archetype[];
  label?: string;
  /** Shown instead of the list when nothing matches. A real finding, not a blank. */
  empty?: string;
}) {
  if (!archetypes.length) {
    return empty ? (
      <div>
        <p className="eyebrow">{label}</p>
        <p className="mt-1.5 text-[13px] leading-snug text-ink-3">{empty}</p>
      </div>
    ) : null;
  }

  return (
    <div>
      <p className="eyebrow">
        {label} · {archetypes.length}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {archetypes.map((a) => (
          <Link key={a.id} href={`/reference?archetype=${a.id}`} title={surfaceById.get(a.surface)?.title}>
            <Chip>{a.abbrev ?? a.title}</Chip>
          </Link>
        ))}
      </div>
    </div>
  );
}
