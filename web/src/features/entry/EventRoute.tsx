import { parseEntry } from '@guestcam/shared';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';
import { readProfile, saveProfile } from '../onboarding/profileStore';
import { WelcomePage } from '../onboarding/WelcomePage';
import { CodeScreen, type CodeError } from './CodeScreen';
import { EventProvider } from './EventContext';
import { LoadingScreen, OfflineScreen } from './StatusScreens';
import { useEventView } from './useEventView';

// The event screens (selfie, menu, capture, gallery) are not part of the first
// screen: a QR scan starts on the name screen, and they are fetched while the
// guest types (and precached for reopening offline).
const loadEventHome = () => import('./EventHome');
const EventHome = lazy(() => loadEventHome().then((m) => ({ default: m.EventHome })));
const GalleryPage = lazy(() => import('../gallery/GalleryPage').then((m) => ({ default: m.GalleryPage })));

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

/** After "Teruskan", how long to wait for the join before offering a retry (no connection). */
const JOIN_WAIT_MS = 15_000;

type JoinState = { status: 'pending' } | { status: 'joined'; eventSlug: string } | { status: 'offline' };

/**
 * QR link. A guest this phone does not know yet types their name on a neutral
 * screen while sign-in and `joinEvent` run in the background (D-078); couple
 * names and theme appear from the next screen. A wrong code goes straight to
 * the code screen; the name is saved only after a successful join. A guest the
 * phone already knows waits for the join, since their next screen is the menu.
 */
function JoinWithCode({ publicId, eventSlug, code }: { publicId: string; eventSlug: string; code: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [askName] = useState(() => readProfile(publicId) === null);
  const [typedName, setTypedName] = useState<string | null>(null);
  const [join, setJoin] = useState<JoinState>({ status: 'pending' });
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // React StrictMode runs effects twice in development; one wrong code must count once.
  const started = useRef(-1);

  useEffect(() => {
    void loadEventHome();
  }, []);

  useEffect(() => {
    if (started.current === attempt) return;
    started.current = attempt;
    const current = () => started.current === attempt;
    import('./eventApi')
      .then(({ joinEvent }) => joinEvent({ publicId, eventSlug, code }))
      .then((result) => {
        if (result.kind === 'joined') {
          setJoin({ status: 'joined', eventSlug: result.event.eventSlug });
        } else if (current()) {
          const state: CodeErrorState = { codeError: result };
          navigate(`/s/${publicId}/${eventSlug}`, { replace: true, state });
        }
      })
      .catch(() => {
        if (current()) setJoin({ status: 'offline' });
      });
  }, [publicId, eventSlug, code, attempt, navigate]);

  // Joined, and the name is in (if it was asked): on to the event, without the code in the address.
  useEffect(() => {
    if (join.status !== 'joined' || (askName && typedName === null)) return;
    if (typedName !== null) saveProfile(publicId, { displayName: typedName, selfieDecided: false, hasSelfie: false });
    navigate(`/s/${publicId}/${join.eventSlug}`, { replace: true });
  }, [join, askName, typedName, publicId, navigate]);

  const waiting = join.status === 'pending' && (!askName || typedName !== null);
  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => setTimedOut(true), JOIN_WAIT_MS);
    return () => clearTimeout(timer);
  }, [waiting, attempt]);

  if (askName && typedName === null) return <WelcomePage event={null} onDone={setTypedName} />;
  if (join.status === 'offline' || (waiting && timedOut)) {
    return (
      <OfflineScreen
        onRetry={() => {
          setTimedOut(false);
          setJoin({ status: 'pending' });
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
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route index element={<EventHome />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="*" element={<Navigate to={base} replace />} />
        </Routes>
      </Suspense>
    </EventProvider>
  );
}
