import { useId, type InputHTMLAttributes } from 'react';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** One short line under the field. */
  hint?: string;
  /** Shown instead of the hint, announced to screen readers. */
  error?: string | null;
}

/** Large single-line input on raised paper (design.md: 18px+ text, 64px tall). */
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
          'min-h-16 w-full rounded-card border bg-paper-2 px-4 text-button text-ink',
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
