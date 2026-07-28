/**
 * Registry of explanatory diagrams, keyed by the string used in an entry's
 * `diagram:` frontmatter field.
 *
 * Astro components can't be selected by dynamic path at build time, so the
 * mapping is explicit. Adding a diagram means adding a component and one line
 * here; an unknown key renders nothing rather than breaking the page.
 */
import AuthorityAfter1708 from './AuthorityAfter1708.astro';
import EighteenthCenturyArc from './EighteenthCenturyArc.astro';
import PartitionOfPunjab from './PartitionOfPunjab.astro';

export const diagrams = {
  'authority-after-1708': AuthorityAfter1708,
  'eighteenth-century-arc': EighteenthCenturyArc,
  'partition-of-punjab': PartitionOfPunjab,
} as const;

export type DiagramKey = keyof typeof diagrams;
