import { test, expect } from '../../src/fixtures';
import { TestDataGenerator, staticTestData } from '../../src/utils';

/**
 * Suite de tests de API para el módulo de Productos
 */
test.describe('Products API', () => {

  test.describe('Listar productos', () => {
    test('GET /products - debe listar todos los productos', async ({ 
      apiClient 
    }) => {
      const response = await apiClient.get('/products');

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });

    test('GET /products - debe soportar paginación', async ({ 
      apiClient 
    }) => {
      const response = await apiClient.get('/products', {
        params: { page: 1, limit: 10 }
      });

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
      expect(response.data.length).toBeLessThanOrEqual(10);
    });

    test('GET /products - debe soportar filtros por categoría', async ({ 
      apiClient 
    }) => {
      const response = await apiClient.get('/products', {
        params: { category: 'electronics' }
      });

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
    });

    test('GET /products - debe soportar búsqueda', async ({ 
      apiClient 
    }) => {
      const response = await apiClient.get('/products', {
        params: { search: 'laptop' }
      });

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
    });

    test('GET /products - debe soportar ordenamiento', async ({ 
      apiClient 
    }) => {
      const response = await apiClient.get('/products', {
        params: { sort: 'price', order: 'asc' }
      });

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
    });
  });

  test.describe('Obtener producto', () => {
    test('GET /products/:id - debe obtener un producto por ID', async ({ 
      apiClient,
      db
    }) => {
      const response = await apiClient.get('/products/1');

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('name');
      expect(response.data).toHaveProperty('price');

      // Verificar con base de datos
      const dbProduct = await db.getProductById(1);
      if (dbProduct) {
        expect(response.data.name).toBe(dbProduct.name);
        expect(response.data.price).toBe(dbProduct.price);
      }
    });

    test('GET /products/:id - debe retornar 404 para producto inexistente', async ({ 
      apiClient 
    }) => {
      const response = await apiClient.get('/products/999999');

      expect(response.status).toBe(404);
      expect(response.ok).toBe(false);
    });
  });

  test.describe('Crear producto (Admin)', () => {
    test('POST /products - debe crear un nuevo producto', async ({ 
      authenticatedApiClient,
      db
    }) => {
      const newProduct = TestDataGenerator.generateProduct();

      const response = await authenticatedApiClient.post('/products', newProduct);

      expect(response.status).toBe(201);
      expect(response.ok).toBe(true);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(newProduct.name);
      expect(response.data.price).toBe(newProduct.price);
    });

    test('POST /products - debe rechazar producto sin nombre', async ({ 
      authenticatedApiClient 
    }) => {
      const response = await authenticatedApiClient.post('/products', {
        price: 99.99,
        description: 'A product without name',
      });

      expect(response.status).toBe(400);
      expect(response.ok).toBe(false);
    });

    test('POST /products - debe rechazar precio negativo', async ({ 
      authenticatedApiClient 
    }) => {
      const response = await authenticatedApiClient.post('/products', {
        name: 'Test Product',
        price: -10.00,
        description: 'A product with negative price',
      });

      expect(response.status).toBe(400);
      expect(response.ok).toBe(false);
    });
  });

  test.describe('Actualizar producto (Admin)', () => {
    test('PUT /products/:id - debe actualizar un producto', async ({ 
      authenticatedApiClient 
    }) => {
      const updateData = {
        name: 'Updated Product Name',
        price: 149.99,
      };

      const response = await authenticatedApiClient.put('/products/1', updateData);

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
      expect(response.data.name).toBe(updateData.name);
      expect(response.data.price).toBe(updateData.price);
    });

    test('PATCH /products/:id - debe actualizar parcialmente un producto', async ({ 
      authenticatedApiClient 
    }) => {
      const patchData = {
        price: 199.99,
      };

      const response = await authenticatedApiClient.patch('/products/1', patchData);

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
      expect(response.data.price).toBe(patchData.price);
    });
  });

  test.describe('Eliminar producto (Admin)', () => {
    test('DELETE /products/:id - debe eliminar un producto', async ({ 
      authenticatedApiClient 
    }) => {
      // Crear producto para eliminar
      const newProduct = TestDataGenerator.generateProduct();
      const createResponse = await authenticatedApiClient.post('/products', newProduct);
      const productId = createResponse.data.id;

      // Eliminar
      const deleteResponse = await authenticatedApiClient.delete(`/products/${productId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.ok).toBe(true);

      // Verificar que ya no existe
      const getResponse = await authenticatedApiClient.get(`/products/${productId}`);
      expect(getResponse.status).toBe(404);
    });
  });

  test.describe('Stock de productos', () => {
    test('debe verificar stock disponible antes de compra', async ({ 
      apiClient,
      db
    }) => {
      const productId = 1;
      const requestedQuantity = 5;

      // Verificar stock en API
      const response = await apiClient.get(`/products/${productId}`);
      expect(response.status).toBe(200);

      const apiStock = response.data.stock;

      // Verificar stock en base de datos
      const dbStock = await db.getProductStock(productId);
      
      // Comparar
      expect(apiStock).toBe(dbStock);

      // Verificar si hay suficiente stock
      const hasStock = await db.hasEnoughStock(productId, requestedQuantity);
      expect(typeof hasStock).toBe('boolean');
    });
  });
});
