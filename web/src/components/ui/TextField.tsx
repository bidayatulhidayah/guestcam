import { useId, type InputHTMLAttributes } from 'react';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** One short line under the field. */
  hint?: string;
  /** Shown instead of the hint, announced to screen readers. */
  error?: string | null;
}

/** Single-line input on raised paper (design.md: 16px text, 48px tall, D-092). */
export function TextField({ label, hint, error, className = '', ...rest }: TextFieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-bold text-ink">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className={[
          'min-h-12 w-full rounded-card border bg-paper-2 px-3 text-body text-ink',
          error ? 'border-danger' : 'border-line',
          className,
        ].join(' ')}
        {...rest}
      />
      {note ? (
        <p id={noteId} role={error ? 'alert' : undefined} className={error ? 'text-danger' : 'text-caption text-ink-2'}>
          {note}
        </p>
      ) : null}
    </div>
  );
}
