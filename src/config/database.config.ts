import dotenv from 'dotenv';
dotenv.config();

/**
 * Configuración de conexión para PostgreSQL
 */
export const postgresConfig = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
  database: process.env.PG_DATABASE || 'test_db',
  ssl: process.env.PG_SSL === 'true',
  max: 10, // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

/**
 * Configuración de conexión para SQL Server
 */
export const mssqlConfig = {
  server: process.env.MSSQL_HOST || 'localhost',
  port: parseInt(process.env.MSSQL_PORT || '1433'),
  user: process.env.MSSQL_USER || 'sa',
  password: process.env.MSSQL_PASSWORD || '',
  database: process.env.MSSQL_DATABASE || 'test_db',
  options: {
    encrypt: process.env.MSSQL_ENCRYPT === 'true',
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

/**
 * Configuración de conexión para MySQL
 */
export const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'test_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

/**
 * Tipo de base de datos a utilizar
 */
export type DatabaseType = 'postgres' | 'mssql' | 'mysql';

/**
 * Obtener la configuración de base de datos según el tipo
 */
export function getDatabaseConfig(type: DatabaseType) {
  switch (type) {
    case 'postgres':
      return postgresConfig;
    case 'mssql':
      return mssqlConfig;
    case 'mysql':
      return mysqlConfig;
    default:
      throw new Error(`Tipo de base de datos no soportado: ${type}`);
  }
}
