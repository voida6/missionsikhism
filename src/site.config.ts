/**
 * Project-wide links for the contribution flow. The site is static and content
 * lives as Markdown in Git, so "contributing" concretely means: open an issue
 * with a sourced correction, or edit the entry's file directly on GitHub.
 */
export const REPO_URL = 'https://github.com/voida6/missionsikhism';
export const REPO_BRANCH = 'main';

/** Direct "edit this file" link on GitHub (opens a fork/PR flow for visitors). */
export const editUrl = (contentPath: string) =>
  `${REPO_URL}/edit/${REPO_BRANCH}/${contentPath}`;

/** Prefilled GitHub issue for suggesting a sourced correction to one entry. */
export const correctionUrl = (title: string, contentPath: string) => {
  const params = new URLSearchParams({
    title: `Correction: ${title}`,
    body: [
      `**Entry:** ${title}`,
      `**File:** \`${contentPath}\``,
      '',
      '**What is inaccurate or missing?**',
      '',
      '',
      '**Source for the correction** (required — book with author and page, or a link):',
      '',
    ].join('\n'),
    labels: 'correction',
  });
  return `${REPO_URL}/issues/new?${params}`;
};

/** Generic "report an inaccuracy" issue, for when no single entry applies. */
export const reportUrl = () => {
  const params = new URLSearchParams({
    title: 'Correction: ',
    body: [
      '**Which page or entry?**',
      '',
      '',
      '**What is inaccurate or missing?**',
      '',
      '',
      '**Source for the correction** (required — book with author and page, or a link):',
      '',
    ].join('\n'),
    labels: 'correction',
  });
  return `${REPO_URL}/issues/new?${params}`;
};

/** Prefilled GitHub issue for proposing a brand-new entry. */
export const newEntryUrl = () => {
  const params = new URLSearchParams({
    title: 'New entry: ',
    body: [
      '**What should be added?** (an event, person, place, or topic)',
      '',
      '',
      '**Source** (required — book with author and page, or a link):',
      '',
    ].join('\n'),
    labels: 'new-entry',
  });
  return `${REPO_URL}/issues/new?${params}`;
};
