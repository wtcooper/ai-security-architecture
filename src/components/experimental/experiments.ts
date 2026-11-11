/**
 * The experimental section of the architecture picker: drawings on trial, each tied to an
 * existing architecture whose data and tabs it reuses. Nothing here changes that architecture.
 */
export interface Experiment {
  id: string;
  /** The architecture whose data the experiment draws. */
  archetype: string;
  title: string;
  tagline: string;
}

export const EXPERIMENTS: Experiment[] = [
  {
    id: "expCodingAgentDrawings",
    archetype: "archCodingAgentThirdParty",
    title: "Third-party coding & desktop agents: simplified drawings",
    tagline: "three cleaner drawings on trial",
  },
];

export const experimentById = new Map(EXPERIMENTS.map((e) => [e.id, e]));
