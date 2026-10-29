import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { EvidenceLinks } from '../../components/ExternalLinks';
import { LedgerCheck } from '../../components/LedgerCheck';
import { ErrorMessage, Loading } from '../../components/Status';
import { api, isSha256 } from '../../lib/api';
import { accountUrl, indicatorKindLabel, shortKey, txUrl } from '../../lib/registry';
import { compareIndicator, type ChainIndicator } from '../../lib/stellar/spotcheck';
import { useLedgerCheck } from '../../lib/stellar/useLedgerCheck';
import ui from '../../styles/ui.module.css';
import { NotFoundPage } from '../not-found/NotFoundPage';

const STATUS_TEXT: Record<string, string> = {
  proposed: 'Proposed: waiting for more curator approvals. Not yet treated as known bad.',
  active: 'Active: approved by enough curators. Treated as known bad.',
  retracted: 'Retracted: a curator withdrew it. Kept visible so the mistake stays on record.',
};

function Account({ id }: { id: string }) {
  const href = accountUrl(id);
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={ui.mono} title={id}>
      {shortKey(id)}
    </a>
  ) : (
    <span className={ui.mono}>{shortKey(id)}</span>
  );
}

function LedgerRecord({ indicator }: { indicator: ChainIndicator }) {
  return (
    <section aria-labelledby="ledger-heading">
      <h2 id="ledger-heading">On the ledger</h2>
      <dl className={ui.dl}>
        <dt>Status</dt>
        <dd>{STATUS_TEXT[indicator.status] ?? 'Unknown status'}</dd>
        <dt>Kind</dt>
        <dd>{indicatorKindLabel(indicator.kind)}</dd>
        <dt>Campaign</dt>
        <dd className={ui.mono}>{indicator.campaign}</dd>
        <dt>Proposed</dt>
        <dd>{new Date(indicator.proposedAt * 1000).toISOString().slice(0, 10)}</dd>
        <dt>Approvals</dt>
        <dd>
          {indicator.approvals.length}
          <ol>
            {indicator.approvals.map((a) => (
              <li key={a}>
                <Account id={a} />
              </li>
            ))}
          </ol>
        </dd>
        <dt>Evidence hash</dt>
        <dd className={ui.mono}>{indicator.evidence}</dd>
        {indicator.retractedBy && (
          <>
            <dt>Retracted by</dt>
            <dd>
              <Account id={indicator.retractedBy} />
            </dd>
            <dt>Reason hash</dt>
            <dd className={ui.mono}>{indicator.retractReason}</dd>
          </>
        )}
      </dl>
    </section>
  );
}

export function IndicatorPage() {
  const hash = (useParams().hash ?? '').toLowerCase();
  const valid = isSha256(hash);
  const { data, error, isPending } = useQuery({
    queryKey: ['indicator', hash],
    queryFn: () => api.getIndicator(hash),
    enabled: valid,
  });
  const ledger = useLedgerCheck(
    ['indicator', hash],
    (chain, net) => chain.indicator(net, hash),
    (chainValue) => compareIndicator(data!, chainValue),
    valid && Boolean(data),
  );

  if (!valid) return <NotFoundPage />;

  const tx = data?.known ? txUrl(data.txHash) : null;
  return (
    <div className={ui.page}>
      <title>Indicator · Dome</title>
      <p>
        <Link to="/registry">← Registry</Link>
      </p>
      <h1>Indicator</h1>
      <p className={ui.mono}>{hash}</p>
      {isPending && <Loading />}
      {error && <ErrorMessage error={error} />}
      {data && <LedgerCheck check={ledger.check} subject="this indicator" />}
      {data &&
        (data.known ? (
          <dl className={ui.dl}>
            <dt>Status</dt>
            <dd>
              <strong>Active</strong>: known bad
            </dd>
            <dt>Campaign</dt>
            <dd className={ui.mono}>{data.campaign}</dd>
            <dt>Evidence</dt>
            <dd>
              <EvidenceLinks urls={data.evidence} />
            </dd>
            <dt>Ledger</dt>
            <dd>{data.ledger}</dd>
            <dt>Transaction</dt>
            <dd>
              {tx ? (
                <a href={tx} target="_blank" rel="noreferrer" className={ui.mono}>
                  {data.txHash.slice(0, 16)}…
                </a>
              ) : (
                <span className={ui.muted}>Not available</span>
              )}
            </dd>
          </dl>
        ) : (
          <div className={ui.card}>
            <p>
              <strong>Not an active indicator.</strong> No active entry in the Dome Registry has this fingerprint. It may never
              have been proposed, may still be waiting for approvals, or may have been retracted.
            </p>
          </div>
        ))}
      {ledger.value && <LedgerRecord indicator={ledger.value} />}
    </div>
  );
}
