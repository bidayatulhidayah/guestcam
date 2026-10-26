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

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2">
      <span className="text-ink-2">{label}</span>
      <span className="font-bold break-all">{value}</span>
    </div>
  );
}
