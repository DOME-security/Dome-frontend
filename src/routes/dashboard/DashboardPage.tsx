import { useQuery } from '@tanstack/react-query';
import { m } from '../../i18n';
import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { FindingBadge } from '../../components/FindingBadge';
import { InlineNodes } from '../../components/SafeMarkdown';
import { api } from '../../lib/api';
import { parseGitHubRepo } from '../../lib/github';
import { parseInline } from '../../lib/markdown';
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
          <span className={ui.muted}>{m.dashboard.loading}</span>
        ) : error ? (
          <span>{m.dashboard.couldNotLoad}</span>
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
          <span>{m.dashboard.scanStatus(scan.status)}</span>
        ) : (
          <span className={ui.muted}>{m.dashboard.notScannedYet}</span>
        )}
      </td>
      <td>{scan?.finishedAt ? new Date(scan.finishedAt).toISOString().slice(0, 10) : '—'}</td>
      <td>{data?.attestation ? m.dashboard.published : '—'}</td>
      <td>
        <button
          type="button"
          className={ui.secondary}
          onClick={onRemove}
          aria-label={m.dashboard.removeLabel(`${repo.owner}/${repo.repo}`)}
        >
          {m.dashboard.remove}
        </button>
      </td>
    </tr>
  );
}

function ActionSetup() {
  const [copied, setCopied] = useState(false);
  return (
    <section aria-labelledby="action-heading">
      <h2 id="action-heading">{m.dashboard.actionHeading}</h2>
      <p>
        <InlineNodes nodes={parseInline(m.dashboard.actionIntro)} />
      </p>
      <ol>
        {[m.dashboard.actionSteps.save, m.dashboard.actionSteps.pin, m.dashboard.actionSteps.mode].map((step) => (
          <li key={step}>
            <InlineNodes nodes={parseInline(step)} />
          </li>
        ))}
      </ol>
      <div className={styles.code}>
        <pre tabIndex={0} aria-label={m.dashboard.workflowLabel}>
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
          {copied ? m.dashboard.copied : m.dashboard.copy}
        </button>
      </div>
      <p className={ui.hint}>
        {m.dashboard.hardeningBefore} <Link to="/guides/hardening">{m.dashboard.hardeningLink}</Link>
        {m.dashboard.hardeningAfter}
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
      setInputError(m.dashboard.invalid);
      return;
    }
    setInputError(null);
    add({ owner: parsed.owner, repo: parsed.repo });
    setInput('');
  }

  return (
    <div className={ui.wide}>
      <title>{m.app.titleSuffix(m.dashboard.title)}</title>
      <div className={ui.page}>
        <h1>{m.dashboard.title}</h1>
        <p className={ui.lead}>{m.dashboard.lead}</p>
        <div className={ui.card}>
          <p>
            <strong>{m.dashboard.signInSoon}</strong> {m.dashboard.signInSoonBody}
          </p>
        </div>
      </div>

      <section aria-labelledby="repos-heading">
        <h2 id="repos-heading">{m.dashboard.reposHeading}</h2>
        <form onSubmit={onAdd} noValidate className={ui.row}>
          <div className={ui.grow}>
            <label htmlFor={inputId} className={ui.label}>
              {m.dashboard.addLabel}
            </label>
            <input
              id={inputId}
              className={ui.input}
              autoComplete="off"
              spellCheck={false}
              placeholder={m.dashboard.addPlaceholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <button type="submit" className={ui.button}>
            {m.dashboard.add}
          </button>
        </form>
        {inputError && (
          <p role="alert" className={ui.hint}>
            {inputError}
          </p>
        )}
        {list.length === 0 ? (
          <p className={ui.muted}>{m.dashboard.empty}</p>
        ) : (
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <caption className="visually-hidden">{m.dashboard.caption}</caption>
              <thead>
                <tr>
                  <th scope="col">{m.dashboard.columns.repo}</th>
                  <th scope="col">{m.dashboard.columns.result}</th>
                  <th scope="col">{m.dashboard.columns.scanned}</th>
                  <th scope="col">{m.dashboard.columns.chain}</th>
                  <th scope="col">
                    <span className="visually-hidden">{m.dashboard.columns.actions}</span>
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
