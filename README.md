# Time Manager

Application de gestion du temps construite avec React, Express et Supabase.

## Démarrage rapide

### Prérequis

- Docker et Docker Compose installés
- Git

### Installation

```bash
# Cloner le repository
git clone <url-du-repo>
cd time-manager

# Configurer les variables d'environnement
cp backend/.env.example backend/.env    # Se rapprocher du lead technique pour obtenir le fichier avec les variable d'environnement
```

### Lancement en développement

```bash
# Démarre backend + frontend avec rechargement automatique à chaque modification
docker-compose -f docker-compose.dev.yml up

# Accès :
# - Frontend : http://localhost:5173
# - Backend API : http://localhost:3000
```

### Lancement en production

```bash
# Build les images optimisées
docker-compose -f docker-compose.prod.yml build

# Lance les conteneurs
docker-compose -f docker-compose.prod.yml up -d

# Accès :
# - Frontend : http://localhost
# - Backend API : http://localhost:3000
```

## 📁 Structure du projet

```
time-manager/
├── README.md 
├── Docs/
│   ├── ARCHITECTURE.md        # Choix techniques détaillés
│   └── DOCKER.md              # Guide Docker complet
├── backend/                   --- API Express ---
│   ├── app.js                 # Point d'entrée
│   ├── Dockerfile.dev         # Image dev (nodemon)
│   ├── Dockerfile.prod        # Image prod (optimisée)
│   ├── package.json
│   └── .env                   # Variables d'environnement (non versionné)
├── frontend/                  --- Application React ---
│   ├── src/                   # Code source
│   ├── public/                # Assets statiques
│   ├── Dockerfile.dev         # Image dev (Vite)
│   ├── Dockerfile.prod        # Image prod (Nginx)
│   ├── nginx.conf             # Configuration Nginx
│   └── package.json
├── docker-compose.dev.yml     # Orchestration développement
├── docker-compose.prod.yml    # Orchestration production
└── .gitignore
```

## 🛠️ Stack technique

- **Frontend** : React / Vite (dev) ou Nginx (prod)
- **Backend** : Node.js / Express
- **Base de données** : Supabase
- **Conteneurisation** : Docker / Docker Compose

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** : Comprendre les choix techniques et l'architecture
- **[DOCKER.md](DOCKER.md)** : Guide complet Docker (dev, prod, commandes)

## 🔧 Commandes principales

### Développement

```bash
# Démarrer les services
docker-compose -f docker-compose.dev.yml up

# Rebuild après modification de package.json
docker-compose -f docker-compose.dev.yml up --build

# Voir les logs
docker-compose -f docker-compose.dev.yml logs -f

# Arrêter les services
docker-compose -f docker-compose.dev.yml down
```

### Production

```bash
# Build et démarrer
docker-compose -f docker-compose.prod.yml up -d --build

# Voir l'état des conteneurs
docker-compose -f docker-compose.prod.yml ps

# Voir les logs
docker-compose -f docker-compose.prod.yml logs -f

# Redémarrer un service
docker-compose -f docker-compose.prod.yml restart backend-prod

# Arrêter et supprimer
docker-compose -f docker-compose.prod.yml down
```

## 👥 Équipe

Ryan Homawoo, Lucas Noirie

---

Pour plus de détails, consultez [ARCHITECTURE.md](ARCHITECTURE.md) et [DOCKER.md](DOCKER.md).