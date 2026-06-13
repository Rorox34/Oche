import { useEffect } from 'react';

interface Props {
  onClose: () => void;
}

/**
 * "BUST" plein écran : apparition rapide, fermeture automatique après ~1 s,
 * fermeture immédiate au toucher, vibration si disponible. Ne bloque pas le
 * jeu : tout contact le ferme instantanément.
 */
export function BustOverlay({ onClose }: Props) {
  useEffect(() => {
    navigator.vibrate?.([70, 40, 120]);
    const timer = window.setTimeout(onClose, 1000);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center"
      onPointerDown={onClose}
      role="status"
      aria-live="assertive"
    >
      <div
        className="bust-pop rounded-3xl border-4 border-red bg-board/90 px-12 py-6 font-display text-7xl
          font-bold uppercase tracking-widest text-red ring-8 ring-red/25"
      >
        Bust
      </div>
    </div>
  );
}
