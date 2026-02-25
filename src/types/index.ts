/**
 * Tipos globales para el proyecto de tests
 */

/**
 * Usuario
 */
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'user' | 'admin' | 'moderator';

/**
 * Producto
 */
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Categoría
 */
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
}

/**
 * Orden
 */
export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

/**
 * Item de orden
 */
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  total: number;
}

/**
 * Dirección
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Credenciales de login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Respuesta de login
 */
export interface LoginResponse {
  token: string;
  user: User;
  expiresAt: string;
}

/**
 * Respuesta de API genérica
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

/**
 * Respuesta paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Filtros de búsqueda
 */
export interface SearchFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price' | 'name' | 'createdAt';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
