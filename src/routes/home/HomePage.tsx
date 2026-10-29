import { Link } from 'react-router';
import ui from '../../styles/ui.module.css';
import styles from './HomePage.module.css';

const SAFETY_STEPS = [
  {
    title: 'Check before you open',
    body: 'Opening a folder in VS Code or Cursor can run code before you read a single line. Paste the link here first.',
  },
  {
    title: 'Keep automatic tasks off',
    body: 'Leave Workspace Trust on and set task.allowAutomaticTasks to off, so nothing runs just because you opened a folder.',
  },
  {
    title: 'Never install from an unknown repo on a machine with keys',
    body: 'npm install runs scripts. Do it in a container or a throwaway machine, never next to your wallet or SSH keys.',
  },
];

export function HomePage() {
  return (
    <>
      <title>Dome: check before you open</title>
      <section className={styles.hero}>
        <h1>Check a repo before you open it.</h1>
        <p className={ui.lead}>
          Some repositories run code the moment you open the folder, install dependencies or start a build. Dome shows you what a repo
          would run and whether it matches a known attack, with nothing to install.
        </p>
        <div className={styles.actions}>
          <Link to="/check/repo" className={ui.button}>
            Check a GitHub repo
          </Link>
          <Link to="/check/file" className={ui.secondary}>
            Check a single file
          </Link>
        </div>
      </section>

      <section aria-labelledby="safe-heading">
        <h2 id="safe-heading">Three things that keep you safe</h2>
        <ol className={styles.steps}>
          {SAFETY_STEPS.map((step) => (
            <li key={step.title} className={ui.card}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="more-heading">
        <h2 id="more-heading">More from Dome</h2>
        <ul className={styles.links}>
          <li>
            <Link to="/guides/infected">I think I was infected</Link>: what to do, in order, starting now.
          </li>
          <li>
            <Link to="/guides/hardening">Harden your editor and repo</Link>: settings and repo rules that stop auto-run attacks.
          </li>
          <li>
            <Link to="/registry">Browse the Dome Registry</Link>: known-bad files, approved by curators and recorded on Stellar.
          </li>
          <li>
            <Link to="/guides/wave">Stellar Wave review routine</Link>: for maintainers and contributors during a Wave.
          </li>
        </ul>
      </section>
    </>
  );
}
