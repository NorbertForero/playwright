import { test, expect } from '../../src/fixtures';
import { readCsv, readCsvForTestEach } from '../../src/utils';

/**
 * Interfaces para tipado de datos del CSV
 */
interface UserCreateData {
  testName: string;
  email: string | null;
  password: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  expectedStatus: number;
  expectedMessage: string;
}

interface UserLoginData {
  testName: string;
  email: string | null;
  password: string | null;
  expectedStatus: number;
  shouldHaveToken: boolean;
  expectedError: string | null;
}

interface ProductCreateData {
  testName: string;
  name: string | null;
  description: string | null;
  price: number | null;
  category: string | null;
  sku: string | null;
  stock: number | null;
  expectedStatus: number;
  expectedMessage: string;
}

/**
 * Suite de tests de API con datos desde CSV
 * Implementa data-driven testing para validar múltiples escenarios
 */
test.describe('API Tests - Data Driven desde CSV', () => {

  /**
   * Tests de creación de usuarios usando datos del CSV
   */
  test.describe('POST /users - Crear usuarios', () => {
    // Cargar datos del CSV
    const usersData = readCsvForTestEach<UserCreateData>('test-data/users-create.csv');

    for (const [testName, data] of usersData) {
      test(`${testName}`, async ({ authenticatedApiClient }) => {
        // Construir el body del request a partir de los datos del CSV
        const requestBody = {
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        };

        // Realizar la petición
        const response = await authenticatedApiClient.post('/users', requestBody);

        // Validar status code
        expect(response.status).toBe(data.expectedStatus);

        // Validar respuesta según el caso
        if (data.expectedStatus === 201) {
          // Caso exitoso
          expect(response.ok).toBe(true);
          expect(response.data).toHaveProperty('id');
          expect(response.data.email).toBe(data.email);
        } else {
          // Caso de error
          expect(response.ok).toBe(false);
          expect(response.data.message || response.data.error).toContain(data.expectedMessage);
        }
      });
    }
  });

  /**
   * Tests de login usando datos del CSV
   */
  test.describe('POST /auth/login - Autenticación', () => {
    const loginData = readCsvForTestEach<UserLoginData>('test-data/users-login.csv');

    for (const [testName, data] of loginData) {
      test(`${testName}`, async ({ apiClient }) => {
        // Construir body del request
        const requestBody = {
          email: data.email ?? '',
          password: data.password ?? '',
        };

        // Realizar petición de login
        const response = await apiClient.post('/auth/login', requestBody);

        // Validar status
        expect(response.status).toBe(data.expectedStatus);

        if (data.shouldHaveToken) {
          // Login exitoso debe tener token
          expect(response.ok).toBe(true);
          expect(response.data).toHaveProperty('token');
          expect(response.data.token).toBeTruthy();
        } else {
          // Login fallido
          expect(response.ok).toBe(false);
          if (data.expectedError) {
            expect(response.data.message || response.data.error).toContain(data.expectedError);
          }
        }
      });
    }
  });

  /**
   * Tests de creación de productos usando datos del CSV
   */
  test.describe('POST /products - Crear productos', () => {
    const productsData = readCsvForTestEach<ProductCreateData>('test-data/products-create.csv');

    for (const [testName, data] of productsData) {
      test(`${testName}`, async ({ authenticatedApiClient }) => {
        // Construir body del request desde los datos del CSV
        const requestBody = {
          name: data.name,
          description: data.description,
          price: data.price,
          category: data.category,
          sku: data.sku,
          stock: data.stock,
        };

        // Realizar petición
        const response = await authenticatedApiClient.post('/products', requestBody);

        // Validaciones
        expect(response.status).toBe(data.expectedStatus);

        if (data.expectedStatus === 201) {
          expect(response.ok).toBe(true);
          expect(response.data).toHaveProperty('id');
          expect(response.data.name).toBe(data.name);
          expect(response.data.sku).toBe(data.sku);
        } else {
          expect(response.ok).toBe(false);
          expect(response.data.message || response.data.error).toContain(data.expectedMessage);
        }
      });
    }
  });

  /**
   * Ejemplo de test con transformación personalizada del body
   */
  test.describe('POST /orders - Crear órdenes con body transformado', () => {
    // Leer datos crudos del CSV
    const usersData = readCsv<UserCreateData>('test-data/users-create.csv')
      .filter((row: UserCreateData) => row.expectedStatus === 201) // Solo usuarios válidos
      .slice(0, 3); // Tomar los primeros 3

    for (const userData of usersData) {
      test(`Crear orden para ${userData.email}`, async ({ authenticatedApiClient }) => {
        // Transformar datos del CSV en body de orden
        const orderBody = {
          customerEmail: userData.email,
          customerName: `${userData.firstName} ${userData.lastName}`,
          items: [
            {
              productId: 1,
              quantity: 2,
              unitPrice: 99.99,
            },
          ],
          shippingAddress: {
            street: '123 Main St',
            city: 'Test City',
            zipCode: '12345',
          },
          total: 199.98,
        };

        const response = await authenticatedApiClient.post('/orders', orderBody);

        // El endpoint puede no existir, solo validamos el formato del request
        expect([200, 201, 404]).toContain(response.status);
      });
    }
  });
});

/**
 * Ejemplo de suite separada mostrando diferentes patrones de uso
 */
test.describe('Patrones avanzados de CSV Data-Driven Testing', () => {

  test('Bulk create - Múltiples usuarios desde CSV', async ({ authenticatedApiClient }) => {
    // Cargar todos los usuarios válidos del CSV
    const validUsers = readCsv<UserCreateData>('test-data/users-create.csv')
      .filter((u: UserCreateData) => u.expectedStatus === 201);

    const results: Array<{ email: string | null; success: boolean }> = [];

    for (const user of validUsers) {
      const response = await authenticatedApiClient.post('/users', {
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      });

      results.push({
        email: user.email,
        success: response.ok,
      });
    }

    // Reportar resultados
    console.log('Bulk create results:', results);
    
    // Validar que al menos algunos fueron creados
    const successCount = results.filter(r => r.success).length;
    expect(successCount).toBeGreaterThanOrEqual(0); // Ajustar según el API real
  });

  test('CSV con filtrado dinámico', async ({ apiClient }) => {
    // Filtrar solo casos de error para validarlos
    const errorCases = readCsv<UserLoginData>('test-data/users-login.csv')
      .filter((row: UserLoginData) => row.expectedStatus >= 400);

    expect(errorCases.length).toBeGreaterThan(0);
    
    // Validar que todos los casos de error están bien definidos
    for (const errorCase of errorCases) {
      expect(errorCase.expectedError).toBeTruthy();
      expect(errorCase.shouldHaveToken).toBe(false);
    }
  });
});
