import { faker } from '@faker-js/faker';

/**
 * Generador de datos de prueba
 * Utiliza Faker.js para generar datos realistas
 */
export class TestDataGenerator {
  /**
   * Generar usuario de prueba
   */
  static generateUser() {
    return {
      email: `test_${faker.string.alphanumeric(8)}@example.com`,
      password: faker.internet.password({ length: 12, memorable: false }),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number(),
    };
  }

  /**
   * Generar producto de prueba
   */
  static generateProduct() {
    return {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
      category: faker.commerce.department(),
      sku: faker.string.alphanumeric(10).toUpperCase(),
      stock: faker.number.int({ min: 0, max: 100 }),
    };
  }

  /**
   * Generar dirección de prueba
   */
  static generateAddress() {
    return {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
    };
  }

  /**
   * Generar tarjeta de crédito de prueba (datos ficticios)
   */
  static generateCreditCard() {
    return {
      number: '4111111111111111', // Número de prueba de Stripe
      expMonth: faker.number.int({ min: 1, max: 12 }).toString().padStart(2, '0'),
      expYear: (new Date().getFullYear() + 2).toString(),
      cvv: faker.string.numeric(3),
      holderName: faker.person.fullName(),
    };
  }

  /**
   * Generar orden de prueba
   */
  static generateOrder() {
    const quantity = faker.number.int({ min: 1, max: 5 });
    const unitPrice = parseFloat(faker.commerce.price({ min: 10, max: 100 }));
    
    return {
      items: [
        {
          productId: faker.number.int({ min: 1, max: 1000 }),
          quantity,
          unitPrice,
        },
      ],
      total: quantity * unitPrice,
      shippingAddress: this.generateAddress(),
      billingAddress: this.generateAddress(),
    };
  }

  /**
   * Generar texto aleatorio
   */
  static generateText(words: number = 10): string {
    return faker.lorem.words(words);
  }

  /**
   * Generar párrafo aleatorio
   */
  static generateParagraph(): string {
    return faker.lorem.paragraph();
  }

  /**
   * Generar email único
   */
  static generateEmail(): string {
    return `test_${Date.now()}_${faker.string.alphanumeric(5)}@example.com`;
  }

  /**
   * Generar número de teléfono
   */
  static generatePhone(): string {
    return faker.phone.number();
  }

  /**
   * Generar fecha futura
   */
  static generateFutureDate(): Date {
    return faker.date.future();
  }

  /**
   * Generar fecha pasada
   */
  static generatePastDate(): Date {
    return faker.date.past();
  }

  /**
   * Generar ID único
   */
  static generateId(): string {
    return faker.string.uuid();
  }

  /**
   * Generar número entero aleatorio
   */
  static generateNumber(min: number = 1, max: number = 100): number {
    return faker.number.int({ min, max });
  }
}

/**
 * Datos de prueba estáticos
 */
export const staticTestData = {
  // Usuarios predefinidos
  users: {
    valid: {
      email: 'test@example.com',
      password: 'TestPassword123!',
    },
    invalid: {
      email: 'invalid@example.com',
      password: 'wrongpassword',
    },
    admin: {
      email: 'admin@example.com',
      password: 'AdminPassword123!',
    },
  },

  // Mensajes de error esperados
  errorMessages: {
    invalidCredentials: 'Invalid email or password',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    emailInvalid: 'Please enter a valid email',
    passwordTooShort: 'Password must be at least 8 characters',
    unauthorized: 'Unauthorized access',
    notFound: 'Resource not found',
    serverError: 'Internal server error',
  },

  // Mensajes de éxito esperados
  successMessages: {
    loginSuccess: 'Login successful',
    logoutSuccess: 'Logged out successfully',
    profileUpdated: 'Profile updated successfully',
    orderPlaced: 'Order placed successfully',
    itemAdded: 'Item added to cart',
  },

  // URLs de prueba
  urls: {
    login: '/login',
    register: '/register',
    dashboard: '/dashboard',
    profile: '/profile',
    settings: '/settings',
    products: '/products',
    cart: '/cart',
    checkout: '/checkout',
  },
};

export default TestDataGenerator;
