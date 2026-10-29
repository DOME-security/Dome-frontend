import { useId, useState, type DragEvent } from 'react';
import styles from './FileDropzone.module.css';

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

/** A file input styled as a drop target. Keyboard and screen-reader users get the native file picker. */
export function FileDropzone({ onFile, disabled }: Props) {
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
        <strong>Choose a file</strong> or drop it here
        <span className={styles.hint}>The file stays on your device. Only its SHA-256 fingerprint is looked up.</span>
      </label>
    </div>
  );
}
