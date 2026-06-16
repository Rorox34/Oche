import { useAppStore } from '../store/appStore';
import { gameModes } from '../modes/registry';
import { normalizeName, sortedProfiles, winRate } from '../store/profiles';
import type { PlayerProfile } from '../store/profiles';
import { Button } from '../components/Button';

const modeName = (id: string): string => gameModes.find((m) => m.id === id)?.name ?? id;

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-board px-3 py-2 text-center">
      <div className="font-display text-2xl font-bold tabular-nums text-cream">{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

function ProfileCard({ profile, onRemove }: { profile: PlayerProfile; onRemove: () => void }) {
  const modes = Object.entries(profile.byMode).sort((a, b) => b[1].games - a[1].games);
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <header className="flex items-center justify-between gap-2">
        <h2 className="min-w-0 truncate font-display text-2xl font-bold text-cream">{profile.name}</h2>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Supprimer ${profile.name}`}
          className="min-h-10 min-w-10 rounded-xl text-muted touch-manipulation active:text-red
            focus-visible:outline-2 focus-visible:outline-cream"
        >
          🗑
        </button>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <StatRow label="Parties" value={String(profile.games)} />
        <StatRow label="Victoires" value={String(profile.wins)} />
        <StatRow label="Taux" value={`${winRate(profile)}%`} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {modes.map(([id, s]) => (
          <span
            key={id}
            className="rounded-lg border border-line bg-board px-2 py-1 text-xs text-muted"
          >
            <span className="text-cream">{modeName(id)}</span> · {s.games}p · {s.wins}v
          </span>
        ))}
      </div>
    </section>
  );
}

export function StatsScreen() {
  const profiles = useAppStore((s) => s.profiles);
  const goHome = useAppStore((s) => s.goHome);
  const removeProfile = useAppStore((s) => s.removeProfile);
  const clearProfiles = useAppStore((s) => s.clearProfiles);

  const list = sortedProfiles(profiles);

  const clearAll = () => {
    if (window.confirm('Effacer toutes les statistiques ?')) clearProfiles();
  };

  const remove = (profile: PlayerProfile) => {
    if (window.confirm(`Supprimer les statistiques de ${profile.name} ?`)) {
      removeProfile(normalizeName(profile.name));
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <Button variant="ghost" onClick={goHome} aria-label="Retour à l'accueil" className="min-h-12 px-3">
          ←
        </Button>
        <h1 className="flex-1 font-display text-3xl font-bold uppercase tracking-wide">Statistiques</h1>
        {list.length > 0 && (
          <Button variant="ghost" onClick={clearAll} className="px-3 text-sm text-muted">
            Tout effacer
          </Button>
        )}
      </header>

      {list.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-2 text-center text-muted">
          <span className="text-4xl">📊</span>
          <p>Aucune partie enregistrée pour l'instant.</p>
          <p className="text-sm">
            Donnez un nom aux joueurs (autre que « Joueur 1 ») et terminez une partie : leurs
            statistiques apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((profile) => (
            <ProfileCard key={profile.name} profile={profile} onRemove={() => remove(profile)} />
          ))}
        </div>
      )}
    </div>
  );
}
