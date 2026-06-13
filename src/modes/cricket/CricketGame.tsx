import { useMemo, useState } from 'react';
import type { GameScreenProps } from '../types';
import type { CricketAction, CricketState } from '../../core/cricket/types';
import { closedCount, mpr } from '../../core/cricket/engine';
import { MARKS_TO_CLOSE, VARIANTS, recommendedDarts } from '../../core/cricket/rules';
import { formatTarget, formatVariant, formatVariantShort } from '../../core/cricket/format';
import { useAppStore } from '../../store/appStore';
import { Button } from '../../components/Button';
import { DartKeypad } from '../../components/DartKeypad';
import { DartBadge } from '../../components/DartBadge';
import { HistoryDrawer, HistoryButton, type HistoryViewEntry } from '../../components/HistoryDrawer';
import { SettingsButton } from '../../components/Settings';
import { VictoryOverlay } from '../../components/VictoryOverlay';
import { CricketBoard } from './CricketBoard';

export function CricketGame({
  state,
  dispatch,
  undo,
  canUndo,
  onQuit,
  onNewGame,
}: GameScreenProps<CricketState, CricketAction>) {
  const { players, currentPlayer, currentVisit, targets, config, phase, winner } = state;
  const current = players[currentPlayer];
  const spec = VARIANTS[config.variant];
  const smartKeypad = useAppStore((s) => s.settings.smartKeypad);
  const [historyOpen, setHistoryOpen] = useState(false);

  const recommended = useMemo(
    () => (smartKeypad && phase === 'playing' ? recommendedDarts(targets, current) : []),
    [smartKeypad, phase, targets, current],
  );

  const visitMarks = current.totalMarks - state.visitStartMarks;

  const remaining = targets
    .filter((_, i) => current.marks[i] < MARKS_TO_CLOSE)
    .map(formatTarget);

  const historyEntries: HistoryViewEntry[] = state.log.map((entry) => ({
    playerName: players[entry.player]?.name ?? `Joueur ${entry.player + 1}`,
    meta: `${entry.marks} marque${entry.marks > 1 ? 's' : ''}`,
    darts: entry.darts,
    badge: entry.finish ? { label: 'Finish', tone: 'green' as const } : undefined,
    value: spec.scores && entry.points > 0 ? `+${entry.points}` : undefined,
    gold: entry.points >= 50,
  }));

  const quit = () => {
    if (phase === 'playing' && !window.confirm('Quitter la partie en cours ?')) return;
    onQuit();
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-1">
        <Button variant="ghost" onClick={quit} aria-label="Quitter la partie" className="min-h-12 px-3">
          ✕
        </Button>
        <span className="min-w-0 flex-1 truncate text-center font-display text-base font-semibold uppercase tracking-widest text-muted">
          Cricket · {formatVariantShort(config)}
        </span>
        <HistoryButton open={historyOpen} onClick={() => setHistoryOpen(true)} />
        <SettingsButton />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <CricketBoard
          targets={targets}
          players={players}
          currentPlayer={currentPlayer}
          variant={config.variant}
        />
      </div>

      <p className="truncate text-center text-sm text-muted" role="status">
        {remaining.length > 0 ? (
          <>
            <span className="text-cream">{current.name}</span> doit fermer : {remaining.join(' · ')}
          </>
        ) : (
          <span className="text-cream">{current.name} a tout fermé — prends l'avance !</span>
        )}
      </p>

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
          aria-label={`Marques dans cette volée : ${visitMarks}`}
          className={`flex h-12 min-w-16 items-center justify-center rounded-xl px-2 font-display text-xl font-bold tabular-nums
            ${visitMarks > 0 ? 'bg-green text-board' : 'bg-cream text-board'}`}
        >
          {visitMarks} ◎
        </div>
      </div>

      <div>
        <DartKeypad
          onDart={(dart) => dispatch({ type: 'dart', dart })}
          undo={undo}
          canUndo={canUndo}
          recommended={recommended}
        />
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
            ...(spec.scores ? [{ label: 'Score', value: String(players[winner].score) }] : []),
            { label: 'Cibles', value: `${closedCount(players[winner])}/${targets.length}` },
            { label: 'MPR', value: (mpr(players[winner]) ?? 0).toFixed(1) },
            { label: 'Fléchettes', value: String(players[winner].dartsThrown) },
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
