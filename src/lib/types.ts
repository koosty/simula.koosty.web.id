/** One simulation as the catalog describes it. */
export interface CatalogEntry {
  /** The simulation's slug. Equal to its filename without the .html suffix. */
  slug: string;
  title: string;
  description: string;
  /** Bahasa URL segment: 'smp' for the lower secondary stage. */
  level: string;
  grade: number;
  /** Bahasa URL segment, an open set: new subjects appear as content arrives. */
  subject: string;
  /** Display order within a class. The only prominence signal. */
  order: number;
}

/** What a simulation declares about itself inside its own HTML. */
export interface SimulationMeta {
  level: string;
  grade: number;
  title: string;
}

export interface ValidationResult {
  /** Problems that must stop the build. */
  errors: string[];
  /** Problems worth telling a human about, which must not stop the build. */
  warnings: string[];
}