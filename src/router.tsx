import type { RouteObject } from 'react-router';
import { Layout } from './components/Layout';
import { RouteError } from './routes/not-found/RouteError';

// One lazily loaded chunk per page, so a phone on a slow connection only
// downloads the page it opened.
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('./routes/home/HomePage')).HomePage }) },
      { path: '*', lazy: async () => ({ Component: (await import('./routes/not-found/NotFoundPage')).NotFoundPage }) },
    ],
  },
];
