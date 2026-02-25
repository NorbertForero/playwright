import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object para la página de Login
 */
export class LoginPage extends BasePage {
  // URL de la página
  readonly url = '/login';

  // Selectores
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly loginErrorMessage: Locator;
  readonly googleLoginButton: Locator;
  readonly microsoftLoginButton: Locator;

  constructor(page: Page) {
    super(page);

    // Inicializar locators específicos de Login
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password-link"]');
    this.registerLink = page.locator('[data-testid="register-link"]');
    this.rememberMeCheckbox = page.locator('[data-testid="remember-me-checkbox"]');
    this.loginErrorMessage = page.locator('[data-testid="login-error"]');
    this.googleLoginButton = page.locator('[data-testid="google-login-button"]');
    this.microsoftLoginButton = page.locator('[data-testid="microsoft-login-button"]');
  }

  /**
   * Navegar a la página de login
   */
  async navigate(): Promise<void> {
    await this.goto(this.url);
  }

  /**
   * Realizar login con credenciales
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  /**
   * Llenar campo de email
   */
  async fillEmail(email: string): Promise<void> {
    await this.fillField(this.emailInput, email);
  }

  /**
   * Llenar campo de password
   */
  async fillPassword(password: string): Promise<void> {
    await this.fillField(this.passwordInput, password);
  }

  /**
   * Hacer clic en botón de login
   */
  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  /**
   * Marcar checkbox de recordarme
   */
  async checkRememberMe(): Promise<void> {
    await this.rememberMeCheckbox.check();
  }

  /**
   * Desmarcar checkbox de recordarme
   */
  async uncheckRememberMe(): Promise<void> {
    await this.rememberMeCheckbox.uncheck();
  }

  /**
   * Navegar a recuperar contraseña
   */
  async goToForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  /**
   * Navegar a registro
   */
  async goToRegister(): Promise<void> {
    await this.registerLink.click();
  }

  /**
   * Verificar que el login fue exitoso
   */
  async verifyLoginSuccess(): Promise<void> {
    // Verificar redirección al dashboard
    await this.verifyUrlContains('/dashboard');
  }

  /**
   * Verificar que el login falló
   */
  async verifyLoginFailed(expectedError?: string): Promise<void> {
    await expect(this.loginErrorMessage).toBeVisible();
    if (expectedError) {
      await expect(this.loginErrorMessage).toContainText(expectedError);
    }
  }

  /**
   * Verificar que la página de login está cargada
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Obtener el mensaje de error de login
   */
  async getLoginErrorMessage(): Promise<string> {
    return await this.getText(this.loginErrorMessage);
  }

  /**
   * Verificar validación de email
   */
  async verifyEmailValidation(): Promise<void> {
    const validationMessage = this.page.locator('[data-testid="email-validation-error"]');
    await expect(validationMessage).toBeVisible();
  }

  /**
   * Verificar validación de password
   */
  async verifyPasswordValidation(): Promise<void> {
    const validationMessage = this.page.locator('[data-testid="password-validation-error"]');
    await expect(validationMessage).toBeVisible();
  }

  /**
   * Login con Google
   */
  async loginWithGoogle(): Promise<void> {
    await this.googleLoginButton.click();
  }

  /**
   * Login con Microsoft
   */
  async loginWithMicrosoft(): Promise<void> {
    await this.microsoftLoginButton.click();
  }
}
