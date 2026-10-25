# Plateforme d'opportunités d'investissement — EDBM Toliara

Plateforme web interactive de valorisation des opportunités d'investissement à Madagascar : catalogue, recherche et filtres, carte interactive, favoris, demandes d'intérêt, et espaces de gestion pour les agents de l'EDBM et les administrateurs.

Le cahier des charges complet se trouve dans [projet-context.md](projet-context.md).

## Technologies

| Partie | Technologies |
| --- | --- |
| Frontend (`client/`) | React, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router, TanStack Query, Zustand, React Hook Form, Zod, Leaflet |
| Backend (`server/`) | Node.js, Express, Drizzle ORM, PostgreSQL, Better Auth, Zod |
| Outils | npm, ESLint, drizzle-kit, tsx |

Aucun Docker n'est nécessaire : PostgreSQL s'utilise en local (ou hébergé).

## Prérequis

- Node.js 22 LTS (20.19 minimum) et npm
- PostgreSQL 16 ou plus, installé sur la machine
- Git

## Installation

```bash
git clone <url-du-depot> edbm-platform
cd edbm-platform
npm install            # outils de la racine (concurrently)
npm run install:all    # dépendances de server/ et client/
```

### 1. Base de données

Dans `psql` (ou « SQL Shell » sous Windows) :

```sql
CREATE USER edbm WITH PASSWORD 'edbm_dev';
CREATE DATABASE edbm OWNER edbm;
```

### 2. Variables d'environnement

```bash
cp server/.env.example server/.env
```

Renseigne `server/.env` :

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://edbm:edbm_dev@localhost:5432/edbm
BETTER_AUTH_SECRET=<32 caractères minimum>
BETTER_AUTH_URL=http://localhost:3000
CLIENT_URL=http://localhost:5173
```

Pour générer le secret :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Si le mot de passe de la base contient des caractères spéciaux (`@`, `#`, `/`…), encode-les dans l'URL (`@` devient `%40`).

### 3. Tables et données initiales

```bash
cd server
npm run db:migrate     # crée les tables
npm run db:seed        # secteurs, régions (et données de démonstration si le seed les inclut)
cd ..
```

### 4. Lancer le projet

```bash
npm run dev
```

- Application : http://localhost:5173
- API : http://localhost:3000/api/health

### 5. Créer le premier administrateur

Inscris-toi sur `/inscription`, puis :

```bash
cd server
npm run make-admin -- ton-email@exemple.com
```

## Scripts

**Racine**

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Lance l'API et le client en parallèle |
| `npm run install:all` | Installe les dépendances de `server/` et `client/` |

**`server/`**

| Commande | Rôle |
| --- | --- |
| `npm run dev` | API en mode watch (tsx) |
| `npm run build` / `npm run start` | Build (tsup) puis démarrage de la version compilée |
| `npm run typecheck` | Vérification TypeScript |
| `npm run db:generate` | Génère une migration à partir du schéma Drizzle |
| `npm run db:migrate` | Applique les migrations |
| `npm run db:push` | Synchronise le schéma sans migration (développement) |
| `npm run db:studio` | Interface web Drizzle pour consulter la base |
| `npm run db:seed` | Insère les données initiales |
| `npm run make-admin -- <email>` | Passe un utilisateur existant en administrateur |

**`client/`**

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Vérification des types puis build de production |
| `npm run lint` | ESLint |
| `npm run preview` | Prévisualisation du build |

## Structure

```
edbm-platform/
├─ client/     # React + Vite (routes/, features/, components/, stores/, lib/)
└─ server/     # Express + Drizzle (modules/, db/, middlewares/, lib/, config/)
```

Le détail des dossiers et des conventions est dans [CLAUDE.md](CLAUDE.md).

## Rôles

| Rôle | Accès |
| --- | --- |
| Visiteur | Catalogue, recherche, carte, fiches publiques |
| Investisseur | Favoris, demandes d'intérêt, suivi, notifications, profil |
| Agent EDBM | Gestion des opportunités et des demandes, selon ses permissions |
| Administrateur | Utilisateurs, rôles et permissions, secteurs, régions, journal d'activité, paramètres |

Les droits sont vérifiés côté serveur sur chaque route ; les gardes de routes du client servent uniquement à l'affichage.

## Déploiement

1. `cd client && npm run build` produit `client/dist`.
2. `cd server && npm run build` produit `server/dist`.
3. Sers `client/dist` et l'API depuis la même origine (Express avec `express.static`, ou un reverse proxy comme Nginx), pour que le cookie de session reste valide.
4. Renseigne `server/.env` avec les valeurs de production (`NODE_ENV=production`, `BETTER_AUTH_URL` et `CLIENT_URL` en HTTPS) et lance `npm run db:migrate` avant le premier démarrage.
5. Le dossier `server/uploads/` contient les fichiers envoyés : sauvegarde-le avec la base.
