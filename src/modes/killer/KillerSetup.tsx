import { useState } from 'react';
import type { SetupScreenProps } from '../types';
import type { KillerConfig, KillerEntry } from '../../core/killer/types';
import { entryDescription } from '../../core/killer/format';
import { Button } from '../../components/Button';
import { Segmented } from '../../components/Segmented';
import { FormSection } from '../../components/FormSection';
import { PlayerNamesField } from '../../components/PlayerNamesField';
import { SettingsButton } from '../../components/Settings';

export function KillerSetup({ onStart, onBack }: SetupScreenProps<KillerConfig>) {
  const [lives, setLives] = useState(3);
  const [entry, setEntry] = useState<KillerEntry>('bull');
  const [healOnKill, setHealOnKill] = useState(false);
  const [names, setNames] = useState<string[]>(['Joueur 1', 'Joueur 2']);

  const start = () =>
    onStart({
      lives,
      entry,
      healOnKill,
      playerNames: names.map((n, i) => n.trim() || `Joueur ${i + 1}`),
    });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack} aria-label="Retour à l'accueil" className="min-h-12 px-3">
          ←
        </Button>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Killer</h1>
        <SettingsButton className="ml-auto" />
      </header>

      <FormSection label="Vies">
        <Segmented
          label="Vies"
          value={lives}
          onChange={setLives}
          options={[3, 4, 5, 7].map((n) => ({ value: n, label: String(n) }))}
        />
        <p className="text-xs text-muted">
          Un numéro est attribué à chaque joueur. Une fois tueur, touchez le numéro d'un adversaire
          pour lui retirer des vies (simple 1, double 2, triple 3).
        </p>
      </FormSection>

      <FormSection label="Entrée">
        <Segmented
          label="Entrée"
          value={entry}
          onChange={setEntry}
          options={[
            { value: 'bull', label: 'Bull' },
            { value: 'double', label: 'Double' },
            { value: 'prison', label: 'Prison' },
          ]}
        />
        <p className="text-xs text-muted">{entryDescription(entry)}</p>
      </FormSection>

      <FormSection label="Soin sur élimination">
        <Segmented
          label="Soin sur élimination"
          value={healOnKill}
          onChange={setHealOnKill}
          options={[
            { value: true, label: 'Activé' },
            { value: false, label: 'Désactivé' },
          ]}
        />
        <p className="text-xs text-muted">Éliminer un adversaire restaure toutes vos vies.</p>
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
