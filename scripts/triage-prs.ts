import { writeFile } from 'node:fs/promises';

type PullRequest = Readonly<{
  head: { sha: string };
  html_url: string;
  number: number;
  title: string;
  updated_at: string;
  user: { login: string; type: string } | null;
}>;

type PullRequestDetails = Readonly<{
  mergeable: boolean | null;
}>;

type CommitDetails = Readonly<{
  commit: { committer?: { date?: string } };
}>;

type CheckRun = Readonly<{
  conclusion: string | null;
  html_url: string;
  name: string;
  output?: { summary?: string | null; title?: string | null };
  status: string;
}>;

type CheckRunsResponse = Readonly<{
  check_runs: CheckRun[];
}>;

const owner = 'SzeChunYiu';
const repo = 'GroceryView';
const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
const token = process.env.GITHUB_TOKEN;
const outputPath = process.env.TRIAGE_OUTPUT ?? 'triage.jsonl';

async function github<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      accept: 'application/vnd.github+json',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) throw new Error(`GitHub request failed ${response.status}: ${path}`);
  return response.json() as Promise<T>;
}

async function listOpenPulls() {
  const pulls: PullRequest[] = [];
  for (let page = 1; ; page += 1) {
    const batch = await github<PullRequest[]>(`/pulls?state=open&per_page=100&page=${page}`);
    pulls.push(...batch);
    if (batch.length < 100) return pulls;
  }
}

function checksStatus(checks: CheckRun[]) {
  if (checks.length === 0 || checks.some((check) => check.status !== 'completed')) return 'pending';
  if (checks.some((check) => !['success', 'skipped', 'neutral'].includes(check.conclusion ?? ''))) return 'fail';
  return 'pass';
}

function stalenessDays(lastPush: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(lastPush).getTime()) / 86_400_000));
}

async function triagePull(pr: PullRequest) {
  const [details, commit, checks] = await Promise.all([
    github<PullRequestDetails>(`/pulls/${pr.number}`),
    github<CommitDetails>(`/commits/${pr.head.sha}`),
    github<CheckRunsResponse>(`/commits/${pr.head.sha}/check-runs?per_page=100`)
  ]);
  const lastPush = commit.commit.committer?.date ?? pr.updated_at;
  const failedChecks = checks.check_runs
    .filter((check) => check.status === 'completed' && !['success', 'skipped', 'neutral'].includes(check.conclusion ?? ''))
    .map((check) => ({
      conclusion: check.conclusion,
      name: check.name,
      summary: check.output?.summary ?? check.output?.title ?? '',
      url: check.html_url
    }));

  return {
    author: pr.user?.login ?? 'unknown',
    authorType: pr.user?.type === 'Bot' || pr.user?.login.endsWith('[bot]') ? 'bot' : 'human',
    checksStatus: checksStatus(checks.check_runs),
    failedChecks,
    headSha: pr.head.sha,
    mergeConflicts: details.mergeable === false,
    number: pr.number,
    stalenessDays: stalenessDays(lastPush),
    title: pr.title,
    url: pr.html_url
  };
}

async function main() {
  const pulls = await listOpenPulls();
  const rows = await Promise.all(pulls.map(triagePull));
  await writeFile(outputPath, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
  console.log(`wrote ${rows.length} PR triage rows to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
