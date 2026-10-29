import { useQuery } from '@tanstack/react-query';
import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { FindingBadge } from '../../components/FindingBadge';
import { api } from '../../lib/api';
import { parseGitHubRepo } from '../../lib/github';
import { VERDICT_TEXT } from '../../lib/rules';
import { useWatchlist, type WatchedRepo } from '../../lib/watchlist';
import ui from '../../styles/ui.module.css';
import { ACTION_WORKFLOW } from './actionWorkflow';
import styles from './DashboardPage.module.css';

function RepoRow({ repo, onRemove }: { repo: WatchedRepo; onRemove: () => void }) {
  const { data, error, isPending } = useQuery({
    queryKey: ['repo', repo.owner, repo.repo],
    queryFn: () => api.getRepo(repo.owner, repo.repo),
  });
  const scan = data?.latestScan;
  const verdict = scan?.status === 'done' ? scan.verdict : null;
  return (
    <tr>
      <th scope="row" className={ui.mono}>
        <Link to={`/repos/${repo.owner}/${repo.repo}`}>
          {repo.owner}/{repo.repo}
        </Link>
      </th>
      <td>
        {isPending ? (
          <span className={ui.muted}>Loading…</span>
        ) : error ? (
          <span>Could not load</span>
        ) : verdict ? (
          <>
            {verdict === 'clean' ? (
              <span>🟢 {VERDICT_TEXT.clean.label}</span>
            ) : (
              <FindingBadge severity={verdict === 'block' ? 'block' : 'review'} />
            )}{' '}
            {verdict === 'incomplete' && <span>{VERDICT_TEXT.incomplete.label}</span>}
          </>
        ) : scan ? (
          <span>Scan {scan.status}</span>
        ) : (
          <span className={ui.muted}>Not scanned yet</span>
        )}
      </td>
      <td>{scan?.finishedAt ? new Date(scan.finishedAt).toISOString().slice(0, 10) : '—'}</td>
      <td>{data?.attestation ? 'Published' : '—'}</td>
      <td>
        <button
          type="button"
          className={ui.secondary}
          onClick={onRemove}
          aria-label={`Stop following ${repo.owner}/${repo.repo}`}
        >
          Remove
        </button>
      </td>
    </tr>
  );
}

function ActionSetup() {
  const [copied, setCopied] = useState(false);
  return (
    <section aria-labelledby="action-heading">
      <h2 id="action-heading">Scan every pull request</h2>
      <p>
        Add the Dome GitHub Action so every pull request is scanned before anyone checks it out. It runs on{' '}
        <code>pull_request</code> with a read-only token, so a fork cannot use it to reach your secrets.
      </p>
      <ol>
        <li>
          Save this file as <code>.github/workflows/dome.yml</code>.
        </li>
        <li>
          Replace <code>REPLACE_WITH_RELEASE_SHA</code> with the commit SHA of the latest Dome Action release (the Action has not
          had its first release yet; follow the{' '}
          <a href="https://github.com/DOME-security/Dome-backend" target="_blank" rel="noreferrer">
            dome-backend repository
          </a>
          ).
        </li>
        <li>Start with mode: report for a week, then switch to enforce.</li>
      </ol>
      <div className={styles.code}>
        <pre tabIndex={0} aria-label="Workflow file">
          <code>{ACTION_WORKFLOW}</code>
        </pre>
        <button
          type="button"
          className={ui.secondary}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(ACTION_WORKFLOW);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className={ui.hint}>
        Then follow the <Link to="/guides/hardening">hardening guide</Link>: rulesets, signed commits and CODEOWNERS.
      </p>
    </section>
  );
}

export function DashboardPage() {
  const { list, add, remove } = useWatchlist();
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const inputId = useId();

  function onAdd(event: FormEvent) {
    event.preventDefault();
    const parsed = parseGitHubRepo(input);
    if (!parsed) {
      setInputError('Enter a public GitHub repository, like owner/repo.');
      return;
    }
    setInputError(null);
    add({ owner: parsed.owner, repo: parsed.repo });
    setInput('');
  }

  return (
    <div className={ui.wide}>
      <title>Maintainer dashboard · Dome</title>
      <div className={ui.page}>
        <h1>Maintainer dashboard</h1>
        <p className={ui.lead}>
          Follow the latest Dome result for the repositories you maintain, and set up scanning on every pull request.
        </p>
        <div className={ui.card}>
          <p>
            <strong>GitHub sign-in is coming.</strong> Once the Dome GitHub App supports it, this page will list your repositories
            and their scan history automatically. Until then, add repositories by hand; the list is saved only in this browser.
          </p>
        </div>
      </div>

      <section aria-labelledby="repos-heading">
        <h2 id="repos-heading">Your repositories</h2>
        <form onSubmit={onAdd} noValidate className={ui.row}>
          <div className={ui.grow}>
            <label htmlFor={inputId} className={ui.label}>
              Add a public repository
            </label>
            <input
              id={inputId}
              className={ui.input}
              autoComplete="off"
              spellCheck={false}
              placeholder="owner/repo"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <button type="submit" className={ui.button}>
            Add
          </button>
        </form>
        {inputError && (
          <p role="alert" className={ui.hint}>
            {inputError}
          </p>
        )}
        {list.length === 0 ? (
          <p className={ui.muted}>No repositories yet. Add one you maintain to see its latest result here.</p>
        ) : (
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <caption className="visually-hidden">Followed repositories and their latest Dome result</caption>
              <thead>
                <tr>
                  <th scope="col">Repository</th>
                  <th scope="col">Latest result</th>
                  <th scope="col">Scanned</th>
                  <th scope="col">On chain</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((repo) => (
                  <RepoRow key={`${repo.owner}/${repo.repo}`} repo={repo} onRemove={() => remove(repo)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ActionSetup />
    </div>
  );
}
