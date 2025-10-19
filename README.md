# 🏛️ Shepherd Capital Investment

Plateforme privée d'investissement sécurisée pour un maximum de 50 investisseurs privés.

## 🎯 Aperçu

Shepherd Capital Investment est une plateforme fintech premium qui permet :
- Investissement minimum de 1000 €
- Distribution automatique de 50% des gains journaliers
- Gestion KYC complète et sécurisée
- Contrats personnalisés automatiques
- Désignation de successeur
- Maximum 50 investisseurs actifs

## 🏗️ Architecture

```
shepherd-capital-investment/
├── frontend/          # Next.js + React + TailwindCSS
├── backend/           # Node.js + Express + PostgreSQL
├── docs/              # Documentation
└── package.json       # Scripts globaux
```

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Installation

1. **Installer toutes les dépendances**
```bash
npm run install:all
```

2. **Configurer la base de données**
```bash
# Créer la base de données PostgreSQL
createdb shepherd_capital

# Configurer les variables d'environnement
cp backend/.env.example backend/.env
# Éditer backend/.env avec vos paramètres
```

3. **Lancer en mode développement**
```bash
npm run dev
```

Cela lancera :
- Frontend : http://localhost:3000
- Backend API : http://localhost:5000

## 📋 Fonctionnalités

### Côté Investisseur
- ✅ Création de compte avec authentification JWT
- ✅ KYC complet (ID, justificatif de domicile)
- ✅ Signature électronique de contrat
- ✅ Dashboard avec graphiques d'évolution
- ✅ Dépôts/Retraits (Fiat & Crypto)
- ✅ Désignation de successeur
- ✅ Historique complet des transactions

### Côté Administrateur
- ✅ Dashboard de gestion global
- ✅ Saisie du gain journalier (%)
- ✅ Calcul automatique des gains redistribués
- ✅ Validation KYC
- ✅ Gestion des dépôts/retraits
- ✅ Archivage des contrats
- ✅ Notifications automatiques

## 🔐 Sécurité

- Authentification JWT avec refresh tokens
- Chiffrement des données sensibles
- Stockage sécurisé des documents KYC
- Validation serveur pour toutes les opérations
- HTTPS obligatoire en production
- Rate limiting sur les API

## 🎨 Design

Interface fintech premium :
- Couleurs : bleu nuit (#1e293b), argenté (#cbd5e1), blanc
- Responsive (desktop + mobile)
- Graphiques interactifs
- Animations fluides

## 📊 Règles de calcul

```
Bankroll = Σ(dépôts actifs)
Gain du jour = Bankroll × pourcentage_admin
Gain redistribué = Gain du jour × 50%

Pour chaque investisseur :
  Part = capital_investi / bankroll
  Gain individuel = Gain_redistribué × Part
  Nouveau solde = ancien_solde + gain_individuel
```

## 🛠️ Stack technique

### Frontend
- Next.js 14 (App Router)
- React 18
- TailwindCSS
- shadcn/ui
- Recharts (graphiques)
- Lucide React (icônes)

### Backend
- Node.js
- Express
- PostgreSQL
- JWT Authentication
- Multer (upload fichiers)
- PDFKit (génération contrats)

## 📝 Variables d'environnement

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/shepherd_capital
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
AWS_S3_BUCKET=your_s3_bucket
AWS_ACCESS_KEY=your_aws_key
AWS_SECRET_KEY=your_aws_secret
NODE_ENV=development
PORT=5000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📞 Support

Pour toute question ou assistance technique, contactez l'équipe Shepherd Capital Investment.

## 📄 Licence

PROPRIETARY - Tous droits réservés © 2025 Shepherd Capital Investment
