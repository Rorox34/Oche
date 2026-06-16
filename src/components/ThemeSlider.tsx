import { useAppStore } from '../store/appStore';
import { themes } from '../themes';

/** Sélecteur de thème à 3 positions (pastille coulissante), pour l'accueil. */
export function ThemeSlider() {
  const themeId = useAppStore((s) => s.settings.themeId);
  const setTheme = useAppStore((s) => s.setTheme);
  const index = Math.max(0, themes.findIndex((t) => t.id === themeId));

  return (
    <div className="flex flex-col gap-2">
      <span className="font-display text-sm font-semibold uppercase tracking-widest text-muted">Thème</span>
      <div
        role="radiogroup"
        aria-label="Thème de couleur"
        className="relative grid grid-cols-3 rounded-2xl border border-line bg-surface p-1"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1 left-1 top-1 rounded-xl bg-cream transition-transform duration-200 ease-out"
          style={{ width: 'calc((100% - 0.5rem) / 3)', transform: `translateX(${index * 100}%)` }}
        />
        {themes.map((t) => {
          const active = t.id === themeId;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(t.id)}
              className="relative z-10 flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-xl
                px-1 transition-colors touch-manipulation focus-visible:outline-2 focus-visible:outline-cream"
            >
              <span className="flex gap-1" aria-hidden="true">
                {[t.boardColor, t.surfaceColor, t.accentColor].map((c, i) => (
                  <span
                    key={i}
                    className="h-3 w-3 rounded-full border border-black/20"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
              <span
                className={`max-w-full truncate text-xs font-semibold ${active ? 'text-board' : 'text-muted'}`}
              >
                {t.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
