"use client";

import { useSearchParams } from "next/navigation";
import { firstLine } from "@/components/Prose";
import { StatusPill } from "@/components/StatusPill";
import { controls, controlStatusFor, mitigationsForControl } from "@/lib/data";
import { CataloguePage } from "./CataloguePage";
import { ControlDetail } from "./ControlDetail";

export { CONTROL_CATEGORY_ACCENT } from "./CataloguePage";

/** Question one: what controls does the business need, and can we deliver them? */
export function ControlsBrowser() {
  const params = useSearchParams();
  return <CataloguePage items={controls} param="control" linked={params.get("control")}
    eyebrow={`${controls.length} CoSAI controls · CoSAI Risk Map`} title="CoSAI controls"
    lead="The control objectives an AI deployment needs, as CoSAI names them. Each is delivered by one or more controls in the catalogue, and its status rolls up from theirs. To see the catalogue arranged by these groups, switch its rows to CoSAI control group."
    placeholder="Search CoSAI controls, or the catalogue controls that deliver them…"
    searchText={(c) => `${c.title} ${c.id} ${mitigationsForControl(c.id).map((m) => `${m.title} ${m.id}`).join(" ")}`}
    meta={(c) => controlStatusFor(c.id) !== "notSet" ? <StatusPill status={controlStatusFor(c.id)} compact /> : firstLine(c.description, 80)}
    detail={(c) => <ControlDetail controlId={c.id} framed={false} />} />;
}
