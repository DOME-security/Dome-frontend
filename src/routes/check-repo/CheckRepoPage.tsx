import { useMutation, useQuery } from '@tanstack/react-query';
import { useId, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ReportView } from '../../components/ReportView';
import { ScanProgress } from '../../components/ScanProgress';
import { ErrorMessage, Loading } from '../../components/Status';
import { api } from '../../lib/api';
import { parseGitHubRepo } from '../../lib/github';
import type { Scan } from '../../lib/types';
import ui from '../../styles/ui.module.css';

const SCAN_ID = /^[\w-]{1,64}$/;
const GIT_REF = /^(?!.*\.\.)(?!\/)[\w.\-/]{1,200}(?<!\/)$/;
export const POLL_MS = 2000;

function ScanResult({ id }: { id: string }) {
  const {
    data: scan,
    error,
    isPending,
  } = useQuery({
    queryKey: ['scan', id],
    queryFn: () => api.getScan(id),
    refetchInterval: (query) => {
      const status = (query.state.data as Scan | undefined)?.status;
      return status === 'queued' || status === 'running' ? POLL_MS : false;
    },
  });

  if (isPending) return <Loading label="Loading scan…" />;
  if (error) return <ErrorMessage error={error} />;

  const { owner, repo } = scan.repository;
  return (
    <section aria-labelledby="scan-heading">
      <h2 id="scan-heading">
        <span className={ui.mono}>
          {owner}/{repo}
        </span>
      </h2>
      <p className={ui.muted}>
        {scan.commit ? (
          <>
            Commit <span className={ui.mono}>{scan.commit.slice(0, 12)}</span>
          </>
        ) : (
          'Default branch'
        )}
        {scan.ref ? (
          <>
            {' '}
            on <span className={ui.mono}>{scan.ref}</span>
          </>
        ) : null}
      </p>
      {scan.status !== 'done' && scan.status !== 'failed' && <ScanProgress status={scan.status} />}
      {scan.status === 'failed' && (
        <div role="alert" className={ui.card}>
          <p>
            <strong>The scan could not finish.</strong> This is not a clean result. Try again later, and do not open the
            repository until a scan completes.
          </p>
        </div>
      )}
      {scan.status === 'done' && scan.report && (
        <ReportView report={scan.report} repository={scan.repository} commit={scan.commit} />
      )}
      {scan.status === 'done' && (
        <p>
          <Link to={`/repos/${owner}/${repo}`}>Repository history and on-chain attestation</Link>
        </p>
      )}
    </section>
  );
}

export function CheckRepoPage() {
  const [params, setParams] = useSearchParams();
  const [url, setUrl] = useState('');
  const [ref, setRef] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const urlId = useId();
  const refId = useId();
  const errorId = useId();

  const create = useMutation({
    mutationFn: ({ repoUrl, gitRef }: { repoUrl: string; gitRef?: string }) => api.createScan(repoUrl, gitRef),
    onSuccess: (created) => setParams({ scan: created.id }),
  });

  const scanId = params.get('scan');
  const validScanId = scanId && SCAN_ID.test(scanId) ? scanId : null;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseGitHubRepo(url);
    if (!parsed) {
      setInputError('Enter a public GitHub repository, like https://github.com/owner/repo.');
      return;
    }
    const gitRef = ref.trim();
    if (gitRef && !GIT_REF.test(gitRef)) {
      setInputError('That branch or tag name is not valid.');
      return;
    }
    setInputError(null);
    create.mutate({ repoUrl: parsed.url, gitRef: gitRef || undefined });
  }

  return (
    <div className={ui.wide}>
      <title>Check a repo · Dome</title>
      <div className={ui.page}>
        <h1>Check a repo</h1>
        <p className={ui.lead}>
          Paste a public GitHub link. Dome reads the repository on its servers, without running anything, and shows what would run
          when you open, install or build it.
        </p>
        <form onSubmit={onSubmit} noValidate className={ui.card}>
          <div className={ui.row}>
            <div className={ui.grow}>
              <label htmlFor={urlId} className={ui.label}>
                GitHub repository
              </label>
              <input
                id={urlId}
                className={ui.input}
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder="https://github.com/owner/repo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                aria-invalid={inputError ? true : undefined}
                aria-describedby={inputError ? errorId : undefined}
              />
            </div>
            <div>
              <label htmlFor={refId} className={ui.label}>
                Branch or tag <span className={ui.muted}>(optional)</span>
              </label>
              <input
                id={refId}
                className={ui.input}
                autoComplete="off"
                spellCheck={false}
                placeholder="main"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
              />
            </div>
            <button type="submit" className={ui.button} disabled={create.isPending}>
              {create.isPending ? 'Starting…' : 'Check'}
            </button>
          </div>
          {inputError && (
            <p id={errorId} role="alert" className={ui.hint}>
              {inputError}
            </p>
          )}
        </form>
        {create.error && <ErrorMessage error={create.error} />}
      </div>
      {validScanId && <ScanResult key={validScanId} id={validScanId} />}
    </div>
  );
}
