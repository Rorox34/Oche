import { useState } from 'react';
import type { SetupScreenProps } from '../types';
import type { GolfConfig, GolfHoles, GolfVariant } from '../../core/golf/types';
import { VARIANTS } from '../../core/golf/rules';
import { Button } from '../../components/Button';
import { Segmented } from '../../components/Segmented';
import { FormSection } from '../../components/FormSection';
import { PlayerNamesField } from '../../components/PlayerNamesField';
import { SettingsButton } from '../../components/Settings';

export function GolfSetup({ onStart, onBack }: SetupScreenProps<GolfConfig>) {
  const [variant, setVariant] = useState<GolfVariant>('standard');
  const [holes, setHoles] = useState<GolfHoles>(9);
  const [names, setNames] = useState<string[]>(['Joueur 1', 'Joueur 2']);

  const start = () =>
    onStart({
      variant,
      holes,
      playerNames: names.map((n, i) => n.trim() || `Joueur ${i + 1}`),
    });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack} aria-label="Retour à l'accueil" className="min-h-12 px-3">
          ←
        </Button>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Golf</h1>
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
          Un trou par numéro : on vise ce numéro avec 3 fléchettes. Score le plus bas gagne.
        </p>
      </FormSection>

      <FormSection label="Score">
        <Segmented
          label="Score"
          value={variant}
          onChange={setVariant}
          options={[
            { value: 'standard', label: 'Standard' },
            { value: 'darts', label: 'Au plus court' },
            { value: 'cricket', label: 'Cricket' },
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
