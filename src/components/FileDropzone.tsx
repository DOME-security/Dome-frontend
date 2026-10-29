import { useId, useState, type DragEvent } from 'react';
import { m } from '../i18n';
import styles from './FileDropzone.module.css';

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
  maxMb: number;
}

/** A file input styled as a drop target. Keyboard and screen-reader users get the native file picker. */
export function FileDropzone({ onFile, disabled, maxMb }: Props) {
  const id = useId();
  const [dragging, setDragging] = useState(false);

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !disabled) onFile(file);
  }

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.dragging : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        id={id}
        type="file"
        className={styles.input}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
      <label htmlFor={id} className={styles.label}>
        <strong>{m.checkFile.choose}</strong> {m.checkFile.orDrop}
        <span className={styles.hint}>{m.checkFile.dropHint(maxMb)}</span>
      </label>
    </div>
  );
}
