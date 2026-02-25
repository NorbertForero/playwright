import { Pool, QueryResult } from 'pg';
import * as mssql from 'mssql';
import * as mysql from 'mysql2/promise';
import { 
  postgresConfig, 
  mssqlConfig, 
  mysqlConfig, 
  DatabaseType 
} from '../config/database.config';

/**
 * Cliente de Base de Datos Multi-Motor
 * Soporta PostgreSQL, SQL Server y MySQL
 */
export class DatabaseClient {
  private pgPool: Pool | null = null;
  private mssqlPool: mssql.ConnectionPool | null = null;
  private mysqlPool: mysql.Pool | null = null;
  private dbType: DatabaseType;

  constructor(type: DatabaseType = 'postgres') {
    this.dbType = type;
  }

  /**
   * Conectar a la base de datos
   */
  async connect(): Promise<void> {
    switch (this.dbType) {
      case 'postgres':
        this.pgPool = new Pool(postgresConfig);
        await this.pgPool.connect();
        console.log('✅ Conectado a PostgreSQL');
        break;

      case 'mssql':
        this.mssqlPool = await mssql.connect(mssqlConfig);
        console.log('✅ Conectado a SQL Server');
        break;

      case 'mysql':
        this.mysqlPool = mysql.createPool(mysqlConfig);
        console.log('✅ Conectado a MySQL');
        break;

      default:
        throw new Error(`Tipo de base de datos no soportado: ${this.dbType}`);
    }
  }

  /**
   * Ejecutar una consulta SQL
   * @param query - Consulta SQL
   * @param params - Parámetros de la consulta
   */
  async query<T = any>(query: string, params?: any[]): Promise<T[]> {
    switch (this.dbType) {
      case 'postgres':
        if (!this.pgPool) throw new Error('No hay conexión a PostgreSQL');
        const pgResult: QueryResult = await this.pgPool.query(query, params);
        return pgResult.rows as T[];

      case 'mssql':
        if (!this.mssqlPool) throw new Error('No hay conexión a SQL Server');
        const mssqlResult = await this.mssqlPool.request().query(query);
        return mssqlResult.recordset as T[];

      case 'mysql':
        if (!this.mysqlPool) throw new Error('No hay conexión a MySQL');
        const [mysqlRows] = await this.mysqlPool.execute(query, params);
        return mysqlRows as T[];

      default:
        throw new Error(`Tipo de base de datos no soportado: ${this.dbType}`);
    }
  }

  /**
   * Ejecutar consulta y obtener un solo resultado
   */
  async queryOne<T = any>(query: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(query, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Ejecutar una consulta de inserción, actualización o eliminación
   */
  async execute(query: string, params?: any[]): Promise<number> {
    switch (this.dbType) {
      case 'postgres':
        if (!this.pgPool) throw new Error('No hay conexión a PostgreSQL');
        const pgResult = await this.pgPool.query(query, params);
        return pgResult.rowCount || 0;

      case 'mssql':
        if (!this.mssqlPool) throw new Error('No hay conexión a SQL Server');
        const mssqlResult = await this.mssqlPool.request().query(query);
        return mssqlResult.rowsAffected[0] || 0;

      case 'mysql':
        if (!this.mysqlPool) throw new Error('No hay conexión a MySQL');
        const [mysqlResult] = await this.mysqlPool.execute(query, params) as any;
        return mysqlResult.affectedRows || 0;

      default:
        throw new Error(`Tipo de base de datos no soportado: ${this.dbType}`);
    }
  }

  /**
   * Ejecutar transacción
   */
  async transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T> {
    switch (this.dbType) {
      case 'postgres':
        if (!this.pgPool) throw new Error('No hay conexión a PostgreSQL');
        const pgClient = await this.pgPool.connect();
        try {
          await pgClient.query('BEGIN');
          const result = await callback(this);
          await pgClient.query('COMMIT');
          return result;
        } catch (error) {
          await pgClient.query('ROLLBACK');
          throw error;
        } finally {
          pgClient.release();
        }

      case 'mssql':
        if (!this.mssqlPool) throw new Error('No hay conexión a SQL Server');
        const transaction = new mssql.Transaction(this.mssqlPool);
        try {
          await transaction.begin();
          const result = await callback(this);
          await transaction.commit();
          return result;
        } catch (error) {
          await transaction.rollback();
          throw error;
        }

      case 'mysql':
        if (!this.mysqlPool) throw new Error('No hay conexión a MySQL');
        const connection = await this.mysqlPool.getConnection();
        try {
          await connection.beginTransaction();
          const result = await callback(this);
          await connection.commit();
          return result;
        } catch (error) {
          await connection.rollback();
          throw error;
        } finally {
          connection.release();
        }

      default:
        throw new Error(`Tipo de base de datos no soportado: ${this.dbType}`);
    }
  }

  /**
   * Cerrar la conexión
   */
  async disconnect(): Promise<void> {
    switch (this.dbType) {
      case 'postgres':
        if (this.pgPool) {
          await this.pgPool.end();
          this.pgPool = null;
          console.log('🔌 Desconectado de PostgreSQL');
        }
        break;

      case 'mssql':
        if (this.mssqlPool) {
          await this.mssqlPool.close();
          this.mssqlPool = null;
          console.log('🔌 Desconectado de SQL Server');
        }
        break;

      case 'mysql':
        if (this.mysqlPool) {
          await this.mysqlPool.end();
          this.mysqlPool = null;
          console.log('🔌 Desconectado de MySQL');
        }
        break;
    }
  }

  /**
   * Verificar si hay conexión activa
   */
  isConnected(): boolean {
    switch (this.dbType) {
      case 'postgres':
        return this.pgPool !== null;
      case 'mssql':
        return this.mssqlPool !== null && this.mssqlPool.connected;
      case 'mysql':
        return this.mysqlPool !== null;
      default:
        return false;
    }
  }
}

// Instancia singleton para uso global
let defaultClient: DatabaseClient | null = null;

/**
 * Obtener cliente de base de datos singleton
 */
export function getDatabase(type: DatabaseType = 'postgres'): DatabaseClient {
  if (!defaultClient) {
    defaultClient = new DatabaseClient(type);
  }
  return defaultClient;
}

/**
 * Crear nueva instancia de cliente de base de datos
 */
export function createDatabase(type: DatabaseType): DatabaseClient {
  return new DatabaseClient(type);
}
