import { CHIP, PATH_STYLE, REF_LAYERS, TAG } from "./flow-style";

/**
 * The reading key for a flow-style architecture drawing, on one line: the two path styles,
 * what a numbered chip and a risk code are, and the three tab colours. Shared by the
 * architecture page and the incident replay's architecture view.
 */
export function FlowLegend({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-ink-2 ${className}`}>
      {Object.entries(PATH_STYLE).map(([id, style]) => (
        <span key={id} className="flex items-center gap-1.5">
          <svg width="22" height="10" aria-hidden>
            <path d="M 1 5 H 21" stroke={style.stroke} strokeWidth="2" strokeDasharray={style.dash} />
          </svg>
          {style.label}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="flex h-[16px] w-[16px] items-center justify-center rounded-full border text-[9px] font-bold"
          style={{ background: CHIP.fill, borderColor: CHIP.stroke, color: CHIP.text }}
        >
          1
        </span>
        Capability
      </span>
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="ident rounded-sm border px-1 py-px text-[9px] font-bold"
          style={{ background: TAG.fill, borderColor: TAG.stroke, color: TAG.text }}
        >
          R01
        </span>
        Risk
      </span>
      <span className="flex items-center gap-1.5">
        {REF_LAYERS.map((l) => (
          <span key={l.label} title={`${l.label} layer`} className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: l.color }} />
        ))}
        {REF_LAYERS.map((l) => l.label).join(" · ")}
      </span>
      <span className="text-ink-3">Hover anything for detail</span>
    </div>
  );
}
