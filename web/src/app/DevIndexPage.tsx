import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Screen } from '../components/ui';
import { buildPublicUrl } from '../config';
import { DevFirebaseStatus } from './DevFirebaseStatus';

/**
 * Dev server only (never in a production build): links to the emulator seed
 * data from `scripts/seed-dev.ts`. Dev codes only; real codes are never in code.
 */
const links: { path: string; label: string }[] = [
  { path: '/s/7k3qmxa/tunang-K7Q2', label: '#10001 tunang (join with code)' },
  { path: '/s/7k3qmxa/tunang', label: '#10001 tunang (no code)' },
  { path: '/s/7k3qmxa', label: '#10001 space link' },
  { path: '/s/zh3k7qm/sanding-m4p8', label: '#00000 sanding (join with code)' },
  { path: '/s/demq2cx/demo-majlis-d3m2', label: '#00001 demo (join with code)' },
  { path: '/zaimhidayah', label: 'Alias (inactive until Phase 4)' },
  { path: '/mine', label: '/mine' },
  { path: '/login', label: '/login' },
  { path: '/admin', label: '/admin' },
];

export function DevIndexPage() {
  const { t } = useTranslation();
  return (
    <Screen eyebrow={t('appName')} title={t('dev.title')}>
      <p className="text-ink-2">{t('dev.body')}</p>
      <ul className="flex flex-col border-t border-line">
        {links.map(({ path, label }) => (
          <li key={path} className="border-b border-line">
            <Link to={path} className="flex min-h-16 flex-col justify-center py-2 active:bg-paper-2">
              <span className="font-bold text-accent">{label}</span>
              <span className="text-caption break-all text-ink-2">{buildPublicUrl(path)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <DevFirebaseStatus />
    </Screen>
  );
}
