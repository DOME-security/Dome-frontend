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
      {
        // Errors inside a page keep the header and footer.
        errorElement: <RouteError />,
        children: [
          { index: true, lazy: async () => ({ Component: (await import('./routes/home/HomePage')).HomePage }) },
          {
            path: 'check/repo',
            lazy: async () => ({ Component: (await import('./routes/check-repo/CheckRepoPage')).CheckRepoPage }),
          },
          {
            path: 'check/file',
            lazy: async () => ({ Component: (await import('./routes/check-file/CheckFilePage')).CheckFilePage }),
          },
          {
            path: 'guides/:slug',
            lazy: async () => {
              const [{ GuidePage }, { guideLoader }] = await Promise.all([
                import('./routes/guides/GuidePage'),
                import('./routes/guides/guides'),
              ]);
              return { Component: GuidePage, loader: guideLoader };
            },
          },
          { path: '*', lazy: async () => ({ Component: (await import('./routes/not-found/NotFoundPage')).NotFoundPage }) },
        ],
      },
    ],
  },
];
