import { Link } from 'react-router';
import { m } from '../../i18n';
import ui from '../../styles/ui.module.css';
import styles from './HomePage.module.css';

export function HomePage() {
  const t = m.home;
  return (
    <>
      <title>{m.app.title}</title>
      <section className={styles.hero}>
        <h1>{t.heading}</h1>
        <p className={ui.lead}>{t.lead}</p>
        <div className={styles.actions}>
          <Link to="/check/repo" className={ui.button}>
            {t.checkRepo}
          </Link>
          <Link to="/check/file" className={ui.secondary}>
            {t.checkFile}
          </Link>
        </div>
      </section>

      <section aria-labelledby="safe-heading">
        <h2 id="safe-heading">{t.safeHeading}</h2>
        <ol className={styles.steps}>
          {t.steps.map((step) => (
            <li key={step.title} className={ui.card}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="more-heading">
        <h2 id="more-heading">{t.moreHeading}</h2>
        <ul className={styles.links}>
          {t.more.map((item) => (
            <li key={item.to}>
              <Link to={item.to}>{item.link}</Link>: {item.text}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
