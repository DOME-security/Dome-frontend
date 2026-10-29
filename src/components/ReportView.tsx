import { fileUrl } from '../lib/github';
import { describeRule, HONESTY_NOTICE, INCOMPLETE_TEXT, SEVERITY_ORDER } from '../lib/rules';
import type { Finding, Repository, ScanReport } from '../lib/types';
import ui from '../styles/ui.module.css';
import { FindingBadge } from './FindingBadge';
import styles from './ReportView.module.css';
import { VerdictBanner } from './VerdictBanner';

const RULE_DOCS = 'https://github.com/DOME-security/Dome-backend/blob/main/docs/rules';

interface Props {
  report: ScanReport;
  repository: Repository;
  commit: string | null;
}

function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.ruleId.localeCompare(b.ruleId),
  );
}

function FindingLocations({ finding, repository, commit }: { finding: Finding } & Omit<Props, 'report'>) {
  if (!finding.locations.length) return <span className={ui.muted}>Whole repository</span>;
  return (
    <ul className={styles.locations}>
      {finding.locations.map((loc, i) => {
        // The path is repository-supplied text: rendered as text, linked only through an encoded URL.
        const label = loc.line ? `${loc.path}:${loc.line}` : loc.path;
        const href = commit ? fileUrl(repository, commit, loc.path, loc.line) : null;
        return (
          <li key={i} className={ui.mono}>
            {href ? (
              <a href={href} target="_blank" rel="noreferrer">
                {label}
              </a>
            ) : (
              label
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A scan report. Titles and explanations come from the app's rule table; the
 * only repository-supplied text shown is file paths, rendered as plain text.
 */
export function ReportView({ report, repository, commit }: Props) {
  const counted = sortFindings(report.findings.filter((f) => !f.fixture && !f.allowed));
  const ignored = report.findings.length - counted.length;

  return (
    <div className={styles.report}>
      <VerdictBanner verdict={report.verdict} />

      {counted.length > 0 ? (
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <caption className="visually-hidden">Findings, most serious first</caption>
            <thead>
              <tr>
                <th scope="col">Level</th>
                <th scope="col">What Dome found</th>
                <th scope="col">Where</th>
              </tr>
            </thead>
            <tbody>
              {counted.map((finding, i) => {
                const rule = describeRule(finding.ruleId);
                return (
                  <tr key={i}>
                    <td>
                      <FindingBadge severity={finding.severity} />
                    </td>
                    <td>
                      <strong>{rule.title}</strong>
                      <p className={styles.summary}>{rule.summary}</p>
                      {rule.known ? (
                        <a href={`${RULE_DOCS}/${rule.id}.md`} target="_blank" rel="noreferrer" className={styles.ruleId}>
                          {rule.id}
                        </a>
                      ) : (
                        <span className={styles.ruleId}>{rule.id}</span>
                      )}
                    </td>
                    <td>
                      <FindingLocations finding={finding} repository={repository} commit={commit} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No findings.</p>
      )}

      {ignored > 0 && (
        <p className={ui.hint}>
          {ignored} {ignored === 1 ? 'finding was' : 'findings were'} in test fixtures or allowed by the repository&apos;s
          hash-pinned Dome config, and did not affect the verdict.
        </p>
      )}

      {report.incomplete.length > 0 && (
        <details className={styles.incomplete}>
          <summary>
            {report.incomplete.length} {report.incomplete.length === 1 ? 'file' : 'files'} could not be read
          </summary>
          <ul>
            {report.incomplete.map((item, i) => (
              <li key={i}>
                <span className={ui.mono}>{item.path}</span>: {INCOMPLETE_TEXT[item.reason] ?? 'Could not be read'}
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className={ui.hint}>
        {report.scope === 'diff' ? 'Changes scanned' : 'Full repository scanned'}: {report.stats.filesInScope} of{' '}
        {report.stats.filesInTree} files, {report.stats.rulesRun} rules, Dome {report.tool.version}.
      </p>

      <p className={styles.notice}>{HONESTY_NOTICE}</p>
    </div>
  );
}
