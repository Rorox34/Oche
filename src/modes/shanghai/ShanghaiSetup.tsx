import { useState } from 'react';
import type { SetupScreenProps } from '../types';
import type { ShanghaiConfig, ShanghaiOrderId, ShanghaiRange } from '../../core/shanghai/types';
import { Button } from '../../components/Button';
import { Segmented } from '../../components/Segmented';
import { FormSection } from '../../components/FormSection';
import { PlayerNamesField } from '../../components/PlayerNamesField';
import { SettingsButton } from '../../components/Settings';

export function ShanghaiSetup({ onStart, onBack }: SetupScreenProps<ShanghaiConfig>) {
  const [range, setRange] = useState<ShanghaiRange>('1-7');
  const [orderId, setOrderId] = useState<ShanghaiOrderId>('ascending');
  const [shanghaiWin, setShanghaiWin] = useState(true);
  const [names, setNames] = useState<string[]>(['Joueur 1', 'Joueur 2']);

  const start = () =>
    onStart({
      range,
      orderId,
      shanghaiWin,
      playerNames: names.map((n, i) => n.trim() || `Joueur ${i + 1}`),
    });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack} aria-label="Retour à l'accueil" className="min-h-12 px-3">
          ←
        </Button>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Shanghai</h1>
        <SettingsButton className="ml-auto" />
      </header>

      <FormSection label="Manches">
        <Segmented
          label="Manches"
          value={range}
          onChange={setRange}
          options={[
            { value: '1-7', label: '1 → 7' },
            { value: '1-10', label: '1 → 10' },
            { value: '1-20', label: '1 → 20' },
          ]}
        />
        <p className="text-xs text-muted">
          Une manche par numéro : on vise uniquement ce numéro avec 3 fléchettes.
        </p>
      </FormSection>

      <FormSection label="Ordre des numéros">
        <Segmented
          label="Ordre des numéros"
          value={orderId}
          onChange={setOrderId}
          options={[
            { value: 'ascending', label: 'Croissant' },
            { value: 'random', label: 'Aléatoire' },
          ]}
        />
      </FormSection>

      <FormSection label="Victoire Shanghai">
        <Segmented
          label="Victoire Shanghai"
          value={shanghaiWin}
          onChange={setShanghaiWin}
          options={[
            { value: true, label: 'Activée' },
            { value: false, label: 'Désactivée' },
          ]}
        />
        <p className="text-xs text-muted">
          Simple + Double + Triple du numéro dans une volée = victoire immédiate.
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
