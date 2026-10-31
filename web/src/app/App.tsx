import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { EventRoute } from '../features/entry/EventRoute';
import { AliasInactivePage } from '../features/entry/AliasInactivePage';
import { MyEventsPage } from '../features/entry/MyEventsPage';
import { SpaceHomePage } from '../features/entry/SpaceHomePage';
import { SpaceLayout } from '../features/entry/SpaceLayout';
import { LoadingScreen } from '../features/entry/StatusScreens';
import { HomePage } from './HomePage';
import { NotFoundPage } from './NotFoundPage';
import { RootLayout } from './RootLayout';

// Separate chunks: guests never download host code (performance budget).
const LoginPage = lazy(() => import('../features/admin/LoginPage').then((m) => ({ default: m.LoginPage })));
const AdminPage = lazy(() => import('../features/admin/AdminPage').then((m) => ({ default: m.AdminPage })));
// Dev server only; removed from production builds.
const DevIndexPage = import.meta.env.DEV
  ? lazy(() => import('./DevIndexPage').then((m) => ({ default: m.DevIndexPage })))
  : null;

const later = (page: ReactNode) => <Suspense fallback={<LoadingScreen />}>{page}</Suspense>;

/**
 * Routes (architecture.md Part 3). Fixed routes are English; aliases are built
 * in Phase 4, so every other single segment shows the neutral inactive page.
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={DevIndexPage ? later(<DevIndexPage />) : <HomePage />} />
          <Route path="mine" element={<MyEventsPage />} />
          <Route path="login" element={later(<LoginPage />)} />
          <Route path="admin/*" element={later(<AdminPage />)} />
          <Route path="s/:publicId" element={<SpaceLayout />}>
            <Route index element={<SpaceHomePage />} />
            <Route path=":eventEntry/*" element={<EventRoute />} />
          </Route>
          <Route path="s/*" element={<NotFoundPage />} />
          <Route path=":aliasName/*" element={<AliasInactivePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
