import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderRoute } from '../../test/render';
import { GUIDE_SLUGS, loadGuide } from './guides';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('guides', () => {
  it.each(GUIDE_SLUGS)('%s has a title, summary and sections', async (slug) => {
    const guide = await loadGuide(slug);
    expect(guide?.title).not.toBe('');
    expect(guide?.summary.length).toBeGreaterThan(40);
    expect(guide?.blocks.some((b) => b.type === 'heading')).toBe(true);
  });

  it('renders the infected guide with a working checklist', async () => {
    const { user } = renderRoute('/guides/infected');
    expect(await screen.findByRole('heading', { level: 1, name: 'I think I was infected' })).toBeInTheDocument();
    const toc = screen.getByRole('navigation', { name: 'On this page' });
    expect(within(toc).getByRole('link', { name: '1. Disconnect the machine' })).toHaveAttribute('href', '#1-disconnect-the-machine');
    const box = screen.getByRole('checkbox', { name: /turn off wi-fi/i });
    await user.click(box);
    expect(box).toBeChecked();
  });

  it('links between guides inside the app', async () => {
    renderRoute('/guides/wave');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getAllByRole('link', { name: 'the hardening guide' })[0]).toHaveAttribute('href', '/guides/hardening');
  });

  it('returns not found for unknown guides', async () => {
    renderRoute('/guides/unknown');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
