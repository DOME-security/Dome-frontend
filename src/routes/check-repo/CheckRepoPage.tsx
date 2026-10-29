import { useMutation, useQuery } from '@tanstack/react-query';
import { m } from '../../i18n';
import { useId, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ReportView } from '../../components/ReportView';
import { ScanProgress } from '../../components/ScanProgress';
import { ErrorMessage, Loading } from '../../components/Status';
import { api } from '../../lib/api';
import { parseGitHubRepo } from '../../lib/github';
import { isTerminal, nextPollDelay } from '../../lib/polling';
import ui from '../../styles/ui.module.css';

const SCAN_ID = /^[\w-]{1,64}$/;
const GIT_REF = /^(?!.*\.\.)(?!\/)[\w.\-/]{1,200}(?<!\/)$/;

function ScanResult({ id }: { id: string }) {
  const startedAt = useRef(Date.now());
  const {
    data: scan,
    error,
    isPending,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['scan', id],
    queryFn: () => api.getScan(id),
    // Finished scans never change, so they are cached for the session.
    staleTime: (query) => (isTerminal(query.state.data?.status) ? Infinity : 0),
    refetchInterval: (query) =>
      nextPollDelay(query.state.data?.status, query.state.dataUpdateCount - 1, Date.now() - startedAt.current),
  });
  const gaveUp = scan && !isTerminal(scan.status) && nextPollDelay(scan.status, 0, Date.now() - startedAt.current) === false;

  if (isPending) return <Loading label={m.checkRepo.loadingScan} />;
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
            {m.checkRepo.commit} <span className={ui.mono}>{scan.commit.slice(0, 12)}</span>
          </>
        ) : (
          m.checkRepo.defaultBranch
        )}
        {scan.ref ? (
          <>
            {' '}
            {m.checkRepo.on} <span className={ui.mono}>{scan.ref}</span>
          </>
        ) : null}
      </p>
      {!isTerminal(scan.status) && <ScanProgress status={scan.status} />}
      {gaveUp && (
        <div role="status" className={ui.card}>
          <p>{m.checkRepo.slow}</p>
          <button
            type="button"
            className={ui.secondary}
            disabled={isFetching}
            onClick={() => {
              startedAt.current = Date.now();
              void refetch();
            }}
          >
            {m.checkRepo.checkAgain}
          </button>
        </div>
      )}
      {scan.status === 'failed' && (
        <div role="alert" className={ui.card}>
          <p>
            <strong>{m.checkRepo.failed}</strong> {m.checkRepo.failedAdvice}
          </p>
        </div>
      )}
      {scan.status === 'done' && scan.report && (
        <ReportView report={scan.report} repository={scan.repository} commit={scan.commit} />
      )}
      {scan.status === 'done' && (
        <p>
          <Link to={`/repos/${owner}/${repo}`}>{m.checkRepo.history}</Link>
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
      setInputError(m.checkRepo.invalidUrl);
      return;
    }
    const gitRef = ref.trim();
    if (gitRef && !GIT_REF.test(gitRef)) {
      setInputError(m.checkRepo.invalidRef);
      return;
    }
    setInputError(null);
    create.mutate({ repoUrl: parsed.url, gitRef: gitRef || undefined });
  }

  return (
    <div className={ui.wide}>
      <title>{m.app.titleSuffix(m.checkRepo.title)}</title>
      <div className={ui.page}>
        <h1>{m.checkRepo.title}</h1>
        <p className={ui.lead}>{m.checkRepo.lead}</p>
        <form onSubmit={onSubmit} noValidate className={ui.card}>
          <div className={ui.row}>
            <div className={ui.grow}>
              <label htmlFor={urlId} className={ui.label}>
                {m.checkRepo.urlLabel}
              </label>
              <input
                id={urlId}
                className={ui.input}
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder={m.checkRepo.urlPlaceholder}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                aria-invalid={inputError ? true : undefined}
                aria-describedby={inputError ? errorId : undefined}
              />
            </div>
            <div>
              <label htmlFor={refId} className={ui.label}>
                {m.checkRepo.refLabel} <span className={ui.muted}>{m.checkRepo.optional}</span>
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
              {create.isPending ? m.checkRepo.submitting : m.checkRepo.submit}
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
