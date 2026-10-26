import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_COMMIT, APP_VERSION, COPYRIGHT_OWNER } from '../config';

/** Copyright, app version (shown in bug reports too, pitfall A1) and "Lapor Masalah" (D-019). */
export function Footer() {
  const { t } = useTranslation();
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <footer className="mx-auto w-full max-w-lg border-t border-line px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-caption text-ink-2">
      <button
        type="button"
        onClick={() => setReportOpen((open) => !open)}
        aria-expanded={reportOpen}
        className="min-h-12 w-full rounded-card border border-line px-4 font-bold text-ink active:bg-paper-2"
      >
        {t('footer.reportProblem')}
      </button>
      {reportOpen ? (
        <p role="status" className="mt-2">
          {t('footer.reportProblemSoon')}
        </p>
      ) : null}
      <p className="mt-4">{t('footer.copyright', { year: 2026, owner: COPYRIGHT_OWNER })}</p>
      <p>
        {t('footer.version', { version: `v${APP_VERSION}` })} ({APP_COMMIT})
      </p>
    </footer>
  );
}
