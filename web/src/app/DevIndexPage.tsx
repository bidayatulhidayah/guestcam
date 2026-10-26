import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Screen } from '../components/ui';
import { USE_EMULATORS, buildPublicUrl } from '../config';
import {
  DEV_ALIAS,
  DEV_EVENT_CODE,
  DEV_EVENT_SLUG,
  DEV_INACTIVE_ALIAS,
  DEV_PUBLIC_ID,
} from '../features/entry/devFixtures';
import { DevFirebaseStatus } from './DevFirebaseStatus';

const permanent = `/s/${DEV_PUBLIC_ID}`;
const alias = `/${DEV_ALIAS}`;

/** Phase 0 home: links to every placeholder page, for checking on a phone. */
const links: { path: string; pageKey: string }[] = [
  { path: permanent, pageKey: 'currentEvent' },
  { path: `${permanent}/${DEV_EVENT_SLUG}-${DEV_EVENT_CODE.toUpperCase()}`, pageKey: 'eventJoin' },
  { path: `${permanent}/${DEV_EVENT_SLUG}`, pageKey: 'codeScreen' },
  { path: `${permanent}/${DEV_EVENT_SLUG}/gallery`, pageKey: 'gallery' },
  { path: alias, pageKey: 'currentEvent' },
  { path: `${alias}/${DEV_EVENT_SLUG}-${DEV_EVENT_CODE}`, pageKey: 'eventJoin' },
  { path: `/${DEV_INACTIVE_ALIAS}`, pageKey: 'aliasInactive' },
  { path: '/mine', pageKey: 'mine' },
  { path: '/login', pageKey: 'login' },
  { path: '/admin', pageKey: 'admin' },
];

export function DevIndexPage() {
  const { t } = useTranslation();
  return (
    <Screen eyebrow={t('appName')} title={t('pages.devIndex.title')}>
      <p className="text-ink-2">{t('pages.devIndex.body')}</p>
      <ul className="flex flex-col border-t border-line">
        {links.map(({ path, pageKey }) => (
          <li key={path} className="border-b border-line">
            <Link to={path} className="flex min-h-16 flex-col justify-center py-2 active:bg-paper-2">
              <span className="font-bold text-accent">{t(`pages.${pageKey}.title`)}</span>
              <span className="text-caption break-all text-ink-2">{path}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-caption break-all text-ink-2">QR: {buildPublicUrl(permanent)}</p>
      {USE_EMULATORS ? <DevFirebaseStatus /> : null}
    </Screen>
  );
}
