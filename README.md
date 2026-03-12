# 🎭 Framework de Automatización con Playwright

Framework profesional de pruebas automatizadas con Playwright para testing de Frontend, Backend (API) y E2E con validaciones en base de datos y mensajería Kafka.

## 📋 Características

- ✅ **Tests de UI** - Pruebas de interfaz de usuario con Page Object Model
- ✅ **Tests de API** - Pruebas de backend/servicios REST
- ✅ **Tests E2E** - Flujos completos de usuario
- ✅ **Conexión a DB** - Validaciones con PostgreSQL, SQL Server y MySQL
- ✅ **Validación Kafka** - Verificación de eventos/mensajes en topics Kafka
- ✅ **Multi-navegador** - Chrome, Firefox, Safari, Mobile
- ✅ **Reportes HTML** - Reportes detallados con screenshots y videos
- ✅ **Fixtures personalizados** - Page Objects y API Client inyectables
- ✅ **TypeScript** - Tipado estático para mejor mantenibilidad

## 🗂️ Estructura del Proyecto

```
playwright/
├── src/
│   ├── api/                    # Cliente de API para tests de backend
│   │   └── api-client.ts
│   ├── config/                 # Configuración de ambiente y DB
│   │   ├── database.config.ts
│   │   ├── environment.config.ts
│   │   └── kafka.config.ts
│   ├── database/               # Cliente y helpers de base de datos
│   │   ├── db-client.ts
│   │   └── db-helper.ts
│   ├── kafka/                  # Cliente y helpers de Kafka
│   │   ├── kafka-client.ts
│   │   └── kafka-helper.ts
│   ├── fixtures/               # Fixtures personalizados de Playwright
│   │   └── test-fixtures.ts
│   ├── pages/                  # Page Objects
│   │   ├── base.page.ts
│   │   ├── login.page.ts
│   │   └── dashboard.page.ts
│   ├── types/                  # Tipos TypeScript
│   │   └── index.ts
│   └── utils/                  # Utilidades y helpers
│       ├── test-data.ts
│       └── helpers.ts
├── tests/
│   ├── api/                    # Tests de API
│   │   ├── users.api.spec.ts
│   │   ├── products.api.spec.ts
│   │   └── kafka-events.api.spec.ts
│   ├── ui/                     # Tests de UI
│   │   ├── login.spec.ts
│   │   └── dashboard.spec.ts
│   ├── e2e/                    # Tests End-to-End
│   │   └── complete-flow.spec.ts
│   └── auth.setup.ts           # Setup de autenticación
├── playwright.config.ts        # Configuración de Playwright
├── tsconfig.json               # Configuración de TypeScript
├── .env.example                # Variables de entorno de ejemplo
└── package.json
```

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd playwright

# Instalar dependencias
npm install

# Instalar navegadores de Playwright
npx playwright install

# Copiar archivo de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
# URLs
BASE_URL=http://localhost:3000
API_URL=http://localhost:3000/api

# Base de Datos PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_password
PG_DATABASE=test_db

# Credenciales de prueba
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
```

## 🧪 Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Tests de UI solamente
npm run test:ui

# Tests de API solamente
npm run test:api

# Tests E2E solamente
npm run test:e2e

# Ejecutar con navegador visible
npm run test:headed

# Modo debug
npm run test:debug

# Por navegador específico
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Tests en dispositivos móviles
npm run test:mobile

# Ejecutar en paralelo
npm run test:parallel
```

## 📊 Ver Reportes

```bash
# Abrir reporte HTML
npm run report

# Ver trace de un test fallido
npm run trace trace.zip
```

## 🔧 Herramientas de Desarrollo

```bash
# Generador de código
npm run codegen

# Esto abre un navegador donde puedes grabar acciones
# y Playwright genera el código automáticamente
```

## 📝 Escribir Tests

### Test de UI con Page Object

```typescript
import { test, expect } from '../../src/fixtures';

test('Usuario puede hacer login', async ({ loginPage }) => {
  await loginPage.navigate();
  await loginPage.login('user@example.com', 'password123');
  await loginPage.verifyLoginSuccess();
});
```

### Test de API

```typescript
import { test, expect } from '../../src/fixtures';

test('API retorna lista de usuarios', async ({ authenticatedApiClient }) => {
  const response = await authenticatedApiClient.get('/users');
  
  expect(response.status).toBe(200);
  expect(response.data).toBeInstanceOf(Array);
});
```

### Test con validación en Base de Datos

```typescript
import { test, expect } from '../../src/fixtures';

test('Usuario se guarda en la base de datos', async ({ 
  apiClient, 
  db 
}) => {
  // Crear usuario via API
  const newUser = { email: 'new@example.com', password: 'Pass123!' };
  await apiClient.post('/users', newUser);
  
  // Verificar en la base de datos
  const dbUser = await db.getUserByEmail(newUser.email);
  expect(dbUser).not.toBeNull();
  expect(dbUser.email).toBe(newUser.email);
});
```

## 🏗️ Crear un Page Object

```typescript
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class MyPage extends BasePage {
  readonly url = '/my-page';
  
  // Definir selectores
  readonly myButton: Locator;
  readonly myInput: Locator;

  constructor(page: Page) {
    super(page);
    this.myButton = page.locator('[data-testid="my-button"]');
    this.myInput = page.locator('[data-testid="my-input"]');
  }

  async navigate(): Promise<void> {
    await this.goto(this.url);
  }

  async clickMyButton(): Promise<void> {
    await this.myButton.click();
  }

  async fillMyInput(value: string): Promise<void> {
    await this.fillField(this.myInput, value);
  }
}
```

## 🔌 Soporte de Bases de Datos

El framework soporta múltiples motores de base de datos:

### PostgreSQL
```typescript
const db = new DatabaseHelper('postgres');
await db.connect();
const user = await db.getUserByEmail('user@example.com');
```

### SQL Server
```typescript
const db = new DatabaseHelper('mssql');
await db.connect();
const user = await db.getUserByEmail('user@example.com');
```

### MySQL
```typescript
const db = new DatabaseHelper('mysql');
await db.connect();
const user = await db.getUserByEmail('user@example.com');
```

## 📨 Validación de Eventos Kafka

El framework permite validar mensajes en Kafka después de ejecutar acciones en la API o UI.

### Configuración de Kafka

```env
# .env
KAFKA_BROKERS=localhost:9092
KAFKA_GROUP_ID=playwright-test-group
KAFKA_TOPIC_USER_EVENTS=user-events
KAFKA_TOPIC_ORDER_EVENTS=order-events
```

### Patrón de Validación

```typescript
import { test, expect } from '../../src/fixtures';

test('POST /users debe publicar evento en Kafka', async ({ 
  authenticatedApiClient,
  kafka
}) => {
  // 1. INICIAR captura de mensajes ANTES de la acción
  await kafka.startUserEventsCapture();

  // 2. Ejecutar la acción que genera el evento
  const response = await authenticatedApiClient.post('/users', {
    email: 'new@example.com',
    name: 'Test User'
  });
  expect(response.status).toBe(201);
  const userId = response.data.id;

  // 3. ESPERAR y validar el evento en Kafka
  const kafkaEvent = await kafka.waitForUserCreatedEvent(userId);

  // 4. Verificaciones del evento
  expect(kafkaEvent).not.toBeNull();
  expect(kafkaEvent!.value).toMatchObject({
    eventType: 'USER_CREATED',
    userId: String(userId),
    email: 'new@example.com',
  });

  // 5. Detener captura
  await kafka.stopCapture();
});
```

### Métodos de Validación Disponibles

| Método | Descripción |
|--------|-------------|
| `startUserEventsCapture()` | Inicia captura en topic de usuarios |
| `startOrderEventsCapture()` | Inicia captura en topic de órdenes |
| `startProductEventsCapture()` | Inicia captura en topic de productos |
| `startAuditCapture()` | Inicia captura en topic de auditoría |
| `startCapture(topics[])` | Inicia captura en múltiples topics |
| `waitForUserCreatedEvent(userId)` | Espera evento USER_CREATED |
| `waitForUserUpdatedEvent(userId)` | Espera evento USER_UPDATED |
| `waitForLoginEvent(email)` | Espera evento USER_LOGIN |
| `waitForOrderCreatedEvent(orderId)` | Espera evento ORDER_CREATED |
| `waitForOrderStatusChangedEvent(orderId, status)` | Espera cambio de estado |
| `waitForStockUpdatedEvent(productId)` | Espera evento de stock |
| `verifyNoMessage(filter)` | Verifica que NO llegó un mensaje |
| `getCapturedMessages()` | Obtiene todos los mensajes capturados |
| `stopCapture()` | Detiene captura y desconecta |

### Validación Negativa

```typescript
test('Login fallido NO debe generar evento', async ({ apiClient, kafka }) => {
  await kafka.startUserEventsCapture();

  // Intento fallido de login
  await apiClient.post('/auth/login', { email: 'wrong@email.com', password: 'wrong' });

  // Verificar que NO llegó evento de login exitoso
  const noEvent = await kafka.verifyNoMessage({
    topic: 'user-events',
    valueContains: { eventType: 'USER_LOGIN', email: 'wrong@email.com' },
  });
  expect(noEvent).toBe(true);

  await kafka.stopCapture();
});
```

### Test E2E con UI + API + Kafka + DB

```typescript
test('Compra completa valida eventos', async ({ page, apiClient, kafka, db }) => {
  // Capturar múltiples topics
  await kafka.startCapture(['user-events', 'order-events', 'product-events']);

  // Login via UI
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'Password123!');
  await page.click('[data-testid="login-button"]');

  // Verificar evento de login
  const loginEvent = await kafka.waitForLoginEvent('test@example.com');
  expect(loginEvent).not.toBeNull();

  // Crear orden via API
  const orderResponse = await apiClient.post('/orders', { items: [{ productId: 1, qty: 1 }] });
  
  // Verificar evento de orden
  const orderEvent = await kafka.waitForOrderCreatedEvent(orderResponse.data.id);
  expect(orderEvent).not.toBeNull();

  // Verificar en base de datos
  const order = await db.getOrderById(orderResponse.data.id);
  expect(order).not.toBeNull();

  await kafka.stopCapture();
});
```

## 🎯 Mejores Prácticas Implementadas

1. **Page Object Model (POM)** - Separación de selectores y lógica de página
2. **Fixtures personalizados** - Inyección de dependencias limpia
3. **Datos de prueba centralizados** - Generador de datos con Faker.js
4. **Configuración por ambiente** - Variables de entorno
5. **Reportes detallados** - Screenshots, videos y traces
6. **Tipado estricto** - TypeScript para mejor mantenibilidad
7. **Reutilización de autenticación** - Setup global para evitar logins repetidos
8. **Tests independientes** - Cada test puede ejecutarse de forma aislada
9. **Validación de datos** - Verificación en múltiples capas (UI, API, DB)

## 📚 Recursos

- [Documentación oficial de Playwright](https://playwright.dev/docs/intro)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Fixtures](https://playwright.dev/docs/test-fixtures)
- [API Testing](https://playwright.dev/docs/api-testing)

## 📄 Licencia

ISC
