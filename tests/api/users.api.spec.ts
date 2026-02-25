import { test, expect } from '../../src/fixtures';
import { TestDataGenerator, staticTestData } from '../../src/utils';

/**
 * Suite de tests de API para el módulo de Usuarios
 */
test.describe('Users API', () => {

  test.describe('Autenticación', () => {
    test('POST /auth/login - debe autenticar usuario con credenciales válidas', async ({ 
      apiClient 
    }) => {
      const response = await apiClient.login(
        staticTestData.users.valid.email,
        staticTestData.users.valid.password
      );

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.email).toBe(staticTestData.users.valid.email);
    });

    test('POST /auth/login - debe rechazar credenciales inválidas', async ({ 
      apiClient 
    }) => {
      const response = await apiClient.post('/auth/login', {
        email: staticTestData.users.invalid.email,
        password: staticTestData.users.invalid.password,
      });

      expect(response.status).toBe(401);
      expect(response.ok).toBe(false);
    });

    test('POST /auth/logout - debe cerrar sesión correctamente', async ({ 
      authenticatedApiClient 
    }) => {
      const response = await authenticatedApiClient.logout();

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
    });

    test('GET /auth/me - debe obtener usuario actual', async ({ 
      authenticatedApiClient 
    }) => {
      const response = await authenticatedApiClient.getCurrentUser();

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
      expect(response.data).toHaveProperty('email');
    });

    test('GET /auth/me - debe rechazar petición sin token', async ({ 
      apiClient 
    }) => {
      const response = await apiClient.get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.ok).toBe(false);
    });
  });

  test.describe('Gestión de usuarios', () => {
    test('GET /users - debe listar usuarios (requiere autenticación)', async ({ 
      authenticatedApiClient 
    }) => {
      const response = await authenticatedApiClient.get('/users');

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });

    test('GET /users/:id - debe obtener un usuario específico', async ({ 
      authenticatedApiClient 
    }) => {
      const response = await authenticatedApiClient.get('/users/1');

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('email');
    });

    test('GET /users/:id - debe retornar 404 para usuario inexistente', async ({ 
      authenticatedApiClient 
    }) => {
      const response = await authenticatedApiClient.get('/users/999999');

      expect(response.status).toBe(404);
      expect(response.ok).toBe(false);
    });

    test('POST /users - debe crear un nuevo usuario', async ({ 
      authenticatedApiClient,
      db
    }) => {
      const newUser = TestDataGenerator.generateUser();

      const response = await authenticatedApiClient.post('/users', newUser);

      expect(response.status).toBe(201);
      expect(response.ok).toBe(true);
      expect(response.data).toHaveProperty('id');
      expect(response.data.email).toBe(newUser.email);

      // Verificar en la base de datos
      const dbUser = await db.getUserByEmail(newUser.email);
      expect(dbUser).not.toBeNull();
      expect(dbUser?.email).toBe(newUser.email);
    });

    test('PUT /users/:id - debe actualizar un usuario', async ({ 
      authenticatedApiClient 
    }) => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'User',
      };

      const response = await authenticatedApiClient.put('/users/1', updateData);

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
      expect(response.data.firstName).toBe(updateData.firstName);
    });

    test('DELETE /users/:id - debe eliminar un usuario', async ({ 
      authenticatedApiClient,
      db
    }) => {
      // Primero crear un usuario para eliminar
      const newUser = TestDataGenerator.generateUser();
      const createResponse = await authenticatedApiClient.post('/users', newUser);
      const userId = createResponse.data.id;

      // Eliminar el usuario
      const deleteResponse = await authenticatedApiClient.delete(`/users/${userId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.ok).toBe(true);

      // Verificar que no existe en la base de datos
      const dbUser = await db.getUserByEmail(newUser.email);
      expect(dbUser).toBeNull();
    });
  });

  test.describe('Validaciones', () => {
    test('POST /users - debe rechazar email duplicado', async ({ 
      authenticatedApiClient 
    }) => {
      // Intentar crear usuario con email existente
      const response = await authenticatedApiClient.post('/users', {
        email: staticTestData.users.valid.email,
        password: 'SomePassword123!',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(409); // Conflict
      expect(response.ok).toBe(false);
    });

    test('POST /users - debe rechazar email inválido', async ({ 
      authenticatedApiClient 
    }) => {
      const response = await authenticatedApiClient.post('/users', {
        email: 'invalid-email',
        password: 'SomePassword123!',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.ok).toBe(false);
    });

    test('POST /users - debe rechazar password débil', async ({ 
      authenticatedApiClient 
    }) => {
      const response = await authenticatedApiClient.post('/users', {
        email: TestDataGenerator.generateEmail(),
        password: '123', // Password muy corto
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.ok).toBe(false);
    });
  });

  test.describe('Health Check', () => {
    test('GET /health - debe retornar estado saludable', async ({ 
      apiClient 
    }) => {
      const response = await apiClient.healthCheck();

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
      expect(response.data.status).toBe('healthy');
    });
  });
});
