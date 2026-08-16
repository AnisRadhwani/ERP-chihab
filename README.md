# Ecom ERP — Profit Tracker V1

Système interne de suivi de profit pour e-commerce COD.

Remplace le tracking Excel par une application automatique qui collecte :
- Commandes livrées (API livraison)
- Ad Spend (Meta Ads)
- Économie produit (Firebase)

## Architecture

```
React/Vite (localhost:5173)
        ↓
Node.js API (localhost:3000)
        ↓
Firebase Firestore
        ↓
APIs externes (Meta, Livraison)
```

## Prérequis

- Node.js >= 20
- Compte Firebase
- Tokens API (Meta, Livraison) — dans `.env` uniquement

## Installation

```bash
# Cloner et installer
npm install

# Copier les variables d'environnement
cp .env.example .env
# Remplir .env avec vos credentials

# Lancer frontend + backend
npm run dev
```

- Frontend : http://localhost:5173
- Backend : http://localhost:3000
- Health check : http://localhost:3000/api/health

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Lance frontend + backend |
| `npm run dev:web` | Frontend seul |
| `npm run dev:api` | Backend seul |
| `npm run build` | Build production |

## Structure

```
apps/web/       → React + Vite + Tailwind
apps/api/       → Express + TypeScript + Firebase Admin
packages/shared/→ Types TypeScript partagés
```

## Sécurité

- Ne jamais commiter `.env`, `firebase.txt`, `apis.txt`
- Les tokens API restent côté backend uniquement
- Révoquer tout token exposé accidentellement

## Phases de développement

- [x] Phase 1 — Setup projet
- [x] Phase 2 — Products CRUD + Firebase
- [x] Phase 3 — Import Excel X-Delivery + Daily Profit + calculs
- [x] Phase 4 — Meta Ads API (spend auto) + Sync Now
- [x] Phase 5 — X-Delivery API statut (barcodes importés)
- [ ] Phase 6 — Converty / auto-import commandes

## Workflow V1

1. **Products** — créer produits avec mots-clés matching (ex: `Compresseur Portable`)
2. **X-Delivery** — exporter "Colis Livrés" en Excel
3. **Daily Profit** ou **Integrations** — importer le fichier Excel
4. **Sync Now** — récupère Ad Spend Meta + statuts X-Delivery
5. **Daily Profit** — saisir/répartir Ad Spend par produit (bouton Ad Spend)
6. **Settings** — ajuster taux USD/TND si besoin
7. Voir profit estimé par produit et totaux du jour
