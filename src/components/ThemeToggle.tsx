import { useTheme, type ThemePreference } from '../lib/theme';
import styles from './ThemeToggle.module.css';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  return (
    <label className={styles.toggle}>
      <span className="visually-hidden">Colour theme</span>
      <select value={theme} onChange={(e) => setTheme(e.target.value as ThemePreference)} className={styles.select}>
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
