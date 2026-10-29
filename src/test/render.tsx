import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { vi } from 'vitest';
import { routes } from '../router';
import { mockFetch } from './fixtures';

type Routes = Parameters<typeof mockFetch>[0];

/** Renders the real route tree at `path`, with API calls answered by `api`. */
export function renderRoute(
  path: string,
  api: Routes = {},
): RenderResult & { user: ReturnType<typeof userEvent.setup>; router: ReturnType<typeof createMemoryRouter> } {
  const fetchSpy = vi.fn(mockFetch(api));
  vi.stubGlobal('fetch', fetchSpy);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user = userEvent.setup();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...result, user, router };
}
