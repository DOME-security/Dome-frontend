import { useInfiniteQuery } from '@tanstack/react-query';
import { m } from '../../i18n';
import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { LedgerCheck } from '../../components/LedgerCheck';
import { ErrorMessage, Loading } from '../../components/Status';
import { api, isSha256 } from '../../lib/api';
import { config } from '../../lib/config';
import { contractUrl, indicatorKindLabel, NETWORK_LABEL, shortKey } from '../../lib/registry';
import { compareKnownBad } from '../../lib/stellar/spotcheck';
import { useLedgerCheck } from '../../lib/stellar/useLedgerCheck';
import ui from '../../styles/ui.module.css';

export const PAGE_SIZE = 100;
/** How many listed fingerprints are re-checked on the ledger with `is_known_bad`. */
export const SPOT_CHECK_SIZE = 5;

export function RegistryPage() {
  const [campaign, setCampaign] = useState('');
  const campaignId = useId();
  const query = useInfiniteQuery({
    queryKey: ['indicators'],
    queryFn: ({ pageParam }) => api.listIndicators({ limit: PAGE_SIZE, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const indicators = useMemo(() => query.data?.pages.flatMap((p) => p.indicators) ?? [], [query.data]);
  const campaigns = useMemo(() => [...new Set(indicators.map((i) => i.campaign))].sort(), [indicators]);
  const shown = campaign ? indicators.filter((i) => i.campaign === campaign) : indicators;
  const contract = contractUrl(config.registryContractId);
  const sample = indicators
    .filter((i) => i.kind === 'hash' && isSha256(i.value))
    .slice(0, SPOT_CHECK_SIZE)
    .map((i) => i.value);
  const ledger = useLedgerCheck(
    ['known-bad', ...sample],
    (chain, net) => Promise.all(sample.map(async (hash) => ({ hash, knownBad: await chain.isKnownBad(net, hash) }))),
    compareKnownBad,
    sample.length > 0,
  );

  return (
    <div className={ui.wide}>
      <title>{m.app.titleSuffix(m.app.nav.registry)}</title>
      <div className={ui.page}>
        <h1>{m.registry.title}</h1>
        <p className={ui.lead}>{m.registry.lead(NETWORK_LABEL[config.network])}</p>
        {contract && (
          <p className={ui.hint}>
            {m.registry.contract}{' '}
            <a href={contract} target="_blank" rel="noreferrer" className={ui.mono} title={config.registryContractId}>
              {shortKey(config.registryContractId, 6)}
            </a>
          </p>
        )}
      </div>

      {query.isPending && <Loading label={m.registry.loading} />}
      {query.error && <ErrorMessage error={query.error} />}

      {query.isSuccess && (
        <>
          {sample.length > 0 && <LedgerCheck check={ledger.check} subject={m.registry.sample(sample.length)} />}
          <div className={ui.row}>
            <div>
              <label htmlFor={campaignId} className={ui.label}>
                {m.registry.campaignLabel}
              </label>
              <select id={campaignId} className={ui.input} value={campaign} onChange={(e) => setCampaign(e.target.value)}>
                <option value="">{m.registry.allCampaigns(indicators.length)}</option>
                {campaigns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {shown.length === 0 ? (
            <p>{m.registry.empty}</p>
          ) : (
            <div className={ui.tableWrap}>
              <table className={ui.table}>
                <caption className="visually-hidden">{m.registry.caption}</caption>
                <thead>
                  <tr>
                    <th scope="col">{m.registry.columns.kind}</th>
                    <th scope="col">{m.registry.columns.value}</th>
                    <th scope="col">{m.registry.columns.campaign}</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((indicator) => (
                    <tr key={`${indicator.kind}:${indicator.value}`}>
                      <td>{indicatorKindLabel(indicator.kind)}</td>
                      <td className={ui.mono}>
                        {isSha256(indicator.value) ? (
                          <Link to={`/registry/indicator/${indicator.value}`} title={indicator.value}>
                            {shortKey(indicator.value, 10)}
                          </Link>
                        ) : (
                          indicator.value
                        )}
                      </td>
                      <td className={ui.mono}>{indicator.campaign}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {query.hasNextPage && (
            <p>
              <button
                type="button"
                className={ui.secondary}
                onClick={() => query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
              >
                {query.isFetchingNextPage ? m.app.loading : m.registry.loadMore}
              </button>
            </p>
          )}
        </>
      )}

      <p className={ui.hint}>{m.registry.footnote}</p>
    </div>
  );
}
