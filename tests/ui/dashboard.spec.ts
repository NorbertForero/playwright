import { test, expect } from '../../src/fixtures';
import { staticTestData } from '../../src/utils';

/**
 * Suite de tests para el Dashboard
 */
test.describe('Dashboard Page', () => {

  test.describe('Usuario autenticado', () => {
    test('debe mostrar el dashboard después del login', async ({ 
      loginPage, 
      dashboardPage 
    }) => {
      // Login
      await loginPage.navigate();
      await loginPage.login(
        staticTestData.users.valid.email,
        staticTestData.users.valid.password
      );
      
      // Verificar dashboard
      await dashboardPage.verifyPageLoaded();
    });

    test('debe mostrar mensaje de bienvenida personalizado', async ({ 
      authenticatedPage 
    }) => {
      const { DashboardPage } = await import('../../src/pages');
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      await dashboardPage.navigate();
      await dashboardPage.verifyPageLoaded();
      
      const welcomeMessage = await dashboardPage.getWelcomeMessage();
      expect(welcomeMessage).toContain('Welcome');
    });

    test('debe permitir cerrar sesión', async ({ 
      authenticatedPage 
    }) => {
      const { DashboardPage } = await import('../../src/pages');
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      await dashboardPage.navigate();
      await dashboardPage.logout();
      
      // Verificar redirección a login
      expect(authenticatedPage.url()).toContain('/login');
    });
  });

  test.describe('Sidebar navigation', () => {
    test('debe poder colapsar y expandir el sidebar', async ({ 
      authenticatedPage 
    }) => {
      const { DashboardPage } = await import('../../src/pages');
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      await dashboardPage.navigate();
      
      // Verificar sidebar expandido inicialmente
      await dashboardPage.verifySidebarExpanded();
      
      // Colapsar sidebar
      await dashboardPage.toggleSidebar();
      await dashboardPage.verifySidebarCollapsed();
      
      // Expandir sidebar
      await dashboardPage.toggleSidebar();
      await dashboardPage.verifySidebarExpanded();
    });
  });

  test.describe('Estadísticas', () => {
    test('debe mostrar tarjetas de estadísticas', async ({ 
      authenticatedPage 
    }) => {
      const { DashboardPage } = await import('../../src/pages');
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      await dashboardPage.navigate();
      
      const cardsCount = await dashboardPage.getStatsCardsCount();
      expect(cardsCount).toBeGreaterThan(0);
    });
  });

  test.describe('Notificaciones', () => {
    test('debe mostrar el panel de notificaciones al hacer clic', async ({ 
      authenticatedPage 
    }) => {
      const { DashboardPage } = await import('../../src/pages');
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      await dashboardPage.navigate();
      await dashboardPage.openNotifications();
      
      // Verificar que el panel está visible
      await expect(
        authenticatedPage.locator('[data-testid="notifications-panel"]')
      ).toBeVisible();
    });
  });

  test.describe('Búsqueda', () => {
    test('debe permitir realizar búsquedas', async ({ 
      authenticatedPage 
    }) => {
      const { DashboardPage } = await import('../../src/pages');
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      await dashboardPage.navigate();
      await dashboardPage.search('test query');
      
      // Verificar que se muestra resultados o mensaje de no resultados
      const resultsOrEmpty = authenticatedPage.locator(
        '[data-testid="search-results"], [data-testid="no-results"]'
      );
      await expect(resultsOrEmpty).toBeVisible();
    });
  });
});
