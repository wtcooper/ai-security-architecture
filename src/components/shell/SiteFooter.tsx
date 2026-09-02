import { dataset } from "@/lib/data";
import { REPO_URL } from "./SiteHeader";

/**
 * The trust line every page raises and none answered: which CoSAI commit the taxonomy is
 * vendored from, when the dataset was built, and that the authored layers are still under
 * review. Said once here rather than as a pill on every architecture.
 */
export function SiteFooter() {
  const { meta } = dataset;
  const generated = meta.generatedAt.slice(0, 10);
  const sha = meta.cosaiRef.slice(0, 7);
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center gap-x-5 gap-y-2 px-6 py-4 text-[11.5px] text-ink-3">
        <span>
          Dataset built <span className="ident text-ink-2">{generated}</span>
        </span>
        <span>
          CoSAI Risk Map @{" "}
          <a
            href={`https://github.com/cosai-oasis/secure-ai-tooling/tree/${meta.cosaiRef}/risk-map`}
            target="_blank"
            rel="noreferrer"
            className="ident text-ink-2 hover:text-introduced hover:underline"
          >
            {sha}
          </a>
        </span>
        <span>
          {meta.counts.risks} risks · {meta.counts.controls} controls · {meta.counts.capabilities}{" "}
          capabilities · {meta.counts.archetypes} architectures · {meta.counts.incidents} incidents
        </span>
        <span
          className="rounded-full border px-2 py-[2px] text-[10.5px] font-semibold"
          style={{ borderColor: "var(--band-data-rail)", color: "var(--band-data-rail)" }}
          title="The capability taxonomy, the reference architectures and their controls guidance are authored here and under active review — treat drawings, pins and mappings as draft."
        >
          Authored layers under review
        </span>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="ml-auto font-medium text-ink-2 hover:text-introduced hover:underline"
        >
          Source, audit and issues on GitHub ↗
        </a>
      </div>
    </footer>
  );
}
