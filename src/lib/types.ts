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
  /**
   * The tool's scene id this simulation was published from, e.g. 's9'.
   *
   * What ties a published URL to a scene rather than to a title. The tool
   * rewrites a title when it corrects a simulation, and re-slugifying that
   * would move an address search results already point at (docs/adr/0007).
   * Absent on entries published before the field existed.
   */
  scene?: string;
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