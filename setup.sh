#!/bin/bash

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Shepherd Capital Investment - Setup        ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════╝${NC}"
echo ""

# Fonction pour afficher les erreurs
error() {
    echo -e "${RED}❌ Erreur: $1${NC}"
    exit 1
}

# Fonction pour afficher les succès
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher les infos
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Fonction pour afficher les avertissements
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier Node.js
info "Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé. Téléchargez-le depuis https://nodejs.org/"
fi
NODE_VERSION=$(node -v)
success "Node.js $NODE_VERSION détecté"

# Vérifier PostgreSQL
info "Vérification de PostgreSQL..."
if ! command -v psql &> /dev/null; then
    warning "PostgreSQL n'est pas installé!"
    echo ""
    echo "Pour installer PostgreSQL :"
    echo "  Option 1 (Homebrew): brew install postgresql@14"
    echo "  Option 2 (App): Téléchargez depuis https://postgresapp.com/"
    echo ""
    read -p "Appuyez sur Entrée une fois PostgreSQL installé..."
fi

# Vérifier que PostgreSQL fonctionne
info "Test de connexion PostgreSQL..."
if ! psql postgres -c "SELECT 1;" &> /dev/null; then
    warning "PostgreSQL n'est pas démarré ou la connexion a échoué"
    echo ""
    echo "Démarrer PostgreSQL :"
    echo "  Avec Homebrew: brew services start postgresql@14"
    echo "  Avec Postgres.app: Lancez l'application et cliquez sur 'Initialize'"
    echo ""
    read -p "Appuyez sur Entrée une fois PostgreSQL démarré..."
fi
success "PostgreSQL fonctionne"

# Installation des dépendances
echo ""
info "Installation des dépendances..."

echo "📦 Installation des dépendances root..."
npm install || error "Échec de l'installation root"
success "Dépendances root installées"

echo "📦 Installation des dépendances backend..."
cd backend
npm install || error "Échec de l'installation backend"
success "Dépendances backend installées"

echo "📦 Installation des dépendances frontend..."
cd ../frontend
npm install || error "Échec de l'installation frontend"
success "Dépendances frontend installées"

cd ..

# Configuration des fichiers .env
echo ""
info "Configuration des fichiers d'environnement..."

if [ ! -f "backend/.env" ]; then
    echo "📝 Création de backend/.env..."
    cp backend/.env.example backend/.env || error "Échec de la copie backend/.env"
    
    echo ""
    warning "IMPORTANT: Éditez backend/.env avec vos paramètres PostgreSQL"
    echo "Par défaut, utilisez : postgresql://postgres:@localhost:5432/shepherd_capital"
    echo ""
    read -p "Voulez-vous éditer backend/.env maintenant ? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        ${EDITOR:-nano} backend/.env
    fi
else
    success "backend/.env existe déjà"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "📝 Création de frontend/.env.local..."
    cp frontend/.env.local.example frontend/.env.local || error "Échec de la copie frontend/.env.local"
    success "frontend/.env.local créé"
else
    success "frontend/.env.local existe déjà"
fi

# Création de la base de données
echo ""
info "Configuration de la base de données..."

DB_EXISTS=$(psql -lqt | cut -d \| -f 1 | grep -w shepherd_capital | wc -l)

if [ $DB_EXISTS -eq 0 ]; then
    echo "🗄️  Création de la base shepherd_capital..."
    createdb shepherd_capital || error "Échec de la création de la base de données"
    success "Base de données créée"
else
    success "Base de données shepherd_capital existe déjà"
fi

# Migration de la base
echo ""
info "Migration de la base de données..."
cd backend
npm run migrate || error "Échec de la migration"
success "Base de données migrée"
cd ..

# Résumé
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Installation terminée avec succès !      ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📚 Prochaines étapes :${NC}"
echo ""
echo "1. Démarrer l'application :"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "2. Accéder à l'application :"
echo "   Frontend : ${GREEN}http://localhost:3000${NC}"
echo "   Backend  : ${GREEN}http://localhost:5000${NC}"
echo ""
echo "3. Connexion admin par défaut :"
echo "   Email    : ${GREEN}max@shepherdcapital.com${NC}"
echo "   Password : ${GREEN}Admin@123${NC}"
echo "   ${RED}⚠️  Changez ce mot de passe immédiatement !${NC}"
echo ""
echo -e "${BLUE}📖 Documentation disponible :${NC}"
echo "   • DEMARRAGE_RAPIDE.md - Guide de démarrage"
echo "   • INSTALLATION.md - Installation détaillée"
echo "   • QUICKSTART.md - Démarrage en 5 minutes"
echo "   • TECHNICAL_DOC.md - Documentation technique"
echo ""
echo "🚀 Pour démarrer : ${GREEN}npm run dev${NC}"
echo ""
