interface Option<T> {
  value: T;
  label: string;
}

interface Props<T> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string | number | boolean>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl border border-line bg-surface p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`min-h-12 rounded-xl px-3 font-display text-lg font-semibold transition-colors touch-manipulation
              focus-visible:outline-2 focus-visible:outline-cream
              ${active ? 'bg-cream text-board' : 'text-muted active:text-cream'}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
