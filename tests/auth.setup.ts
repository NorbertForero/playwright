import { test as setup } from '@playwright/test';
import { testUsers } from '../src/config';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

/**
 * Setup: Autenticación global
 * Este test se ejecuta antes de todos los demás para guardar el estado de autenticación
 */
setup('authenticate', async ({ page }) => {
  // Navegar a login
  await page.goto('/login');

  // Realizar login
  await page.fill('[data-testid="email-input"]', testUsers.standard.email);
  await page.fill('[data-testid="password-input"]', testUsers.standard.password);
  await page.click('[data-testid="login-button"]');

  // Esperar a que el login sea exitoso
  await page.waitForURL('/dashboard');

  // Guardar el estado de autenticación
  await page.context().storageState({ path: authFile });
});
