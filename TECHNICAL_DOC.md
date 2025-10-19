# 📚 Documentation Technique - Shepherd Capital Investment

## Vue d'ensemble

Shepherd Capital Investment est une plateforme fintech complète pour la gestion d'investissements privés avec distribution automatique des gains.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Dashboard │  │   KYC    │  │   Auth   │  │  Admin  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↕ (REST API)
┌─────────────────────────────────────────────────────────┐
│                  Backend (Node.js/Express)               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │Controllers │  │Middleware  │  │  Routes    │       │
│  └────────────┘  └────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│               PostgreSQL Database                        │
│  Users | Investments | Transactions | KYC | Contracts   │
└─────────────────────────────────────────────────────────┘
```

## Stack Technique

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, TailwindCSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **State**: Zustand
- **HTTP**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Auth**: JWT (jsonwebtoken)
- **Security**: bcryptjs, helmet
- **Validation**: express-validator
- **File Upload**: Multer

### Base de données
- **SGBD**: PostgreSQL 14+
- **ORM**: pg (native driver)

## Schéma de Base de Données

### Tables principales

#### `users`
```sql
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- first_name, last_name (VARCHAR)
- role (investor|admin)
- kyc_status (pending|submitted|approved|rejected)
- is_active, is_verified (BOOLEAN)
```

#### `investments`
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- balance (DECIMAL)
- total_deposited, total_withdrawn, total_gains (DECIMAL)
- is_active (BOOLEAN)
```

#### `transactions`
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- type (deposit|withdrawal|gain|fee)
- amount (DECIMAL)
- status (pending|completed|rejected)
- payment_method (fiat|crypto|bank_transfer)
```

#### `daily_gains`
```sql
- id (UUID, PK)
- gain_date (DATE, UNIQUE)
- bankroll (DECIMAL)
- gain_percentage (DECIMAL)
- total_gain, redistributed_gain (DECIMAL)
```

#### `investor_gains`
```sql
- id (UUID, PK)
- daily_gain_id (UUID, FK → daily_gains)
- user_id (UUID, FK → users)
- capital_invested (DECIMAL)
- gain_amount (DECIMAL)
```

#### `kyc_documents`
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- document_type (identity|proof_of_address)
- file_url, encrypted_file_path (VARCHAR)
- status (pending|approved|rejected)
```

#### `contracts`
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- contract_number (VARCHAR, UNIQUE)
- signed (BOOLEAN)
- signature_data (TEXT)
```

#### `successors`
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- first_name, last_name, email, phone (VARCHAR)
- relationship (VARCHAR)
- social_media (JSONB)
```

## Authentification & Sécurité

### JWT Tokens
- **Access Token**: Expire en 1h
- **Refresh Token**: Expire en 7 jours
- Stockés dans localStorage côté client
- Vérification via middleware `verifyToken`

### Sécurité
- Mots de passe hashés avec bcryptjs (salt rounds: 10)
- HTTPS obligatoire en production
- Helmet.js pour sécuriser les headers
- CORS configuré
- Rate limiting (100 req/15min par IP)
- Validation des entrées avec express-validator
- Chiffrement des données sensibles (KYC)

### Rôles
- **investor**: Accès dashboard, KYC, transactions
- **admin**: Accès complet + gestion plateforme

## Logique métier principale

### Calcul des gains

```javascript
// Formules implémentées dans admin.controller.js

Bankroll = Σ(balance de tous les investissements actifs)
Gain du jour = Bankroll × (pourcentage saisi / 100)
Gain redistribué = Gain du jour × 50%

Pour chaque investisseur:
  Part = capital_investi / Bankroll
  Gain individuel = Gain_redistribué × Part
  Nouveau solde = ancien_solde + Gain individuel
```

### Workflow KYC

1. **Soumission** (`kyc_status: submitted`)
   - Upload pièce d'identité
   - Upload justificatif de domicile

2. **Validation Admin** (`kyc_status: approved|rejected`)
   - Vérification manuelle des documents
   - Notification automatique à l'utilisateur

3. **Génération contrat** (si KYC approuvé)
   - Création PDF avec numéro unique
   - Signature électronique requise

4. **Activation** (`is_verified: true`)
   - Accès dépôts/retraits débloqué

### Workflow Transaction

1. **Création** (`status: pending`)
   - Investisseur crée demande de dépôt/retrait
   - Notification admin automatique

2. **Validation** (`status: completed|rejected`)
   - Admin approuve/rejette
   - Si dépôt approuvé: balance += amount
   - Si retrait approuvé: balance -= amount

3. **Notification**
   - Email/notification in-app à l'investisseur

## API Routes

### Publiques
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

### Protégées (JWT requis)
- `GET /api/users/profile`
- `GET /api/investments/dashboard`
- `POST /api/transactions/deposit`
- `POST /api/kyc/upload`

### Admin uniquement
- `GET /api/admin/stats`
- `POST /api/admin/daily-gain`
- `PUT /api/admin/kyc/:userId`

## Frontend - Structure

```
frontend/src/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── login/page.tsx           # Connexion
│   ├── register/page.tsx        # Inscription
│   ├── dashboard/
│   │   ├── layout.tsx           # Layout investisseur
│   │   ├── page.tsx             # Dashboard principal
│   │   ├── kyc/page.tsx         # KYC & Contrat
│   │   ├── profile/page.tsx     # Profil & Successeur
│   │   └── transactions/page.tsx # Historique
│   └── admin/
│       ├── layout.tsx           # Layout admin
│       ├── dashboard/page.tsx   # Stats globales
│       ├── gains/page.tsx       # Saisie gains
│       ├── investors/page.tsx   # Liste investisseurs
│       └── kyc/page.tsx         # Validation KYC
├── components/
│   └── Navbar.tsx               # Navigation
├── lib/
│   └── api.ts                   # API client
└── store/
    └── authStore.ts             # State management
```

## Backend - Structure

```
backend/src/
├── server.js                    # Point d'entrée
├── controllers/
│   ├── auth.controller.js       # Authentification
│   ├── user.controller.js       # Gestion utilisateur
│   ├── admin.controller.js      # Fonctions admin
│   ├── investment.controller.js # Dashboard investisseur
│   ├── transaction.controller.js# Transactions
│   └── kyc.controller.js        # KYC & Contrats
├── middleware/
│   └── auth.middleware.js       # JWT verification
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── admin.routes.js
│   ├── investment.routes.js
│   ├── transaction.routes.js
│   └── kyc.routes.js
├── database/
│   ├── db.js                    # Pool PostgreSQL
│   ├── schema.sql               # Schéma DB
│   └── migrate.js               # Script migration
└── lib/
    └── utils.js                 # Utilitaires
```

## Variables d'environnement

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/db
JWT_SECRET=secret_key
JWT_REFRESH_SECRET=refresh_secret_key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
MAX_INVESTORS=50
MIN_DEPOSIT=1000
INVESTOR_GAIN_PERCENTAGE=50
AWS_S3_BUCKET=bucket_name
AWS_ACCESS_KEY_ID=key
AWS_SECRET_ACCESS_KEY=secret
ENCRYPTION_KEY=32_char_key
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Déploiement

### Backend
```bash
# Build (si TypeScript)
npm run build

# Production
NODE_ENV=production npm start
```

### Frontend
```bash
# Build Next.js
npm run build

# Start production server
npm start
```

### Base de données
```bash
# Backup
pg_dump shepherd_capital > backup.sql

# Restore
psql shepherd_capital < backup.sql
```

## Tests

### Backend
```bash
# Tests unitaires (à implémenter)
npm test

# Tests d'intégration
npm run test:integration
```

### Frontend
```bash
# Tests composants
npm test

# E2E tests (Playwright)
npm run test:e2e
```

## Monitoring & Logs

- **Backend**: Console logs + optionnel Winston
- **Database**: PostgreSQL logs
- **Frontend**: Browser console + Next.js logs
- **Production**: Intégration Sentry recommandée

## Optimisations possibles

### Performance
- [ ] Mise en cache Redis pour sessions
- [ ] CDN pour assets statiques
- [ ] Compression Gzip/Brotli
- [ ] Pagination des listes longues
- [ ] Lazy loading des composants

### Sécurité
- [ ] 2FA (Two-Factor Authentication)
- [ ] Audit logs pour actions admin
- [ ] IP whitelisting pour admin
- [ ] WAF (Web Application Firewall)
- [ ] DDoS protection

### Fonctionnalités
- [ ] Notifications email (Nodemailer)
- [ ] Export PDF des transactions
- [ ] Graphiques avancés
- [ ] Multi-langue (i18n)
- [ ] Mode sombre
- [ ] Application mobile (React Native)

## Maintenance

### Backup
- Base de données: quotidien
- Documents KYC: quotidien
- Logs: hebdomadaire

### Mises à jour
- Dépendances: mensuel
- Patch sécurité: immédiat
- Features: selon roadmap

## Contact & Support

Pour toute question technique, consultez :
- Documentation API (Swagger à ajouter)
- Logs serveur
- Issues GitHub

---

**Shepherd Capital Investment** - Documentation Technique v1.0
