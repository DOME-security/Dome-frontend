import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { ReportView } from '../../components/ReportView';
import { ErrorMessage, Loading } from '../../components/Status';
import { api, ApiError } from '../../lib/api';
import { isValidOwner, isValidRepo } from '../../lib/github';
import { accountUrl, shortKey, txUrl, verifyReportHash, type ReportCheck } from '../../lib/registry';
import { VERDICT_TEXT } from '../../lib/rules';
import type { OnChainAttestation, Scan, Verdict } from '../../lib/types';
import ui from '../../styles/ui.module.css';
import { NotFoundPage } from '../not-found/NotFoundPage';

const CHECK_TEXT: Record<ReportCheck, string> = {
  match: '✓ The report below hashes to the value recorded on chain.',
  mismatch: '✗ The report below does not match the hash recorded on chain. Treat this result with suspicion.',
  unavailable: 'The report could not be compared with the chain.',
};

function verdictLabel(verdict: string): string {
  return Object.hasOwn(VERDICT_TEXT, verdict) ? VERDICT_TEXT[verdict as Verdict].label : 'Unreadable';
}

function Attestation({ attestation, scan }: { attestation: OnChainAttestation; scan: Scan | null }) {
  // Only compare when the attestation is for the scan shown below.
  const sameCommit = scan?.commit && scan.commit === attestation.commit;
  const { data: check } = useQuery({
    queryKey: ['report-check', scan?.id, attestation.reportHash],
    queryFn: () => verifyReportHash(scan?.report, attestation.reportHash),
    enabled: Boolean(sameCommit),
  });
  const tx = txUrl(attestation.txHash);
  const attester = accountUrl(attestation.attester);
  return (
    <section aria-labelledby="attestation-heading" className={ui.card}>
      <h2 id="attestation-heading">On-chain attestation</h2>
      <dl className={ui.dl}>
        <dt>Verdict</dt>
        <dd>{verdictLabel(attestation.verdict)}</dd>
        <dt>Commit</dt>
        <dd className={ui.mono}>{attestation.commit.slice(0, 12)}</dd>
        <dt>Attester</dt>
        <dd className={ui.mono}>
          {attester ? (
            <a href={attester} target="_blank" rel="noreferrer" title={attestation.attester}>
              {shortKey(attestation.attester)}
            </a>
          ) : (
            shortKey(attestation.attester)
          )}
        </dd>
        <dt>Recorded</dt>
        <dd>
          Ledger {attestation.ledger}
          {tx && (
            <>
              {' · '}
              <a href={tx} target="_blank" rel="noreferrer">
                View transaction
              </a>
            </>
          )}
        </dd>
        <dt>Report hash</dt>
        <dd className={ui.mono}>{attestation.reportHash}</dd>
      </dl>
      {sameCommit ? (
        check && <p role="status">{CHECK_TEXT[check]}</p>
      ) : (
        <p className={ui.hint}>This attestation is for a different commit from the latest scan below.</p>
      )}
    </section>
  );
}

export function RepoPage() {
  const { owner = '', repo = '' } = useParams();
  const valid = isValidOwner(owner) && isValidRepo(repo);
  const { data, error, isPending } = useQuery({
    queryKey: ['repo', owner, repo],
    queryFn: () => api.getRepo(owner, repo),
    enabled: valid,
  });

  if (!valid) return <NotFoundPage />;

  const notScanned = error instanceof ApiError && error.status === 404;
  return (
    <div className={ui.wide}>
      <title>{`${owner}/${repo} · Dome`}</title>
      <h1 className={ui.mono}>
        {owner}/{repo}
      </h1>
      <p>
        <a href={`https://github.com/${owner}/${repo}`} target="_blank" rel="noreferrer">
          View on GitHub
        </a>
      </p>
      {isPending && <Loading />}
      {notScanned && (
        <div className={ui.card}>
          <p>Dome has not scanned this repository yet.</p>
          <Link to="/check/repo" className={ui.button}>
            Check it now
          </Link>
        </div>
      )}
      {error && !notScanned && <ErrorMessage error={error} />}
      {data && (
        <>
          {data.attestation ? (
            <Attestation attestation={data.attestation} scan={data.latestScan} />
          ) : (
            <p className={ui.muted}>No on-chain attestation has been published for this repository yet.</p>
          )}
          <h2>Latest scan</h2>
          {data.latestScan?.status === 'done' && data.latestScan.report ? (
            <ReportView report={data.latestScan.report} repository={data.latestScan.repository} commit={data.latestScan.commit} />
          ) : (
            <p>
              No finished scan yet. <Link to="/check/repo">Start one</Link>.
            </p>
          )}
        </>
      )}
    </div>
  );
}
