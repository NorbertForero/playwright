import { test as base, Page, BrowserContext } from '@playwright/test';
import { LoginPage, DashboardPage } from '../pages';
import { ApiClient } from '../api';
import { DatabaseHelper } from '../database';
import { testUsers } from '../config';

/**
 * Tipo para fixtures personalizados
 */
type CustomFixtures = {
  // Page Objects
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  
  // API Client
  apiClient: ApiClient;
  authenticatedApiClient: ApiClient;
  
  // Database
  db: DatabaseHelper;
  
  // Usuario autenticado
  authenticatedPage: Page;
  authenticatedContext: BrowserContext;
};

/**
 * Extender test de Playwright con fixtures personalizados
 */
export const test = base.extend<CustomFixtures>({
  // Fixture: LoginPage
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  // Fixture: DashboardPage
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  // Fixture: API Client sin autenticación
  apiClient: async ({ request }, use) => {
    const apiClient = new ApiClient(request);
    await use(apiClient);
  },

  // Fixture: API Client con autenticación
  authenticatedApiClient: async ({ request }, use) => {
    const apiClient = new ApiClient(request);
    
    // Login automático
    await apiClient.login(
      testUsers.standard.email,
      testUsers.standard.password
    );
    
    await use(apiClient);
    
    // Cleanup: logout
    await apiClient.logout();
  },

  // Fixture: Database Helper
  db: async ({}, use) => {
    const dbHelper = new DatabaseHelper('postgres');
    
    try {
      await dbHelper.connect();
    } catch (error) {
      console.warn('⚠️ No se pudo conectar a la base de datos:', error);
    }
    
    await use(dbHelper);
    
    // Cleanup: desconectar
    try {
      await dbHelper.disconnect();
    } catch {
      // Ignorar errores de desconexión
    }
  },

  // Fixture: Página autenticada
  authenticatedPage: async ({ browser }, use) => {
    // Crear nuevo contexto
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Realizar login
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(
      testUsers.standard.email,
      testUsers.standard.password
    );
    await loginPage.verifyLoginSuccess();
    
    await use(page);
    
    // Cleanup
    await context.close();
  },

  // Fixture: Contexto autenticado (para múltiples páginas)
  authenticatedContext: async ({ browser }, use) => {
    // Crear nuevo contexto
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Realizar login
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(
      testUsers.standard.email,
      testUsers.standard.password
    );
    await loginPage.verifyLoginSuccess();
    
    // Guardar estado de autenticación
    await context.storageState({ path: '.auth/user.json' });
    
    await use(context);
    
    // Cleanup
    await context.close();
  },
});

export { expect } from '@playwright/test';
