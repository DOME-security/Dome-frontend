import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { EvidenceLinks } from '../../components/ExternalLinks';
import { ErrorMessage, Loading } from '../../components/Status';
import { api, isSha256 } from '../../lib/api';
import { txUrl } from '../../lib/registry';
import ui from '../../styles/ui.module.css';
import { NotFoundPage } from '../not-found/NotFoundPage';

export function IndicatorPage() {
  const hash = (useParams().hash ?? '').toLowerCase();
  const valid = isSha256(hash);
  const { data, error, isPending } = useQuery({
    queryKey: ['indicator', hash],
    queryFn: () => api.getIndicator(hash),
    enabled: valid,
  });

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
      <p className={ui.hint}>Approvals, proposal history and retractions for each indicator are planned; see the roadmap.</p>
    </div>
  );
}
