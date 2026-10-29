import { useId, useState } from 'react';
import { m } from '../i18n';
import { isSha256 } from '../lib/api';
import { hashFile } from '../lib/hash';
import ui from '../styles/ui.module.css';

interface Props {
  label: string;
  hint: string;
  value: string;
  onChange: (hash: string) => void;
}

/** A SHA-256 field that can also fill itself by hashing a local file in the browser. */
export function HashField({ label, hint, value, onChange }: Props) {
  const id = useId();
  const fileId = useId();
  const hintId = useId();
  const [fileError, setFileError] = useState<string | null>(null);
  const invalid = value !== '' && !isSha256(value);
  return (
    <div>
      <label htmlFor={id} className={ui.label}>
        {label}
      </label>
      <input
        id={id}
        className={`${ui.input} ${ui.mono}`}
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value.trim().toLowerCase())}
        aria-invalid={invalid || undefined}
        aria-describedby={hintId}
      />
      <p id={hintId} className={ui.hint}>
        {invalid ? `${m.checkFile.invalidHash} ` : ''}
        {hint}{' '}
        <label htmlFor={fileId} className={ui.linkButton}>
          {m.checkFile.hashFromFile}
        </label>
        <input
          id={fileId}
          type="file"
          className="visually-hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            try {
              setFileError(null);
              onChange(await hashFile(file));
            } catch (error) {
              setFileError(error instanceof RangeError ? error.message : m.checkFile.couldNotRead);
            }
          }}
        />
      </p>
      {fileError && (
        <p role="alert" className={ui.hint}>
          {fileError}
        </p>
      )}
    </div>
  );
}
