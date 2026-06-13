import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameScreenProps } from '../types';
import type { Dart, X01Action, X01State } from '../../core/x01/types';
import { average3Darts, dartScore } from '../../core/x01/engine';
import { openingDarts } from '../../core/x01/rules';
import { checkoutRoutes } from '../../core/x01/checkout';
import { formatRules, formatRulesShort } from '../../core/x01/format';
import { useAppStore } from '../../store/appStore';
import { Button } from '../../components/Button';
import { DartKeypad } from '../../components/DartKeypad';
import { DartBadge } from '../../components/DartBadge';
import { HistoryDrawer, HistoryButton, type HistoryViewEntry } from '../../components/HistoryDrawer';
import { SettingsButton } from '../../components/Settings';
import { VictoryOverlay } from '../../components/VictoryOverlay';
import { PlayerCard } from './PlayerCard';
import { FinishPanel } from './FinishPanel';
import { BustOverlay } from './BustOverlay';

export function X01Game({
  state,
  dispatch,
  undo,
  canUndo,
  onQuit,
  onNewGame,
}: GameScreenProps<X01State, X01Action>) {
  const { players, currentPlayer, currentVisit, config, phase, winner } = state;
  const current = players[currentPlayer];
  const smartKeypad = useAppStore((s) => s.settings.smartKeypad);
  const [historyOpen, setHistoryOpen] = useState(false);

  const dartsLeft = 3 - currentVisit.length;

  const routes = useMemo(() => {
    if (phase !== 'playing' || !current.opened) return [];
    return checkoutRoutes(current.score, dartsLeft, config.outRule, 3);
  }, [phase, current.opened, current.score, dartsLeft, config.outRule]);

  // Clavier intelligent : premières fléchettes des routes, ou fléchettes d'ouverture.
  const recommended = useMemo<Dart[]>(() => {
    if (!smartKeypad || phase !== 'playing') return [];
    if (!current.opened) return openingDarts(config.inRule);
    return routes.map((r) => r[0]);
  }, [smartKeypad, phase, current.opened, config.inRule, routes]);

  // Animation BUST : déclenchée uniquement quand bustCount augmente (undo-safe).
  const [bustVisible, setBustVisible] = useState(false);
  const hideBust = useCallback(() => setBustVisible(false), []);
  const seenBusts = useRef(state.bustCount);
  useEffect(() => {
    if (state.bustCount > seenBusts.current) setBustVisible(true);
    seenBusts.current = state.bustCount;
  }, [state.bustCount]);

  const visitTotal = currentVisit.reduce((sum, d) => sum + dartScore(d), 0);

  const historyEntries: HistoryViewEntry[] = state.log.map((entry) => ({
    playerName: players[entry.player]?.name ?? `Joueur ${entry.player + 1}`,
    meta: `M${entry.leg}`,
    darts: entry.darts,
    badge: entry.bust
      ? { label: 'Bust', tone: 'red' as const }
      : entry.checkout
        ? { label: 'Finish', tone: 'green' as const }
        : undefined,
    value: entry.bust || entry.checkout ? undefined : String(entry.scored),
    gold: entry.scored >= 100,
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
          {formatRulesShort(config)}
        </span>
        <HistoryButton open={historyOpen} onClick={() => setHistoryOpen(true)} />
        <SettingsButton />
      </header>

      <div className={`grid gap-2 ${gridCols}`}>
        {players.map((p, i) => (
          <PlayerCard
            key={i}
            player={p}
            active={i === currentPlayer && phase === 'playing'}
            legsToWin={config.legsToWin}
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
          aria-label={`Total de la volée : ${visitTotal}`}
          className={`flex h-12 min-w-16 items-center justify-center rounded-xl px-2 font-display text-xl font-bold tabular-nums
            ${visitTotal >= 100 ? 'bg-gold text-board' : 'bg-cream text-board'}`}
        >
          {visitTotal}
        </div>
      </div>

      <FinishPanel
        score={current.score}
        routes={routes}
        opened={current.opened || phase !== 'playing'}
        inRule={config.inRule}
      />

      <div className="mt-auto">
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

      {bustVisible && <BustOverlay key={state.bustCount} onClose={hideBust} />}

      {phase === 'legOver' && winner !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Fin de manche"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-board/85 p-6 backdrop-blur-sm"
        >
          <div className="victory-pop flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border border-line bg-surface p-6 text-center">
            <span className="font-display text-base font-semibold uppercase tracking-widest text-muted">
              Manche gagnée
            </span>
            <span className="font-display text-5xl font-bold leading-none text-cream">
              {players[winner].name}
            </span>
            <span className="text-sm text-muted">
              Moyenne {average3Darts(players[winner]).toFixed(1)} · Max{' '}
              {players[winner].highestVisit}
            </span>
            <Button variant="primary" className="w-full" onClick={() => dispatch({ type: 'nextLeg' })}>
              Manche suivante
            </Button>
            <div className="flex w-full gap-2">
              <Button className="flex-1" onClick={undo} disabled={!canUndo}>
                Annuler le lancer
              </Button>
              <Button variant="ghost" className="flex-1" onClick={onQuit}>
                Accueil
              </Button>
            </div>
          </div>
        </div>
      )}

      {phase === 'matchOver' && winner !== null && (
        <VictoryOverlay
          winnerName={players[winner].name}
          stats={[
            { label: 'Tours', value: String(players[winner].visits) },
            { label: 'Moyenne', value: average3Darts(players[winner]).toFixed(1) },
            { label: 'Max volée', value: String(players[winner].highestVisit) },
            { label: 'Fléchettes', value: String(players[winner].dartsThrown) },
          ]}
          rules={formatRules(config)}
          onRematch={() => dispatch({ type: 'restart' })}
          onNewGame={onNewGame}
          onQuit={onQuit}
        />
      )}
    </div>
  );
}
