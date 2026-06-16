import { useMemo, useState } from 'react';
import type { GameScreenProps } from '../types';
import type { KillerAction, KillerState } from '../../core/killer/types';
import { recommendedDarts } from '../../core/killer/rules';
import { visitLivesTaken } from '../../core/killer/engine';
import { formatEvent, formatVariant, formatVariantShort } from '../../core/killer/format';
import { useAppStore } from '../../store/appStore';
import { Button } from '../../components/Button';
import { DartKeypad } from '../../components/DartKeypad';
import { DartBadge } from '../../components/DartBadge';
import { HistoryDrawer, HistoryButton, type HistoryViewEntry } from '../../components/HistoryDrawer';
import { SettingsButton } from '../../components/Settings';
import { VictoryOverlay } from '../../components/VictoryOverlay';
import { KillerPlayerCard } from './KillerPlayerCard';

export function KillerGame({
  state,
  dispatch,
  undo,
  canUndo,
  onQuit,
  onNewGame,
}: GameScreenProps<KillerState, KillerAction>) {
  const { players, currentPlayer, currentVisit, config, phase, winner } = state;
  const me = players[currentPlayer];
  const smartKeypad = useAppStore((s) => s.settings.smartKeypad);
  const [historyOpen, setHistoryOpen] = useState(false);

  const recommended = useMemo(
    () => (smartKeypad && phase === 'playing' ? recommendedDarts(state) : []),
    [smartKeypad, phase, state],
  );

  const livesTaken = visitLivesTaken(state);

  const instruction = (() => {
    if (me.inPrison) return `🔒 ${me.name} est en prison — touchez le Bull (25/50) pour sortir`;
    if (!me.isKiller) {
      return config.entry === 'double'
        ? `${me.name} : touchez le Double ${me.number} pour devenir tueur`
        : `${me.name} : touchez le Bull (25/50) pour devenir tueur`;
    }
    return config.entry === 'prison'
      ? `🗡 ${me.name}, tueur — visez les numéros adverses (Bull = tous en prison)`
      : `🗡 ${me.name}, tueur — visez les numéros adverses`;
  })();

  const historyEntries: HistoryViewEntry[] = state.log.map((entry) => {
    const summary = entry.events.map((ev) => formatEvent(ev, players)).join(' · ');
    return {
      playerName: players[entry.player]?.name ?? `Joueur ${entry.player + 1}`,
      meta: summary || '—',
      darts: entry.darts,
      badge: entry.events.some((ev) => ev.kind === 'eliminate')
        ? { label: 'KO', tone: 'red' as const }
        : undefined,
    };
  });

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
          Killer · {formatVariantShort(config)}
        </span>
        <HistoryButton open={historyOpen} onClick={() => setHistoryOpen(true)} />
        <SettingsButton />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={`grid gap-2 ${gridCols}`}>
          {players.map((p, i) => (
            <KillerPlayerCard
              key={i}
              player={p}
              active={i === currentPlayer && phase === 'playing'}
              compact={players.length > 2}
            />
          ))}
        </div>
      </div>

      <p className="truncate text-center text-sm text-muted" role="status">
        {instruction}
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
          aria-label={`Vies retirées dans cette volée : ${livesTaken}`}
          className={`flex h-12 min-w-16 items-center justify-center rounded-xl px-2 font-display text-xl font-bold tabular-nums
            ${livesTaken > 0 ? 'bg-red text-cream' : 'bg-cream text-board'}`}
        >
          {livesTaken > 0 ? `−${livesTaken}` : '—'}
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
            { label: 'Vies', value: String(players[winner].lives) },
            { label: 'Numéro', value: String(players[winner].number) },
            { label: 'Éliminations', value: String(players[winner].kills) },
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
