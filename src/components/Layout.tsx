import { Suspense } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';
import { config } from '../lib/config';
import { NETWORK_LABEL } from '../lib/registry';
import { HONESTY_NOTICE } from '../lib/rules';
import styles from './Layout.module.css';
import { Loading } from './Status';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { to: '/check/repo', label: 'Check a repo' },
  { to: '/check/file', label: 'Check a file' },
  { to: '/registry', label: 'Registry' },
  { to: '/guides/infected', label: 'Infected?' },
  { to: '/guides/hardening', label: 'Hardening' },
];

export function Layout() {
  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand}>
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <span>Dome</span>
          </Link>
          <nav aria-label="Main" className={styles.nav}>
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
            <strong>{HONESTY_NOTICE}</strong> Dome looks for known auto-run and payload patterns; it cannot prove code is safe.
          </p>
          <p className={styles.footerLinks}>
            <span>Registry on {NETWORK_LABEL[config.network]}</span>
            <Link to="/guides/wave">Stellar Wave guide</Link>
            <a href="https://github.com/DOME-security" rel="noreferrer" target="_blank">
              Source on GitHub
            </a>
          </p>
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
