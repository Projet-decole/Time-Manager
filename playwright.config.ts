import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour Time Manager
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // Timeout par test
  timeout: 30_000,

  // Timeout pour les expect
  expect: {
    timeout: 5_000,
  },

  // Reporter
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  // Parallélisation - limiter les workers pour éviter surcharge mémoire
  fullyParallel: true,
  workers: process.env.CI ? 1 : 2, // Max 2 workers en local pour éviter plantage

  // Retry en CI
  retries: process.env.CI ? 2 : 0,

  // Configuration globale
  use: {
    // URL de base (docker-compose.dev.yml)
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',

    // Traces pour debug
    trace: 'on-first-retry',

    // Screenshots sur échec
    screenshot: 'only-on-failure',
  },

  // Projets (navigateurs)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Décommenter pour tester sur Firefox/Safari
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Démarrage automatique du serveur (optionnel)
  // webServer: {
  //   command: 'docker-compose -f docker-compose.dev.yml up',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120_000,
  // },
});
