import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Screen, TextField } from '../../components/ui';
import { useEvent } from '../entry/EventContext';
import { CoupleHeader } from './CoupleHeader';

const MAX_NAME = 40;

/** Welcome: couple names, event title and one question, the guest's name. */
export function WelcomePage({ onDone }: { onDone: (displayName: string) => void }) {
  const { t } = useTranslation();
  const event = useEvent();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(formEvent: FormEvent) {
    formEvent.preventDefault();
    const trimmed = name.trim().replace(/\s+/g, ' ');
    if (!trimmed) {
      setError(t('welcome.nameRequired'));
      return;
    }
    onDone(trimmed.slice(0, MAX_NAME));
  }

  return (
    <Screen>
      <CoupleHeader event={event} />
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6" noValidate>
        <TextField
          label={t('welcome.nameLabel')}
          hint={t('welcome.nameHint')}
          error={error}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          maxLength={MAX_NAME}
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
        />
        <div className="mt-auto">
          <Button type="submit" variant="primary">
            {t('welcome.continue')}
          </Button>
        </div>
      </form>
    </Screen>
  );
}
