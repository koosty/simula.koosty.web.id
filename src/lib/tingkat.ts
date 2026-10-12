/** Indonesian names for the Tingkat, so a pupil never sees a bare "smp". */
const TINGKAT_LABELS: Record<string, string> = {
  sd: 'Sekolah Dasar',
  smp: 'SMP',
  sma: 'SMA',
};

/**
 * The order an Indonesian reader expects the Tingkat in, from primary upwards.
 *
 * Sorting the URL segments instead would put "sma" before "smp", which reads
 * backwards. A segment not listed here sorts after the ones that are, keeping
 * a newly added stage at the end rather than dropping it.
 */
const TINGKAT_PROGRESSION: Record<string, number> = {
  sd: 0,
  smp: 1,
  sma: 2,
  smk: 3,
};

/**
 * How a Tingkat sorts against another at the same grade.
 *
 * Lower comes first; an unknown segment comes last rather than being dropped.
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