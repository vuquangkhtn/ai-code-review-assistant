// QA probe for issue 24: run this repo's installed @semantic-release/commit-analyzer
// plugin entry (the exact code path semantic-release executes) against the candidate
// squash title and the PR #16 WIP title.
// Run from a checkout of this branch after `npm ci`: node <this-file>
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const analyzer = await import(pathToFileURL(resolve(ROOT, 'node_modules/@semantic-release/commit-analyzer/index.js')));

const WIP_TITLE = '🚧 [wip] comparison: compare two CLI providers';
const FEAT_TITLE = 'feat: release comparison and CLI-review batch';
const body = '- Trigger a minor release containing comparison PR #16 and CLI reviews.\n- Record the source commit outside CI documentation path exclusions.\n- Verify commit-analyzer and the pipeline feature detector accept the subject.\n\nCloses #24';

const mkLogger = () => ({ log: () => {}, error: () => {} });

const scenarios = [
  { name: 'feat-only (this PR squash)', commits: [{ hash: '28943ad', message: `${FEAT_TITLE}\n\n${body}` }] },
  { name: 'wip-only (PR #16 squash — root cause)', commits: [{ hash: 'a581a25', message: WIP_TITLE }] },
  { name: 'wip + feat (what main will see after merge)', commits: [
    { hash: 'a581a25', message: WIP_TITLE },
    { hash: '28943ad', message: `${FEAT_TITLE}\n\n${body}` },
  ] },
];

const results = [];
for (const s of scenarios) {
  const releaseType = await analyzer.analyzeCommits({}, {
    cwd: ROOT,
    logger: mkLogger(),
    commits: s.commits,
  });
  results.push({ scenario: s.name, releaseType });
  console.log(JSON.stringify({ scenario: s.name, releaseType }));
}
console.log('SUMMARY ' + JSON.stringify(results));
