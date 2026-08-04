import { useEffect, useMemo, useState } from 'react';
import type { GameScreenProps } from '../types';
import type { AtcAction, AtcState } from '../../core/atc/types';
import { hitRate } from '../../core/atc/engine';
import { recommendedDarts } from '../../core/atc/rules';
import { formatDuration, formatTarget, formatVariant, formatVariantShort } from '../../core/atc/format';
import { useAppStore } from '../../store/appStore';
import { Button } from '../../components/Button';
import { CollapsibleKeypad } from '../../components/CollapsibleKeypad';
import { DartKeypad } from '../../components/DartKeypad';
import { DartBadge } from '../../components/DartBadge';
import { HistoryDrawer, HistoryButton, type HistoryViewEntry } from '../../components/HistoryDrawer';
import { SettingsButton } from '../../components/Settings';
import { VictoryOverlay } from '../../components/VictoryOverlay';
import { AtcPlayerCard } from './AtcPlayerCard';

export function AtcGame({
  state,
  dispatch,
  undo,
  canUndo,
  onQuit,
  onNewGame,
}: GameScreenProps<AtcState, AtcAction>) {
  const { players, currentPlayer, currentVisit, config, targets, phase, winner } = state;
  const current = players[currentPlayer];
  const smartKeypad = useAppStore((s) => s.settings.smartKeypad);
  const [historyOpen, setHistoryOpen] = useState(false);

  const recommended = useMemo(
    () =>
      smartKeypad && phase === 'playing'
        ? recommendedDarts(targets[current.targetIndex], config.segmentRule)
        : [],
    [smartKeypad, phase, targets, current.targetIndex, config.segmentRule],
  );

  // Temps de jeu : tic chaque seconde tant que la partie est en cours.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [phase]);
  const elapsed = (state.endedAt ?? now) - state.startedAt;

  const visitHits = current.hits - state.visitStartHits;

  const upcoming = targets
    .slice(current.targetIndex + 1, current.targetIndex + 4)
    .map(formatTarget);

  const historyEntries: HistoryViewEntry[] = state.log.map((entry) => ({
    playerName: players[entry.player]?.name ?? `Joueur ${entry.player + 1}`,
    meta: `Cible ${entry.target}`,
    darts: entry.darts,
    badge: entry.finish ? { label: 'Finish', tone: 'green' as const } : undefined,
    value: entry.finish ? undefined : `+${entry.hits}`,
    gold: entry.hits >= 3,
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
          {formatVariantShort(config)}
        </span>
        <span
          className="shrink-0 font-display text-sm font-semibold tabular-nums text-muted"
          aria-label="Temps de jeu"
        >
          {formatDuration(elapsed)}
        </span>
        <HistoryButton open={historyOpen} onClick={() => setHistoryOpen(true)} />
        <SettingsButton />
      </header>

      <div className={`grid gap-2 ${gridCols}`}>
        {players.map((p, i) => (
          <AtcPlayerCard
            key={i}
            player={p}
            targetLabel={formatTarget(targets[p.targetIndex])}
            progress={Math.min(1, p.targetIndex / targets.length)}
            hitsPerTarget={config.hitsPerTarget}
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
          aria-label={`Touches dans cette volée : ${visitHits}`}
          className={`flex h-12 min-w-16 items-center justify-center rounded-xl px-2 font-display text-xl font-bold tabular-nums
            ${visitHits > 0 ? 'bg-green text-board' : 'bg-cream text-board'}`}
        >
          +{visitHits}
        </div>
      </div>

      <div className="flex h-24 flex-col items-center justify-center gap-1" role="status">
        <div className="flex items-center gap-2">
          <span className="text-sm uppercase tracking-widest text-muted">Cible</span>
          <span className="font-display text-3xl font-bold tabular-nums text-cream">
            {formatTarget(targets[current.targetIndex])}
          </span>
          {config.hitsPerTarget > 1 && (
            <span className="font-display text-lg text-muted">
              {current.hitsOnTarget} / {config.hitsPerTarget}
            </span>
          )}
        </div>
        {upcoming.length > 0 && (
          <span className="text-sm text-muted">Ensuite : {upcoming.join(' · ')}</span>
        )}
      </div>

      <div className="mt-auto">
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
            { label: 'Fléchettes', value: String(players[winner].dartsThrown) },
            { label: 'Tours', value: String(players[winner].visits) },
            { label: 'Temps', value: formatDuration(elapsed) },
            { label: 'Réussite', value: `${hitRate(players[winner]) ?? 0}%` },
          ]}
          rules={formatVariant(config)}
          onRematch={() => dispatch({ type: 'restart' })}
          onNewGame={onNewGame}
          onQuit={onQuit}
        />
      )}
    </div>
  );
}
