import { useInfiniteQuery } from '@tanstack/react-query';
import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ErrorMessage, Loading } from '../../components/Status';
import { api, isSha256 } from '../../lib/api';
import { config } from '../../lib/config';
import { contractUrl, indicatorKindLabel, NETWORK_LABEL, shortKey } from '../../lib/registry';
import ui from '../../styles/ui.module.css';

export const PAGE_SIZE = 100;

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

  return (
    <div className={ui.wide}>
      <title>Registry · Dome</title>
      <div className={ui.page}>
        <h1>Dome Registry</h1>
        <p className={ui.lead}>
          Fingerprints of files confirmed as malicious. Each one was approved by several independent curators and recorded on{' '}
          {NETWORK_LABEL[config.network]}, so anyone can check it without trusting Dome.
        </p>
        {contract && (
          <p className={ui.hint}>
            Contract{' '}
            <a href={contract} target="_blank" rel="noreferrer" className={ui.mono} title={config.registryContractId}>
              {shortKey(config.registryContractId, 6)}
            </a>
          </p>
        )}
      </div>

      {query.isPending && <Loading label="Loading indicators…" />}
      {query.error && <ErrorMessage error={query.error} />}

      {query.isSuccess && (
        <>
          <div className={ui.row}>
            <div>
              <label htmlFor={campaignId} className={ui.label}>
                Campaign
              </label>
              <select id={campaignId} className={ui.input} value={campaign} onChange={(e) => setCampaign(e.target.value)}>
                <option value="">All campaigns ({indicators.length})</option>
                {campaigns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {shown.length === 0 ? (
            <p>No active indicators yet.</p>
          ) : (
            <div className={ui.tableWrap}>
              <table className={ui.table}>
                <caption className="visually-hidden">Active indicators</caption>
                <thead>
                  <tr>
                    <th scope="col">Kind</th>
                    <th scope="col">Fingerprint or name</th>
                    <th scope="col">Campaign</th>
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
                {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            </p>
          )}
        </>
      )}

      <p className={ui.hint}>
        Proposed and retracted indicators, approvals and on-chain verification of this list are planned; see the roadmap.
      </p>
    </div>
  );
}
