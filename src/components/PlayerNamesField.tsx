import { Button } from './Button';

interface Props {
  names: string[];
  onChange: (names: string[]) => void;
  max?: number;
}

/** Éditeur de la liste des joueurs, partagé par tous les modes. */
export function PlayerNamesField({ names, onChange, max = 8 }: Props) {
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
        {names.map((name, i) => (
          <li key={i} className="flex gap-2">
            <input
              value={name}
              onChange={(e) => update(i, e.target.value)}
              onFocus={(e) => e.target.select()}
              aria-label={`Nom du joueur ${i + 1}`}
              maxLength={20}
              className="min-h-14 w-full min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 text-lg text-cream
                focus:outline-2 focus:outline-cream"
            />
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
        ))}
      </ul>
      {names.length < max && (
        <Button variant="surface" onClick={add}>
          + Ajouter un joueur
        </Button>
      )}
    </>
  );
}
