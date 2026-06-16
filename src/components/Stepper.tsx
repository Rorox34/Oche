interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Suffixe affiché après la valeur (ex. « vies »). */
  suffix?: string;
}

const BTN = `flex min-h-14 w-16 items-center justify-center rounded-2xl border border-line bg-surface
  font-display text-3xl font-semibold text-cream transition-transform duration-75 touch-manipulation
  active:scale-[0.95] active:bg-line disabled:pointer-events-none disabled:opacity-35
  focus-visible:outline-2 focus-visible:outline-cream`;

/** Sélecteur numérique incrémental (− valeur +), borné [min, max]. */
export function Stepper({ label, value, onChange, min = 1, max = 99, suffix }: Props) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)));

  return (
    <div className="flex items-center justify-between gap-2" role="group" aria-label={label}>
      <button type="button" onClick={() => set(value - 1)} disabled={value <= min} aria-label="Diminuer" className={BTN}>
        −
      </button>
      <span aria-live="polite" className="flex items-baseline gap-2 font-display tabular-nums text-cream">
        <span className="text-5xl font-bold">{value}</span>
        {suffix && <span className="text-base text-muted">{suffix}</span>}
      </span>
      <button type="button" onClick={() => set(value + 1)} disabled={value >= max} aria-label="Augmenter" className={BTN}>
        +
      </button>
    </div>
  );
}
