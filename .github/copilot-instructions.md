# Instrucciones para Agente de IA - Proyecto Playwright

## 📋 Descripción del Proyecto

Este es un framework de automatización de pruebas con Playwright que incluye:
- Tests de UI (Frontend)
- Tests de API (Backend)
- Tests E2E (End-to-End)
- Validaciones con base de datos (PostgreSQL, SQL Server, MySQL)
- Validaciones de eventos Kafka

## 🏗️ Arquitectura y Patrones de Diseño

### Page Object Model (POM)
- Todas las páginas deben extender de `BasePage`
- Los selectores se definen como propiedades `Locator` en el constructor
- Usar `data-testid` como selector principal
- Cada página tiene su propio archivo en `src/pages/`

### Estructura de archivos:
```
src/
├── api/          # Cliente API para tests de backend
├── config/       # Configuración de ambiente, BD y Kafka
├── database/     # Cliente multi-BD
├── kafka/        # Cliente y helpers de Kafka
├── fixtures/     # Fixtures personalizados de Playwright
├── pages/        # Page Objects
├── types/        # Tipos TypeScript
└── utils/        # Helpers y generadores de datos
tests/
├── api/          # Tests de API (*.api.spec.ts)
├── ui/           # Tests de UI (*.spec.ts)
└── e2e/          # Tests E2E (*.spec.ts)
```

## 📝 Convenciones de Código

### Nomenclatura
- **Archivos de Page Objects**: `nombre.page.ts` (ej: `login.page.ts`)
- **Archivos de Tests UI**: `nombre.spec.ts` (ej: `login.spec.ts`)
- **Archivos de Tests API**: `nombre.api.spec.ts` (ej: `users.api.spec.ts`)
- **Clases**: PascalCase (ej: `LoginPage`, `DashboardPage`)
- **Métodos**: camelCase (ej: `verifyLoginSuccess`, `getUserByEmail`)
- **Selectores**: usar `data-testid` (ej: `[data-testid="login-button"]`)

### Selectores
Siempre preferir en este orden:
1. `data-testid` - Más estable y mantenible
2. `role` - Para accesibilidad
3. `text` - Para contenido visible
4. `CSS selectors` - Último recurso

```typescript
// ✅ Correcto
this.loginButton = page.locator('[data-testid="login-button"]');

// ❌ Evitar
this.loginButton = page.locator('.btn-primary');
```

### Estructura de un Page Object

```typescript
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class MiPagina extends BasePage {
  readonly url = '/mi-pagina';
  
  // Selectores como propiedades
  readonly miBoton: Locator;
  readonly miInput: Locator;

  constructor(page: Page) {
    super(page);
    this.miBoton = page.locator('[data-testid="mi-boton"]');
    this.miInput = page.locator('[data-testid="mi-input"]');
  }

  // Métodos de navegación
  async navigate(): Promise<void> {
    await this.goto(this.url);
  }

  // Métodos de acción
  async clickMiBoton(): Promise<void> {
    await this.miBoton.click();
  }

  // Métodos de verificación
  async verifyPageLoaded(): Promise<void> {
    await expect(this.miBoton).toBeVisible();
  }
}
```

### Estructura de un Test

```typescript
import { test, expect } from '../../src/fixtures';

test.describe('Nombre del módulo', () => {
  
  test.beforeEach(async ({ loginPage }) => {
    // Setup común
  });

  test.describe('Grupo de tests', () => {
    test('debe hacer algo específico', async ({ loginPage, db }) => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## 🔌 Conexión a Base de Datos

### Uso del DatabaseHelper
```typescript
// Fixture disponible automáticamente
test('validar datos en BD', async ({ db }) => {
  const user = await db.getUserByEmail('test@example.com');
  expect(user).not.toBeNull();
});
```

### Métodos disponibles
- `getUserByEmail(email)` - Obtener usuario
- `getProductById(id)` - Obtener producto
- `getOrderStatus(orderId)` - Estado de orden
- `hasEnoughStock(productId, qty)` - Verificar stock
- `cleanTestData(prefix)` - Limpiar datos de prueba

## 🧪 Fixtures Disponibles

Los siguientes fixtures están disponibles en todos los tests:

| Fixture | Descripción |
|---------|-------------|
| `loginPage` | Page Object de Login |
| `dashboardPage` | Page Object de Dashboard |
| `apiClient` | Cliente API sin autenticación |
| `authenticatedApiClient` | Cliente API autenticado |
| `db` | Helper de base de datos |
| `kafka` | Helper de validación Kafka |
| `authenticatedPage` | Página ya autenticada |

## 📨 Validación de Eventos Kafka

### Uso del KafkaHelper
```typescript
// Patrón: Iniciar captura ANTES de la acción
test('POST /users genera evento Kafka', async ({ authenticatedApiClient, kafka }) => {
  // 1. Iniciar captura
  await kafka.startUserEventsCapture();

  // 2. Ejecutar acción
  const response = await authenticatedApiClient.post('/users', userData);

  // 3. Esperar evento
  const event = await kafka.waitForUserCreatedEvent(response.data.id);
  expect(event).not.toBeNull();
  expect(event!.value.eventType).toBe('USER_CREATED');

  // 4. Cleanup
  await kafka.stopCapture();
});
```

### Métodos de Kafka disponibles
- `startUserEventsCapture()` - Captura en topic de usuarios
- `startOrderEventsCapture()` - Captura en topic de órdenes
- `startProductEventsCapture()` - Captura en topic de productos
- `startAuditCapture()` - Captura en topic de auditoría
- `waitForUserCreatedEvent(userId)` - Espera evento USER_CREATED
- `waitForOrderCreatedEvent(orderId)` - Espera evento ORDER_CREATED
- `waitForLoginEvent(email)` - Espera evento USER_LOGIN
- `verifyNoMessage(filter)` - Verifica que NO llegó mensaje
- `stopCapture()` - Detener y desconectar

## 📊 Generación de Datos de Prueba

Usar `TestDataGenerator` para datos dinámicos:

```typescript
import { TestDataGenerator } from '../../src/utils';

const user = TestDataGenerator.generateUser();
const product = TestDataGenerator.generateProduct();
const address = TestDataGenerator.generateAddress();
```

## ⚠️ Reglas Importantes

1. **No hardcodear credenciales** - Usar variables de entorno
2. **No usar `page.waitForTimeout()`** - Usar esperas explícitas
3. **Siempre limpiar datos de prueba** - Usar `db.cleanTestData()`
4. **Tests independientes** - Cada test debe poder ejecutarse solo
5. **Usar fixtures** - No crear instancias manuales de Page Objects

## 🚀 Comandos Útiles

```bash
npm test              # Todos los tests
npm run test:ui       # Solo UI
npm run test:api      # Solo API
npm run test:e2e      # Solo E2E
npm run test:headed   # Con navegador visible
npm run test:debug    # Modo debug
npm run report        # Ver reporte
npm run codegen       # Generador de código
```

## 📁 Al Crear Nuevos Archivos

### Nuevo Page Object
1. Crear en `src/pages/nombre.page.ts`
2. Extender de `BasePage`
3. Exportar en `src/pages/index.ts`
4. Agregar fixture en `src/fixtures/test-fixtures.ts`

### Nuevo Test de UI
1. Crear en `tests/ui/nombre.spec.ts`
2. Importar fixtures desde `../../src/fixtures`
3. Usar Page Objects existentes

### Nuevo Test de API
1. Crear en `tests/api/nombre.api.spec.ts`
2. Usar `apiClient` o `authenticatedApiClient`
3. Validar con `db` si es necesario

### Nuevo Helper de BD
1. Agregar método en `src/database/db-helper.ts`
2. Documentar con JSDoc
3. Soportar los 3 motores de BD si aplica
