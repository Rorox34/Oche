import { useMemo, useState } from 'react';
import type { GameScreenProps } from '../types';
import type { ShanghaiAction, ShanghaiState } from '../../core/shanghai/types';
import { recommendedDarts } from '../../core/shanghai/rules';
import { formatVariant, formatVariantShort } from '../../core/shanghai/format';
import { useAppStore } from '../../store/appStore';
import { Button } from '../../components/Button';
import { CollapsibleKeypad } from '../../components/CollapsibleKeypad';
import { DartKeypad } from '../../components/DartKeypad';
import { DartBadge } from '../../components/DartBadge';
import { HistoryDrawer, HistoryButton, type HistoryViewEntry } from '../../components/HistoryDrawer';
import { SettingsButton } from '../../components/Settings';
import { VictoryOverlay } from '../../components/VictoryOverlay';
import { ShanghaiPlayerCard } from './ShanghaiPlayerCard';

export function ShanghaiGame({
  state,
  dispatch,
  undo,
  canUndo,
  onQuit,
  onNewGame,
}: GameScreenProps<ShanghaiState, ShanghaiAction>) {
  const { players, currentPlayer, currentVisit, targets, config, round, phase, winner } = state;
  const target = targets[round];
  const smartKeypad = useAppStore((s) => s.settings.smartKeypad);
  const [historyOpen, setHistoryOpen] = useState(false);

  const recommended = useMemo(
    () => (smartKeypad && phase === 'playing' ? recommendedDarts(target) : []),
    [smartKeypad, phase, target],
  );

  // Meneur, mis en valeur seulement s'il existe un écart.
  const scores = players.map((p) => p.score);
  const best = Math.max(...scores);
  const hasLeader = new Set(scores).size > 1;

  const upcoming = targets.slice(round + 1, round + 4);

  const historyEntries: HistoryViewEntry[] = state.log.map((entry) => ({
    playerName: players[entry.player]?.name ?? `Joueur ${entry.player + 1}`,
    meta: `Cible ${entry.target}`,
    darts: entry.darts,
    badge: entry.shanghai ? { label: 'Shanghai', tone: 'green' as const } : undefined,
    value: entry.shanghai ? undefined : `+${entry.points}`,
    gold: entry.shanghai || entry.points >= 30,
  }));

  const quit = () => {
    if (phase === 'playing' && !window.confirm('Quitter la partie en cours ?')) return;
    onQuit();
  };

  const gridCols =
    players.length <= 2 ? 'grid-cols-2' : players.length === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-1">
        <Button variant="ghost" onClick={quit} aria-label="Quitter la partie" className="min-h-12 px-3">
          ✕
        </Button>
        <span className="min-w-0 flex-1 truncate text-center font-display text-base font-semibold uppercase tracking-widest text-muted">
          Shanghai · {formatVariantShort(config)}
        </span>
        <HistoryButton open={historyOpen} onClick={() => setHistoryOpen(true)} />
        <SettingsButton />
      </header>

      <div className={`grid gap-2 ${gridCols}`}>
        {players.map((p, i) => (
          <ShanghaiPlayerCard
            key={i}
            player={p}
            active={i === currentPlayer && phase === 'playing'}
            leader={hasLeader && p.score === best}
            compact={players.length > 2}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-1" role="status">
        <span className="text-sm uppercase tracking-widest text-muted">
          Manche {round + 1} / {targets.length}
        </span>
        <span className="font-display text-7xl font-bold leading-none tabular-nums text-cream">
          {target}
        </span>
        <span className="text-sm text-muted">
          Simple {target} · Double {target * 2} · Triple {target * 3}
        </span>
        {config.shanghaiWin && (
          <span className="mt-1 rounded-full border border-gold/50 bg-gold/10 px-3 py-0.5 text-xs font-semibold text-gold">
            ⚡ S + D + T = Shanghai
          </span>
        )}
        {upcoming.length > 0 && (
          <span className="mt-1 text-sm text-muted">Ensuite : {upcoming.join(' · ')}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => {
          const dart = currentVisit[i];
          return (
            <div key={i} className="flex h-12 flex-1 items-center justify-center">
              {dart ? (
                <DartBadge dart={dart} />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-xl border border-line/60 text-muted/40">
                  ·
                </div>
              )}
            </div>
          );
        })}
        <div
          aria-label={`Points dans cette volée : ${state.visitPoints}`}
          className={`flex h-12 min-w-16 items-center justify-center rounded-xl px-2 font-display text-xl font-bold tabular-nums
            ${state.visitPoints > 0 ? 'bg-green text-board' : 'bg-cream text-board'}`}
        >
          +{state.visitPoints}
        </div>
      </div>

      <div>
        <CollapsibleKeypad>
          <DartKeypad
            onDart={(dart) => dispatch({ type: 'dart', dart })}
            undo={undo}
            canUndo={canUndo}
            recommended={recommended}
          />
        </CollapsibleKeypad>
      </div>

      <HistoryDrawer
        entries={historyEntries}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      {phase === 'matchOver' && winner !== null && (
        <VictoryOverlay
          winnerName={players[winner].name}
          stats={[
            { label: 'Score', value: String(players[winner].score) },
            { label: 'Manches', value: String(players[winner].visits) },
            { label: 'Fléchettes', value: String(players[winner].dartsThrown) },
            { label: 'Shanghai', value: state.shanghai ? 'Oui ⚡' : 'Non' },
          ]}
          rules={
            state.shanghai
              ? `SHANGHAI sur le ${target} ! Simple + Double + Triple du même numéro.`
              : formatVariant(config)
          }
          onRematch={() => dispatch({ type: 'restart' })}
          onNewGame={onNewGame}
          onQuit={onQuit}
        />
      )}
    </div>
  );
}
