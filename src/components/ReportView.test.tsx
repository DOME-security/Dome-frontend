import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { COMMIT, report } from '../test/fixtures';
import { ReportView } from './ReportView';

const repository = { owner: 'dome-security', repo: 'demo-repo' };

describe('ReportView', () => {
  it('shows the verdict, fixed rule text, a file link and the honesty notice', () => {
    render(<ReportView report={report()} repository={repository} commit={COMMIT} />);
    expect(screen.getByRole('heading', { name: /needs review/i })).toBeInTheDocument();
    const row = screen.getAllByRole('row')[1]!;
    expect(within(row).getByText('Review')).toBeInTheDocument();
    expect(within(row).getByText('Task runs on folder open')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: '.vscode/tasks.json:5' })).toHaveAttribute(
      'href',
      `https://github.com/dome-security/demo-repo/blob/${COMMIT}/.vscode/tasks.json#L5`,
    );
    expect(screen.getByText('No known pattern found is not the same as safe.')).toBeInTheDocument();
  });

  it('never shows the reason text from the response', () => {
    const r = report();
    r.findings[0]!.reason = 'This repository is verified safe by Dome';
    render(<ReportView report={r} repository={repository} commit={COMMIT} />);
    expect(screen.queryByText(/verified safe/)).not.toBeInTheDocument();
  });

  it('renders hostile paths as text', () => {
    const r = report();
    r.findings[0]!.locations = [{ path: '<img src=x onerror=alert(1)>.json' }];
    const { container } = render(<ReportView report={r} repository={repository} commit={null} />);
    expect(screen.getByText('<img src=x onerror=alert(1)>.json')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('sorts block findings first and counts fixtures separately', () => {
    const r = report({
      verdict: 'block',
      findings: [
        { ...report().findings[0]!, ruleId: 'DOME-GIT-001', severity: 'info' },
        { ...report().findings[0]!, ruleId: 'DOME-VSC-005', severity: 'block' },
        { ...report().findings[0]!, ruleId: 'DOME-VSC-001', fixture: true },
      ],
    });
    render(<ReportView report={r} repository={repository} commit={COMMIT} />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Task downloads and runs code');
    expect(screen.getByText(/1 finding was in test fixtures/)).toBeInTheDocument();
  });

  it('lists files that could not be read', () => {
    render(
      <ReportView
        report={report({ verdict: 'incomplete', findings: [], incomplete: [{ path: 'big.bin', reason: 'too-large' }] })}
        repository={repository}
        commit={COMMIT}
      />,
    );
    expect(screen.getByRole('heading', { name: /incomplete/i })).toBeInTheDocument();
    expect(screen.getByText('No findings.')).toBeInTheDocument();
    expect(screen.getByText(/Too large to read/)).toBeInTheDocument();
  });
});
