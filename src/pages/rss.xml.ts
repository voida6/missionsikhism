import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

// Hand-rolled RSS 2.0 feed of events (Phase H) — no extra dependency.
function esc(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c] as string)
  );
}

export async function GET(context: APIContext) {
  const base = (context.site?.href ?? 'https://missionsikhism.org/').replace(/\/$/, '');
  const events = (await getCollection('events')).sort((a, b) => b.data.year - a.data.year);

  const items = events
    .map((e) => {
      const link = `${base}/events/${e.id}`;
      const pub = new Date(Date.UTC(Math.max(0, e.data.year), 0, 1)).toUTCString();
      return `    <item>
      <title>${esc(e.data.title)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <pubDate>${pub}</pubDate>
      <description>${esc(e.data.summary)}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Mission Sikhism — Events</title>
    <link>${esc(base)}/</link>
    <description>Events from the fully-sourced history of the Sikh faith.</description>
    <language>en</language>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${esc(base)}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
