import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Pointage
 * Parcours critique: Pointer une journée de travail
 */

test.describe('Pointage', () => {
  // Se connecter avant chaque test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('employee@test.com');
    await page.getByLabel(/mot de passe|password/i).fill('password123');
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click();
    await expect(page).toHaveURL(/dashboard|accueil/i);
  });

  test('pointer une entrée de temps', async ({ page }) => {
    // TODO: Implémenter quand la fonctionnalité existera
    // Navigation vers la page de pointage
    // await page.goto('/timesheet');
    // ou
    // await page.getByRole('link', { name: /pointage|temps/i }).click();

    // Créer une entrée
    // await page.getByRole('button', { name: /nouveau|ajouter/i }).click();
    // await page.getByLabel(/date/i).fill('2026-01-11');
    // await page.getByLabel(/heures/i).fill('8');
    // await page.getByRole('button', { name: /enregistrer|sauvegarder/i }).click();

    // Vérifier l'enregistrement
    // await expect(page.getByText(/enregistré|succès/i)).toBeVisible();

    test.skip(true, 'Fonctionnalité de pointage non encore implémentée');
  });

  test('modifier une entrée existante', async ({ page }) => {
    // TODO: Implémenter quand la fonctionnalité existera
    test.skip(true, 'Fonctionnalité de pointage non encore implémentée');
  });

  test('supprimer une entrée', async ({ page }) => {
    // TODO: Implémenter quand la fonctionnalité existera
    test.skip(true, 'Fonctionnalité de pointage non encore implémentée');
  });
});
