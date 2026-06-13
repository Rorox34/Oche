import { useState } from 'react';
import type { SetupScreenProps } from '../types';
import type { InRule, OutRule, X01Config } from '../../core/x01/types';
import { Button } from '../../components/Button';
import { Segmented } from '../../components/Segmented';
import { FormSection } from '../../components/FormSection';
import { PlayerNamesField } from '../../components/PlayerNamesField';
import { SettingsButton } from '../../components/Settings';

export function X01Setup({ onStart, onBack }: SetupScreenProps<X01Config>) {
  const [startScore, setStartScore] = useState<301 | 501>(501);
  const [inRule, setInRule] = useState<InRule>('straight');
  const [outRule, setOutRule] = useState<OutRule>('double');
  const [legsToWin, setLegsToWin] = useState(1);
  const [names, setNames] = useState<string[]>(['Joueur 1', 'Joueur 2']);

  const start = () =>
    onStart({
      startScore,
      inRule,
      outRule,
      legsToWin,
      playerNames: names.map((n, i) => n.trim() || `Joueur ${i + 1}`),
    });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack} aria-label="Retour à l'accueil" className="min-h-12 px-3">
          ←
        </Button>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">301 / 501</h1>
        <SettingsButton className="ml-auto" />
      </header>

      <FormSection label="Score de départ">
        <Segmented
          label="Score de départ"
          value={startScore}
          onChange={setStartScore}
          options={[
            { value: 301, label: '301' },
            { value: 501, label: '501' },
          ]}
        />
      </FormSection>

      <FormSection label="Entrée">
        <Segmented
          label="Règle d'entrée"
          value={inRule}
          onChange={setInRule}
          options={[
            { value: 'straight', label: 'Direct' },
            { value: 'double', label: 'Double' },
            { value: 'triple', label: 'Triple' },
            { value: 'bull', label: 'Bull' },
          ]}
        />
        {inRule === 'bull' && (
          <p className="text-xs text-muted">Bull in : ouvrir avec 25 ou 50 obligatoire.</p>
        )}
      </FormSection>

      <FormSection label="Sortie">
        <Segmented
          label="Règle de sortie"
          value={outRule}
          onChange={setOutRule}
          options={[
            { value: 'straight', label: 'Direct' },
            { value: 'double', label: 'Double' },
            { value: 'master', label: 'Master' },
          ]}
        />
        {outRule === 'master' && (
          <p className="text-xs text-muted">Master out : terminer sur un double ou un triple.</p>
        )}
      </FormSection>

      <FormSection label="Manches gagnantes">
        <Segmented
          label="Manches gagnantes"
          value={legsToWin}
          onChange={setLegsToWin}
          options={[1, 2, 3, 5].map((n) => ({ value: n, label: String(n) }))}
        />
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
