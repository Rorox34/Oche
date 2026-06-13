import { useState } from 'react';
import type { SetupScreenProps } from '../types';
import type { CricketConfig, CricketVariant } from '../../core/cricket/types';
import { VARIANTS } from '../../core/cricket/rules';
import { Button } from '../../components/Button';
import { Segmented } from '../../components/Segmented';
import { FormSection } from '../../components/FormSection';
import { PlayerNamesField } from '../../components/PlayerNamesField';
import { SettingsButton } from '../../components/Settings';

export function CricketSetup({ onStart, onBack }: SetupScreenProps<CricketConfig>) {
  const [variant, setVariant] = useState<CricketVariant>('standard');
  const [names, setNames] = useState<string[]>(['Joueur 1', 'Joueur 2']);

  const start = () =>
    onStart({
      variant,
      playerNames: names.map((n, i) => n.trim() || `Joueur ${i + 1}`),
    });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack} aria-label="Retour à l'accueil" className="min-h-12 px-3">
          ←
        </Button>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Cricket</h1>
        <SettingsButton className="ml-auto" />
      </header>

      <FormSection label="Variante">
        <Segmented
          label="Variante"
          value={variant}
          onChange={setVariant}
          options={[
            { value: 'standard', label: 'Standard' },
            { value: 'cutthroat', label: 'Cut-Throat' },
            { value: 'no-score', label: 'Sans points' },
          ]}
        />
        <p className="text-xs text-muted">{VARIANTS[variant].description}</p>
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
