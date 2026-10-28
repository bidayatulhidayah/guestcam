import { isValidPublicId } from '@guestcam/shared';
import { Outlet, useParams } from 'react-router';
import { NotFoundPage } from '../../app/NotFoundPage';

/** `/s/:publicId/*`: a malformed id never reaches the server. */
export function SpaceLayout() {
  const { publicId = '' } = useParams();
  if (!isValidPublicId(publicId.toLowerCase())) return <NotFoundPage />;
  return <Outlet />;
}
