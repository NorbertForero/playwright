import { KafkaClient, CapturedKafkaMessage, KafkaMessageFilter, kafkaTopics } from './kafka-client';

/**
 * Helper de Kafka para validaciones en tests
 * Proporciona métodos de alto nivel para validar mensajes
 */
export class KafkaHelper {
  private kafka: KafkaClient;
  private captureStartTime: number = 0;

  constructor() {
    this.kafka = new KafkaClient();
  }

  /**
   * Iniciar captura de mensajes en topics específicos
   * Llamar ANTES de ejecutar la acción que genera el mensaje
   */
  async startCapture(topics: string[]): Promise<void> {
    await this.kafka.connectConsumer(topics);
    this.captureStartTime = Date.now();
    await this.kafka.startCapturing();
    
    // Dar tiempo al consumidor para stabilizarse
    await this.sleep(1000);
  }

  /**
   * Iniciar captura para eventos de usuario
   */
  async startUserEventsCapture(): Promise<void> {
    await this.startCapture([kafkaTopics.userEvents]);
  }

  /**
   * Iniciar captura para eventos de órdenes
   */
  async startOrderEventsCapture(): Promise<void> {
    await this.startCapture([kafkaTopics.orderEvents]);
  }

  /**
   * Iniciar captura para eventos de productos
   */
  async startProductEventsCapture(): Promise<void> {
    await this.startCapture([kafkaTopics.productEvents]);
  }

  /**
   * Iniciar captura para auditoría
   */
  async startAuditCapture(): Promise<void> {
    await this.startCapture([kafkaTopics.auditLog]);
  }

  // ==========================================
  // Métodos de Validación de Eventos de Usuario
  // ==========================================

  /**
   * Esperar evento de usuario creado
   */
  async waitForUserCreatedEvent(
    userId: string | number,
    timeoutMs: number = 30000
  ): Promise<CapturedKafkaMessage | null> {
    return this.kafka.waitForMessage(
      {
        topic: kafkaTopics.userEvents,
        valueContains: { eventType: 'USER_CREATED', userId: String(userId) },
        afterTimestamp: this.captureStartTime,
      },
      timeoutMs
    );
  }

  /**
   * Esperar evento de usuario actualizado
   */
  async waitForUserUpdatedEvent(
    userId: string | number,
    timeoutMs: number = 30000
  ): Promise<CapturedKafkaMessage | null> {
    return this.kafka.waitForMessage(
      {
        topic: kafkaTopics.userEvents,
        valueContains: { eventType: 'USER_UPDATED' },
        afterTimestamp: this.captureStartTime,
      },
      timeoutMs
    );
  }

  /**
   * Esperar evento de login
   */
  async waitForLoginEvent(
    email: string,
    timeoutMs: number = 30000
  ): Promise<CapturedKafkaMessage | null> {
    return this.kafka.waitForMessage(
      {
        topic: kafkaTopics.userEvents,
        valueContains: { eventType: 'USER_LOGIN', email },
        afterTimestamp: this.captureStartTime,
      },
      timeoutMs
    );
  }

  // ==========================================
  // Métodos de Validación de Eventos de Órdenes
  // ==========================================

  /**
   * Esperar evento de orden creada
   */
  async waitForOrderCreatedEvent(
    orderId?: string | number,
    timeoutMs: number = 30000
  ): Promise<CapturedKafkaMessage | null> {
    const filter: KafkaMessageFilter = {
      topic: kafkaTopics.orderEvents,
      valueContains: { eventType: 'ORDER_CREATED' },
      afterTimestamp: this.captureStartTime,
    };

    if (orderId) {
      filter.valueContains = { eventType: 'ORDER_CREATED', orderId: String(orderId) };
    }

    return this.kafka.waitForMessage(filter, timeoutMs);
  }

  /**
   * Esperar evento de cambio de estado de orden
   */
  async waitForOrderStatusChangedEvent(
    orderId: string | number,
    newStatus: string,
    timeoutMs: number = 30000
  ): Promise<CapturedKafkaMessage | null> {
    return this.kafka.waitForMessage(
      {
        topic: kafkaTopics.orderEvents,
        valueContains: { 
          eventType: 'ORDER_STATUS_CHANGED', 
          orderId: String(orderId),
          newStatus 
        },
        afterTimestamp: this.captureStartTime,
      },
      timeoutMs
    );
  }

  // ==========================================
  // Métodos de Validación de Eventos de Productos
  // ==========================================

  /**
   * Esperar evento de producto creado
   */
  async waitForProductCreatedEvent(
    productId?: string | number,
    timeoutMs: number = 30000
  ): Promise<CapturedKafkaMessage | null> {
    const filter: KafkaMessageFilter = {
      topic: kafkaTopics.productEvents,
      valueContains: { eventType: 'PRODUCT_CREATED' },
      afterTimestamp: this.captureStartTime,
    };

    return this.kafka.waitForMessage(filter, timeoutMs);
  }

  /**
   * Esperar evento de stock actualizado
   */
  async waitForStockUpdatedEvent(
    productId: string | number,
    timeoutMs: number = 30000
  ): Promise<CapturedKafkaMessage | null> {
    return this.kafka.waitForMessage(
      {
        topic: kafkaTopics.productEvents,
        valueContains: { 
          eventType: 'STOCK_UPDATED', 
          productId: String(productId) 
        },
        afterTimestamp: this.captureStartTime,
      },
      timeoutMs
    );
  }

  // ==========================================
  // Métodos de Validación de Auditoría
  // ==========================================

  /**
   * Esperar evento de auditoría
   */
  async waitForAuditEvent(
    action: string,
    entityType?: string,
    timeoutMs: number = 30000
  ): Promise<CapturedKafkaMessage | null> {
    const filter: KafkaMessageFilter = {
      topic: kafkaTopics.auditLog,
      valueContains: { action },
      afterTimestamp: this.captureStartTime,
    };

    if (entityType) {
      filter.valueContains = { action, entityType };
    }

    return this.kafka.waitForMessage(filter, timeoutMs);
  }

  // ==========================================
  // Métodos de Validación de Cotizaciones (Quotations)
  // ==========================================

  /**
   * Iniciar captura para eventos de estado de cotizaciones
   */
  async startQuotationStatusCapture(): Promise<void> {
    await this.startCapture([kafkaTopics.quotationStatus]);
  }

  /**
   * Esperar evento de estado de cotización por TransactionId
   * Útil para validar el procesamiento después de POST /api/Quotations
   */
  async waitForQuotationStatusEvent(
    transactionId: string | number,
    expectedStatus?: string,
    timeoutMs: number = 60000
  ): Promise<CapturedKafkaMessage | null> {
    const filter: KafkaMessageFilter = {
      topic: kafkaTopics.quotationStatus,
      valueContains: { TransactionId: String(transactionId) },
      afterTimestamp: this.captureStartTime,
    };

    if (expectedStatus) {
      filter.valueContains = { 
        TransactionId: String(transactionId), 
        CurrentStatus: expectedStatus 
      };
    }

    return this.kafka.waitForMessage(filter, timeoutMs);
  }

  /**
   * Esperar evento de cotización procesada exitosamente
   */
  async waitForQuotationProcessed(
    transactionId: string | number,
    timeoutMs: number = 60000
  ): Promise<CapturedKafkaMessage | null> {
    return this.waitForQuotationStatusEvent(transactionId, 'PROCESSING', timeoutMs);
  }

  /**
   * Esperar evento de error de transformación en cotización
   */
  async waitForQuotationTransformationError(
    transactionId: string | number,
    timeoutMs: number = 60000
  ): Promise<CapturedKafkaMessage | null> {
    return this.waitForQuotationStatusEvent(transactionId, 'TRANSFORMATION_ERROR', timeoutMs);
  }

  /**
   * Esperar evento de cotización completada
   */
  async waitForQuotationCompleted(
    transactionId: string | number,
    timeoutMs: number = 60000
  ): Promise<CapturedKafkaMessage | null> {
    return this.waitForQuotationStatusEvent(transactionId, 'COMPLETED', timeoutMs);
  }

  /**
   * Obtener todos los eventos de una cotización por TransactionId
   * Útil para ver el historial completo de estados
   */
  getQuotationEvents(transactionId: string | number): CapturedKafkaMessage[] {
    return this.getCapturedMessages().filter(msg => {
      try {
        const value = typeof msg.value === 'string' ? JSON.parse(msg.value) : msg.value;
        return value.TransactionId === String(transactionId);
      } catch {
        return false;
      }
    });
  }

  /**
   * Verificar que una cotización tenga errores de validación específicos
   */
  async waitForQuotationValidationErrors(
    transactionId: string | number,
    expectedErrorCodes?: string[],
    timeoutMs: number = 60000
  ): Promise<CapturedKafkaMessage | null> {
    const event = await this.waitForQuotationTransformationError(transactionId, timeoutMs);
    
    if (event && expectedErrorCodes && expectedErrorCodes.length > 0) {
      const value = typeof event.value === 'string' ? JSON.parse(event.value) : event.value;
      const errors = value.Errors || [];
      const errorCodes = errors.map((e: any) => e.Code);
      
      const allCodesFound = expectedErrorCodes.every(code => errorCodes.includes(code));
      if (!allCodesFound) {
        console.warn(`⚠️ No se encontraron todos los códigos esperados. Esperados: ${expectedErrorCodes}, Encontrados: ${errorCodes}`);
      }
    }
    
    return event;
  }

  // ==========================================
  // Métodos Genéricos
  // ==========================================

  /**
   * Esperar cualquier mensaje que contenga cierto valor
   */
  async waitForMessageContaining(
    topic: string,
    valueContains: string | object,
    timeoutMs: number = 30000
  ): Promise<CapturedKafkaMessage | null> {
    return this.kafka.waitForMessage(
      {
        topic,
        valueContains,
        afterTimestamp: this.captureStartTime,
      },
      timeoutMs
    );
  }

  /**
   * Esperar mensaje con key específico
   */
  async waitForMessageWithKey(
    topic: string,
    key: string,
    timeoutMs: number = 30000
  ): Promise<CapturedKafkaMessage | null> {
    return this.kafka.waitForMessage(
      {
        topic,
        key,
        afterTimestamp: this.captureStartTime,
      },
      timeoutMs
    );
  }

  /**
   * Verificar que NO llegó un mensaje (útil para casos negativos)
   */
  async verifyNoMessage(
    filter: KafkaMessageFilter,
    waitTimeMs: number = 5000
  ): Promise<boolean> {
    await this.sleep(waitTimeMs);
    const message = this.kafka.findMessage({
      ...filter,
      afterTimestamp: this.captureStartTime,
    });
    return message === undefined;
  }

  /**
   * Obtener todos los mensajes capturados después del inicio
   */
  getCapturedMessages(): CapturedKafkaMessage[] {
    return this.kafka.getCapturedMessages().filter(
      msg => parseInt(msg.timestamp) >= this.captureStartTime
    );
  }

  /**
   * Obtener cantidad de mensajes capturados
   */
  getCapturedMessagesCount(): number {
    return this.getCapturedMessages().length;
  }

  /**
   * Limpiar mensajes capturados
   */
  clearMessages(): void {
    this.kafka.clearCapturedMessages();
  }

  /**
   * Detener captura y desconectar
   */
  async stopCapture(): Promise<void> {
    await this.kafka.disconnect();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export { KafkaClient, kafkaTopics };
export type { CapturedKafkaMessage, KafkaMessageFilter };
