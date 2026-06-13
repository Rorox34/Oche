import { useState } from 'react';
import type { SetupScreenProps } from '../types';
import type {
  AtcBullRule,
  AtcConfig,
  AtcOrderId,
  AtcSegmentRule,
} from '../../core/atc/types';
import { Button } from '../../components/Button';
import { Segmented } from '../../components/Segmented';
import { FormSection } from '../../components/FormSection';
import { PlayerNamesField } from '../../components/PlayerNamesField';

export function AtcSetup({ onStart, onBack }: SetupScreenProps<AtcConfig>) {
  const [segmentRule, setSegmentRule] = useState<AtcSegmentRule>('any');
  const [orderId, setOrderId] = useState<AtcOrderId>('ascending');
  const [bullRule, setBullRule] = useState<AtcBullRule>('any');
  const [hitsPerTarget, setHitsPerTarget] = useState<1 | 2 | 3>(1);
  const [names, setNames] = useState<string[]>(['Joueur 1', 'Joueur 2']);

  const start = () =>
    onStart({
      segmentRule,
      orderId,
      bullRule,
      hitsPerTarget,
      playerNames: names.map((n, i) => n.trim() || `Joueur ${i + 1}`),
    });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack} aria-label="Retour à l'accueil" className="min-h-12 px-3">
          ←
        </Button>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
          Around the Clock
        </h1>
      </header>

      <FormSection label="Segments valides">
        <Segmented
          label="Segments valides"
          value={segmentRule}
          onChange={setSegmentRule}
          options={[
            { value: 'any', label: 'Tous' },
            { value: 'singles', label: 'Simples' },
            { value: 'doubles', label: 'Doubles' },
            { value: 'triples', label: 'Triples' },
          ]}
        />
      </FormSection>

      <FormSection label="Ordre des numéros">
        <Segmented
          label="Ordre des numéros"
          value={orderId}
          onChange={setOrderId}
          options={[
            { value: 'ascending', label: '1 → 20' },
            { value: 'descending', label: '20 → 1' },
            { value: 'random', label: 'Aléatoire' },
            { value: 'board', label: 'Plateau' },
          ]}
        />
        {orderId === 'board' && (
          <p className="text-xs text-muted">
            Ordre réel du plateau : 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5, 20.
          </p>
        )}
      </FormSection>

      <FormSection label="Bull final">
        <Segmented
          label="Bull final"
          value={bullRule}
          onChange={setBullRule}
          options={[
            { value: 'any', label: '25 ou 50' },
            { value: 'bullseye', label: '50 seul' },
            { value: 'outerThenBullseye', label: '25 puis 50' },
          ]}
        />
        <p className="text-xs text-muted">
          Le bull suit sa propre règle, indépendamment des segments valides.
        </p>
      </FormSection>

      <FormSection label="Touches par cible">
        <Segmented
          label="Touches par cible"
          value={hitsPerTarget}
          onChange={setHitsPerTarget}
          options={([1, 2, 3] as const).map((n) => ({ value: n, label: String(n) }))}
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
