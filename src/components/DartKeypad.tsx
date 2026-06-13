import { useState } from 'react';
import type { Dart, Multiplier } from '../core/darts';

interface Props {
  onDart: (dart: Dart) => void;
  undo: () => void;
  canUndo: boolean;
  /** Premières fléchettes des routes recommandées (clavier intelligent), par rang. */
  recommended: Dart[];
}

const NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);

const KEY_BASE = `min-h-13 select-none rounded-xl border font-display text-xl font-semibold transition-colors
  touch-manipulation focus-visible:outline-2 focus-visible:outline-cream
  disabled:pointer-events-none disabled:opacity-35`;

const PLAIN = 'border-line bg-surface text-cream active:bg-line';
const REC_PRIMARY = 'border-gold bg-gold/20 text-cream ring-2 ring-gold/60 active:bg-gold/30';
const REC_ALT = 'border-gold/50 bg-surface text-cream active:bg-line';

export function DartKeypad({ onDart, undo, canUndo, recommended }: Props) {
  const [multiplier, setMultiplier] = useState<Multiplier>(1);

  const send = (dart: Dart) => {
    onDart(dart);
    setMultiplier(1);
  };

  const toggle = (m: Multiplier) => setMultiplier((cur) => (cur === m ? 1 : m));

  const rankOf = (value: number, m: Multiplier): number =>
    recommended.findIndex((d) => d.value === value && d.multiplier === m);

  const recStyle = (rank: number): string =>
    rank === 0 ? REC_PRIMARY : rank > 0 ? REC_ALT : PLAIN;

  const hasRecMultiplier = (m: Multiplier): boolean =>
    recommended.some((d) => d.multiplier === m && d.value !== 25);

  const prefix = multiplier === 2 ? 'D' : multiplier === 3 ? 'T' : '';

  const toggleButton = (m: 2 | 3, label: string) => (
    <button
      type="button"
      onClick={() => toggle(m)}
      aria-pressed={multiplier === m}
      className={`${KEY_BASE} relative ${
        multiplier === m ? 'border-cream bg-cream text-board' : PLAIN
      }`}
    >
      {label}
      {hasRecMultiplier(m) && multiplier !== m && (
        <span
          aria-hidden="true"
          className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold"
        />
      )}
    </button>
  );

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        {toggleButton(2, 'Double ×2')}
        {toggleButton(3, 'Triple ×3')}
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {NUMBERS.map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => send({ value: n, multiplier })}
            className={`${KEY_BASE} ${recStyle(rankOf(n, multiplier))}`}
          >
            {prefix}
            {n}
          </button>
        ))}
      </div>

      {/* 25 et 50 toujours accessibles directement, indépendamment des multiplicateurs. */}
      <div className="grid grid-cols-4 gap-1.5">
        <button
          type="button"
          onClick={() => send({ value: 25, multiplier: 1 })}
          aria-label="Bull (25 points)"
          className={`${KEY_BASE} ${
            rankOf(25, 1) === 0 ? REC_PRIMARY : rankOf(25, 1) > 0 ? REC_ALT : 'border-gold/40 bg-surface text-gold active:bg-line'
          }`}
        >
          25
        </button>
        <button
          type="button"
          onClick={() => send({ value: 25, multiplier: 2 })}
          aria-label="Double bull (50 points)"
          className={`${KEY_BASE} ${
            rankOf(25, 2) === 0 ? REC_PRIMARY : rankOf(25, 2) > 0 ? REC_ALT : 'border-gold/40 bg-surface text-gold active:bg-line'
          }`}
        >
          50
        </button>
        <button
          type="button"
          onClick={() => send({ value: 0, multiplier: 1 })}
          className={`${KEY_BASE} border-line bg-surface text-base text-muted active:bg-line`}
        >
          Manqué
        </button>
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          className={`${KEY_BASE} border-red/50 bg-surface text-base text-red active:bg-line`}
        >
          ⟲ Annuler
        </button>
      </div>
    </div>
  );
}
