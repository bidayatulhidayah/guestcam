import { parseSpaceLocation, type SpaceLocation } from '@guestcam/shared';
import { Outlet, useLocation, useOutletContext } from 'react-router';
import { NotFoundPage } from '../../app/NotFoundPage';
import { AliasInactivePage } from './AliasInactivePage';
import { DEV_ACTIVE_ALIASES } from './devFixtures';

type ValidSpaceLocation = Exclude<SpaceLocation, { kind: 'invalid' }>;

export function useSpaceLocation(): ValidSpaceLocation {
  return useOutletContext<ValidSpaceLocation>();
}

/**
 * Wraps every route inside a space, for both `/s/:publicId` and `/:aliasName`.
 * Phase 0: checks the format only and fakes the alias window with dev fixtures;
 * Phase 1 replaces this with the `resolveSpace` server call.
 */
export function SpaceLayout() {
  const { pathname } = useLocation();
  const location = parseSpaceLocation(pathname);

  if (location.kind === 'invalid') {
    // Malformed alias (reserved, all digits...): same neutral page as an inactive one.
    return pathname.toLowerCase().startsWith('/s/') ? <NotFoundPage /> : <AliasInactivePage />;
  }
  if (location.kind === 'alias' && !DEV_ACTIVE_ALIASES.has(location.aliasName)) {
    return <AliasInactivePage />;
  }
  return <Outlet context={location} />;
}
