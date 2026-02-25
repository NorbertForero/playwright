import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object para la página de Dashboard
 */
export class DashboardPage extends BasePage {
  // URL de la página
  readonly url = '/dashboard';

  // Selectores
  readonly welcomeMessage: Locator;
  readonly userAvatar: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly settingsLink: Locator;
  readonly profileLink: Locator;
  readonly statsCards: Locator;
  readonly recentActivityList: Locator;
  readonly searchInput: Locator;
  readonly notificationBell: Locator;
  readonly notificationBadge: Locator;
  readonly sidebar: Locator;
  readonly sidebarToggle: Locator;

  constructor(page: Page) {
    super(page);

    // Inicializar locators específicos del Dashboard
    this.welcomeMessage = page.locator('[data-testid="welcome-message"]');
    this.userAvatar = page.locator('[data-testid="user-avatar"]');
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.logoutButton = page.locator('[data-testid="logout-button"]');
    this.settingsLink = page.locator('[data-testid="settings-link"]');
    this.profileLink = page.locator('[data-testid="profile-link"]');
    this.statsCards = page.locator('[data-testid="stats-card"]');
    this.recentActivityList = page.locator('[data-testid="recent-activity-list"]');
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.notificationBell = page.locator('[data-testid="notification-bell"]');
    this.notificationBadge = page.locator('[data-testid="notification-badge"]');
    this.sidebar = page.locator('[data-testid="sidebar"]');
    this.sidebarToggle = page.locator('[data-testid="sidebar-toggle"]');
  }

  /**
   * Navegar al dashboard
   */
  async navigate(): Promise<void> {
    await this.goto(this.url);
  }

  /**
   * Verificar que el dashboard está cargado
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.welcomeMessage).toBeVisible();
    await expect(this.sidebar).toBeVisible();
  }

  /**
   * Obtener mensaje de bienvenida
   */
  async getWelcomeMessage(): Promise<string> {
    return await this.getText(this.welcomeMessage);
  }

  /**
   * Abrir menú de usuario
   */
  async openUserMenu(): Promise<void> {
    await this.userAvatar.click();
    await expect(this.userMenu).toBeVisible();
  }

  /**
   * Realizar logout
   */
  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.logoutButton.click();
    await this.verifyUrlContains('/login');
  }

  /**
   * Ir a configuración
   */
  async goToSettings(): Promise<void> {
    await this.openUserMenu();
    await this.settingsLink.click();
  }

  /**
   * Ir al perfil
   */
  async goToProfile(): Promise<void> {
    await this.openUserMenu();
    await this.profileLink.click();
  }

  /**
   * Obtener cantidad de tarjetas de estadísticas
   */
  async getStatsCardsCount(): Promise<number> {
    return await this.statsCards.count();
  }

  /**
   * Obtener valor de una tarjeta de estadísticas por índice
   */
  async getStatsCardValue(index: number): Promise<string> {
    const card = this.statsCards.nth(index);
    const valueElement = card.locator('[data-testid="stats-value"]');
    return await this.getText(valueElement);
  }

  /**
   * Buscar en el dashboard
   */
  async search(query: string): Promise<void> {
    await this.fillField(this.searchInput, query);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Obtener cantidad de notificaciones
   */
  async getNotificationCount(): Promise<number> {
    const isVisible = await this.notificationBadge.isVisible();
    if (!isVisible) return 0;
    const text = await this.getText(this.notificationBadge);
    return parseInt(text) || 0;
  }

  /**
   * Abrir panel de notificaciones
   */
  async openNotifications(): Promise<void> {
    await this.notificationBell.click();
    await this.page.locator('[data-testid="notifications-panel"]').waitFor({ state: 'visible' });
  }

  /**
   * Toggle sidebar
   */
  async toggleSidebar(): Promise<void> {
    await this.sidebarToggle.click();
  }

  /**
   * Verificar que el sidebar está colapsado
   */
  async verifySidebarCollapsed(): Promise<void> {
    await expect(this.sidebar).toHaveClass(/collapsed/);
  }

  /**
   * Verificar que el sidebar está expandido
   */
  async verifySidebarExpanded(): Promise<void> {
    await expect(this.sidebar).not.toHaveClass(/collapsed/);
  }

  /**
   * Navegar a una sección del sidebar
   */
  async navigateToSection(sectionName: string): Promise<void> {
    const sectionLink = this.sidebar.locator(`[data-testid="nav-${sectionName.toLowerCase()}"]`);
    await sectionLink.click();
  }
}
