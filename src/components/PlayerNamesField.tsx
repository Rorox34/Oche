import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { normalizeName, suggestNames } from '../store/profiles';
import { Button } from './Button';

interface Props {
  names: string[];
  onChange: (names: string[]) => void;
  max?: number;
}

/** Éditeur de la liste des joueurs, avec suggestions des joueurs connus. */
export function PlayerNamesField({ names, onChange, max = 8 }: Props) {
  const profiles = useAppStore((s) => s.profiles);
  const [focused, setFocused] = useState<number | null>(null);

  const update = (index: number, value: string) =>
    onChange(names.map((n, i) => (i === index ? value : n)));

  const add = () => {
    if (names.length < max) onChange([...names, `Joueur ${names.length + 1}`]);
  };

  const remove = (index: number) => {
    if (names.length > 1) onChange(names.filter((_, i) => i !== index));
  };

  return (
    <>
      <ul className="flex flex-col gap-2">
        {names.map((name, i) => {
          const others = names.filter((_, j) => j !== i);
          const suggestions = focused === i ? suggestNames(profiles, name, others) : [];
          return (
            <li key={i} className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <input
                  value={name}
                  onChange={(e) => update(i, e.target.value)}
                  onFocus={(e) => {
                    e.target.select();
                    setFocused(i);
                  }}
                  onBlur={() => setFocused((f) => (f === i ? null : f))}
                  aria-label={`Nom du joueur ${i + 1}`}
                  autoComplete="off"
                  maxLength={20}
                  className="min-h-14 w-full rounded-2xl border border-line bg-surface px-4 text-lg text-cream
                    focus:outline-2 focus:outline-cream"
                />
                {suggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
                    {suggestions.map((s) => {
                      const profile = profiles[normalizeName(s)];
                      return (
                        <li key={s}>
                          <button
                            type="button"
                            // évite que le blur de l'input ne ferme la liste avant le clic
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              update(i, s);
                              setFocused(null);
                            }}
                            className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left
                              text-cream transition-colors touch-manipulation active:bg-line"
                          >
                            <span className="truncate">{s}</span>
                            <span className="shrink-0 text-xs text-muted">
                              {profile?.games}{' '}partie{(profile?.games ?? 0) > 1 ? 's' : ''}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {names.length > 1 && (
                <Button
                  variant="ghost"
                  onClick={() => remove(i)}
                  aria-label={`Retirer ${name || `le joueur ${i + 1}`}`}
                  className="px-4"
                >
                  ✕
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {names.length < max && (
        <Button variant="surface" onClick={add}>
          + Ajouter un joueur
        </Button>
      )}
    </>
  );
}
