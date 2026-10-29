import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RequestHandler } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '../router';
import { server } from './server';

/** Renders the real route tree at `path`, with the Dome API answered by MSW `handlers`. */
export function renderRoute(
  path: string,
  ...handlers: RequestHandler[]
): RenderResult & { user: ReturnType<typeof userEvent.setup>; router: ReturnType<typeof createMemoryRouter> } {
  server.use(...handlers);
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
