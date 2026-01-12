# Changelog

Toutes les modifications notables de ce projet sont documentees dans ce fichier.

Le format est base sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet adhere au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-12

### Epic 4 : Time Tracking - 3 Modes

#### Ajoute

**Simple Mode (Timer)**
- Demarrage d'un timer en un clic
- Arret du timer avec calcul automatique de la duree
- Affichage en temps reel du temps ecoule
- Possibilite d'assigner un projet et une categorie au demarrage ou a l'arret

**Day Mode (Journee)**
- Demarrage de journee avec heure de debut automatique
- Fin de journee avec resume des heures
- Creation de blocs de temps sur une timeline interactive
- Modification des blocs par glisser-deposer (drag & drop)
- Redimensionnement des blocs pour ajuster les heures
- Validation anti-chevauchement des blocs
- Statistiques en temps reel (heures allouees / non allouees)

**Template Mode (Modeles)**
- Creation de templates de journee type
- Creation de template depuis une journee existante
- Application d'un template pour pre-remplir une journee
- Gestion CRUD complete des templates
- Builder visuel avec preview

**Interface Utilisateur**
- Page Time Tracking avec navigation entre les 3 modes
- Composant Timeline interactif avec support tactile
- Modal d'edition des blocs de temps
- Liste des entrees de temps groupees par jour
- Switch de mode intuitif (Tache / Journee / Template)

**API Backend**
- `POST /time-entries/start` - Demarrer un timer
- `POST /time-entries/stop` - Arreter le timer actif
- `GET /time-entries/active` - Recuperer le timer actif
- `POST /time-entries/day/start` - Demarrer une journee
- `POST /time-entries/day/end` - Terminer la journee
- `GET /time-entries/day/active` - Recuperer la journee active avec blocs
- `POST /time-entries/day/blocks` - Creer un bloc de temps
- CRUD complet pour templates (`/templates`)
- `POST /templates/:id/apply` - Appliquer un template

#### Corrige
- Null check pour `activeDay.startTime` dans le calcul des statistiques
- Meilleure gestion du rollback lors de la creation de templates
- Clear de l'erreur lors de la synchronisation avec un timer existant

---

## [1.1.0] - 2026-01-11

### Epic 3 : Administration des donnees

#### Ajoute

**Gestion des Equipes**
- Creation, modification et suppression d'equipes
- Ajout et retrait de membres
- Assignation de projets aux equipes
- Vue detaillee avec liste des membres et projets

**Gestion des Projets**
- Creation avec code auto-genere (PRJ-XXX)
- Modification des informations du projet
- Archivage et restauration des projets
- Suivi du budget en heures

**Gestion des Categories**
- Creation avec couleur personnalisable
- Modification et desactivation
- Reactivation des categories desactivees

**Interface Administration**
- Menu Administration pour les managers
- Pages de gestion des equipes, projets et categories
- Tableaux avec pagination et recherche

---

## [1.0.0] - 2026-01-10

### Epic 2 : Authentification

#### Ajoute
- Connexion avec email et mot de passe
- Deconnexion
- Reinitialisation de mot de passe par email
- Gestion du profil utilisateur
- Creation d'utilisateurs (manager uniquement)
- Liste des utilisateurs avec pagination (manager uniquement)
