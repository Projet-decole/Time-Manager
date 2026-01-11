# Modele de Donnees - Time Manager

> **Version** : 1.0 | **Date** : 2026-01-11 | **Database** : PostgreSQL (Supabase)

## Vue d'ensemble

Le schema de base de donnees comprend 10 tables reparties en 3 categories :

1. **Tables Core** : profiles, teams, team_members, projects, categories, team_projects
2. **Tables Time Tracking** : time_entries, timesheets, templates
3. **Tables Systeme** : audit_logs

## Diagramme Entite-Relation

```
┌─────────────────┐          ┌─────────────────┐
│    profiles     │          │     teams       │
├─────────────────┤          ├─────────────────┤
│ id (PK, UUID)   │←─────┐   │ id (PK, UUID)   │
│ email           │      │   │ name            │
│ first_name      │      │   │ description     │
│ last_name       │      │   │ created_at      │
│ role            │      │   │ updated_at      │
│ weekly_hours    │      │   └────────┬────────┘
│ created_at      │      │            │
│ updated_at      │      │            │
└─────────────────┘      │   ┌────────┴────────┐
         │               │   │  team_members   │
         │               │   ├─────────────────┤
         ▼               │   │ id (PK, UUID)   │
┌─────────────────┐      └───│ user_id (FK)    │
│  time_entries   │          │ team_id (FK)    │
├─────────────────┤          │ created_at      │
│ id (PK, UUID)   │          └─────────────────┘
│ user_id (FK)    │                    │
│ project_id (FK) │──┐                 │
│ category_id(FK) │  │                 │
│ start_time      │  │        ┌────────┴────────┐
│ end_time        │  │        │  team_projects  │
│ duration_min    │  │        ├─────────────────┤
│ description     │  │        │ id (PK, UUID)   │
│ entry_mode      │  │        │ team_id (FK)    │
│ created_at      │  │        │ project_id (FK) │─┐
│ updated_at      │  │        │ created_at      │ │
└─────────────────┘  │        └─────────────────┘ │
                     │                            │
┌─────────────────┐  │   ┌─────────────────┐      │
│   timesheets    │  │   │    projects     │←─────┘
├─────────────────┤  │   ├─────────────────┤
│ id (PK, UUID)   │  │   │ id (PK, UUID)   │
│ user_id (FK)    │  └──→│ code (UNIQUE)   │
│ week_start      │      │ name            │
│ week_end        │      │ description     │
│ status          │      │ budget_hours    │
│ submitted_at    │      │ status          │
│ validated_at    │      │ created_at      │
│ validated_by(FK)│      │ updated_at      │
│ rejection_reason│      └─────────────────┘
│ total_hours     │
│ created_at      │      ┌─────────────────┐
│ updated_at      │      │   categories    │
└─────────────────┘      ├─────────────────┤
                         │ id (PK, UUID)   │
┌─────────────────┐      │ name            │
│   templates     │      │ description     │
├─────────────────┤      │ color           │
│ id (PK, UUID)   │      │ is_active       │
│ user_id (FK)    │      │ created_at      │
│ name            │      │ updated_at      │
│ description     │      └─────────────────┘
│ config (JSONB)  │
│ created_at      │      ┌─────────────────┐
│ updated_at      │      │   audit_logs    │
└─────────────────┘      ├─────────────────┤
                         │ id (PK, UUID)   │
                         │ user_id (FK)    │
                         │ action          │
                         │ table_name      │
                         │ record_id       │
                         │ old_values(JSON)│
                         │ new_values(JSON)│
                         │ created_at      │
                         └─────────────────┘
```

---

## Tables Detaillees

### profiles

Profils utilisateurs etendant `auth.users` de Supabase.

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| id | UUID | Non | - | PK, reference auth.users(id) |
| email | TEXT | Non | - | Email utilisateur |
| first_name | TEXT | Non | - | Prenom |
| last_name | TEXT | Non | - | Nom |
| role | TEXT | Non | - | Role : 'employee' ou 'manager' |
| weekly_hours_target | INTEGER | Oui | 35 | Heures cibles hebdomadaires |
| created_at | TIMESTAMPTZ | Oui | NOW() | Date creation |
| updated_at | TIMESTAMPTZ | Oui | NOW() | Date modification |

**Contraintes** :
- `PRIMARY KEY (id)`
- `FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE`
- `CHECK (role IN ('employee', 'manager'))`

---

### teams

Equipes de travail.

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| id | UUID | Non | gen_random_uuid() | PK |
| name | TEXT | Non | - | Nom de l'equipe |
| description | TEXT | Oui | - | Description |
| created_at | TIMESTAMPTZ | Oui | NOW() | Date creation |
| updated_at | TIMESTAMPTZ | Oui | NOW() | Date modification |

---

### team_members

Table de junction equipes-utilisateurs.

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| id | UUID | Non | gen_random_uuid() | PK |
| team_id | UUID | Non | - | FK vers teams |
| user_id | UUID | Non | - | FK vers profiles |
| created_at | TIMESTAMPTZ | Oui | NOW() | Date ajout |

**Contraintes** :
- `UNIQUE (team_id, user_id)`
- `FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE`
- `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE`

**Index** :
- `idx_team_members_user_id` sur `user_id`
- `idx_team_members_team_id` sur `team_id`

---

### projects

Projets sur lesquels les employes saisissent leur temps.

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| id | UUID | Non | gen_random_uuid() | PK |
| code | TEXT | Non | - | Code unique projet |
| name | TEXT | Non | - | Nom du projet |
| description | TEXT | Oui | - | Description |
| budget_hours | INTEGER | Oui | - | Budget heures total |
| status | TEXT | Oui | 'active' | Statut : 'active' ou 'archived' |
| created_at | TIMESTAMPTZ | Oui | NOW() | Date creation |
| updated_at | TIMESTAMPTZ | Oui | NOW() | Date modification |

**Contraintes** :
- `UNIQUE (code)`
- `CHECK (status IN ('active', 'archived'))`

---

### categories

Categories de temps (ex: developpement, reunion, formation).

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| id | UUID | Non | gen_random_uuid() | PK |
| name | TEXT | Non | - | Nom categorie |
| description | TEXT | Oui | - | Description |
| color | TEXT | Non | - | Couleur hex (#RRGGBB) |
| is_active | BOOLEAN | Oui | true | Categorie active |
| created_at | TIMESTAMPTZ | Oui | NOW() | Date creation |
| updated_at | TIMESTAMPTZ | Oui | NOW() | Date modification |

---

### team_projects

Table de junction equipes-projets.

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| id | UUID | Non | gen_random_uuid() | PK |
| team_id | UUID | Non | - | FK vers teams |
| project_id | UUID | Non | - | FK vers projects |
| created_at | TIMESTAMPTZ | Oui | NOW() | Date assignation |

**Contraintes** :
- `UNIQUE (team_id, project_id)`
- `FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE`
- `FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE`

**Index** :
- `idx_team_projects_team_id` sur `team_id`
- `idx_team_projects_project_id` sur `project_id`

---

### time_entries

Saisies de temps individuelles.

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| id | UUID | Non | gen_random_uuid() | PK |
| user_id | UUID | Non | - | FK vers profiles |
| project_id | UUID | Oui | - | FK vers projects |
| category_id | UUID | Oui | - | FK vers categories |
| start_time | TIMESTAMPTZ | Non | - | Debut de la saisie |
| end_time | TIMESTAMPTZ | Oui | - | Fin de la saisie |
| duration_minutes | INTEGER | Oui | - | Duree en minutes |
| description | TEXT | Oui | - | Description du travail |
| entry_mode | TEXT | Oui | - | Mode : 'simple', 'day', 'template' |
| created_at | TIMESTAMPTZ | Oui | NOW() | Date creation |
| updated_at | TIMESTAMPTZ | Oui | NOW() | Date modification |

**Contraintes** :
- `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `FOREIGN KEY (project_id) REFERENCES projects(id)`
- `FOREIGN KEY (category_id) REFERENCES categories(id)`
- `CHECK (entry_mode IN ('simple', 'day', 'template'))`

**Index** :
- `idx_time_entries_user_id` sur `user_id`
- `idx_time_entries_start_time` sur `start_time`
- `idx_time_entries_user_start` sur `(user_id, start_time)`

---

### timesheets

Feuilles de temps hebdomadaires.

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| id | UUID | Non | gen_random_uuid() | PK |
| user_id | UUID | Non | - | FK vers profiles |
| week_start | DATE | Non | - | Debut de semaine (lundi) |
| week_end | DATE | Non | - | Fin de semaine (dimanche) |
| status | TEXT | Oui | 'draft' | Statut workflow |
| submitted_at | TIMESTAMPTZ | Oui | - | Date soumission |
| validated_at | TIMESTAMPTZ | Oui | - | Date validation |
| validated_by | UUID | Oui | - | FK manager validateur |
| rejection_reason | TEXT | Oui | - | Motif de rejet |
| total_hours | DECIMAL(5,2) | Oui | - | Total heures |
| created_at | TIMESTAMPTZ | Oui | NOW() | Date creation |
| updated_at | TIMESTAMPTZ | Oui | NOW() | Date modification |

**Contraintes** :
- `UNIQUE (user_id, week_start)`
- `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `FOREIGN KEY (validated_by) REFERENCES profiles(id)`
- `CHECK (status IN ('draft', 'submitted', 'validated', 'rejected'))`

**Index** :
- `idx_timesheets_user_week` sur `(user_id, week_start)`
- `idx_timesheets_status` sur `status`

**Workflow statuts** :
```
draft → submitted → validated
                 ↘ rejected → (edit) → submitted
```

---

### templates

Modeles de saisie recurrente.

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| id | UUID | Non | gen_random_uuid() | PK |
| user_id | UUID | Non | - | FK vers profiles |
| name | TEXT | Non | - | Nom du template |
| description | TEXT | Oui | - | Description |
| config | JSONB | Non | - | Configuration JSON |
| created_at | TIMESTAMPTZ | Oui | NOW() | Date creation |
| updated_at | TIMESTAMPTZ | Oui | NOW() | Date modification |

**Structure config (exemple)** :
```json
{
  "entries": [
    {
      "project_id": "uuid",
      "category_id": "uuid",
      "duration_minutes": 480,
      "description": "Developpement feature X"
    }
  ]
}
```

---

### audit_logs

Journal d'audit pour tracabilite.

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| id | UUID | Non | gen_random_uuid() | PK |
| user_id | UUID | Oui | - | FK utilisateur auteur |
| action | TEXT | Non | - | Action effectuee |
| table_name | TEXT | Non | - | Table concernee |
| record_id | UUID | Non | - | ID de l'enregistrement |
| old_values | JSONB | Oui | - | Anciennes valeurs |
| new_values | JSONB | Oui | - | Nouvelles valeurs |
| created_at | TIMESTAMPTZ | Oui | NOW() | Date action |

**Index** :
- `idx_audit_logs_record` sur `(table_name, record_id)`
- `idx_audit_logs_user` sur `user_id`

---

## Row Level Security (RLS)

### Fonction Helper

```sql
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Policies par Table

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Own + Manager all | Own only | Own only | - |
| teams | Authenticated | Manager | Manager | Manager |
| team_members | Authenticated | Manager | - | Manager |
| projects | Authenticated | Manager | Manager | Manager |
| categories | Authenticated | Manager | Manager | Manager |
| team_projects | Authenticated | Manager | - | Manager |
| time_entries | Own + Manager all | Own only | Own only | Own only |
| timesheets | Own + Manager all | Own only | Own draft/rejected + Manager | - |
| templates | Own only | Own only | Own only | Own only |
| audit_logs | - (service role only) | - | - | - |

---

## Triggers

### updated_at Automatique

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Tables avec trigger `set_updated_at_*` :
- time_entries
- timesheets
- templates

---

## Conventions de Nommage

### Base de donnees (PostgreSQL)

- Tables : `snake_case` pluriel (ex: `time_entries`)
- Colonnes : `snake_case` (ex: `weekly_hours_target`)
- Index : `idx_[table]_[column(s)]` (ex: `idx_time_entries_user_id`)
- Policies : `[table]_[action]_[scope]` (ex: `profiles_select_own`)

### API (JavaScript)

- Objets : `camelCase` (ex: `weeklyHoursTarget`)
- Transformation automatique via `transformers.js`

---

## Migrations

Les migrations sont stockees dans `supabase/migrations/` :

1. `20260110105727_create_core_database_schema.sql` - Tables core
2. `20260110111412_create_time_tracking_tables.sql` - Tables time tracking
3. `20260110113501_rls_policies.sql` - Politiques RLS

Pour appliquer les migrations :
```bash
supabase db push
```
