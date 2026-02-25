import { DatabaseClient, getDatabase } from './db-client';
import { DatabaseType } from '../config/database.config';

/**
 * Interfaz para usuario
 */
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Interfaz para producto
 */
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: number;
  created_at: Date;
}

/**
 * Interfaz para orden
 */
export interface Order {
  id: number;
  user_id: number;
  status: string;
  total: number;
  created_at: Date;
}

/**
 * Helper de Base de Datos para validaciones en tests
 */
export class DatabaseHelper {
  private db: DatabaseClient;

  constructor(dbType: DatabaseType = 'postgres') {
    this.db = getDatabase(dbType);
  }

  /**
   * Conectar a la base de datos
   */
  async connect(): Promise<void> {
    await this.db.connect();
  }

  /**
   * Desconectar de la base de datos
   */
  async disconnect(): Promise<void> {
    await this.db.disconnect();
  }

  // ==========================================
  // Métodos para Usuarios
  // ==========================================

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return this.db.queryOne<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(id: number): Promise<User | null> {
    return this.db.queryOne<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
  }

  /**
   * Verificar si existe un usuario
   */
  async userExists(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    return user !== null;
  }

  /**
   * Obtener el rol de un usuario
   */
  async getUserRole(email: string): Promise<string | null> {
    const user = await this.getUserByEmail(email);
    return user?.role || null;
  }

  /**
   * Contar usuarios
   */
  async countUsers(): Promise<number> {
    const result = await this.db.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM users'
    );
    return parseInt(result?.count || '0');
  }

  // ==========================================
  // Métodos para Productos
  // ==========================================

  /**
   * Obtener producto por ID
   */
  async getProductById(id: number): Promise<Product | null> {
    return this.db.queryOne<Product>(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
  }

  /**
   * Obtener productos por categoría
   */
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return this.db.query<Product>(
      'SELECT * FROM products WHERE category_id = $1',
      [categoryId]
    );
  }

  /**
   * Verificar stock de producto
   */
  async getProductStock(productId: number): Promise<number> {
    const product = await this.getProductById(productId);
    return product?.stock || 0;
  }

  /**
   * Verificar si producto tiene stock suficiente
   */
  async hasEnoughStock(productId: number, quantity: number): Promise<boolean> {
    const stock = await this.getProductStock(productId);
    return stock >= quantity;
  }

  // ==========================================
  // Métodos para Órdenes
  // ==========================================

  /**
   * Obtener orden por ID
   */
  async getOrderById(id: number): Promise<Order | null> {
    return this.db.queryOne<Order>(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );
  }

  /**
   * Obtener órdenes de un usuario
   */
  async getOrdersByUser(userId: number): Promise<Order[]> {
    return this.db.query<Order>(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
  }

  /**
   * Obtener el estado de una orden
   */
  async getOrderStatus(orderId: number): Promise<string | null> {
    const order = await this.getOrderById(orderId);
    return order?.status || null;
  }

  /**
   * Contar órdenes de un usuario
   */
  async countUserOrders(userId: number): Promise<number> {
    const result = await this.db.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = $1',
      [userId]
    );
    return parseInt(result?.count || '0');
  }

  // ==========================================
  // Métodos de Limpieza para Tests
  // ==========================================

  /**
   * Limpiar datos de prueba
   * ⚠️ USAR CON CUIDADO - Solo en ambiente de test
   */
  async cleanTestData(testPrefix: string = 'test_'): Promise<void> {
    await this.db.transaction(async () => {
      // Eliminar órdenes de usuarios de prueba
      await this.db.execute(`
        DELETE FROM orders 
        WHERE user_id IN (
          SELECT id FROM users WHERE email LIKE $1
        )
      `, [`${testPrefix}%`]);

      // Eliminar usuarios de prueba
      await this.db.execute(
        'DELETE FROM users WHERE email LIKE $1',
        [`${testPrefix}%`]
      );
    });
  }

  /**
   * Crear usuario de prueba
   */
  async createTestUser(data: Partial<User>): Promise<User> {
    const result = await this.db.query<User>(
      `INSERT INTO users (email, name, role) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [data.email, data.name || 'Test User', data.role || 'user']
    );
    return result[0];
  }
}

export { DatabaseClient, getDatabase };
