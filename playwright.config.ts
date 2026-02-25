import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Configuración principal de Playwright
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directorio donde se encuentran los tests
  testDir: './tests',

  // Ejecutar tests en paralelo
  fullyParallel: true,

  // Fallar el build en CI si se dejó test.only
  forbidOnly: !!process.env.CI,

  // Reintentos en CI
  retries: process.env.CI ? 2 : 0,

  // Workers paralelos
  workers: process.env.CI ? 1 : undefined,

  // Reporter de resultados
  reporter: [
    ['html', { outputFolder: 'reports/html' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['list'],
  ],

  // Configuración global de tests
  use: {
    // URL base para navegación
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Capturar trace en caso de fallo
    trace: 'on-first-retry',

    // Capturar screenshot en caso de fallo
    screenshot: 'only-on-failure',

    // Capturar video en caso de fallo
    video: 'on-first-retry',

    // Timeout de acciones
    actionTimeout: 15000,

    // Timeout de navegación
    navigationTimeout: 30000,

    // Headers adicionales para API
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },

  // Timeout global por test
  timeout: 60000,

  // Timeout para expect
  expect: {
    timeout: 10000,
  },

  // Configuración por proyecto/navegador
  projects: [
    // Setup - Ejecutar antes de todos los tests
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Tests de UI en diferentes navegadores
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },

    // Tests de API (sin navegador)
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.ts/,
      use: {
        baseURL: process.env.API_URL || 'http://localhost:3000/api',
      },
    },

    // Tests Mobile
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },
  ],

  // Directorio de output
  outputDir: 'test-results/',

  // Servidor de desarrollo (opcional)
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
