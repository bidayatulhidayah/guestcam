import { useTranslation } from 'react-i18next';
import type { PrivacyChoice } from './privacyChoice';

interface SegmentProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** Two-way switch: both words always visible, the chosen one filled with the accent. */
function Segment<T extends string>({ label, value, options, onChange }: SegmentProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex items-center justify-between gap-3">
      <span className="text-caption text-ink-2">{label}</span>
      <span className="flex overflow-hidden rounded-card border border-ink">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            className={[
              'min-h-12 px-4 text-body font-bold transition-colors duration-150',
              option.value === value ? 'bg-accent text-on-accent' : 'bg-transparent text-ink active:bg-paper-2',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </span>
    </div>
  );
}

/**
 * After the first answer, later uploads use this small switch on the menu;
 * it remembers the last choice (spec: Privacy and gallery logic).
 */
export function PrivacySwitch({ choice, onChange }: { choice: PrivacyChoice; onChange: (choice: PrivacyChoice) => void }) {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col gap-2">
      <Segment
        label={t('privacy.sendAs')}
        value={choice.visibility}
        options={[
          { value: 'private', label: t('privacy.privateTitle') },
          { value: 'public', label: t('privacy.publicTitle') },
        ]}
        onChange={(visibility) => onChange({ visibility, showName: visibility === 'public' ? choice.showName : false })}
      />
      {choice.visibility === 'public' ? (
        <Segment
          label={t('privacy.nameInGallery')}
          value={choice.showName ? 'shown' : 'hidden'}
          options={[
            { value: 'shown', label: t('privacy.shown') },
            { value: 'hidden', label: t('privacy.hidden') },
          ]}
          onChange={(shown) => onChange({ visibility: 'public', showName: shown === 'shown' })}
        />
      ) : null}
    </section>
  );
}
