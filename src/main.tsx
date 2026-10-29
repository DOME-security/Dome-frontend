import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { defaultServices, ServicesProvider, type Services } from './lib/services';
import { applyTheme, readThemePreference } from './lib/theme';
import { routes } from './router';
import './styles/global.css';

applyTheme(readThemePreference());

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});
const router = createBrowserRouter(routes);

// End-to-end builds (VITE_E2E_FAKES=true) take a fake chain and wallet from the
// test harness. In every other build this condition is a compile-time false
// and the branch is removed.
const services: Services =
  import.meta.env.VITE_E2E_FAKES === 'true' && window.__DOME_E2E__ ? window.__DOME_E2E__ : defaultServices;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ServicesProvider services={services}>
        <RouterProvider router={router} />
      </ServicesProvider>
    </QueryClientProvider>
  </StrictMode>,
);
