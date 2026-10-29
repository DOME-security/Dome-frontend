import { Suspense } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';
import { m } from '../i18n';
import { config } from '../lib/config';
import styles from './Layout.module.css';
import { Loading } from './Status';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { to: '/check/repo', label: m.app.nav.checkRepo },
  { to: '/check/file', label: m.app.nav.checkFile },
  { to: '/registry', label: m.app.nav.registry },
  { to: '/guides/infected', label: m.app.nav.infected },
  { to: '/dashboard', label: m.app.nav.dashboard },
];

export function Layout() {
  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        {m.app.skipLink}
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand}>
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <span>{m.app.brand}</span>
          </Link>
          <nav aria-label={m.app.navLabel} className={styles.nav}>
            <ul>
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className={({ isActive }) => (isActive ? styles.active : undefined)}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <ThemeToggle />
        </div>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>
            <strong>{m.honestyNotice}</strong> {m.app.footerNotice}
          </p>
          <p className={styles.footerLinks}>
            <span>{m.app.footerNetwork(m.network[config.network])}</span>
            <Link to="/guides/hardening">{m.app.footerLinks.hardening}</Link>
            <Link to="/guides/wave">{m.app.footerLinks.wave}</Link>
            <Link to="/curate">{m.app.footerLinks.curate}</Link>
            <a href="https://github.com/DOME-security" rel="noreferrer" target="_blank">
              {m.app.footerLinks.source}
            </a>
          </p>
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
