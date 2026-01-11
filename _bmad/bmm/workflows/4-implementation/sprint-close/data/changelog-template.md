# Template Changelog Utilisateur

Ce template guide la génération d'un changelog orienté utilisateur final.

## Format attendu

Le changelog doit être :
- **Non technique** : Pas de jargon développeur
- **Orienté valeur** : Ce que l'utilisateur peut faire de nouveau
- **Concis** : 1-2 phrases par fonctionnalité
- **Positif** : Formulations actives et engageantes

## Structure

```
🎉 Quoi de neuf dans [Nom App] ?

✨ Nouvelles fonctionnalités
- [Fonctionnalité 1] : [Description orientée utilisateur]
- [Fonctionnalité 2] : [Description orientée utilisateur]

🔧 Améliorations
- [Amélioration 1] : [Bénéfice pour l'utilisateur]

🐛 Corrections
- [Correction 1] : [Ce qui fonctionne mieux maintenant]

📝 Comment tester
1. [Étape pour tester fonctionnalité 1]
2. [Étape pour tester fonctionnalité 2]
```

## Exemples de formulations

**Technique (à éviter):**
- "Implémentation du endpoint GET /api/v1/teams"
- "Refactoring du composant TeamList avec React Query"

**Orienté utilisateur (à utiliser):**
- "Vous pouvez maintenant voir la liste de vos équipes"
- "L'affichage des équipes est plus rapide et fluide"

## Génération

Pour générer le changelog :
1. Analyser les stories complétées de l'epic
2. Extraire les fonctionnalités visibles par l'utilisateur
3. Formuler en langage non technique
4. Ajouter les étapes pour tester chaque nouveauté
