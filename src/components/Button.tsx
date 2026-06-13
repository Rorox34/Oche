import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'surface' | 'ghost';

const styles: Record<Variant, string> = {
  primary: 'bg-red text-cream active:bg-red/85',
  surface: 'bg-surface text-cream border border-line active:bg-line',
  ghost: 'bg-transparent text-muted active:text-cream',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'surface', className = '', ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`min-h-14 select-none rounded-2xl px-4 font-display text-lg font-semibold uppercase tracking-wide
        transition-transform duration-75 touch-manipulation active:scale-[0.97]
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream
        disabled:pointer-events-none disabled:opacity-35 ${styles[variant]} ${className}`}
    />
  );
}
