import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Authentification
 * Parcours critique: Login/Logout
 */

test.describe('Authentification', () => {
  test('connexion avec identifiants valides', async ({ page }) => {
    await page.goto('/login');

    // Remplir le formulaire
    await page.getByLabel(/email/i).fill('employee@test.com');
    await page.getByLabel(/mot de passe|password/i).fill('password123');

    // Soumettre
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click();

    // Vérifier la redirection vers le dashboard
    await expect(page).toHaveURL(/dashboard|accueil/i);
    await expect(page.getByText(/bienvenue|tableau de bord/i)).toBeVisible();
  });

  test('connexion avec identifiants invalides', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('employee@test.com');
    await page.getByLabel(/mot de passe|password/i).fill('wrongpassword');

    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click();

    // Vérifier le message d'erreur
    await expect(page.getByText(/invalide|incorrect|erreur/i)).toBeVisible();
    await expect(page).toHaveURL(/login/i);
  });

  test('déconnexion', async ({ page }) => {
    // D'abord se connecter
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('employee@test.com');
    await page.getByLabel(/mot de passe|password/i).fill('password123');
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click();

    await expect(page).toHaveURL(/dashboard|accueil/i);

    // Puis se déconnecter
    await page.getByRole('button', { name: /déconnexion|logout|quitter/i }).click();

    // Vérifier le retour à la page de login
    await expect(page).toHaveURL(/login/i);
  });

  test('accès protégé sans authentification', async ({ page }) => {
    // Tenter d'accéder au dashboard sans être connecté
    await page.goto('/dashboard');

    // Doit rediriger vers login
    await expect(page).toHaveURL(/login/i);
  });
});
