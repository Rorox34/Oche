# Reprise de session — Oche

Note de continuité pour reprendre le travail (depuis un autre appareil, l'app
Claude sur iPhone, Codespaces, github.dev…). Le code fait foi : tout est commité.

## État actuel

Compteur de fléchettes PWA (React 19 + TS + Vite + Tailwind v4 + Zustand),
mobile-first, hors-ligne. **7 modes** : 301/501, Around the Clock, Cricket,
Shanghai, Golf (dont variante Cricket), Steeplechase, Killer. Voir
[README.md](README.md) pour l'architecture détaillée.

Réalisé récemment :
- **Steeplechase** (`src/core/steeplechase/`, `src/modes/steeplechase/`) :
  course 1 → 20 (+ Bull en option) où chaque numéro est une haie — simple = 1
  haie franchie, double = 2, triple = 3, mais une volée de 3 fléchettes sans
  aucune touche fait **chuter** le joueur d'une haie en arrière. Règles
  inventées pour l'occasion (pas de norme officielle unique pour ce jeu de
  pub), à ajuster si l'esprit voulu diffère.
- **Déploiement PWA sur GitHub Pages** (`.github/workflows/deploy.yml`, build
  auto sur push `main`) — dépôt rendu public pour que Pages soit gratuit :
  https://rorox34.github.io/Oche/
- **Golf, variante Cricket** (`src/core/golf/`, 3e option du Segmented
  Score) : fermez chaque trou en 3 marques (simple=1, double=2, triple=3),
  tout le monde attend avant le trou suivant, chaque fléchette (touchée ou
  manquée) compte un coup — le plus rapide gagne. D'abord fait en mode séparé,
  puis rapatrié comme 3e variante du mode Golf existant (option produit).
- Les modes de jeu (cœurs purs testés dans `tests/`, un fichier par mode).
- **Statistiques par joueur** : profils mémorisés, suggestions de noms triées par
  usage, écran dédié (`store/profiles.ts`, `screens/StatsScreen.tsx`).
- **Accueil = menu** (Nouvelle partie / Options / Statistiques / Crédits) +
  **slider de thème** à 3 positions (`components/ThemeSlider.tsx`).
- **Killer** : clavier dédié limité aux numéros des joueurs + Manqué
  (`components/KillerKeypad.tsx`) ; vies 1–99 ; attribution des numéros au choix
  ou aléatoire ; règles Prison et soin sur élimination.
- Outillage multi-appareils : `.devcontainer/` (Codespaces), `server.host` (Vite).

## Lancer / vérifier

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # type-check (tsc) + build PWA
# Tests des moteurs (Node ≥ 22.6, un par mode) :
node --experimental-strip-types tests/engine.test.mjs
node --experimental-strip-types tests/atc.test.mjs
node --experimental-strip-types tests/cricket.test.mjs
node --experimental-strip-types tests/shanghai.test.mjs
node --experimental-strip-types tests/golf.test.mjs
node --experimental-strip-types tests/steeplechase.test.mjs
node --experimental-strip-types tests/killer.test.mjs
node --experimental-strip-types tests/profiles.test.mjs
```

Ajouter un mode = 1 dossier `src/core/<mode>/` + 1 dossier `src/modes/<mode>/`
(dont `getResult` pour les stats) + 1 ligne dans `src/modes/registry.ts`.

## Pistes discutées pour la suite

- **Étoffer le menu Options** (son, vibration, langue, format de match…).
- **Statistiques avancées par mode** (moyenne X01, MPR Cricket, meilleur score
  Golf…) en enrichissant le `GameResult` retourné par `getResult`.
- 4e entrée du menu d'accueil (actuellement « Crédits », placeholder).

## Convention de travail

- Le dossier actif est le contenu de ce dépôt (anciennement `oche 0.3`) ; les
  versions plus anciennes ne sont pas sur GitHub.
- Après chaque changement : `tsc` + `npm run build` + suites de tests, puis commit
  descriptif et push.
