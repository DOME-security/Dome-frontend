import { useMutation, useQuery } from '@tanstack/react-query';
import { useId, useState, type FormEvent } from 'react';
import { HashField } from '../../components/HashField';
import { m } from '../../i18n';
import { WalletButton } from '../../components/WalletButton';
import { isSha256 } from '../../lib/api';
import { config, type StellarNetwork } from '../../lib/config';
import {
  contractErrorCode,
  contractErrorMessage,
  contractUrl,
  indicatorKindLabel,
  NETWORK_LABEL,
  txUrl,
} from '../../lib/registry';
import { useServices } from '../../lib/services';
import { networkForPassphrase, PASSPHRASE, stroopsToXlm } from '../../lib/stellar/networks';
import type { CuratorAction, PreparedTransaction, WalletState } from '../../lib/stellar/types';
import ui from '../../styles/ui.module.css';
import styles from './CuratePage.module.css';

const KINDS = ['task', 'font', 'config', 'script', 'package'] as const;
const CAMPAIGN = /^[a-z0-9][a-z0-9-]{0,31}$/;
type ActionType = CuratorAction['type'];

const ACTION_LABEL: Record<ActionType, string> = m.curate.actions;

/** Plain-language description of what one transaction will do. */
export function describeAction(action: CuratorAction): string {
  switch (action.type) {
    case 'propose':
      return m.curate.describe.propose(indicatorKindLabel(action.kind).toLowerCase(), action.campaign);
    case 'approve':
      return m.curate.describe.approve;
    case 'retract':
      return m.curate.describe.retract;
  }
}

function failureMessage(error: unknown): string {
  const code = contractErrorCode(error);
  if (code !== null) return contractErrorMessage(code);
  if (error instanceof Error && /refused|declined|rejected|denied/i.test(error.message)) return m.curate.errors.declined;
  return m.curate.errors.failed;
}

function NetworkSwitch({
  network,
  onChange,
  acknowledged,
  onAcknowledge,
}: {
  network: StellarNetwork;
  onChange: (n: StellarNetwork) => void;
  acknowledged: boolean;
  onAcknowledge: (v: boolean) => void;
}) {
  const ackId = useId();
  const mainnetAvailable = Boolean(config.networks.mainnet) || config.network === 'mainnet';
  return (
    <fieldset className={ui.fieldset}>
      <legend>{m.curate.networkLegend}</legend>
      <div className={styles.radios}>
        {(['testnet', 'mainnet'] as const).map((n) => (
          <label key={n}>
            <input
              type="radio"
              name="network"
              value={n}
              checked={network === n}
              disabled={n === 'mainnet' && !mainnetAvailable}
              onChange={() => onChange(n)}
            />{' '}
            {NETWORK_LABEL[n]}
            {n === 'testnet' && m.curate.defaultSuffix}
          </label>
        ))}
      </div>
      {!mainnetAvailable && <p className={ui.hint}>{m.curate.mainnetNotDeployed}</p>}
      {network === 'mainnet' && (
        <div role="alert" className={ui.warning}>
          <p>
            <strong>{m.curate.mainnetWarning}</strong> {m.curate.mainnetWarningBody}
          </p>
          <label htmlFor={ackId}>
            <input id={ackId} type="checkbox" checked={acknowledged} onChange={(e) => onAcknowledge(e.target.checked)} />{' '}
            {m.curate.mainnetAck}
          </label>
        </div>
      )}
    </fieldset>
  );
}

function Summary({
  prepared,
  onSign,
  onCancel,
  signing,
}: {
  prepared: PreparedTransaction;
  onSign: () => void;
  onCancel: () => void;
  signing: boolean;
}) {
  const { action } = prepared;
  return (
    <section aria-labelledby="summary-heading" className={`${ui.card} ${styles.summary}`}>
      <h2 id="summary-heading">{m.curate.summary.heading}</h2>
      <p>{describeAction(action)}</p>
      <dl className={ui.dl}>
        <dt>{m.curate.summary.action}</dt>
        <dd>{ACTION_LABEL[action.type]}</dd>
        <dt>{m.curate.summary.hash}</dt>
        <dd className={ui.mono}>{action.hash}</dd>
        {action.type === 'propose' && (
          <>
            <dt>{m.curate.summary.kind}</dt>
            <dd>{indicatorKindLabel(action.kind)}</dd>
            <dt>{m.curate.summary.evidence}</dt>
            <dd className={ui.mono}>{action.evidence}</dd>
          </>
        )}
        {action.type === 'retract' && (
          <>
            <dt>{m.curate.summary.reason}</dt>
            <dd className={ui.mono}>{action.reason}</dd>
          </>
        )}
        <dt>{m.curate.summary.network}</dt>
        <dd>{NETWORK_LABEL[prepared.network]}</dd>
        <dt>{m.curate.summary.signer}</dt>
        <dd className={ui.mono}>{prepared.source}</dd>
        <dt>{m.curate.summary.fee}</dt>
        <dd>{m.curate.summary.feeValue(stroopsToXlm(prepared.feeStroops), prepared.network === 'testnet')}</dd>
      </dl>
      <p className={ui.hint}>{m.curate.summary.advice}</p>
      <div className={ui.row}>
        <button type="button" className={ui.button} onClick={onSign} disabled={signing}>
          {signing ? m.curate.waitingForWallet : m.curate.summary.sign}
        </button>
        <button type="button" className={ui.secondary} onClick={onCancel} disabled={signing}>
          {m.curate.summary.cancel}
        </button>
      </div>
    </section>
  );
}

export function CuratePage() {
  const services = useServices();
  const [network, setNetwork] = useState<StellarNetwork>(config.network);
  const [mainnetAck, setMainnetAck] = useState(false);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [type, setType] = useState<ActionType>('propose');
  const [hash, setHash] = useState('');
  const [kind, setKind] = useState<(typeof KINDS)[number]>('task');
  const [campaign, setCampaign] = useState('');
  const [evidence, setEvidence] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<PreparedTransaction | null>(null);
  const [sent, setSent] = useState<{ txHash: string; network: StellarNetwork } | null>(null);
  const campaignId = useId();
  const kindId = useId();

  const net = config.networks[network];
  const walletInfo = useQuery({
    queryKey: ['wallet-info'],
    queryFn: async () => {
      const w = await services.wallet();
      const available = await w.isAvailable();
      if (available) setWallet(await w.current());
      return { name: w.name, available };
    },
    staleTime: Infinity,
  });
  const connect = useMutation({
    mutationFn: async () => (await services.wallet()).connect(),
    onSuccess: setWallet,
  });
  const curator = useQuery({
    queryKey: ['is-curator', network, wallet?.address],
    queryFn: async () => (await services.chain()).isCurator(net!, wallet!.address),
    enabled: Boolean(net && wallet),
  });
  const prepare = useMutation({
    mutationFn: async (action: CuratorAction) => (await services.chain()).prepare(net!, action, wallet!.address),
    onSuccess: (tx) => {
      setPrepared(tx);
      setSent(null);
    },
  });
  const submit = useMutation({
    mutationFn: async (tx: PreparedTransaction) => {
      const w = await services.wallet();
      return tx.submit((xdr) => w.signTransaction(xdr, { networkPassphrase: PASSPHRASE[tx.network], address: tx.source }));
    },
    onSuccess: (result, tx) => {
      setSent({ txHash: result.txHash, network: tx.network });
      setPrepared(null);
    },
  });

  const walletNetwork = wallet ? networkForPassphrase(wallet.networkPassphrase) : null;
  const blocked = !net
    ? m.curate.errors.notConfigured(NETWORK_LABEL[network])
    : network === 'mainnet' && !mainnetAck
      ? m.curate.errors.confirmMainnet
      : !wallet
        ? m.curate.errors.connect
        : walletNetwork !== network
          ? m.curate.errors.switchNetwork
          : curator.data === false
            ? m.curate.errors.notCurator(NETWORK_LABEL[network])
            : null;

  function buildAction(): CuratorAction | string {
    if (!isSha256(hash)) return m.curate.errors.hash;
    if (type === 'approve') return { type, hash };
    if (type === 'retract') return isSha256(reason) ? { type, hash, reason } : m.curate.errors.reason;
    if (!CAMPAIGN.test(campaign)) return m.curate.errors.campaign;
    if (!isSha256(evidence)) return m.curate.errors.evidence;
    return { type, hash, kind, campaign, evidence };
  }

  function onReview(event: FormEvent) {
    event.preventDefault();
    const action = buildAction();
    if (typeof action === 'string') {
      setFormError(action);
      return;
    }
    setFormError(null);
    prepare.mutate(action);
  }

  const contract = net ? contractUrl(net.contractId, network) : null;
  const sentUrl = sent ? txUrl(sent.txHash, sent.network) : null;

  return (
    <div className={ui.page}>
      <title>{m.app.titleSuffix(m.curate.title)}</title>
      <h1>{m.curate.title}</h1>
      <p className={ui.lead}>{m.curate.lead}</p>
      <p className={ui.hint}>
        {m.curate.oneTx}
        {contract && (
          <>
            {' '}
            <a href={contract} target="_blank" rel="noreferrer">
              {m.curate.viewContract}
            </a>
            .
          </>
        )}
      </p>

      <NetworkSwitch
        network={network}
        onChange={(n) => {
          setNetwork(n);
          setPrepared(null);
          setMainnetAck(false);
        }}
        acknowledged={mainnetAck}
        onAcknowledge={setMainnetAck}
      />

      <WalletButton
        walletName={walletInfo.data?.name ?? 'Freighter'}
        available={walletInfo.isError ? false : walletInfo.data?.available}
        state={wallet}
        connecting={connect.isPending}
        expected={network}
        onConnect={() => connect.mutate()}
      />
      {connect.isError && (
        <p role="alert" className={ui.warning}>
          {m.curate.connectFailed(walletInfo.data?.name ?? 'Freighter')}
        </p>
      )}

      {sent && (
        <div role="status" className={`${ui.card} ${styles.sent}`}>
          <p>
            <strong>{m.curate.sent}</strong> {m.curate.sentOn(NETWORK_LABEL[sent.network])}{' '}
            {sentUrl && (
              <a href={sentUrl} target="_blank" rel="noreferrer">
                {m.curate.viewSent}
              </a>
            )}
          </p>
        </div>
      )}

      {prepared ? (
        <Summary
          prepared={prepared}
          signing={submit.isPending}
          onSign={() => submit.mutate(prepared)}
          onCancel={() => {
            setPrepared(null);
            submit.reset();
          }}
        />
      ) : (
        <form onSubmit={onReview} noValidate className={ui.stack}>
          <fieldset className={ui.fieldset}>
            <legend>{m.curate.actionLegend}</legend>
            <div className={styles.radios}>
              {(Object.keys(ACTION_LABEL) as ActionType[]).map((t) => (
                <label key={t}>
                  <input type="radio" name="action" value={t} checked={type === t} onChange={() => setType(t)} />{' '}
                  {ACTION_LABEL[t]}
                </label>
              ))}
            </div>
          </fieldset>

          <HashField label={m.curate.fileHash} hint={m.curate.fileHashHint} value={hash} onChange={setHash} />

          {type === 'propose' && (
            <>
              <div>
                <label htmlFor={kindId} className={ui.label}>
                  {m.curate.kind}
                </label>
                <select id={kindId} className={ui.input} value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {indicatorKindLabel(k)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={campaignId} className={ui.label}>
                  {m.curate.campaign}
                </label>
                <input
                  id={campaignId}
                  className={`${ui.input} ${ui.mono}`}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="unknown"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value.trim().toLowerCase())}
                />
                <p className={ui.hint}>{m.curate.campaignHint}</p>
              </div>
              <HashField label={m.curate.evidenceHash} hint={m.curate.evidenceHint} value={evidence} onChange={setEvidence} />
            </>
          )}

          {type === 'retract' && (
            <HashField label={m.curate.reasonHash} hint={m.curate.reasonHint} value={reason} onChange={setReason} />
          )}

          {(formError || blocked) && (
            <p role="alert" className={ui.warning}>
              {formError ?? blocked}
            </p>
          )}
          {prepare.isError && (
            <p role="alert" className={ui.warning}>
              {failureMessage(prepare.error)}
            </p>
          )}

          <div>
            <button type="submit" className={ui.button} disabled={Boolean(blocked) || prepare.isPending}>
              {prepare.isPending ? m.curate.preparing : m.curate.review}
            </button>
          </div>
        </form>
      )}
      {submit.isError && (
        <p role="alert" className={ui.warning}>
          {failureMessage(submit.error)}
        </p>
      )}
    </div>
  );
}
