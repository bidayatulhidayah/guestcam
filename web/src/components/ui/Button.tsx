import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

const variantClasses: Record<ButtonVariant, string> = {
  // The ONE main action on a screen.
  primary: 'bg-accent text-on-accent border-accent active:bg-accent-press active:border-accent-press',
  // Every other action: outlined in ink.
  secondary: 'bg-transparent text-ink border-ink active:bg-paper-2',
  // End call, delete only.
  danger: 'bg-danger text-on-accent border-danger',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Icon shown before the label. Every icon has a word next to it. */
  icon?: ReactNode;
  /** Full width by default (design.md); `false` for inline buttons such as the language toggle. */
  block?: boolean;
}

export function Button({
  variant = 'secondary',
  icon,
  block = true,
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex min-h-16 items-center justify-center gap-3 rounded-card border px-5',
        'text-button font-bold',
        'transition-colors duration-150 disabled:opacity-50',
        block ? 'w-full' : '',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {icon ? (
        <span aria-hidden="true" className="inline-flex size-7 shrink-0 items-center justify-center">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}
