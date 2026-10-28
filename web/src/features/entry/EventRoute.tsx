import { parseEntry } from '@guestcam/shared';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';
import { GalleryPage } from '../gallery/GalleryPage';
import { CodeScreen, type CodeError } from './CodeScreen';
import { EventProvider } from './EventContext';
import { EventHome } from './EventHome';
import { LoadingScreen, OfflineScreen } from './StatusScreens';
import { useEventView } from './useEventView';

/** Passed in navigation state after a failed join, so the code never stays in the address bar. */
interface CodeErrorState {
  codeError?: CodeError;
}

/**
 * `/s/:publicId/:eventEntry/*`
 * - `tunang-k7q2`: join with the code, then replace the address with `/s/:publicId/tunang`.
 * - `tunang`: the event for members, the generic code screen for everyone else.
 */
export function EventRoute() {
  const params = useParams();
  const publicId = (params.publicId ?? '').toLowerCase();
  const entry = parseEntry(params.eventEntry ?? '');

  if (entry.kind === 'withCode') {
    return <JoinWithCode key={`${entry.eventSlug}-${entry.code}`} publicId={publicId} {...entry} />;
  }
  if (entry.kind === 'slugOnly') {
    return <EventShell key={entry.eventSlug} publicId={publicId} eventSlug={entry.eventSlug} />;
  }
  return <CodeScreen publicId={publicId} />;
}

function JoinWithCode({ publicId, eventSlug, code }: { publicId: string; eventSlug: string; code: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [offline, setOffline] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // React StrictMode runs effects twice in development; one wrong code must count once.
  const started = useRef(-1);

  useEffect(() => {
    if (started.current === attempt) return;
    started.current = attempt;
    const eventPath = `/s/${publicId}/${eventSlug}`;
    import('./eventApi')
      .then(({ joinEvent }) => joinEvent({ publicId, eventSlug, code }))
      .then((result) => {
        if (result.kind === 'joined') {
          navigate(`/s/${publicId}/${result.event.eventSlug}`, { replace: true });
        } else {
          const state: CodeErrorState = { codeError: result };
          navigate(eventPath, { replace: true, state });
        }
      })
      .catch(() => setOffline(true));
  }, [publicId, eventSlug, code, attempt, navigate]);

  if (offline) {
    return (
      <OfflineScreen
        onRetry={() => {
          setOffline(false);
          setAttempt((n) => n + 1);
        }}
      />
    );
  }
  return <LoadingScreen message={t('entry.joining')} />;
}

function EventShell({ publicId, eventSlug }: { publicId: string; eventSlug: string }) {
  const { state, retry } = useEventView(publicId, eventSlug);
  const location = useLocation();
  const codeError = (location.state as CodeErrorState | null)?.codeError ?? null;

  if (state.status === 'loading') return <LoadingScreen />;
  if (state.status === 'offline') return <OfflineScreen onRetry={retry} />;
  if (state.status === 'codeRequired') {
    return <CodeScreen publicId={publicId} eventSlug={eventSlug} initialError={codeError} />;
  }

  const base = `/s/${publicId}/${eventSlug}`;
  return (
    <EventProvider event={state.event}>
      <Routes>
        <Route index element={<EventHome />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="*" element={<Navigate to={base} replace />} />
      </Routes>
    </EventProvider>
  );
}
