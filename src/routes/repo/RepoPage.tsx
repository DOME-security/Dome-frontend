import { useQuery } from '@tanstack/react-query';
import { m } from '../../i18n';
import { Link, useParams } from 'react-router';
import { LedgerCheck } from '../../components/LedgerCheck';
import { ReportView } from '../../components/ReportView';
import { ErrorMessage, Loading } from '../../components/Status';
import { api, ApiError } from '../../lib/api';
import { isValidOwner, isValidRepo } from '../../lib/github';
import { accountUrl, shortKey, txUrl, verifyReportHash, type ReportCheck } from '../../lib/registry';
import { VERDICT_TEXT } from '../../lib/rules';
import type { OnChainAttestation, Scan, Verdict } from '../../lib/types';
import { compareAttestation } from '../../lib/stellar/spotcheck';
import { useLedgerCheck } from '../../lib/stellar/useLedgerCheck';
import ui from '../../styles/ui.module.css';
import { NotFoundPage } from '../not-found/NotFoundPage';

const CHECK_TEXT: Record<ReportCheck, string> = m.repo.check;

function verdictLabel(verdict: string): string {
  return Object.hasOwn(VERDICT_TEXT, verdict) ? VERDICT_TEXT[verdict as Verdict].label : m.verdict.unreadable;
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
      <h2 id="attestation-heading">{m.repo.attestationHeading}</h2>
      <dl className={ui.dl}>
        <dt>{m.repo.verdict}</dt>
        <dd>{verdictLabel(attestation.verdict)}</dd>
        <dt>{m.repo.commit}</dt>
        <dd className={ui.mono}>{attestation.commit.slice(0, 12)}</dd>
        <dt>{m.repo.attester}</dt>
        <dd className={ui.mono}>
          {attester ? (
            <a href={attester} target="_blank" rel="noreferrer" title={attestation.attester}>
              {shortKey(attestation.attester)}
            </a>
          ) : (
            shortKey(attestation.attester)
          )}
        </dd>
        <dt>{m.repo.recorded}</dt>
        <dd>
          {m.checkFile.ledger(attestation.ledger)}
          {tx && (
            <>
              {' · '}
              <a href={tx} target="_blank" rel="noreferrer">
                {m.checkFile.viewTx}
              </a>
            </>
          )}
        </dd>
        <dt>{m.repo.reportHash}</dt>
        <dd className={ui.mono}>{attestation.reportHash}</dd>
      </dl>
      {sameCommit ? check && <p role="status">{CHECK_TEXT[check]}</p> : <p className={ui.hint}>{m.repo.otherCommit}</p>}
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
  const ledger = useLedgerCheck(
    ['attestation', owner.toLowerCase(), repo.toLowerCase()],
    (chain, net) => chain.latestAttestation(net, owner, repo),
    (chainValue) => compareAttestation(data?.attestation ?? null, chainValue),
    valid && Boolean(data),
  );

  if (!valid) return <NotFoundPage />;

  // The API answers 200 with both fields null for a repository it has never seen.
  const notScanned = (error instanceof ApiError && error.status === 404) || (data && !data.latestScan && !data.attestation);
  return (
    <div className={ui.wide}>
      <title>{`${owner}/${repo} · Dome`}</title>
      <h1 className={ui.mono}>
        {owner}/{repo}
      </h1>
      <p>
        <a href={`https://github.com/${owner}/${repo}`} target="_blank" rel="noreferrer">
          {m.repo.viewOnGitHub}
        </a>
      </p>
      {isPending && <Loading />}
      {notScanned && (
        <div className={ui.card}>
          <p>{m.repo.notScanned}</p>
          <Link to="/check/repo" className={ui.button}>
            {m.repo.checkNow}
          </Link>
        </div>
      )}
      {error && !notScanned && <ErrorMessage error={error} />}
      {data && (data.attestation || ledger.check.state === 'mismatch') && (
        <LedgerCheck check={ledger.check} subject={m.repo.subject} />
      )}
      {data && !notScanned && (
        <>
          {data.attestation ? (
            <Attestation attestation={data.attestation} scan={data.latestScan} />
          ) : (
            <p className={ui.muted}>{m.repo.noAttestation}</p>
          )}
          <h2>{m.repo.latestScan}</h2>
          {data.latestScan?.status === 'done' && data.latestScan.report ? (
            <ReportView report={data.latestScan.report} repository={data.latestScan.repository} commit={data.latestScan.commit} />
          ) : (
            <p>
              {m.repo.noFinishedScan} <Link to="/check/repo">{m.repo.startOne}</Link>.
            </p>
          )}
        </>
      )}
    </div>
  );
}
