/**
 * A person's life dates, as a label.
 *
 * Not every figure in the chronicle has recorded dates — Mai Bhago is the
 * clearest case — and the pages used to render that as a bare "?" or as
 * "?–present", which reads as a broken template rather than as an honest gap.
 * Where nothing is known, this returns an empty string and the caller renders
 * nothing at all.
 *
 * `present` marks someone recorded as born but not as died. Every person in
 * the collection today is historical, so it does not currently appear; it is
 * the right answer if a living figure is ever added.
 */
export const lifespan = (born?: number, died?: number): string => {
  if (born == null && died == null) return '';
  if (born == null) return `?–${died}`;
  if (died == null) return `${born}–present`;
  return `${born}–${died}`;
};
