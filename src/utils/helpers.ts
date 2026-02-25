import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Utilidades de ayuda para tests
 */
export class TestHelpers {
  /**
   * Esperar un tiempo específico
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reintentar una función con backoff exponencial
   */
  static async retry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      initialDelay?: number;
      maxDelay?: number;
    } = {}
  ): Promise<T> {
    const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000 } = options;
    let lastError: Error | undefined;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        console.log(`Intento ${attempt}/${maxRetries} falló. Reintentando en ${delay}ms...`);
        
        if (attempt < maxRetries) {
          await this.wait(delay);
          delay = Math.min(delay * 2, maxDelay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Generar timestamp único
   */
  static generateTimestamp(): string {
    return Date.now().toString();
  }

  /**
   * Generar identificador único
   */
  static generateUniqueId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Formatear fecha
   */
  static formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * Leer archivo JSON
   */
  static readJsonFile<T>(filePath: string): T {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf-8');
    return JSON.parse(content) as T;
  }

  /**
   * Escribir archivo JSON
   */
  static writeJsonFile(filePath: string, data: any): void {
    const absolutePath = path.resolve(filePath);
    const dir = path.dirname(absolutePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(absolutePath, JSON.stringify(data, null, 2));
  }

  /**
   * Crear directorio si no existe
   */
  static ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Limpiar directorio
   */
  static cleanDirectory(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
    fs.mkdirSync(dirPath, { recursive: true });
  }

  /**
   * Interceptar y mockear respuestas de red
   */
  static async mockApiResponse(
    page: Page,
    urlPattern: string | RegExp,
    response: {
      status?: number;
      body?: any;
      headers?: { [key: string]: string };
    }
  ): Promise<void> {
    await page.route(urlPattern, async (route) => {
      await route.fulfill({
        status: response.status || 200,
        body: JSON.stringify(response.body),
        headers: {
          'Content-Type': 'application/json',
          ...response.headers,
        },
      });
    });
  }

  /**
   * Interceptar peticiones de red
   */
  static async interceptRequests(
    page: Page,
    urlPattern: string | RegExp,
    callback: (request: any) => void
  ): Promise<void> {
    page.on('request', (request) => {
      if (typeof urlPattern === 'string') {
        if (request.url().includes(urlPattern)) {
          callback(request);
        }
      } else {
        if (urlPattern.test(request.url())) {
          callback(request);
        }
      }
    });
  }

  /**
   * Esperar respuesta de red
   */
  static async waitForApiResponse(
    page: Page,
    urlPattern: string | RegExp,
    options?: { timeout?: number }
  ): Promise<any> {
    const response = await page.waitForResponse(urlPattern, {
      timeout: options?.timeout || 30000,
    });
    return response.json();
  }

  /**
   * Comparar objetos ignorando propiedades específicas
   */
  static compareObjects(
    actual: any,
    expected: any,
    ignoreFields: string[] = []
  ): boolean {
    const actualFiltered = { ...actual };
    const expectedFiltered = { ...expected };

    ignoreFields.forEach((field) => {
      delete actualFiltered[field];
      delete expectedFiltered[field];
    });

    return JSON.stringify(actualFiltered) === JSON.stringify(expectedFiltered);
  }

  /**
   * Sanitizar string para uso en selectores
   */
  static sanitizeForSelector(text: string): string {
    return text.replace(/['"\\]/g, '\\$&');
  }

  /**
   * Convertir string a slug
   */
  static toSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
}

export default TestHelpers;
