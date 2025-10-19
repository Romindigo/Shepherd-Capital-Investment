# 🚀 Démarrage Rapide - Shepherd Capital Investment

## ⚡ Installation Express (5 minutes)

### 1️⃣ Installer PostgreSQL et créer la base
```bash
# Créer la base de données
createdb shepherd_capital
```

### 2️⃣ Installer les dépendances
```bash
npm run install:all
```

### 3️⃣ Configurer les variables d'environnement

**Backend** (`backend/.env`) :
```bash
cp backend/.env.example backend/.env
# Modifier DATABASE_URL avec vos identifiants PostgreSQL
```

**Frontend** (`frontend/.env.local`) :
```bash
cp frontend/.env.local.example frontend/.env.local
```

### 4️⃣ Initialiser la base de données
```bash
cd backend
npm run migrate
```

### 5️⃣ Lancer l'application
```bash
# Depuis la racine
npm run dev
```

✅ **C'est prêt !**
- Frontend : http://localhost:3000
- Backend : http://localhost:5000

---

## 🔑 Identifiants par défaut

**Administrateur :**
- Email : `max@shepherdcapital.com`
- Mot de passe : `Admin@123`

⚠️ **Changez ce mot de passe immédiatement !**

---

## 📱 Pages disponibles

### Public
- `/` - Landing page
- `/login` - Connexion
- `/register` - Inscription (nouveau compte investisseur)

### Investisseur (après connexion)
- `/dashboard` - Dashboard principal avec graphiques
- `/dashboard/kyc` - Upload documents KYC et signature contrat
- `/dashboard/transactions` - Historique et demandes de dépôt/retrait
- `/dashboard/profile` - Profil et désignation de successeur

### Admin (connexion avec compte admin)
- `/admin/dashboard` - Vue d'ensemble et statistiques
- `/admin/gains` - **Saisir le gain journalier** (distribution automatique)
- `/admin/investors` - Liste de tous les investisseurs
- `/admin/kyc` - Valider les documents KYC

---

## 🎯 Scénario de test complet

### Étape 1 : Créer un investisseur
1. Allez sur http://localhost:3000
2. Cliquez sur "S'inscrire"
3. Remplissez le formulaire (email, mot de passe, nom, prénom)
4. Connectez-vous

### Étape 2 : Compléter le KYC
1. Allez dans "KYC & Contrat"
2. Téléchargez une pièce d'identité (n'importe quelle image pour test)
3. Téléchargez un justificatif de domicile
4. Le statut passe à "En attente de validation"

### Étape 3 : Valider le KYC (Admin)
1. Déconnectez-vous
2. Connectez-vous avec le compte admin (`max@shepherdcapital.com`)
3. Allez dans "Validation KYC" (menu admin)
4. Cliquez sur "Approuver" pour l'investisseur

### Étape 4 : Générer et signer le contrat
1. Reconnectez-vous avec le compte investisseur
2. Allez dans "KYC & Contrat"
3. Cliquez sur "Générer mon contrat"
4. Cliquez sur "Signer électroniquement le contrat"
5. Votre compte est maintenant vérifié ✅

### Étape 5 : Faire un dépôt
1. Sur le dashboard, cliquez sur "Déposer des fonds"
2. Créez une demande de dépôt (montant minimum 1000 €)
3. Le dépôt est en attente de validation admin

### Étape 6 : Valider le dépôt (Admin)
1. Connectez-vous en admin
2. Allez dans "Dashboard Admin"
3. Cliquez sur "Transactions en attente"
4. Approuvez le dépôt
5. Le solde de l'investisseur est automatiquement crédité

### Étape 7 : Distribuer un gain journalier (Admin)
1. En admin, allez dans "Gains journaliers"
2. Saisissez un pourcentage (ex: 2.5%)
3. Sélectionnez la date du jour
4. Cliquez sur "Distribuer le gain"
5. **Le système calcule et distribue automatiquement** :
   - 50% du gain redistribué aux investisseurs
   - Au prorata du capital investi
   - Notification envoyée à chaque investisseur
   - Soldes mis à jour instantanément

### Étape 8 : Voir les gains (Investisseur)
1. Reconnectez-vous en investisseur
2. Sur le dashboard, vous verrez :
   - Votre nouveau solde augmenté
   - Le gain crédité dans "Gains récents"
   - Le graphique d'évolution mis à jour
   - Une notification de gain

---

## 🎨 Fonctionnalités clés

### ✅ Côté Investisseur
- Dashboard moderne avec graphiques temps réel
- KYC complet (identité + justificatif domicile)
- Contrat personnalisé avec signature électronique
- Désignation d'un successeur/héritier
- Demandes de dépôt/retrait (Fiat & Crypto)
- Historique complet des transactions
- Notifications en temps réel
- Suivi de l'évolution du capital sur 30 jours

### ✅ Côté Admin
- Dashboard avec statistiques globales
- **Saisie du gain journalier avec distribution automatique**
- Gestion complète des investisseurs (max 50)
- Validation/Rejet KYC
- Validation des dépôts et retraits
- Vue d'ensemble de la bankroll totale
- Historique des gains distribués

---

## 🔐 Règles métier

### Calcul des gains (automatique)
```
Bankroll = Somme des soldes de tous les investisseurs actifs
Gain du jour = Bankroll × Pourcentage saisi
Gain redistribué = Gain du jour × 50%

Pour chaque investisseur :
  Part = (Capital investi / Bankroll)
  Gain individuel = Gain redistribué × Part
  Nouveau solde = Ancien solde + Gain individuel
```

### Limites
- **Maximum 50 investisseurs** actifs simultanément
- **Dépôt minimum** : 1000 €
- **Gains redistribués** : 50% des gains journaliers
- **KYC obligatoire** avant tout dépôt

---

## 📞 Aide

### Erreur "Cannot connect to database"
```bash
# Vérifier que PostgreSQL est démarré
sudo service postgresql start  # Linux
brew services start postgresql # macOS
```

### Réinitialiser la base
```bash
dropdb shepherd_capital
createdb shepherd_capital
cd backend && npm run migrate
```

### Port déjà utilisé
```bash
# Modifier dans backend/.env
PORT=5001

# Modifier dans frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

---

## 📚 Documentation complète

- **README.md** - Vue d'ensemble du projet
- **INSTALLATION.md** - Guide d'installation détaillé
- **TECHNICAL_DOC.md** - Documentation technique complète
- **QUICKSTART.md** - Ce fichier (démarrage rapide)

---

## 🎯 Prochaines étapes recommandées

1. ✅ Tester le scénario complet ci-dessus
2. ✅ Changer le mot de passe admin par défaut
3. ✅ Personnaliser les variables d'environnement
4. ✅ Configurer AWS S3 pour le stockage KYC (optionnel)
5. ✅ Ajouter votre logo et branding
6. ✅ Configurer les emails (Nodemailer)
7. ✅ Déployer en production avec HTTPS

---

**🏛️ Shepherd Capital Investment** - Plateforme d'investissement privée premium

Développé avec ❤️ - © 2025 Tous droits réservés
