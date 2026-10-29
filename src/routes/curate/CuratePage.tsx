import { useMutation, useQuery } from '@tanstack/react-query';
import { useId, useState, type FormEvent } from 'react';
import { HashField } from '../../components/HashField';
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

const ACTION_LABEL: Record<ActionType, string> = {
  propose: 'Propose an indicator',
  approve: 'Approve an indicator',
  retract: 'Retract an indicator',
};

/** Plain-language description of what one transaction will do. */
export function describeAction(action: CuratorAction): string {
  switch (action.type) {
    case 'propose':
      return `Propose a new known-bad file (${indicatorKindLabel(action.kind).toLowerCase()}, campaign "${action.campaign}"). Your proposal counts as the first approval; it becomes active only after other curators approve it.`;
    case 'approve':
      return 'Approve this indicator. It becomes active, and is treated as known bad, once enough curators have approved it.';
    case 'retract':
      return 'Retract this indicator. It stops being treated as known bad but stays visible on the ledger as retracted, with your reason hash.';
  }
}

function failureMessage(error: unknown): string {
  const code = contractErrorCode(error);
  if (code !== null) return contractErrorMessage(code);
  if (error instanceof Error && /refused|declined|rejected|denied/i.test(error.message)) {
    return 'The wallet did not sign. Nothing was sent.';
  }
  return 'The transaction could not be prepared or sent. Nothing was charged unless a transaction hash is shown.';
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
      <legend>Network</legend>
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
            {n === 'testnet' && ' (default)'}
          </label>
        ))}
      </div>
      {!mainnetAvailable && (
        <p className={ui.hint}>The mainnet registry is not deployed yet; it waits for an independent review.</p>
      )}
      {network === 'mainnet' && (
        <div role="alert" className={ui.warning}>
          <p>
            <strong>Mainnet transactions are real and permanent.</strong> They cost real XLM and every curator action is public
            forever. Practise on testnet first.
          </p>
          <label htmlFor={ackId}>
            <input id={ackId} type="checkbox" checked={acknowledged} onChange={(e) => onAcknowledge(e.target.checked)} /> I
            understand and want to act on mainnet
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
      <h2 id="summary-heading">Check before you sign</h2>
      <p>{describeAction(action)}</p>
      <dl className={ui.dl}>
        <dt>Action</dt>
        <dd>{ACTION_LABEL[action.type]}</dd>
        <dt>Indicator hash</dt>
        <dd className={ui.mono}>{action.hash}</dd>
        {action.type === 'propose' && (
          <>
            <dt>Kind</dt>
            <dd>{indicatorKindLabel(action.kind)}</dd>
            <dt>Evidence hash</dt>
            <dd className={ui.mono}>{action.evidence}</dd>
          </>
        )}
        {action.type === 'retract' && (
          <>
            <dt>Reason hash</dt>
            <dd className={ui.mono}>{action.reason}</dd>
          </>
        )}
        <dt>Network</dt>
        <dd>{NETWORK_LABEL[prepared.network]}</dd>
        <dt>Signed by</dt>
        <dd className={ui.mono}>{prepared.source}</dd>
        <dt>Maximum fee</dt>
        <dd>
          {stroopsToXlm(prepared.feeStroops)} XLM{prepared.network === 'testnet' ? ' (testnet XLM, no real value)' : ''}
        </dd>
      </dl>
      <p className={ui.hint}>
        Your wallet will show the same transaction. Sign only if both match. Dome never asks for your secret key or recovery
        phrase.
      </p>
      <div className={ui.row}>
        <button type="button" className={ui.button} onClick={onSign} disabled={signing}>
          {signing ? 'Waiting for the wallet…' : 'Sign and send'}
        </button>
        <button type="button" className={ui.secondary} onClick={onCancel} disabled={signing}>
          Cancel
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
    ? `The registry is not configured for ${NETWORK_LABEL[network]} in this build.`
    : network === 'mainnet' && !mainnetAck
      ? 'Confirm that you want to act on mainnet first.'
      : !wallet
        ? 'Connect your wallet first.'
        : walletNetwork !== network
          ? 'Switch your wallet to the same network first.'
          : curator.data === false
            ? `This account is not a curator on ${NETWORK_LABEL[network]}. The registry would reject the transaction.`
            : null;

  function buildAction(): CuratorAction | string {
    if (!isSha256(hash)) return 'Enter the SHA-256 fingerprint of the file.';
    if (type === 'approve') return { type, hash };
    if (type === 'retract')
      return isSha256(reason) ? { type, hash, reason } : 'Enter the SHA-256 of the published retraction notice.';
    if (!CAMPAIGN.test(campaign)) return 'Campaign labels are 1–32 characters: lowercase letters, digits and hyphens.';
    if (!isSha256(evidence)) return 'Enter the SHA-256 of the published advisory or write-up.';
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
      <title>Curator console · Dome</title>
      <h1>Curator console</h1>
      <p className={ui.lead}>
        Curators add fingerprints of confirmed malicious files to the Dome Registry. An indicator only becomes active after
        several curators approve it, so one mistaken or stolen key cannot add a file on its own.
      </p>
      <p className={ui.hint}>
        Each button builds exactly one transaction and shows you what it does before your wallet asks you to sign. Dome never asks
        for, sees or stores your secret key.
        {contract && (
          <>
            {' '}
            <a href={contract} target="_blank" rel="noreferrer">
              View the registry contract
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
          The wallet did not connect. Open {walletInfo.data?.name ?? 'Freighter'}, unlock it and try again.
        </p>
      )}

      {sent && (
        <div role="status" className={`${ui.card} ${styles.sent}`}>
          <p>
            <strong>Sent.</strong> The transaction is on {NETWORK_LABEL[sent.network]}.{' '}
            {sentUrl && (
              <a href={sentUrl} target="_blank" rel="noreferrer">
                View it on stellar.expert
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
            <legend>Action</legend>
            <div className={styles.radios}>
              {(Object.keys(ACTION_LABEL) as ActionType[]).map((t) => (
                <label key={t}>
                  <input type="radio" name="action" value={t} checked={type === t} onChange={() => setType(t)} />{' '}
                  {ACTION_LABEL[t]}
                </label>
              ))}
            </div>
          </fieldset>

          <HashField
            label="File fingerprint (SHA-256)"
            hint="The fingerprint of the malicious file."
            value={hash}
            onChange={setHash}
          />

          {type === 'propose' && (
            <>
              <div>
                <label htmlFor={kindId} className={ui.label}>
                  Kind of file
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
                  Campaign label
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
                <p className={ui.hint}>Lowercase, e.g. polinrider or unknown. Labels describe attacks, never people.</p>
              </div>
              <HashField
                label="Evidence hash (SHA-256)"
                hint="Publish the advisory or write-up first, then use the SHA-256 of that document."
                value={evidence}
                onChange={setEvidence}
              />
            </>
          )}

          {type === 'retract' && (
            <HashField
              label="Reason hash (SHA-256)"
              hint="Publish a short retraction notice first, then use the SHA-256 of that notice."
              value={reason}
              onChange={setReason}
            />
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
              {prepare.isPending ? 'Preparing…' : 'Review transaction'}
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
