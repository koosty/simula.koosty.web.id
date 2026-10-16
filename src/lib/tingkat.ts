/** The Tingkat a tingkat-first URL may use. Locked: a new one is a decision (docs/adr/0027). */
export const TINGKAT = ['sd', 'smp', 'sma'] as const;

/** Subjects not taught by class. They have no kelas segment (docs/adr/0027). */
export const SPESIALISASI = 'spesialisasi';

export type Tingkat = (typeof TINGKAT)[number];

const TINGKAT_LABELS: Record<string, string> = {
  sd: 'Sekolah Dasar',
  smp: 'SMP',
  sma: 'SMA',
  [SPESIALISASI]: 'Spesialisasi',
};

/**
 * The order an Indonesian reader expects the Tingkat in, from primary upwards.
 *
 * Spesialisasi comes last: it is not a school level, so it does not sit between
 * the stages. Sorting the URL segments instead would put "sma" before "smp".
 */
const TINGKAT_PROGRESSION: Record<string, number> = {
  sd: 0,
  smp: 1,
  sma: 2,
  [SPESIALISASI]: 3,
};

/**
 * How a Tingkat sorts against another. Lower comes first. An unknown value
 * comes last rather than being dropped.
 */
export function tingkatProgression(level: string): number {
  return TINGKAT_PROGRESSION[level] ?? Number.MAX_SAFE_INTEGER;
}

/**
 * The Indonesian name of a Tingkat.
 *
 * An unknown segment comes back unchanged, so a new stage added to the catalog
 * shows up with its own name rather than disappearing from the label.
 */
export function tingkatLabel(level: string): string {
  return TINGKAT_LABELS[level] ?? level;
}
