import { Kafka, Consumer, Producer, Admin, EachMessagePayload, KafkaMessage } from 'kafkajs';
import { kafkaConfig, kafkaTopics } from '../config/kafka.config';

/**
 * Interfaz para mensajes de Kafka capturados
 */
export interface CapturedKafkaMessage {
  topic: string;
  partition: number;
  offset: string;
  key: string | null;
  value: any;
  headers: { [key: string]: string };
  timestamp: string;
}

/**
 * Filtro para buscar mensajes de Kafka
 */
export interface KafkaMessageFilter {
  /** Filtrar por topic */
  topic?: string;
  /** Filtrar por key del mensaje */
  key?: string;
  /** Filtrar por contenido del value (búsqueda parcial) */
  valueContains?: string | object;
  /** Filtrar por header específico */
  header?: { key: string; value: string };
  /** Filtrar mensajes después de cierto timestamp */
  afterTimestamp?: number;
}

/**
 * Cliente de Kafka para pruebas
 * Permite consumir y validar mensajes en topics de Kafka
 */
export class KafkaClient {
  private kafka: Kafka;
  private consumer: Consumer | null = null;
  private producer: Producer | null = null;
  private admin: Admin | null = null;
  private capturedMessages: CapturedKafkaMessage[] = [];
  private isConsuming: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: kafkaConfig.clientId,
      brokers: kafkaConfig.brokers,
      ssl: kafkaConfig.ssl,
      sasl: kafkaConfig.sasl,
      connectionTimeout: kafkaConfig.connectionTimeout,
      requestTimeout: kafkaConfig.requestTimeout,
    });
  }

  /**
   * Conectar el consumidor a uno o más topics
   */
  async connectConsumer(topics: string[]): Promise<void> {
    this.consumer = this.kafka.consumer({ 
      groupId: `${kafkaConfig.groupId}-${Date.now()}` // Group ID único para cada test
    });
    
    await this.consumer.connect();
    console.log('✅ Consumidor Kafka conectado');

    for (const topic of topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }
    console.log(`📡 Subscrito a topics: ${topics.join(', ')}`);
  }

  /**
   * Iniciar captura de mensajes
   */
  async startCapturing(): Promise<void> {
    if (!this.consumer) {
      throw new Error('Consumidor no conectado. Llama a connectConsumer primero.');
    }

    this.capturedMessages = [];
    this.isConsuming = true;

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        const capturedMessage: CapturedKafkaMessage = {
          topic,
          partition,
          offset: message.offset,
          key: message.key?.toString() || null,
          value: this.parseMessageValue(message.value),
          headers: this.parseHeaders(message.headers),
          timestamp: message.timestamp,
        };

        this.capturedMessages.push(capturedMessage);
        console.log(`📨 Mensaje capturado en ${topic}: ${JSON.stringify(capturedMessage.value)}`);
      },
    });
  }

  /**
   * Parsear el valor del mensaje
   */
  private parseMessageValue(value: Buffer | null): any {
    if (!value) return null;
    
    try {
      return JSON.parse(value.toString());
    } catch {
      return value.toString();
    }
  }

  /**
   * Parsear headers del mensaje
   */
  private parseHeaders(headers: KafkaMessage['headers']): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        result[key] = value?.toString() || '';
      }
    }
    return result;
  }

  /**
   * Esperar a que llegue un mensaje que cumpla el filtro
   * @param filter - Filtro para buscar el mensaje
   * @param timeoutMs - Timeout máximo de espera en ms
   */
  async waitForMessage(
    filter: KafkaMessageFilter,
    timeoutMs: number = 30000
  ): Promise<CapturedKafkaMessage | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const message = this.findMessage(filter);
      if (message) {
        return message;
      }
      await this.sleep(100);
    }

    console.warn(`⚠️ Timeout esperando mensaje con filtro: ${JSON.stringify(filter)}`);
    return null;
  }

  /**
   * Esperar múltiples mensajes que cumplan el filtro
   */
  async waitForMessages(
    filter: KafkaMessageFilter,
    count: number,
    timeoutMs: number = 30000
  ): Promise<CapturedKafkaMessage[]> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const messages = this.findMessages(filter);
      if (messages.length >= count) {
        return messages.slice(0, count);
      }
      await this.sleep(100);
    }

    console.warn(`⚠️ Timeout: solo se encontraron ${this.findMessages(filter).length} de ${count} mensajes`);
    return this.findMessages(filter);
  }

  /**
   * Buscar un mensaje en los capturados
   */
  findMessage(filter: KafkaMessageFilter): CapturedKafkaMessage | undefined {
    return this.capturedMessages.find(msg => this.matchesFilter(msg, filter));
  }

  /**
   * Buscar todos los mensajes que cumplan el filtro
   */
  findMessages(filter: KafkaMessageFilter): CapturedKafkaMessage[] {
    return this.capturedMessages.filter(msg => this.matchesFilter(msg, filter));
  }

  /**
   * Verificar si un mensaje cumple con el filtro
   */
  private matchesFilter(message: CapturedKafkaMessage, filter: KafkaMessageFilter): boolean {
    // Filtrar por topic
    if (filter.topic && message.topic !== filter.topic) {
      return false;
    }

    // Filtrar por key
    if (filter.key && message.key !== filter.key) {
      return false;
    }

    // Filtrar por contenido del value
    if (filter.valueContains) {
      const valueStr = JSON.stringify(message.value);
      const searchStr = typeof filter.valueContains === 'string' 
        ? filter.valueContains 
        : JSON.stringify(filter.valueContains);
      
      if (!valueStr.includes(searchStr)) {
        return false;
      }
    }

    // Filtrar por header
    if (filter.header) {
      if (message.headers[filter.header.key] !== filter.header.value) {
        return false;
      }
    }

    // Filtrar por timestamp
    if (filter.afterTimestamp) {
      if (parseInt(message.timestamp) < filter.afterTimestamp) {
        return false;
      }
    }

    return true;
  }

  /**
   * Obtener todos los mensajes capturados
   */
  getCapturedMessages(): CapturedKafkaMessage[] {
    return [...this.capturedMessages];
  }

  /**
   * Limpiar mensajes capturados
   */
  clearCapturedMessages(): void {
    this.capturedMessages = [];
  }

  /**
   * Producir un mensaje a un topic (útil para setup de tests)
   */
  async produceMessage(
    topic: string,
    message: {
      key?: string;
      value: any;
      headers?: { [key: string]: string };
    }
  ): Promise<void> {
    if (!this.producer) {
      this.producer = this.kafka.producer();
      await this.producer.connect();
    }

    await this.producer.send({
      topic,
      messages: [
        {
          key: message.key,
          value: JSON.stringify(message.value),
          headers: message.headers,
        },
      ],
    });

    console.log(`📤 Mensaje enviado a ${topic}`);
  }

  /**
   * Obtener información de los topics
   */
  async getTopicMetadata(topics?: string[]): Promise<any> {
    if (!this.admin) {
      this.admin = this.kafka.admin();
      await this.admin.connect();
    }

    return await this.admin.fetchTopicMetadata({ topics });
  }

  /**
   * Desconectar todos los clientes
   */
  async disconnect(): Promise<void> {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.consumer = null;
      console.log('🔌 Consumidor Kafka desconectado');
    }

    if (this.producer) {
      await this.producer.disconnect();
      this.producer = null;
      console.log('🔌 Productor Kafka desconectado');
    }

    if (this.admin) {
      await this.admin.disconnect();
      this.admin = null;
    }

    this.isConsuming = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Instancia singleton
let kafkaClientInstance: KafkaClient | null = null;

/**
 * Obtener instancia singleton del cliente Kafka
 */
export function getKafkaClient(): KafkaClient {
  if (!kafkaClientInstance) {
    kafkaClientInstance = new KafkaClient();
  }
  return kafkaClientInstance;
}

/**
 * Crear nueva instancia del cliente Kafka
 */
export function createKafkaClient(): KafkaClient {
  return new KafkaClient();
}

export { kafkaTopics };
