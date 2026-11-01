import { normalizeEventCode } from '@guestcam/shared';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button, Screen, TextField } from '../../components/ui';

export type CodeError = { kind: 'wrongCode' } | { kind: 'tooManyTries'; retryAfterMs: number };

export interface CodeScreenProps {
  publicId: string;
  /** Event from the QR entry, when known. Without it the code is matched across the space. */
  eventSlug?: string | null;
  initialError?: CodeError | null;
}

/**
 * The generic code screen (D-036): identical for unknown events, events this
 * phone has not joined, and wrong codes. It never shows names, title or theme.
 */
export function CodeScreen({ publicId, eventSlug = null, initialError = null }: CodeScreenProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(() => describe(initialError));

  function describe(codeError: CodeError | null): string | null {
    if (!codeError) return null;
    if (codeError.kind === 'wrongCode') return t('entry.wrongCode');
    return t('entry.tooManyTries', { minutes: Math.max(1, Math.ceil(codeError.retryAfterMs / 60_000)) });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalized = normalizeEventCode(code);
    if (!normalized) {
      setError(t('entry.invalidCode'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { joinEvent } = await import('./eventApi');
      const result = await joinEvent({ publicId, eventSlug, code: normalized });
      if (result.kind === 'joined') {
        navigate(`/s/${publicId}/${result.event.eventSlug}`, { replace: true });
        return;
      }
      setError(describe(result));
    } catch {
      setError(t('common.offline'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title={t('entry.codeTitle')} back>
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6" noValidate>
        <p>{t('entry.codeBody')}</p>
        <TextField
          label={t('entry.codeLabel')}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
          error={error}
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          maxLength={4}
          className="text-center font-bold tracking-[0.3em] uppercase"
        />
        <div className="mt-auto">
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? t('entry.checking') : t('entry.submit')}
          </Button>
        </div>
      </form>
    </Screen>
  );
}
