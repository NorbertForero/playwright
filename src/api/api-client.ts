import { APIRequestContext, APIResponse } from '@playwright/test';
import { environment } from '../config';

/**
 * Interfaz de respuesta de API
 */
export interface ApiResponse<T = any> {
  status: number;
  data: T;
  headers: { [key: string]: string };
  ok: boolean;
}

/**
 * Cliente API para tests de backend
 */
export class ApiClient {
  private request: APIRequestContext;
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(request: APIRequestContext, baseUrl?: string) {
    this.request = request;
    this.baseUrl = baseUrl || environment.apiUrl;
  }

  /**
   * Establecer token de autenticación
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Limpiar token de autenticación
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Obtener headers comunes
   */
  private getHeaders(additionalHeaders?: { [key: string]: string }): { [key: string]: string } {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...additionalHeaders,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Parsear respuesta de API
   */
  private async parseResponse<T>(response: APIResponse): Promise<ApiResponse<T>> {
    let data: T;
    try {
      data = await response.json();
    } catch {
      data = await response.text() as unknown as T;
    }

    const headers: { [key: string]: string } = response.headers();

    return {
      status: response.status(),
      data,
      headers,
      ok: response.ok(),
    };
  }

  /**
   * Realizar petición GET
   */
  async get<T = any>(
    endpoint: string,
    options?: {
      params?: { [key: string]: string | number };
      headers?: { [key: string]: string };
    }
  ): Promise<ApiResponse<T>> {
    const response = await this.request.get(`${this.baseUrl}${endpoint}`, {
      params: options?.params,
      headers: this.getHeaders(options?.headers),
    });
    return this.parseResponse<T>(response);
  }

  /**
   * Realizar petición POST
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    options?: {
      headers?: { [key: string]: string };
    }
  ): Promise<ApiResponse<T>> {
    const response = await this.request.post(`${this.baseUrl}${endpoint}`, {
      data,
      headers: this.getHeaders(options?.headers),
    });
    return this.parseResponse<T>(response);
  }

  /**
   * Realizar petición PUT
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    options?: {
      headers?: { [key: string]: string };
    }
  ): Promise<ApiResponse<T>> {
    const response = await this.request.put(`${this.baseUrl}${endpoint}`, {
      data,
      headers: this.getHeaders(options?.headers),
    });
    return this.parseResponse<T>(response);
  }

  /**
   * Realizar petición PATCH
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    options?: {
      headers?: { [key: string]: string };
    }
  ): Promise<ApiResponse<T>> {
    const response = await this.request.patch(`${this.baseUrl}${endpoint}`, {
      data,
      headers: this.getHeaders(options?.headers),
    });
    return this.parseResponse<T>(response);
  }

  /**
   * Realizar petición DELETE
   */
  async delete<T = any>(
    endpoint: string,
    options?: {
      headers?: { [key: string]: string };
    }
  ): Promise<ApiResponse<T>> {
    const response = await this.request.delete(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(options?.headers),
    });
    return this.parseResponse<T>(response);
  }

  /**
   * Upload de archivo
   */
  async uploadFile<T = any>(
    endpoint: string,
    file: {
      name: string;
      mimeType: string;
      buffer: Buffer;
    },
    additionalData?: { [key: string]: string }
  ): Promise<ApiResponse<T>> {
    const response = await this.request.post(`${this.baseUrl}${endpoint}`, {
      multipart: {
        file: {
          name: file.name,
          mimeType: file.mimeType,
          buffer: file.buffer,
        },
        ...additionalData,
      },
      headers: {
        'Authorization': this.authToken ? `Bearer ${this.authToken}` : '',
      },
    });
    return this.parseResponse<T>(response);
  }

  // ==========================================
  // Métodos de conveniencia para endpoints comunes
  // ==========================================

  /**
   * Login y obtener token
   */
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    const response = await this.post<{ token: string; user: any }>('/auth/login', {
      email,
      password,
    });
    
    if (response.ok && response.data.token) {
      this.setAuthToken(response.data.token);
    }
    
    return response;
  }

  /**
   * Logout
   */
  async logout(): Promise<ApiResponse<void>> {
    const response = await this.post<void>('/auth/logout');
    this.clearAuthToken();
    return response;
  }

  /**
   * Obtener usuario actual
   */
  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.get('/auth/me');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.get('/health');
  }
}

export default ApiClient;
