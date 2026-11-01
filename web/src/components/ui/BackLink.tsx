import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

/**
 * Very small "Kembali" at the top of code, error and help screens. Without
 * `onBack` it goes to the previous page, and is hidden when there is none
 * (a QR scan opens the link in a fresh tab).
 */
export function BackLink({ onBack }: { onBack?: (() => void) | undefined }) {
  const { t } = useTranslation();
  if (!onBack && window.history.length <= 1) return null;
  return (
    <button
      type="button"
      onClick={onBack ?? (() => window.history.back())}
      className="-ml-2 inline-flex min-h-11 items-center gap-1 self-start px-2 text-caption text-ink-2 active:text-ink"
    >
      <Icon name="arrowLeft" size={18} />
      <span>{t('common.back')}</span>
    </button>
  );
}
