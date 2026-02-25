import dotenv from 'dotenv';
dotenv.config();

/**
 * Configuración de ambiente
 */
export const environment = {
  /** Ambiente actual */
  nodeEnv: process.env.NODE_ENV || 'development',
  
  /** ¿Es ambiente de CI? */
  isCI: process.env.CI === 'true',
  
  /** URL base del frontend */
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  
  /** URL base de la API */
  apiUrl: process.env.API_URL || 'http://localhost:3000/api',
  
  /** Token de API */
  apiToken: process.env.API_TOKEN || '',
};

/**
 * Credenciales de usuarios de prueba
 */
export const testUsers = {
  standard: {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
  },
  admin: {
    email: process.env.ADMIN_USER_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_USER_PASSWORD || 'AdminPassword123!',
  },
};

/**
 * Timeouts configurables
 */
export const timeouts = {
  /** Timeout corto (acciones rápidas) */
  short: 5000,
  
  /** Timeout medio (carga de página) */
  medium: 15000,
  
  /** Timeout largo (operaciones de red) */
  long: 30000,
  
  /** Timeout muy largo (uploads, exports) */
  extraLong: 60000,
};
