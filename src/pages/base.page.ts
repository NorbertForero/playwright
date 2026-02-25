import { Page, Locator, expect } from '@playwright/test';

/**
 * Página Base - Contiene métodos comunes para todas las páginas
 * Todas las Page Objects deben extender de esta clase
 */
export abstract class BasePage {
  readonly page: Page;
  
  // Selectores comunes
  protected readonly loadingSpinner: Locator;
  protected readonly toastNotification: Locator;
  protected readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Inicializar locators comunes
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.toastNotification = page.locator('[data-testid="toast-notification"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  /**
   * Navegar a una URL específica
   */
  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Esperar a que la página cargue completamente
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Esperar a que el spinner de carga desaparezca
   */
  async waitForLoadingToFinish(): Promise<void> {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 30000 });
  }

  /**
   * Obtener el título de la página
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Obtener la URL actual
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Verificar si un elemento es visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }

  /**
   * Esperar a que un elemento sea visible
   */
  async waitForElement(locator: Locator, timeout: number = 10000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Hacer clic en un elemento con reintentos
   */
  async clickWithRetry(locator: Locator, retries: number = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await locator.click({ timeout: 5000 });
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Llenar un campo de texto con limpieza previa
   */
  async fillField(locator: Locator, value: string): Promise<void> {
    await locator.clear();
    await locator.fill(value);
  }

  /**
   * Tomar screenshot
   */
  async takeScreenshot(name: string): Promise<Buffer> {
    return await this.page.screenshot({ 
      path: `screenshots/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * Verificar que un toast/notificación aparezca con cierto texto
   */
  async verifyToastMessage(expectedText: string): Promise<void> {
    await expect(this.toastNotification).toBeVisible();
    await expect(this.toastNotification).toContainText(expectedText);
  }

  /**
   * Verificar mensaje de error
   */
  async verifyErrorMessage(expectedText: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(expectedText);
  }

  /**
   * Scroll hasta un elemento
   */
  async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Esperar un tiempo específico (usar con moderación)
   */
  async wait(milliseconds: number): Promise<void> {
    await this.page.waitForTimeout(milliseconds);
  }

  /**
   * Obtener texto de un elemento
   */
  async getText(locator: Locator): Promise<string> {
    return await locator.innerText();
  }

  /**
   * Obtener valor de un input
   */
  async getValue(locator: Locator): Promise<string> {
    return await locator.inputValue();
  }

  /**
   * Verificar que la URL contenga cierto path
   */
  async verifyUrlContains(path: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(path));
  }
}
