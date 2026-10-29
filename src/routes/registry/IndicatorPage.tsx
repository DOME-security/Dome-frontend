import { useQuery } from '@tanstack/react-query';
import { m } from '../../i18n';
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
      <h2 id="ledger-heading">{m.indicator.onLedger}</h2>
      <dl className={ui.dl}>
        <dt>{m.indicator.status}</dt>
        <dd>{m.indicator.statusText[indicator.status] ?? m.indicator.unknownStatus}</dd>
        <dt>{m.indicator.kind}</dt>
        <dd>{indicatorKindLabel(indicator.kind)}</dd>
        <dt>{m.indicator.campaign}</dt>
        <dd className={ui.mono}>{indicator.campaign}</dd>
        <dt>{m.indicator.proposed}</dt>
        <dd>{new Date(indicator.proposedAt * 1000).toISOString().slice(0, 10)}</dd>
        <dt>{m.indicator.approvals}</dt>
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
        <dt>{m.indicator.evidenceHash}</dt>
        <dd className={ui.mono}>{indicator.evidence}</dd>
        {indicator.retractedBy && (
          <>
            <dt>{m.indicator.retractedBy}</dt>
            <dd>
              <Account id={indicator.retractedBy} />
            </dd>
            <dt>{m.indicator.reasonHash}</dt>
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
      <title>{m.app.titleSuffix(m.indicator.title)}</title>
      <p>
        <Link to="/registry">{m.indicator.back}</Link>
      </p>
      <h1>{m.indicator.title}</h1>
      <p className={ui.mono}>{hash}</p>
      {isPending && <Loading />}
      {error && <ErrorMessage error={error} />}
      {data && <LedgerCheck check={ledger.check} subject={m.indicator.subject} />}
      {data &&
        (data.known ? (
          <dl className={ui.dl}>
            <dt>{m.indicator.status}</dt>
            <dd>
              <strong>{m.indicator.active}</strong>: {m.indicator.knownBad}
            </dd>
            <dt>{m.indicator.campaign}</dt>
            <dd className={ui.mono}>{data.campaign}</dd>
            <dt>{m.indicator.evidence}</dt>
            <dd>
              <EvidenceLinks urls={data.evidence} />
            </dd>
            <dt>{m.indicator.ledger}</dt>
            <dd>{data.ledger}</dd>
            <dt>{m.indicator.transaction}</dt>
            <dd>
              {tx ? (
                <a href={tx} target="_blank" rel="noreferrer" className={ui.mono}>
                  {data.txHash.slice(0, 16)}…
                </a>
              ) : (
                <span className={ui.muted}>{m.indicator.notAvailable}</span>
              )}
            </dd>
          </dl>
        ) : (
          <div className={ui.card}>
            <p>
              <strong>{m.indicator.notActive}</strong> {m.indicator.notActiveBody}
            </p>
          </div>
        ))}
      {ledger.value && <LedgerRecord indicator={ledger.value} />}
    </div>
  );
}
