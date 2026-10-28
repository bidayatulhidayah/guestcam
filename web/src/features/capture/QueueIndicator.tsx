import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui';
import type { QueueSummary } from './useQueueSummary';

export interface QueueIndicatorProps {
  summary: QueueSummary;
  onSendNow: () => void;
  onRepick: () => void;
  onRetry: () => void;
}

function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

/**
 * Upload queue status on the menu: words plus one accent progress bar
 * (design.md: status uses words and icons, not extra colours).
 */
export function QueueIndicator({ summary, onSendNow, onRepick, onRetry }: QueueIndicatorProps) {
  const { t } = useTranslation();
  const online = useOnline();
  const pending = summary.waiting + (summary.uploading ? 1 : 0);
  const nothingToShow = pending === 0 && summary.held === 0 && summary.needsRepick === 0 && summary.failed === 0;

  if (nothingToShow) {
    return summary.sent > 0 ? (
      <p role="status" className="text-caption text-ink-2">
        {t('queue.allSent', { count: summary.sent })}
      </p>
    ) : null;
  }

  return (
    <section aria-live="polite" className="flex flex-col gap-3 rounded-card border border-line bg-paper-2 p-4">
      {pending > 0 ? (
        <>
          <p className="font-bold">{t('queue.waiting', { count: pending })}</p>
          {summary.uploading ? (
            <>
              <p className="text-caption">
                {summary.uploading.resumed
                  ? t('queue.resuming')
                  : t('queue.sending', { percent: summary.uploading.percent })}
              </p>
              <div
                role="progressbar"
                aria-label={t('queue.progressLabel')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={summary.uploading.percent}
                className="h-2 w-full overflow-hidden rounded-card bg-paper"
              >
                <div className="h-full bg-accent" style={{ width: `${summary.uploading.percent}%` }} />
              </div>
            </>
          ) : null}
          <p className="text-caption text-ink-2">{online ? t('queue.keepOpen') : t('queue.offline')}</p>
        </>
      ) : null}

      {summary.held > 0 ? (
        <>
          <p className="font-bold">{t('queue.held', { count: summary.held })}</p>
          <Button onClick={onSendNow}>{t('queue.sendNow')}</Button>
        </>
      ) : null}

      {summary.needsRepick > 0 ? (
        <>
          <p className="font-bold">{t('queue.needsRepick', { count: summary.needsRepick })}</p>
          <Button onClick={onRepick}>{t('queue.repick')}</Button>
        </>
      ) : null}

      {summary.failed > 0 ? (
        <>
          <p className="font-bold">{t('queue.failed', { count: summary.failed })}</p>
          <Button onClick={onRetry}>{t('queue.retry')}</Button>
        </>
      ) : null}
    </section>
  );
}
