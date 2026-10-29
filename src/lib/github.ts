export interface GitHubRepoRef {
  owner: string;
  repo: string;
  /** Canonical `https://github.com/<owner>/<repo>` form the backend accepts. */
  url: string;
}

// GitHub's own limits: owners are alphanumeric with single hyphens, repos also allow `.` and `_`.
const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
const REPO = /^[A-Za-z0-9._-]{1,100}$/;

export function isValidOwner(owner: string): boolean {
  return OWNER.test(owner);
}

export function isValidRepo(repo: string): boolean {
  return REPO.test(repo) && repo !== '.' && repo !== '..';
}

/**
 * Parses what people paste: a full URL, a URL with `/tree/...` or `.git`, or `owner/repo`.
 * Returns null for anything that is not a public github.com repository.
 */
export function parseGitHubRepo(input: string): GitHubRepoRef | null {
  let text = input.trim();
  if (!text) return null;
  if (/^[^/\s]+\/[^/\s]+$/.test(text) && !text.includes(':')) {
    text = `https://github.com/${text}`;
  }
  let url: URL;
  try {
    url = new URL(text.startsWith('github.com/') ? `https://${text}` : text);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.hostname !== 'github.com' && url.hostname !== 'www.github.com') return null;
  if (url.username || url.password || url.port) return null;
  const [owner, rawRepo] = url.pathname.split('/').filter(Boolean);
  if (!owner || !rawRepo) return null;
  const repo = rawRepo.replace(/\.git$/, '');
  if (!isValidOwner(owner) || !isValidRepo(repo)) return null;
  return { owner, repo, url: `https://github.com/${owner}/${repo}` };
}

/** Link to a file in a repository at a commit. Every path segment is encoded, so a path cannot break out of the URL. */
export function fileUrl(repo: { owner: string; repo: string }, commit: string, path: string, line?: number): string | null {
  if (!isValidOwner(repo.owner) || !isValidRepo(repo.repo) || !/^[0-9a-f]{7,64}$/i.test(commit)) return null;
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  const anchor = line && Number.isInteger(line) && line > 0 ? `#L${line}` : '';
  return `https://github.com/${repo.owner}/${repo.repo}/blob/${commit}/${encoded}${anchor}`;
}
