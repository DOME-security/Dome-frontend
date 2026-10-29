import { useQuery } from '@tanstack/react-query';
import { m } from '../../i18n';
import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { EvidenceLinks } from '../../components/ExternalLinks';
import { FileDropzone } from '../../components/FileDropzone';
import { ErrorMessage, Loading } from '../../components/Status';
import { VerdictBanner } from '../../components/VerdictBanner';
import { api, isSha256 } from '../../lib/api';
import { hashFile, MAX_HASH_MB } from '../../lib/hash';
import { txUrl } from '../../lib/registry';
import { HONESTY_NOTICE } from '../../lib/rules';
import ui from '../../styles/ui.module.css';

interface Target {
  sha256: string;
  file?: { name: string; size: number };
}

function LookupResult({ target }: { target: Target }) {
  const { data, error, isPending } = useQuery({
    queryKey: ['indicator', target.sha256],
    queryFn: () => api.getIndicator(target.sha256),
  });
  if (isPending) return <Loading label={m.checkFile.lookingUp} />;
  if (error) return <ErrorMessage error={error} />;

  const tx = data.known ? txUrl(data.txHash) : null;
  return (
    <section aria-label={m.checkFile.resultLabel}>
      {data.known ? (
        <>
          <VerdictBanner verdict="block" />
          <p>
            <strong>{m.checkFile.knownBad}</strong> {m.checkFile.knownBadAdvice}{' '}
            <Link to="/guides/infected">{m.home.more[0]!.link}</Link>.
          </p>
          <dl className={ui.dl}>
            <dt>{m.checkFile.campaign}</dt>
            <dd className={ui.mono}>{data.campaign}</dd>
            <dt>{m.checkFile.evidence}</dt>
            <dd>
              <EvidenceLinks urls={data.evidence} />
            </dd>
            <dt>{m.checkFile.recorded}</dt>
            <dd>
              {m.checkFile.ledger(data.ledger)}
              {tx && (
                <>
                  {' · '}
                  <a href={tx} target="_blank" rel="noreferrer">
                    {m.checkFile.viewTx}
                  </a>
                </>
              )}
            </dd>
          </dl>
          <p>
            <Link to={`/registry/indicator/${target.sha256}`}>{m.checkFile.details}</Link>
          </p>
        </>
      ) : (
        <div className={ui.card}>
          <h2>{m.checkFile.notListed}</h2>
          <p>{m.checkFile.notListedBody}</p>
          <p>
            <Link to="/check/repo">{m.checkFile.checkRepo}</Link>
          </p>
        </div>
      )}
      <p>
        <em>
          <strong>{HONESTY_NOTICE}</strong>
        </em>
      </p>
    </section>
  );
}

export function CheckFilePage() {
  const [target, setTarget] = useState<Target | null>(null);
  const [hashing, setHashing] = useState(false);
  const [hashError, setHashError] = useState<unknown>(null);
  const [pasted, setPasted] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const hashInputId = useId();

  async function onFile(file: File) {
    setHashing(true);
    setHashError(null);
    setTarget(null);
    try {
      const sha256 = await hashFile(file);
      setTarget({ sha256, file: { name: file.name, size: file.size } });
    } catch (error) {
      setHashError(error);
    } finally {
      setHashing(false);
    }
  }

  function onPaste(event: FormEvent) {
    event.preventDefault();
    const value = pasted.trim().toLowerCase();
    if (!isSha256(value)) {
      setPasteError(m.checkFile.invalidHash);
      return;
    }
    setPasteError(null);
    setHashError(null);
    setTarget({ sha256: value });
  }

  return (
    <div className={ui.page}>
      <title>{m.app.titleSuffix(m.checkFile.title)}</title>
      <h1>{m.checkFile.title}</h1>
      <p className={ui.lead}>
        {m.checkFile.leadBefore}
        <code>tasks.json</code>
        {m.checkFile.leadAfter}
      </p>

      <FileDropzone onFile={onFile} disabled={hashing} maxMb={MAX_HASH_MB} />
      {hashing && <Loading label={m.checkFile.hashing} />}
      {hashError !== null && <ErrorMessage error={hashError} />}

      <details>
        <summary>{m.checkFile.havePasted}</summary>
        <form onSubmit={onPaste} noValidate className={ui.row}>
          <div className={ui.grow}>
            <label htmlFor={hashInputId} className={ui.label}>
              {m.checkFile.hashLabel}
            </label>
            <input
              id={hashInputId}
              className={`${ui.input} ${ui.mono}`}
              autoComplete="off"
              spellCheck={false}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
            />
          </div>
          <button type="submit" className={ui.secondary}>
            {m.checkFile.lookUp}
          </button>
        </form>
        {pasteError && (
          <p role="alert" className={ui.hint}>
            {pasteError}
          </p>
        )}
      </details>

      {target && (
        <>
          <dl className={ui.dl}>
            {target.file && (
              <>
                <dt>{m.checkFile.fileLabel}</dt>
                <dd className={ui.mono}>
                  {target.file.name} ({m.checkFile.size(target.file.size)})
                </dd>
              </>
            )}
            <dt>{m.checkFile.hashLabel}</dt>
            <dd className={ui.mono}>{target.sha256}</dd>
          </dl>
          <LookupResult key={target.sha256} target={target} />
        </>
      )}
    </div>
  );
}
