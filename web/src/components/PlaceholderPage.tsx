import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { otherLanguage } from '../i18n';
import { Screen } from './ui';

export interface PlaceholderPageProps {
  /** i18n key under `pages`, e.g. "gallery". */
  pageKey: string;
  children?: ReactNode;
}

/** Phase 0 placeholder: shows the page name in both languages. */
export function PlaceholderPage({ pageKey, children }: PlaceholderPageProps) {
  const { t, i18n } = useTranslation();
  const tOther = i18n.getFixedT(otherLanguage(i18n.language));
  const titleKey = `pages.${pageKey}.title`;

  return (
    <Screen title={t(titleKey)}>
      <p className="text-ink-2">
        {t('placeholder.otherLanguage')} <span lang={otherLanguage(i18n.language)}>{tOther(titleKey)}</span>
      </p>
      {children}
      <p className="mt-auto border-t border-line pt-4 text-caption text-ink-2">{t('placeholder.note')}</p>
    </Screen>
  );
}
