import { fileUrl } from '../lib/github';
import { m } from '../i18n';
import { parseInline, safeHref } from '../lib/markdown';
import { describeRule, HONESTY_NOTICE, INCOMPLETE_TEXT, reasonText, SEVERITY_ORDER } from '../lib/rules';
import type { Finding, Repository, ScanReport } from '../lib/types';
import ui from '../styles/ui.module.css';
import { FindingBadge } from './FindingBadge';
import { InlineNodes } from './SafeMarkdown';
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
  if (!finding.locations.length) return <span className={ui.muted}>{m.report.wholeRepo}</span>;
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
            <caption className="visually-hidden">{m.report.caption}</caption>
            <thead>
              <tr>
                <th scope="col">{m.report.columns.level}</th>
                <th scope="col">{m.report.columns.what}</th>
                <th scope="col">{m.report.columns.where}</th>
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
                      <p className={styles.summary}>
                        {reasonText(rule, finding.reasonKey) ?? <InlineNodes nodes={parseInline(rule.summary)} />}
                      </p>
                      {rule.why && (
                        <details className={styles.why}>
                          <summary>{m.report.whyItMatters}</summary>
                          <p>{rule.why}</p>
                          {rule.references.length > 0 && (
                            <ul>
                              {rule.references.map((ref) => {
                                const href = safeHref(ref.url);
                                return href ? (
                                  <li key={href}>
                                    <a href={href} target="_blank" rel="noreferrer">
                                      {ref.title}
                                    </a>
                                  </li>
                                ) : null;
                              })}
                            </ul>
                          )}
                        </details>
                      )}
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
        <p>{m.report.noFindings}</p>
      )}

      {ignored > 0 && <p className={ui.hint}>{m.report.ignored(ignored)}</p>}

      {report.incomplete.length > 0 && (
        <details className={styles.incomplete}>
          <summary>{m.report.unreadable(report.incomplete.length)}</summary>
          <ul>
            {report.incomplete.map((item, i) => (
              <li key={i}>
                <span className={ui.mono}>{item.path}</span>: {INCOMPLETE_TEXT[item.reason] ?? m.incomplete['read-error']}
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className={ui.hint}>
        {m.report.stats(
          report.scope,
          report.stats.filesInScope,
          report.stats.filesInTree,
          report.stats.rulesRun,
          report.tool.version,
        )}
      </p>

      <p className={styles.notice}>{HONESTY_NOTICE}</p>
    </div>
  );
}
