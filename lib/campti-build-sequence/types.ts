export type CamptiBuildStage = {
  stage: number;
  /** Short slug for URLs and anchors */
  id: string;
  title: string;
  /** e.g. CAMPTI STAGE 1 — CONSTITUTIONAL CORE */
  promptLabel: string;
  /** Layered system law description */
  layerFocus: string;
  /** Concrete models / policy records to add or formalize */
  modelsToBuild: string[];
  /** Existing or future admin paths */
  adminSurfaces: string[];
  goal: string;
  /** What not to do in this stage */
  antiPatterns?: string[];
};
