import { useState, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Enveloppe un clavier de saisie (DartKeypad, KillerKeypad…) avec une poignée
 * pour le replier : sur petit écran, le clavier peut cacher une bonne partie
 * du tableau de scores. Ouvert par défaut à chaque partie ou reprise — l'état
 * n'est délibérément pas persisté, pour retrouver la saisie visible à chaque
 * fois qu'on revient sur l'écran de jeu.
 */
export function CollapsibleKeypad({ children }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Masquer la saisie des fléchettes' : 'Afficher la saisie des fléchettes'}
        className="flex h-6 w-16 shrink-0 items-center justify-center rounded-full border border-line/60
          bg-surface text-muted touch-manipulation active:text-cream
          focus-visible:outline-2 focus-visible:outline-cream"
      >
        {open ? '▾' : '▴'}
      </button>
      {open && <div className="w-full">{children}</div>}
    </div>
  );
}
