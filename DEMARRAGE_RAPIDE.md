# 🚀 Démarrage Rapide - Shepherd Capital Investment

## ⚠️ Prérequis AVANT de commencer

### 1. PostgreSQL (OBLIGATOIRE)

#### Option A : Avec Homebrew
```bash
# Installer Homebrew (si pas déjà fait)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer PostgreSQL
brew install postgresql@14

# Démarrer PostgreSQL
brew services start postgresql@14

# Vérifier que PostgreSQL fonctionne
psql --version
```

#### Option B : Application PostgreSQL (PLUS SIMPLE)
1. Téléchargez Postgres.app : https://postgresapp.com/
2. Installez et lancez l'application
3. Cliquez sur "Initialize" pour créer le serveur

### 2. Node.js (Version 18+)
```bash
# Vérifier si Node.js est installé
node --version

# Si non installé, téléchargez depuis : https://nodejs.org/
```

---

## 🎯 Installation de l'application

### Étape 1 : Installer les dépendances

```bash
# Depuis le dossier "Shepherd Capital Investment"

# 1. Root
npm install

# 2. Backend
cd backend
npm install

# 3. Frontend
cd ../frontend
npm install

# 4. Retourner à la racine
cd ..
```

### Étape 2 : Créer la base de données

```bash
# Ouvrir PostgreSQL
psql postgres

# Dans psql, créer la base
CREATE DATABASE shepherd_capital;

# Quitter psql
\q
```

**OU en une ligne :**
```bash
createdb shepherd_capital
```

### Étape 3 : Configurer les variables d'environnement

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

**Éditez `backend/.env`** avec vos paramètres PostgreSQL :
```env
DATABASE_URL=postgresql://votre_utilisateur:votre_mot_de_passe@localhost:5432/shepherd_capital

# Si vous utilisez Postgres.app, utilisez :
DATABASE_URL=postgresql://postgres:@localhost:5432/shepherd_capital

JWT_SECRET=changez_ceci_par_une_cle_secrete_aleatoire
JWT_REFRESH_SECRET=changez_ceci_aussi
PORT=5000
NODE_ENV=development
```

#### Frontend (.env.local)
```bash
cd ../frontend
cp .env.local.example .env.local
```

Le fichier `frontend/.env.local` devrait contenir :
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Étape 4 : Migrer la base de données

```bash
cd backend
npm run migrate
```

✅ Cela va créer toutes les tables et un compte admin par défaut :
- Email : `max@shepherdcapital.com`
- Mot de passe : `Admin@123`

### Étape 5 : Lancer l'application

#### Option A : Tout lancer en même temps (Recommandé)
```bash
# Depuis la racine du projet
npm run dev
```

#### Option B : Lancer séparément (2 terminaux)

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend :**
```bash
cd frontend
npm run dev
```

---

## 🌐 Accéder à l'application

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:5000
- **Health Check** : http://localhost:5000/health

---

## 🔐 Première connexion

1. Ouvrez http://localhost:3000
2. Cliquez sur "Connexion"
3. Utilisez les identifiants admin :
   - Email : `max@shepherdcapital.com`
   - Mot de passe : `Admin@123`

⚠️ **Changez ce mot de passe immédiatement après la première connexion !**

---

## ❌ Résolution des problèmes courants

### Erreur : "Cannot connect to database"

**Vérifier que PostgreSQL est démarré :**
```bash
# Avec Homebrew
brew services list

# Si pas démarré
brew services start postgresql@14

# Avec Postgres.app
# Assurez-vous que l'application est ouverte et le serveur démarré
```

**Tester la connexion :**
```bash
psql -U postgres shepherd_capital
```

### Erreur : "Port 3000 already in use"

**Trouver et tuer le processus :**
```bash
lsof -ti:3000 | xargs kill -9
```

### Erreur : "Port 5000 already in use"

**Trouver et tuer le processus :**
```bash
lsof -ti:5000 | xargs kill -9
```

### Réinitialiser complètement la base de données

```bash
# Supprimer la base
dropdb shepherd_capital

# Recréer
createdb shepherd_capital

# Remigrer
cd backend
npm run migrate
```

---

## 📊 Vérifier que tout fonctionne

### Backend
```bash
curl http://localhost:5000/health
```

Devrait retourner : `{"status":"OK","timestamp":"..."}`

### Frontend
Ouvrez http://localhost:3000 dans votre navigateur

### Base de données
```bash
psql shepherd_capital -c "SELECT COUNT(*) FROM users;"
```

Devrait retourner au moins 1 (le compte admin)

---

## 🎓 Scénario de test

1. ✅ Créer un compte investisseur (Register)
2. ✅ Se connecter
3. ✅ Aller dans KYC et télécharger des documents (n'importe quelle image pour test)
4. ✅ Se déconnecter et se connecter en admin
5. ✅ Valider le KYC de l'investisseur
6. ✅ Se reconnecter en investisseur
7. ✅ Générer et signer le contrat
8. ✅ Créer une demande de dépôt (1000€ minimum)
9. ✅ Se connecter en admin et approuver le dépôt
10. ✅ En admin, aller dans "Gains journaliers" et saisir un gain (ex: 2.5%)
11. ✅ Observer la distribution automatique
12. ✅ Se reconnecter en investisseur et voir le gain crédité

---

## 📞 Besoin d'aide ?

Si vous rencontrez des problèmes :
1. Vérifiez que PostgreSQL est bien démarré
2. Vérifiez les variables dans `backend/.env`
3. Consultez les logs dans le terminal
4. Regardez `INSTALLATION.md` pour plus de détails

---

Bon développement ! 🚀
