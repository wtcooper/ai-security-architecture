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

/** Empty: the trust-boundary drawing on trial here became the standard (src/components/drawing). */
export const EXPERIMENTS: Experiment[] = [];

export const experimentById = new Map(EXPERIMENTS.map((e) => [e.id, e]));
