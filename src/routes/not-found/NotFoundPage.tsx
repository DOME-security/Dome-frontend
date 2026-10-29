import { Link } from 'react-router';
import { m } from '../../i18n';
import ui from '../../styles/ui.module.css';

export function NotFoundPage() {
  const t = m.notFound;
  return (
    <div className={ui.page}>
      <title>{m.app.titleSuffix(t.title)}</title>
      <h1>{t.title}</h1>
      <p>
        {t.body} {t.goBackBefore} <Link to="/">{t.home}</Link> {t.or} <Link to="/check/repo">{t.checkRepo}</Link>.
      </p>
    </div>
  );
}
