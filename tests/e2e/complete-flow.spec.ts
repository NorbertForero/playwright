import { test, expect } from '../../src/fixtures';
import { LoginPage, DashboardPage } from '../../src/pages';
import { TestDataGenerator, staticTestData, TestHelpers } from '../../src/utils';

/**
 * Suite de tests End-to-End completos
 * Estos tests cubren flujos de usuario completos desde el frontend
 * con validaciones en el backend y la base de datos
 */
test.describe('E2E: Flujo de Compra Completo', () => {

  test('Usuario puede completar una compra desde login hasta confirmación', async ({ 
    page,
    apiClient,
    db
  }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const testUser = staticTestData.users.valid;

    // 1. Login
    await test.step('Login del usuario', async () => {
      await loginPage.navigate();
      await loginPage.login(testUser.email, testUser.password);
      await loginPage.verifyLoginSuccess();
    });

    // 2. Navegar a productos
    await test.step('Navegar a la sección de productos', async () => {
      await dashboardPage.navigateToSection('products');
      await expect(page).toHaveURL(/\/products/);
    });

    // 3. Seleccionar un producto
    await test.step('Seleccionar un producto', async () => {
      const productCard = page.locator('[data-testid="product-card"]').first();
      await productCard.click();
      await expect(page).toHaveURL(/\/products\/\d+/);
    });

    // 4. Agregar al carrito
    await test.step('Agregar producto al carrito', async () => {
      const addToCartButton = page.locator('[data-testid="add-to-cart-button"]');
      await addToCartButton.click();
      
      // Verificar toast de confirmación
      await expect(page.locator('[data-testid="toast-notification"]')).toContainText('added');
    });

    // 5. Ir al carrito
    await test.step('Navegar al carrito', async () => {
      const cartIcon = page.locator('[data-testid="cart-icon"]');
      await cartIcon.click();
      await expect(page).toHaveURL(/\/cart/);
    });

    // 6. Verificar productos en carrito
    await test.step('Verificar productos en el carrito', async () => {
      const cartItems = page.locator('[data-testid="cart-item"]');
      await expect(cartItems).toHaveCount(1);
    });

    // 7. Proceder al checkout
    await test.step('Proceder al checkout', async () => {
      const checkoutButton = page.locator('[data-testid="checkout-button"]');
      await checkoutButton.click();
      await expect(page).toHaveURL(/\/checkout/);
    });

    // 8. Completar información de envío
    await test.step('Completar información de envío', async () => {
      const address = TestDataGenerator.generateAddress();
      
      await page.fill('[data-testid="shipping-street"]', address.street);
      await page.fill('[data-testid="shipping-city"]', address.city);
      await page.fill('[data-testid="shipping-state"]', address.state);
      await page.fill('[data-testid="shipping-zipcode"]', address.zipCode);
      
      await page.click('[data-testid="continue-to-payment"]');
    });

    // 9. Completar información de pago
    await test.step('Completar información de pago', async () => {
      const card = TestDataGenerator.generateCreditCard();
      
      await page.fill('[data-testid="card-number"]', card.number);
      await page.fill('[data-testid="card-expiry"]', `${card.expMonth}/${card.expYear}`);
      await page.fill('[data-testid="card-cvv"]', card.cvv);
      await page.fill('[data-testid="card-name"]', card.holderName);
    });

    // 10. Confirmar orden
    await test.step('Confirmar orden', async () => {
      await page.click('[data-testid="place-order-button"]');
      
      // Esperar confirmación
      await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
    });

    // 11. Verificar en base de datos
    await test.step('Verificar orden en base de datos', async () => {
      const user = await db.getUserByEmail(testUser.email);
      if (user) {
        const orders = await db.getOrdersByUser(user.id);
        expect(orders.length).toBeGreaterThan(0);
        
        const latestOrder = orders[0];
        expect(latestOrder.status).toBe('pending');
        expect(latestOrder.total).toBeGreaterThan(0);
      }
    });
  });
});

test.describe('E2E: Gestión de Perfil de Usuario', () => {

  test('Usuario puede actualizar su perfil y los cambios se reflejan en la DB', async ({ 
    page,
    apiClient,
    db
  }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const testUser = staticTestData.users.valid;

    // 1. Login
    await loginPage.navigate();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.verifyLoginSuccess();

    // 2. Ir al perfil
    await dashboardPage.goToProfile();
    await expect(page).toHaveURL(/\/profile/);

    // 3. Actualizar nombre
    const newFirstName = `Test${Date.now()}`;
    await page.fill('[data-testid="first-name-input"]', newFirstName);

    // 4. Guardar cambios
    await page.click('[data-testid="save-profile-button"]');

    // 5. Verificar toast de éxito
    await expect(page.locator('[data-testid="toast-notification"]')).toContainText('updated');

    // 6. Verificar en base de datos
    const user = await db.getUserByEmail(testUser.email);
    expect(user?.name).toContain(newFirstName);

    // 7. Recargar página y verificar que los cambios persisten
    await page.reload();
    await expect(page.locator('[data-testid="first-name-input"]')).toHaveValue(newFirstName);
  });
});

test.describe('E2E: Registro de Nuevo Usuario', () => {

  test('Nuevo usuario puede registrarse, hacer login y acceder al dashboard', async ({ 
    page,
    apiClient,
    db
  }) => {
    const newUser = TestDataGenerator.generateUser();

    // 1. Navegar a registro
    await page.goto('/register');

    // 2. Llenar formulario de registro
    await test.step('Completar formulario de registro', async () => {
      await page.fill('[data-testid="email-input"]', newUser.email);
      await page.fill('[data-testid="password-input"]', newUser.password);
      await page.fill('[data-testid="confirm-password-input"]', newUser.password);
      await page.fill('[data-testid="first-name-input"]', newUser.firstName);
      await page.fill('[data-testid="last-name-input"]', newUser.lastName);
    });

    // 3. Aceptar términos
    await page.check('[data-testid="accept-terms-checkbox"]');

    // 4. Enviar registro
    await page.click('[data-testid="register-button"]');

    // 5. Verificar redirección a login o dashboard
    await expect(page).toHaveURL(/\/(login|dashboard)/);

    // 6. Verificar usuario en base de datos
    await test.step('Verificar usuario en base de datos', async () => {
      const dbUser = await db.getUserByEmail(newUser.email);
      expect(dbUser).not.toBeNull();
      expect(dbUser?.email).toBe(newUser.email);
    });

    // 7. Si fue redirigido a login, hacer login
    if (page.url().includes('/login')) {
      const loginPage = new LoginPage(page);
      await loginPage.login(newUser.email, newUser.password);
      await loginPage.verifyLoginSuccess();
    }

    // 8. Verificar acceso al dashboard
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.verifyPageLoaded();

    // Cleanup: eliminar usuario de prueba
    await db.cleanTestData('test_');
  });
});

test.describe('E2E: Validación de Stock en Tiempo Real', () => {

  test('Sistema previene compra cuando no hay stock suficiente', async ({ 
    page,
    db
  }) => {
    const loginPage = new LoginPage(page);
    const testUser = staticTestData.users.valid;

    // Login
    await loginPage.navigate();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.verifyLoginSuccess();

    // Navegar a un producto específico
    await page.goto('/products/1');

    // Obtener stock actual de la base de datos
    const currentStock = await db.getProductStock(1);
    
    // Si hay stock, intentar comprar más del disponible
    if (currentStock > 0) {
      // Intentar agregar cantidad mayor al stock
      await page.fill('[data-testid="quantity-input"]', String(currentStock + 100));
      await page.click('[data-testid="add-to-cart-button"]');
      
      // Verificar mensaje de error
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('stock');
    }
  });
});

test.describe('E2E: Consistencia de Datos API-UI-DB', () => {

  test('Los datos del usuario son consistentes entre UI, API y base de datos', async ({ 
    page,
    apiClient,
    db
  }) => {
    const loginPage = new LoginPage(page);
    const testUser = staticTestData.users.valid;

    // 1. Login en UI
    await loginPage.navigate();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.verifyLoginSuccess();

    // 2. Obtener datos del usuario desde el UI
    await page.goto('/profile');
    const uiEmail = await page.locator('[data-testid="user-email"]').textContent();

    // 3. Obtener datos del usuario desde la API
    await apiClient.login(testUser.email, testUser.password);
    const apiResponse = await apiClient.getCurrentUser();
    const apiEmail = apiResponse.data.email;

    // 4. Obtener datos del usuario desde la base de datos
    const dbUser = await db.getUserByEmail(testUser.email);
    const dbEmail = dbUser?.email;

    // 5. Verificar consistencia
    expect(uiEmail?.trim()).toBe(apiEmail);
    expect(apiEmail).toBe(dbEmail);
    expect(uiEmail?.trim()).toBe(dbEmail);
  });
});
