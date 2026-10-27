import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { CodeScreen } from './CodeScreen';
import { readCurrentSlug } from './eventStore';
import { LoadingScreen, OfflineScreen } from './StatusScreens';

type State = { status: 'loading' } | { status: 'event'; eventSlug: string } | { status: 'code' } | { status: 'offline' };

/**
 * `/s/:publicId`: the space's current event for a phone that has joined, or
 * the neutral code screen (no names, title or theme) for everyone else.
 */
export function SpaceHomePage() {
  const publicId = (useParams().publicId ?? '').toLowerCase();
  const [state, setState] = useState<State>(() => {
    const saved = readCurrentSlug(publicId);
    return saved ? { status: 'event', eventSlug: saved } : { status: 'loading' };
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (state.status !== 'loading') return;
    let active = true;
    import('./eventApi')
      .then(({ resolveEvent }) => resolveEvent({ publicId }))
      .then((result) => {
        if (!active) return;
        setState(result.kind === 'event' ? { status: 'event', eventSlug: result.event.eventSlug } : { status: 'code' });
      })
      .catch(() => active && setState({ status: 'offline' }));
    return () => {
      active = false;
    };
  }, [publicId, state.status, attempt]);

  if (state.status === 'event') return <Navigate to={`/s/${publicId}/${state.eventSlug}`} replace />;
  if (state.status === 'code') return <CodeScreen publicId={publicId} />;
  if (state.status === 'offline') {
    return (
      <OfflineScreen
        onRetry={() => {
          setState({ status: 'loading' });
          setAttempt((n) => n + 1);
        }}
      />
    );
  }
  return <LoadingScreen />;
}
