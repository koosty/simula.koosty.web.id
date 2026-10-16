// Icon paths copied from lucide-static 1.57.0 (ISC licence, https://lucide.dev).
// Only the icons the site uses are kept. Each entry is the inner markup of a
// 24 x 24 SVG drawn with currentColor, so the icon takes the text colour of its
// surroundings. Add a path here before using a new icon; the site never loads
// icons from another host (docs/adr/0022).
export const ICONS = {
  play: '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />',
  'rotate-ccw': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />',
  'arrow-right': '<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />',
  'external-link':
    '<path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />',
} as const;

export type IconName = keyof typeof ICONS;
