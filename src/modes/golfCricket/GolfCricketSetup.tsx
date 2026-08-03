import { useState } from 'react';
import type { SetupScreenProps } from '../types';
import type { GolfCricketConfig, GolfCricketHoles } from '../../core/golfCricket/types';
import { Button } from '../../components/Button';
import { Segmented } from '../../components/Segmented';
import { FormSection } from '../../components/FormSection';
import { PlayerNamesField } from '../../components/PlayerNamesField';
import { SettingsButton } from '../../components/Settings';

export function GolfCricketSetup({ onStart, onBack }: SetupScreenProps<GolfCricketConfig>) {
  const [holes, setHoles] = useState<GolfCricketHoles>(9);
  const [names, setNames] = useState<string[]>(['Joueur 1', 'Joueur 2']);

  const start = () =>
    onStart({
      holes,
      playerNames: names.map((n, i) => n.trim() || `Joueur ${i + 1}`),
    });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack} aria-label="Retour à l'accueil" className="min-h-12 px-3">
          ←
        </Button>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Golf Cricket</h1>
        <SettingsButton className="ml-auto" />
      </header>

      <FormSection label="Trous">
        <Segmented
          label="Trous"
          value={holes}
          onChange={setHoles}
          options={[
            { value: 9, label: '9 (1 → 9)' },
            { value: 18, label: '18 (1 → 18)' },
          ]}
        />
        <p className="text-xs text-muted">
          Un trou par numéro : fermez-le en accumulant 3 marques (simple = 1, double = 2, triple =
          3 — ferme d'un coup). Un trou fermé attend que tous les joueurs l'aient fermé avant de
          passer au suivant. Chaque fléchette lancée, touchée ou manquée, compte un coup : fermez
          le plus vite possible pour avoir le score le plus bas.
        </p>
      </FormSection>

      <FormSection label="Joueurs">
        <PlayerNamesField names={names} onChange={setNames} />
      </FormSection>

      <Button variant="primary" onClick={start} className="mt-auto min-h-16 text-xl">
        Lancer la partie
      </Button>
    </div>
  );
}
