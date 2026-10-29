import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RequestHandler } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { ServicesProvider } from '../lib/services';
import { routes } from '../router';
import { server } from './server';
import { testServices } from './services';

/** Renders the real route tree at `path`, with the Dome API answered by MSW `handlers` and fake chain and wallet (see ./services). */
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
      <ServicesProvider services={testServices()}>
        <RouterProvider router={router} />
      </ServicesProvider>
    </QueryClientProvider>,
  );
  return { ...result, user, router };
}
