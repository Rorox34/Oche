import { useMemo, useState } from 'react';
import type { GameScreenProps } from '../types';
import type { SteeplechaseAction, SteeplechaseState } from '../../core/steeplechase/types';
import { hitRate } from '../../core/steeplechase/engine';
import { recommendedDarts } from '../../core/steeplechase/rules';
import { formatConfig, formatConfigShort, formatTarget } from '../../core/steeplechase/format';
import { useAppStore } from '../../store/appStore';
import { Button } from '../../components/Button';
import { DartKeypad } from '../../components/DartKeypad';
import { DartBadge } from '../../components/DartBadge';
import { HistoryDrawer, HistoryButton, type HistoryViewEntry } from '../../components/HistoryDrawer';
import { SettingsButton } from '../../components/Settings';
import { VictoryOverlay } from '../../components/VictoryOverlay';
import { SteeplechasePlayerCard } from './SteeplechasePlayerCard';

export function SteeplechaseGame({
  state,
  dispatch,
  undo,
  canUndo,
  onQuit,
  onNewGame,
}: GameScreenProps<SteeplechaseState, SteeplechaseAction>) {
  const { players, currentPlayer, currentVisit, targets, config, phase, winner } = state;
  const current = players[currentPlayer];
  const smartKeypad = useAppStore((s) => s.settings.smartKeypad);
  const [historyOpen, setHistoryOpen] = useState(false);

  const recommended = useMemo(
    () => (smartKeypad && phase === 'playing' ? recommendedDarts(targets[current.hurdleIndex]) : []),
    [smartKeypad, phase, targets, current.hurdleIndex],
  );

  const visitAdvance = current.hurdleIndex - state.visitStartHurdle;

  const upcoming = targets.slice(current.hurdleIndex + 1, current.hurdleIndex + 4).map(formatTarget);

  const historyEntries: HistoryViewEntry[] = state.log.map((entry) => ({
    playerName: players[entry.player]?.name ?? `Joueur ${entry.player + 1}`,
    meta: `Haie ${entry.target}`,
    darts: entry.darts,
    badge: entry.finish
      ? { label: 'Arrivée', tone: 'green' as const }
      : entry.advance < 0
        ? { label: 'Chute', tone: 'red' as const }
        : undefined,
    value: entry.finish || entry.advance < 0 ? undefined : `+${entry.advance}`,
    gold: entry.advance >= 3,
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
          Steeplechase · {formatConfigShort(config)}
        </span>
        <HistoryButton open={historyOpen} onClick={() => setHistoryOpen(true)} />
        <SettingsButton />
      </header>

      <div className={`grid gap-2 ${gridCols}`}>
        {players.map((p, i) => (
          <SteeplechasePlayerCard
            key={i}
            player={p}
            targetLabel={formatTarget(targets[p.hurdleIndex])}
            progress={Math.min(1, p.hurdleIndex / targets.length)}
            active={i === currentPlayer && phase === 'playing'}
            compact={players.length > 2}
          />
        ))}
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
          aria-label={`Haies franchies dans cette volée : ${visitAdvance}`}
          className={`flex h-12 min-w-16 items-center justify-center rounded-xl px-2 font-display text-xl font-bold tabular-nums
            ${visitAdvance > 0 ? 'bg-green text-board' : 'bg-cream text-board'}`}
        >
          +{visitAdvance}
        </div>
      </div>

      <div className="flex h-20 flex-col items-center justify-center gap-1" role="status">
        <div className="flex items-center gap-2">
          <span className="text-sm uppercase tracking-widest text-muted">Haie</span>
          <span className="font-display text-3xl font-bold tabular-nums text-cream">
            {formatTarget(targets[current.hurdleIndex])}
          </span>
        </div>
        {upcoming.length > 0 && (
          <span className="text-sm text-muted">Ensuite : {upcoming.join(' · ')}</span>
        )}
      </div>

      <div className="mt-auto">
        <DartKeypad
          onDart={(dart) => dispatch({ type: 'dart', dart })}
          undo={undo}
          canUndo={canUndo}
          recommended={recommended}
        />
      </div>

      <HistoryDrawer entries={historyEntries} open={historyOpen} onClose={() => setHistoryOpen(false)} />

      {phase === 'matchOver' && winner !== null && (
        <VictoryOverlay
          winnerName={players[winner].name}
          stats={[
            { label: 'Fléchettes', value: String(players[winner].dartsThrown) },
            { label: 'Tours', value: String(players[winner].visits) },
            { label: 'Chutes', value: String(players[winner].falls) },
            { label: 'Réussite', value: `${hitRate(players[winner]) ?? 0}%` },
          ]}
          rules={formatConfig(config)}
          onRematch={() => dispatch({ type: 'restart' })}
          onNewGame={onNewGame}
          onQuit={onQuit}
        />
      )}
    </div>
  );
}
