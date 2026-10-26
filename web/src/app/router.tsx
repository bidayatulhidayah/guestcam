import { createBrowserRouter, type RouteObject } from 'react-router';
import { PlaceholderPage } from '../components/PlaceholderPage';
import { CodeScreenPage } from '../features/entry/CodeScreenPage';
import { CurrentEventPage } from '../features/entry/CurrentEventPage';
import { EventEntryPage } from '../features/entry/EventEntryPage';
import { SpaceLayout } from '../features/entry/SpaceLayout';
import { GalleryPage } from '../features/gallery/GalleryPage';
import { DevIndexPage } from './DevIndexPage';
import { NotFoundPage } from './NotFoundPage';
import { RootLayout } from './RootLayout';

/** The same pages for the permanent address and the alias (architecture.md Part 3). */
const spaceChildren: RouteObject[] = [
  { index: true, element: <CurrentEventPage /> },
  { path: ':eventEntry', element: <EventEntryPage /> },
  { path: ':eventSlug/gallery', element: <GalleryPage /> },
  { path: '*', element: <CodeScreenPage /> },
];

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <DevIndexPage /> },
      { path: '/mine', element: <PlaceholderPage pageKey="mine" /> },
      {
        path: '/login',
        lazy: async () => ({ Component: (await import('../features/admin/LoginPage')).LoginPage }),
      },
      {
        // Separate chunk: guests never download admin code.
        path: '/admin/*',
        lazy: async () => ({ Component: (await import('../features/admin/AdminPage')).AdminPage }),
      },
      { path: '/s/:publicId', element: <SpaceLayout />, children: spaceChildren },
      { path: '/s/*', element: <NotFoundPage /> },
      { path: '/:aliasName', element: <SpaceLayout />, children: spaceChildren },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
