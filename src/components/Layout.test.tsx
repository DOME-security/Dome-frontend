import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderRoute } from '../test/render';

afterEach(() => {
  localStorage.clear();
});

describe('app shell', () => {
  it('renders the home page with navigation and a skip link', async () => {
    renderRoute('/');
    expect(await screen.findByRole('heading', { level: 1, name: /check a repo before you open it/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav).toHaveTextContent('Check a repo');
    expect(nav).toHaveTextContent('Registry');
  });

  it('shows the honesty notice on every page', async () => {
    renderRoute('/');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('contentinfo')).toHaveTextContent('No known pattern found is not the same as safe.');
  });

  it('switches and remembers the theme', async () => {
    const { user } = renderRoute('/');
    await screen.findByRole('heading', { level: 1 });
    await user.selectOptions(screen.getByLabelText('Colour theme'), 'dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('dome-theme')).toBe('dark');
    await user.selectOptions(screen.getByLabelText('Colour theme'), 'system');
    expect(localStorage.getItem('dome-theme')).toBeNull();
  });

  it('shows a not-found page for unknown routes', async () => {
    renderRoute('/nope');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
