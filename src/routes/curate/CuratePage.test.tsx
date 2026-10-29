import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PASSPHRASE } from '../../lib/stellar/networks';
import type { CuratorAction, PreparedTransaction } from '../../lib/stellar/types';
import { renderRoute } from '../../test/render';
import { fakeChain, fakeWallet, setFakes } from '../../test/services';

const ADDRESS = `G${'Q'.repeat(55)}`;
const HASH = '5b5daf85854470843ec093937f0b47ee52c2260cff3c6e6f65c6c1ae521785dc';
const EVIDENCE = 'e'.repeat(64);

function setup({
  walletNetwork = PASSPHRASE.testnet,
  curator = true,
  prepareError,
}: { walletNetwork?: string; curator?: boolean; prepareError?: Error } = {}) {
  const signTransaction = vi.fn(() => Promise.resolve({ signedTxXdr: 'SIGNED', signerAddress: ADDRESS }));
  const submit = vi.fn(async (sign: PreparedTransaction['submit'] extends (s: infer S) => unknown ? S : never) => {
    await sign('UNSIGNED_XDR');
    return { txHash: '9'.repeat(64) };
  });
  const prepare = vi.fn((_net, action: CuratorAction, source: string) =>
    prepareError
      ? Promise.reject(prepareError)
      : Promise.resolve({ action, network: 'testnet' as const, source, feeStroops: '154321', submit }),
  );
  const wallet = fakeWallet({
    isAvailable: () => Promise.resolve(true),
    connect: vi.fn(() => Promise.resolve({ address: ADDRESS, networkPassphrase: walletNetwork })),
    signTransaction,
  });
  setFakes({ wallet, chain: fakeChain({ prepare, isCurator: () => Promise.resolve(curator) }) });
  return { prepare, submit, signTransaction, wallet };
}

async function connect(user: ReturnType<typeof renderRoute>['user']) {
  await user.click(await screen.findByRole('button', { name: 'Connect Test wallet' }));
  await screen.findByText('Account');
}

describe('/curate', () => {
  it('explains how to get a wallet when none is installed', async () => {
    renderRoute('/curate');
    expect(await screen.findByText(/is not installed in this browser/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review transaction' })).toBeDisabled();
  });

  it('defaults to testnet and keeps mainnet off when it is not configured', async () => {
    renderRoute('/curate');
    expect(await screen.findByRole('radio', { name: /Stellar testnet/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Stellar mainnet/ })).toBeDisabled();
    expect(screen.getByText(/mainnet registry is not deployed yet/)).toBeInTheDocument();
  });

  it('shows the connected address and network, and warns about a network mismatch', async () => {
    setup({ walletNetwork: PASSPHRASE.mainnet });
    const { user } = renderRoute('/curate');
    await connect(user);
    expect(screen.getByTitle(ADDRESS)).toHaveTextContent('GQQQQQ…QQQQQQ');
    expect(screen.getByText('Stellar mainnet', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent(/Your wallet is set to Stellar mainnet/);
    expect(screen.getByRole('button', { name: 'Review transaction' })).toBeDisabled();
  });

  it('blocks accounts that are not curators', async () => {
    setup({ curator: false });
    const { user } = renderRoute('/curate');
    await connect(user);
    expect(await screen.findByText(/is not a curator on Stellar testnet/)).toBeInTheDocument();
  });

  it('validates input, summarises one transaction, and signs only after confirmation', async () => {
    const { prepare, submit, signTransaction } = setup();
    const { user } = renderRoute('/curate');
    await connect(user);

    await user.click(screen.getByRole('button', { name: 'Review transaction' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter the SHA-256 fingerprint of the file.');

    await user.type(screen.getByLabelText('File fingerprint (SHA-256)'), HASH);
    await user.selectOptions(screen.getByLabelText('Kind of file'), 'font');
    await user.type(screen.getByLabelText('Campaign label'), 'Demo');
    await user.type(screen.getByLabelText('Evidence hash (SHA-256)'), EVIDENCE);
    await user.click(screen.getByRole('button', { name: 'Review transaction' }));

    const summary = await screen.findByRole('region', { name: 'Check before you sign' });
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(prepare).toHaveBeenCalledWith(
      expect.objectContaining({ network: 'testnet' }),
      { type: 'propose', hash: HASH, kind: 'font', campaign: 'demo', evidence: EVIDENCE },
      ADDRESS,
    );
    expect(within(summary).getByText('Propose an indicator')).toBeInTheDocument();
    expect(within(summary).getByText(HASH)).toBeInTheDocument();
    expect(within(summary).getByText('Stellar testnet')).toBeInTheDocument();
    expect(within(summary).getByText('0.0154321 XLM (testnet XLM, no real value)')).toBeInTheDocument();
    expect(signTransaction).not.toHaveBeenCalled();

    await user.click(within(summary).getByRole('button', { name: 'Sign and send' }));
    expect(await screen.findByText(/The transaction is on Stellar testnet/)).toBeInTheDocument();
    expect(submit).toHaveBeenCalledTimes(1);
    expect(signTransaction).toHaveBeenCalledWith('UNSIGNED_XDR', { networkPassphrase: PASSPHRASE.testnet, address: ADDRESS });
    expect(screen.getByRole('link', { name: 'View it on stellar.expert' })).toHaveAttribute(
      'href',
      expect.stringContaining('/testnet/tx/9999'),
    );
  });

  it('cancels without signing', async () => {
    const { signTransaction } = setup();
    const { user } = renderRoute('/curate');
    await connect(user);
    await user.click(screen.getByRole('radio', { name: 'Approve an indicator' }));
    await user.type(screen.getByLabelText('File fingerprint (SHA-256)'), HASH);
    await user.click(screen.getByRole('button', { name: 'Review transaction' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Review transaction' })).toBeInTheDocument();
    expect(signTransaction).not.toHaveBeenCalled();
  });

  it('explains contract errors in plain language', async () => {
    setup({ prepareError: new Error('HostError: Error(Contract, #13)') });
    const { user } = renderRoute('/curate');
    await connect(user);
    await user.click(screen.getByRole('radio', { name: 'Approve an indicator' }));
    await user.type(screen.getByLabelText('File fingerprint (SHA-256)'), HASH);
    await user.click(screen.getByRole('button', { name: 'Review transaction' }));
    expect(await screen.findByText('You have already approved this indicator.')).toBeInTheDocument();
  });

  it('says nothing was sent when the wallet declines', async () => {
    const { signTransaction } = setup();
    signTransaction.mockRejectedValueOnce(new Error('Freighter refused the request.'));
    const { user } = renderRoute('/curate');
    await connect(user);
    await user.click(screen.getByRole('radio', { name: 'Retract an indicator' }));
    await user.type(screen.getByLabelText('File fingerprint (SHA-256)'), HASH);
    await user.type(screen.getByLabelText('Reason hash (SHA-256)'), EVIDENCE);
    await user.click(screen.getByRole('button', { name: 'Review transaction' }));
    await user.click(await screen.findByRole('button', { name: 'Sign and send' }));
    expect(await screen.findByText('The wallet did not sign. Nothing was sent.')).toBeInTheDocument();
  });
});
