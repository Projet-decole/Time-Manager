import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Dashboard
 * Parcours critique: Affichage du tableau de bord
 */

test.describe('Dashboard', () => {
  // Se connecter avant chaque test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('employee@test.com');
    await page.getByLabel(/mot de passe|password/i).fill('password123');
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click();
    await expect(page).toHaveURL(/dashboard|accueil/i);
  });

  test('affichage des informations utilisateur', async ({ page }) => {
    // Vérifier les informations de base
    await expect(page.getByText(/jean|dupont/i)).toBeVisible();

    // TODO: Compléter avec les éléments réels du dashboard
  });

  test('navigation vers les différentes sections', async ({ page }) => {
    // TODO: Implémenter quand le dashboard sera plus complet
    test.skip(true, 'Dashboard en cours de développement');
  });

  test('affichage des statistiques', async ({ page }) => {
    // TODO: Implémenter quand les statistiques seront disponibles
    test.skip(true, 'Statistiques non encore implémentées');
  });
});
