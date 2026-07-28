/**
 * Inline citation markers for entry prose.
 *
 * Write `{{3}}` — or `{{1,3}}` / `{{2-4}}` for several at once — at the end of
 * a sentence in any content markdown file. This plugin turns the token into a
 * superscript marker linking to the matching numbered item in that page's
 * Sources panel (`<li id="src-3">`, emitted by SourceList.astro).
 *
 * Why a custom token rather than GFM footnotes: GFM footnotes require a
 * definition block per note and render their own list at the bottom of the
 * page, which would duplicate the Sources panel we already show. Here the
 * source list *is* the footnote list, so the marker only needs to point at it.
 *
 * The token is deliberately unusual so it can never collide with ordinary
 * prose or with markdown link syntax.
 */
import { visit } from 'unist-util-visit';

const TOKEN = /\{\{(\d+(?:\s*[,–-]\s*\d+)*)\}\}/g;

/** "1,3" | "2-4" -> [1,3] | [2,3,4] */
function expand(spec) {
  const out = [];
  for (const part of spec.split(',')) {
    const range = part.trim().match(/^(\d+)\s*[–-]\s*(\d+)$/);
    if (range) {
      const [a, b] = [Number(range[1]), Number(range[2])];
      // Guard against a typo like {{9-1}} producing an empty or runaway list.
      if (b >= a && b - a < 50) for (let n = a; n <= b; n++) out.push(n);
    } else if (/^\d+$/.test(part.trim())) {
      out.push(Number(part.trim()));
    }
  }
  return out;
}

export default function remarkCitations() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index === null) return;
      if (!node.value.includes('{{')) return;

      const children = [];
      let last = 0;
      let match;
      TOKEN.lastIndex = 0;

      while ((match = TOKEN.exec(node.value)) !== null) {
        const nums = expand(match[1]);
        if (!nums.length) continue;

        if (match.index > last) {
          children.push({ type: 'text', value: node.value.slice(last, match.index) });
        }

        children.push({
          type: 'html',
          value:
            '<sup class="cite-ref">' +
            nums
              .map(
                (n) =>
                  `<a href="#src-${n}" aria-label="Source ${n}" data-cite="${n}">${n}</a>`,
              )
              .join('<span class="cite-sep">,</span>') +
            '</sup>',
        });

        last = match.index + match[0].length;
      }

      if (!children.length) return;
      if (last < node.value.length) {
        children.push({ type: 'text', value: node.value.slice(last) });
      }

      parent.children.splice(index, 1, ...children);
      return index + children.length;
    });
  };
}
