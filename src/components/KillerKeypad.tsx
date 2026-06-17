import { useState } from 'react';
import type { Dart, Multiplier } from '../core/darts';

interface Props {
  onDart: (dart: Dart) => void;
  undo: () => void;
  canUndo: boolean;
  /** Numéros affichés comme touches. */
  numbers: number[];
  /** Numéros désactivés (déjà pris, pendant l'attribution). */
  disabledNumbers?: number[];
  /** Afficher le Bull (25/50) — utile à l'entrée / la prison. */
  showBull?: boolean;
  /** Afficher les bascules Double/Triple (retrait de 2/3 vies). */
  showMultipliers?: boolean;
  /** Afficher la touche Manqué. */
  showMiss?: boolean;
  /** Recommandations du clavier intelligent. */
  recommended?: Dart[];
}

const KEY_BASE = `min-h-14 select-none rounded-xl border font-display text-xl font-semibold transition-colors
  touch-manipulation focus-visible:outline-2 focus-visible:outline-cream
  disabled:pointer-events-none disabled:opacity-25`;

const PLAIN = 'border-line bg-surface text-cream active:bg-line';
const REC_PRIMARY = 'border-gold bg-gold/20 text-cream ring-2 ring-gold/60 active:bg-gold/30';
const REC_ALT = 'border-gold/50 bg-surface text-cream active:bg-line';
const BULL = 'border-gold/40 bg-surface text-gold active:bg-line';

/**
 * Clavier dédié au mode Killer : seulement les numéros utiles (ceux des joueurs)
 * + Manqué, plus le Bull et les multiplicateurs quand ils servent.
 */
export function KillerKeypad({
  onDart,
  undo,
  canUndo,
  numbers,
  disabledNumbers = [],
  showBull = false,
  showMultipliers = false,
  showMiss = true,
  recommended = [],
}: Props) {
  const [multiplier, setMultiplier] = useState<Multiplier>(1);
  const disabled = new Set(disabledNumbers);

  const send = (dart: Dart) => {
    onDart(dart);
    setMultiplier(1);
  };
  const toggle = (m: Multiplier) => setMultiplier((cur) => (cur === m ? 1 : m));

  const rankOf = (value: number, m: Multiplier): number =>
    recommended.findIndex((d) => d.value === value && d.multiplier === m);
  const recStyle = (rank: number): string => (rank === 0 ? REC_PRIMARY : rank > 0 ? REC_ALT : PLAIN);
  const bullStyle = (m: Multiplier): string => {
    const r = rankOf(25, m);
    return r === 0 ? REC_PRIMARY : r > 0 ? REC_ALT : BULL;
  };
  const hasRecMultiplier = (m: Multiplier): boolean =>
    recommended.some((d) => d.multiplier === m && d.value !== 25);

  const prefix = multiplier === 2 ? 'D' : multiplier === 3 ? 'T' : '';

  const toggleButton = (m: 2 | 3, label: string) => (
    <button
      type="button"
      onClick={() => toggle(m)}
      aria-pressed={multiplier === m}
      className={`${KEY_BASE} relative ${multiplier === m ? 'border-cream bg-cream text-board' : PLAIN}`}
    >
      {label}
      {hasRecMultiplier(m) && multiplier !== m && (
        <span aria-hidden="true" className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold" />
      )}
    </button>
  );

  const bottom = [
    showBull && (
      <button
        key="b25"
        type="button"
        onClick={() => send({ value: 25, multiplier: 1 })}
        aria-label="Bull (25)"
        className={`${KEY_BASE} ${bullStyle(1)}`}
      >
        25
      </button>
    ),
    showBull && (
      <button
        key="b50"
        type="button"
        onClick={() => send({ value: 25, multiplier: 2 })}
        aria-label="Double bull (50)"
        className={`${KEY_BASE} ${bullStyle(2)}`}
      >
        50
      </button>
    ),
    showMiss && (
      <button
        key="miss"
        type="button"
        onClick={() => send({ value: 0, multiplier: 1 })}
        className={`${KEY_BASE} border-line bg-surface text-base text-muted active:bg-line`}
      >
        Manqué
      </button>
    ),
    <button
      key="undo"
      type="button"
      onClick={undo}
      disabled={!canUndo}
      className={`${KEY_BASE} border-red/50 bg-surface text-base text-red active:bg-line`}
    >
      ⟲ Annuler
    </button>,
  ].filter(Boolean);

  const numberCols = Math.min(Math.max(numbers.length, 1), 5);

  return (
    <div className="flex flex-col gap-1.5">
      {showMultipliers && (
        <div className="grid grid-cols-2 gap-1.5">
          {toggleButton(2, 'Double ×2')}
          {toggleButton(3, 'Triple ×3')}
        </div>
      )}

      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${numberCols}, minmax(0, 1fr))` }}>
        {numbers.map((n) => (
          <button
            type="button"
            key={n}
            disabled={disabled.has(n)}
            onClick={() => send({ value: n, multiplier })}
            className={`${KEY_BASE} ${disabled.has(n) ? PLAIN : recStyle(rankOf(n, multiplier))}`}
          >
            {prefix}
            {n}
          </button>
        ))}
      </div>

      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${bottom.length}, minmax(0, 1fr))` }}>
        {bottom}
      </div>
    </div>
  );
}
