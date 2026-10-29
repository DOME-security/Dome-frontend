import { useTheme, type ThemePreference } from '../lib/theme';
import { m } from '../i18n';
import styles from './ThemeToggle.module.css';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: m.app.theme.system },
  { value: 'light', label: m.app.theme.light },
  { value: 'dark', label: m.app.theme.dark },
];

export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  return (
    <label className={styles.toggle}>
      <span className="visually-hidden">{m.app.themeLabel}</span>
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
