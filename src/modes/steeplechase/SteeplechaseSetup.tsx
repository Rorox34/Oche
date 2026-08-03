import { useState } from 'react';
import type { SetupScreenProps } from '../types';
import type { SteeplechaseConfig } from '../../core/steeplechase/types';
import { Button } from '../../components/Button';
import { Segmented } from '../../components/Segmented';
import { FormSection } from '../../components/FormSection';
import { PlayerNamesField } from '../../components/PlayerNamesField';
import { SettingsButton } from '../../components/Settings';

export function SteeplechaseSetup({ onStart, onBack }: SetupScreenProps<SteeplechaseConfig>) {
  const [finalBull, setFinalBull] = useState(true);
  const [names, setNames] = useState<string[]>(['Joueur 1', 'Joueur 2']);

  const start = () =>
    onStart({
      finalBull,
      playerNames: names.map((n, i) => n.trim() || `Joueur ${i + 1}`),
    });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack} aria-label="Retour à l'accueil" className="min-h-12 px-3">
          ←
        </Button>
        <h1 className="min-w-0 font-display text-3xl font-bold uppercase tracking-wide">Steeplechase</h1>
        <SettingsButton className="ml-auto" />
      </header>

      <FormSection label="Parcours">
        <p className="text-xs text-muted">
          Une course : le premier à franchir les 20 haies (1 → 20) gagne. Touchez votre haie en
          simple pour la franchir, en double pour en sauter 2 d'un coup, en triple pour en sauter 3.
          Une volée de 3 fléchettes qui ne touche jamais la haie visée fait <strong>chuter</strong> le
          cheval, qui recule d'une haie.
        </p>
      </FormSection>

      <FormSection label="Ligne d'arrivée">
        <Segmented
          label="Ligne d'arrivée"
          value={finalBull}
          onChange={setFinalBull}
          options={[
            { value: true, label: 'Avec Bull' },
            { value: false, label: 'Sans Bull' },
          ]}
        />
        <p className="text-xs text-muted">
          {finalBull
            ? 'Dernière haie : le Bull (25 ou 50).'
            : 'La course s’arrête à la 20e haie.'}
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
