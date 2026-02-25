import { test, expect } from '../../src/fixtures';
import { staticTestData } from '../../src/utils';

/**
 * Suite de tests para la funcionalidad de Login
 */
test.describe('Login Page', () => {
  
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test.describe('Carga de página', () => {
    test('debe mostrar todos los elementos del formulario de login', async ({ loginPage }) => {
      await loginPage.verifyPageLoaded();
      await expect(loginPage.forgotPasswordLink).toBeVisible();
      await expect(loginPage.registerLink).toBeVisible();
    });

    test('debe tener el título correcto', async ({ loginPage }) => {
      const title = await loginPage.getPageTitle();
      expect(title).toContain('Login');
    });
  });

  test.describe('Login exitoso', () => {
    test('debe permitir login con credenciales válidas', async ({ loginPage }) => {
      await loginPage.login(
        staticTestData.users.valid.email,
        staticTestData.users.valid.password
      );
      
      await loginPage.verifyLoginSuccess();
    });

    test('debe permitir login con opción "Recordarme"', async ({ loginPage }) => {
      await loginPage.fillEmail(staticTestData.users.valid.email);
      await loginPage.fillPassword(staticTestData.users.valid.password);
      await loginPage.checkRememberMe();
      await loginPage.clickLogin();
      
      await loginPage.verifyLoginSuccess();
    });
  });

  test.describe('Login fallido', () => {
    test('debe mostrar error con credenciales inválidas', async ({ loginPage }) => {
      await loginPage.login(
        staticTestData.users.invalid.email,
        staticTestData.users.invalid.password
      );
      
      await loginPage.verifyLoginFailed(staticTestData.errorMessages.invalidCredentials);
    });

    test('debe mostrar error cuando el email está vacío', async ({ loginPage }) => {
      await loginPage.fillPassword('somepassword');
      await loginPage.clickLogin();
      
      await loginPage.verifyEmailValidation();
    });

    test('debe mostrar error cuando el password está vacío', async ({ loginPage }) => {
      await loginPage.fillEmail(staticTestData.users.valid.email);
      await loginPage.clickLogin();
      
      await loginPage.verifyPasswordValidation();
    });

    test('debe mostrar error con email en formato inválido', async ({ loginPage }) => {
      await loginPage.fillEmail('invalid-email');
      await loginPage.fillPassword('somepassword');
      await loginPage.clickLogin();
      
      await loginPage.verifyEmailValidation();
    });
  });

  test.describe('Navegación', () => {
    test('debe navegar a la página de recuperar contraseña', async ({ loginPage }) => {
      await loginPage.goToForgotPassword();
      await loginPage.verifyUrlContains('/forgot-password');
    });

    test('debe navegar a la página de registro', async ({ loginPage }) => {
      await loginPage.goToRegister();
      await loginPage.verifyUrlContains('/register');
    });
  });

  test.describe('Validación con base de datos', () => {
    test('debe verificar que el usuario existe en la base de datos después del login', async ({ 
      loginPage, 
      db 
    }) => {
      // Verificar que el usuario existe antes del login
      const userExists = await db.userExists(staticTestData.users.valid.email);
      
      if (userExists) {
        // Realizar login
        await loginPage.login(
          staticTestData.users.valid.email,
          staticTestData.users.valid.password
        );
        
        await loginPage.verifyLoginSuccess();
        
        // Verificar datos del usuario en la DB
        const user = await db.getUserByEmail(staticTestData.users.valid.email);
        expect(user).not.toBeNull();
        expect(user?.email).toBe(staticTestData.users.valid.email);
      } else {
        test.skip();
      }
    });
  });
});
