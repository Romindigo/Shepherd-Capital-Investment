# 📦 Guide d'installation - Shepherd Capital Investment

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **npm** ou **yarn**

## Installation étape par étape

### 1. Clone ou téléchargement

Si vous avez cloné le projet, naviguez dans le dossier :
```bash
cd "Shepherd Capital Investment"
```

### 2. Installation des dépendances

Installez toutes les dépendances (frontend + backend) :
```bash
npm run install:all
```

Ou manuellement :
```bash
# Root
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configuration de PostgreSQL

#### Créer la base de données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE shepherd_capital;

# Quitter
\q
```

### 4. Configuration des variables d'environnement

#### Backend

Copiez le fichier d'exemple et modifiez-le :
```bash
cd backend
cp .env.example .env
```

Éditez `backend/.env` avec vos paramètres :
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/shepherd_capital
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this
PORT=5000
NODE_ENV=development
```

#### Frontend

```bash
cd ../frontend
cp .env.local.example .env.local
```

Éditez `frontend/.env.local` :
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 5. Migration de la base de données

Exécutez le script de migration pour créer les tables :
```bash
cd backend
npm run migrate
```

Cela va :
- Créer toutes les tables nécessaires
- Créer un utilisateur admin par défaut :
  - Email : `max@shepherdcapital.com`
  - Mot de passe : `Admin@123`
  - ⚠️ **IMPORTANT : Changez ce mot de passe en production !**

### 6. Lancement de l'application

#### Option 1 : Tout lancer en même temps (recommandé pour développement)

Depuis la racine du projet :
```bash
npm run dev
```

Cela lance :
- Backend API sur http://localhost:5000
- Frontend sur http://localhost:3000

#### Option 2 : Lancer séparément

**Backend :**
```bash
cd backend
npm run dev
```

**Frontend (dans un autre terminal) :**
```bash
cd frontend
npm run dev
```

### 7. Accéder à l'application

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:5000
- **Health Check** : http://localhost:5000/health

### 8. Connexion Admin

Utilisez les identifiants par défaut :
- Email : `max@shepherdcapital.com`
- Mot de passe : `Admin@123`

⚠️ Changez ce mot de passe immédiatement après la première connexion !

## Structure des URLs

### Espace Public
- `/` - Page d'accueil
- `/login` - Connexion
- `/register` - Inscription

### Espace Investisseur
- `/dashboard` - Dashboard principal
- `/dashboard/transactions` - Historique des transactions
- `/dashboard/kyc` - Vérification KYC et contrat
- `/dashboard/profile` - Profil et successeur

### Espace Admin
- `/admin/dashboard` - Dashboard admin
- `/admin/investors` - Liste des investisseurs
- `/admin/gains` - Saisie des gains journaliers
- `/admin/kyc` - Validation KYC

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Rafraîchir le token
- `POST /api/auth/logout` - Déconnexion

### Utilisateur
- `GET /api/users/profile` - Profil
- `PUT /api/users/profile` - Modifier le profil
- `PUT /api/users/successor` - Gérer le successeur
- `PUT /api/users/password` - Changer le mot de passe
- `GET /api/users/notifications` - Notifications

### Investissement
- `GET /api/investments/dashboard` - Dashboard investisseur
- `GET /api/investments/capital-evolution` - Évolution du capital

### Transactions
- `POST /api/transactions/deposit` - Demande de dépôt
- `POST /api/transactions/withdrawal` - Demande de retrait
- `GET /api/transactions` - Historique

### KYC
- `POST /api/kyc/upload` - Upload document
- `GET /api/kyc/documents` - Liste des documents
- `POST /api/kyc/contract/generate` - Générer contrat
- `POST /api/kyc/contract/sign` - Signer contrat

### Admin
- `GET /api/admin/stats` - Statistiques globales
- `GET /api/admin/investors` - Liste investisseurs
- `POST /api/admin/daily-gain` - Saisir gain journalier
- `PUT /api/admin/kyc/:userId` - Valider/Rejeter KYC
- `PUT /api/admin/transactions/:transactionId` - Valider/Rejeter transaction

## Dépannage

### Erreur de connexion à la base de données
```bash
# Vérifier que PostgreSQL est démarré
sudo service postgresql status  # Linux
brew services list  # macOS

# Vérifier les logs PostgreSQL
tail -f /var/log/postgresql/postgresql-14-main.log
```

### Port déjà utilisé
```bash
# Trouver le processus utilisant le port 5000
lsof -i :5000

# Tuer le processus
kill -9 <PID>
```

### Réinitialiser la base de données
```bash
# Se connecter à PostgreSQL
psql -U postgres

# Supprimer et recréer la base
DROP DATABASE shepherd_capital;
CREATE DATABASE shepherd_capital;

# Quitter et réexécuter la migration
\q
cd backend
npm run migrate
```

### Erreur CORS
Vérifiez que `NEXT_PUBLIC_API_URL` dans `frontend/.env.local` correspond à l'URL du backend.

## Production

### Build Frontend
```bash
cd frontend
npm run build
npm start
```

### Variables d'environnement Production

**Backend :**
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=very_long_random_string
HTTPS=true
```

**Frontend :**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomaine.com/api
```

## Sécurité

- [ ] Changez tous les secrets dans `.env`
- [ ] Changez le mot de passe admin par défaut
- [ ] Configurez HTTPS en production
- [ ] Configurez les règles de firewall
- [ ] Activez SSL pour PostgreSQL
- [ ] Configurez les limites de rate limiting
- [ ] Sauvegardez régulièrement la base de données

## Support

Pour toute question ou problème, consultez la documentation ou contactez l'équipe technique.

---

**Shepherd Capital Investment** © 2025
