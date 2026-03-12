import dotenv from 'dotenv';
dotenv.config();

/**
 * Configuración de conexión a Kafka
 */
export const kafkaConfig = {
  /** Brokers de Kafka (separados por coma) */
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  
  /** Client ID para identificar la conexión */
  clientId: process.env.KAFKA_CLIENT_ID || 'playwright-test-client',
  
  /** Group ID para consumidores */
  groupId: process.env.KAFKA_GROUP_ID || 'playwright-test-group',
  
  /** Configuración SSL */
  ssl: process.env.KAFKA_SSL === 'true',
  
  /** Configuración SASL (autenticación) */
  sasl: process.env.KAFKA_SASL_USERNAME ? {
    mechanism: (process.env.KAFKA_SASL_MECHANISM as 'plain' | 'scram-sha-256' | 'scram-sha-512') || 'plain',
    username: process.env.KAFKA_SASL_USERNAME,
    password: process.env.KAFKA_SASL_PASSWORD || '',
  } : undefined,
  
  /** Timeout de conexión en ms */
  connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT || '10000'),
  
  /** Timeout de request en ms */
  requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT || '30000'),
};

/**
 * Topics comunes para pruebas
 */
export const kafkaTopics = {
  /** Topic de eventos de usuario */
  userEvents: process.env.KAFKA_TOPIC_USER_EVENTS || 'user-events',
  
  /** Topic de eventos de órdenes */
  orderEvents: process.env.KAFKA_TOPIC_ORDER_EVENTS || 'order-events',
  
  /** Topic de eventos de productos */
  productEvents: process.env.KAFKA_TOPIC_PRODUCT_EVENTS || 'product-events',
  
  /** Topic de notificaciones */
  notifications: process.env.KAFKA_TOPIC_NOTIFICATIONS || 'notifications',
  
  /** Topic de auditoría */
  auditLog: process.env.KAFKA_TOPIC_AUDIT_LOG || 'audit-log',

  /** Topic de estado de procesamiento de cotizaciones (Quotations) */
  quotationStatus: process.env.KAFKA_TOPIC_QUOTATION_STATUS || 'apm0005763.bsn0019380.latam.sit.status.process.v1',
};

/**
 * Posibles estados de una transacción de cotización
 */
export const QuotationStatus = {
  PROCESSING: 'PROCESSING',
  TRANSFORMATION_ERROR: 'TRANSFORMATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type QuotationStatusType = typeof QuotationStatus[keyof typeof QuotationStatus];
