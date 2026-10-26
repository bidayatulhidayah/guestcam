import { useTranslation } from 'react-i18next';
import { otherLanguage, setLanguage } from '../../i18n';

/** Small EN/BM switch; Malay is the default (D-004). */
export function LanguageToggle() {
  const { t, i18n } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => void setLanguage(otherLanguage(i18n.language))}
      aria-label={t('language.switchLabel')}
      className="min-h-12 rounded-card border border-line px-4 text-caption font-bold text-ink active:bg-paper-2"
    >
      {t('language.switchTo')}
    </button>
  );
}
