import { useMemo, useState } from 'react';
import type { GameScreenProps } from '../types';
import type { GolfAction, GolfState } from '../../core/golf/types';
import { playedHoles, relativeToPar } from '../../core/golf/engine';
import { MARKS_TO_CLOSE, PAR_PER_HOLE, previewHoleScore, recommendedDarts } from '../../core/golf/rules';
import { formatRelativePar, formatVariant, formatVariantShort } from '../../core/golf/format';
import { useAppStore } from '../../store/appStore';
import { Button } from '../../components/Button';
import { DartKeypad } from '../../components/DartKeypad';
import { DartBadge } from '../../components/DartBadge';
import { HistoryDrawer, HistoryButton, type HistoryViewEntry } from '../../components/HistoryDrawer';
import { SettingsButton } from '../../components/Settings';
import { VictoryOverlay } from '../../components/VictoryOverlay';
import { GolfScorecard } from './GolfScorecard';

export function GolfGame({
  state,
  dispatch,
  undo,
  canUndo,
  onQuit,
  onNewGame,
}: GameScreenProps<GolfState, GolfAction>) {
  const { players, currentPlayer, currentVisit, targets, config, round, phase, winner } = state;
  const target = targets[round];
  const player = players[currentPlayer];
  const isCricket = config.variant === 'cricket';
  const smartKeypad = useAppStore((s) => s.settings.smartKeypad);
  const [historyOpen, setHistoryOpen] = useState(false);

  const recommended = useMemo(
    () => (smartKeypad && phase === 'playing' ? recommendedDarts(target) : []),
    [smartKeypad, phase, target],
  );

  // Cricket : la progression (marques /3) se lit en direct sur le joueur courant.
  // Standard / Au plus court : le coup provisoire se déduit de la volée en cours.
  const marks = player.holeMarks;
  const preview = isCricket ? null : previewHoleScore(currentVisit, target, config.variant);
  const chipTone = isCricket
    ? marks === 0
      ? 'bg-cream text-board'
      : marks < MARKS_TO_CLOSE
        ? 'bg-green text-board'
        : 'bg-gold text-board'
    : preview === null
      ? 'bg-cream text-board'
      : preview === 1
        ? 'bg-gold text-board'
        : preview === 2
          ? 'bg-green text-board'
          : 'bg-cream text-board';
  const chipLabel = isCricket ? `${marks}/${MARKS_TO_CLOSE}` : (preview ?? '—');
  const chipAria = isCricket ? `Marques : ${marks} sur ${MARKS_TO_CLOSE}` : preview === null ? 'Trou en cours' : `Coup provisoire : ${preview}`;

  const historyEntries: HistoryViewEntry[] = state.log.map((entry) => ({
    playerName: players[entry.player]?.name ?? `Joueur ${entry.player + 1}`,
    meta: `Trou ${entry.hole}`,
    darts: entry.darts,
    badge: entry.strokes === 1 ? { label: 'Eagle', tone: 'green' as const } : undefined,
    value: entry.strokes === null || entry.strokes === 1 ? undefined : `${entry.strokes}`,
    gold: entry.strokes === 1,
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
          Golf · {formatVariantShort(config)}
        </span>
        <HistoryButton open={historyOpen} onClick={() => setHistoryOpen(true)} />
        <SettingsButton />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <GolfScorecard
          targets={targets}
          players={players}
          currentPlayer={currentPlayer}
          round={round}
          showMarks={isCricket}
        />
      </div>

      <div className="flex items-center justify-center gap-3" role="status">
        <span className="text-sm uppercase tracking-widest text-muted">
          Trou {round + 1} / {targets.length}
        </span>
        <span className="font-display text-4xl font-bold leading-none tabular-nums text-cream">{target}</span>
        {isCricket ? (
          <span className="text-sm text-muted">
            {player.holeDarts} fléchette{player.holeDarts > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-sm text-muted">Par {PAR_PER_HOLE}</span>
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
          aria-label={chipAria}
          className={`flex h-12 min-w-16 items-center justify-center rounded-xl px-2 font-display text-xl font-bold tabular-nums ${chipTone}`}
        >
          {chipLabel}
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
            { label: 'Coups', value: String(players[winner].strokes) },
            { label: 'Score', value: formatRelativePar(relativeToPar(players[winner])) },
            { label: 'Trous', value: String(playedHoles(players[winner])) },
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
