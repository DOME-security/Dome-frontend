import { useQuery } from '@tanstack/react-query';
import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { EvidenceLinks } from '../../components/ExternalLinks';
import { FileDropzone } from '../../components/FileDropzone';
import { ErrorMessage, Loading } from '../../components/Status';
import { VerdictBanner } from '../../components/VerdictBanner';
import { api, isSha256 } from '../../lib/api';
import { hashFile } from '../../lib/hash';
import { txUrl } from '../../lib/registry';
import { HONESTY_NOTICE } from '../../lib/rules';
import ui from '../../styles/ui.module.css';

interface Target {
  sha256: string;
  file?: { name: string; size: number };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function LookupResult({ target }: { target: Target }) {
  const { data, error, isPending } = useQuery({
    queryKey: ['indicator', target.sha256],
    queryFn: () => api.getIndicator(target.sha256),
  });
  if (isPending) return <Loading label="Looking up the fingerprint…" />;
  if (error) return <ErrorMessage error={error} />;

  const tx = data.known ? txUrl(data.txHash) : null;
  return (
    <section aria-label="Result">
      {data.known ? (
        <>
          <VerdictBanner verdict="block" />
          <p>
            <strong>This exact file is on the Dome Registry&apos;s known-bad list.</strong> Do not open or run it. If it came from
            a repository you opened, follow <Link to="/guides/infected">I think I was infected</Link>.
          </p>
          <dl className={ui.dl}>
            <dt>Campaign</dt>
            <dd className={ui.mono}>{data.campaign}</dd>
            <dt>Evidence</dt>
            <dd>
              <EvidenceLinks urls={data.evidence} />
            </dd>
            <dt>Recorded on chain</dt>
            <dd>
              Ledger {data.ledger}
              {tx && (
                <>
                  {' · '}
                  <a href={tx} target="_blank" rel="noreferrer">
                    View transaction
                  </a>
                </>
              )}
            </dd>
          </dl>
          <p>
            <Link to={`/registry/indicator/${target.sha256}`}>Indicator details</Link>
          </p>
        </>
      ) : (
        <div className={ui.card}>
          <h2>Not on the known-bad list</h2>
          <p>
            This exact file has not been recorded as malicious. A file can still be harmful if it is new or slightly changed, so
            check the repository it came from as well.
          </p>
          <p>
            <Link to="/check/repo">Check the repository</Link>
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
      setPasteError('A SHA-256 fingerprint is 64 characters, 0-9 and a-f.');
      return;
    }
    setPasteError(null);
    setHashError(null);
    setTarget({ sha256: value });
  }

  return (
    <div className={ui.page}>
      <title>Check a file · Dome</title>
      <h1>Check a file</h1>
      <p className={ui.lead}>
        Got a suspicious <code>tasks.json</code>, font or config file? Dome computes its fingerprint in your browser and checks it
        against files confirmed as malicious. The file is never uploaded.
      </p>

      <FileDropzone onFile={onFile} disabled={hashing} />
      {hashing && <Loading label="Computing the fingerprint on your device…" />}
      {hashError !== null && <ErrorMessage error={hashError} />}

      <details>
        <summary>Already have a SHA-256 fingerprint?</summary>
        <form onSubmit={onPaste} noValidate className={ui.row}>
          <div className={ui.grow}>
            <label htmlFor={hashInputId} className={ui.label}>
              SHA-256
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
            Look up
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
                <dt>File</dt>
                <dd className={ui.mono}>
                  {target.file.name} ({formatSize(target.file.size)})
                </dd>
              </>
            )}
            <dt>SHA-256</dt>
            <dd className={ui.mono}>{target.sha256}</dd>
          </dl>
          <LookupResult key={target.sha256} target={target} />
        </>
      )}
    </div>
  );
}
