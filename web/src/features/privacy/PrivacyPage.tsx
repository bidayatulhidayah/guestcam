import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Screen, type IconName } from '../../components/ui';
import type { PrivacyChoice } from './privacyChoice';

interface ChoiceCardProps {
  icon: IconName;
  title: string;
  body: string;
  /** The default answer is marked with the accent. */
  highlighted?: boolean;
  onClick: () => void;
}

/** A large card that answers the question with one tap (design.md: one question per screen). */
function ChoiceCard({ icon, title, body, highlighted = false, onClick }: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex min-h-32 w-full items-center gap-4 rounded-card border p-5 text-left',
        'transition-colors duration-150 active:bg-accent-tint',
        highlighted ? 'border-2 border-accent bg-paper-2' : 'border-line bg-paper-2',
      ].join(' ')}
    >
      <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center text-accent">
        <Icon name={icon} size={32} />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-button font-bold">{title}</span>
        <span className="text-ink-2">{body}</span>
      </span>
    </button>
  );
}

/**
 * First upload of the event (spec: Privacy and gallery logic): Peribadi or
 * Awam on one full screen, Peribadi first and marked as the default; for Awam
 * a second screen asks about the name. The captures are already saved on the
 * phone and wait for the answer.
 */
export function PrivacyPage({ onDone }: { onDone: (choice: PrivacyChoice) => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'visibility' | 'name'>('visibility');

  if (step === 'name') {
    return (
      <Screen title={t('privacy.nameTitle')}>
        <ChoiceCard
          icon="user"
          title={t('privacy.showName')}
          body={t('privacy.showNameBody')}
          onClick={() => onDone({ visibility: 'public', showName: true })}
        />
        <ChoiceCard
          icon="userHidden"
          title={t('privacy.hideName')}
          body={t('privacy.hideNameBody')}
          onClick={() => onDone({ visibility: 'public', showName: false })}
        />
      </Screen>
    );
  }

  return (
    <Screen title={t('privacy.title')}>
      <ChoiceCard
        icon="lock"
        title={t('privacy.privateTitle')}
        body={t('privacy.privateBody')}
        highlighted
        onClick={() => onDone({ visibility: 'private', showName: false })}
      />
      <ChoiceCard
        icon="gallery"
        title={t('privacy.publicTitle')}
        body={t('privacy.publicBody')}
        onClick={() => setStep('name')}
      />
      <p className="text-ink-2">{t('privacy.changeLater')}</p>
    </Screen>
  );
}
