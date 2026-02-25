# CLAUDE.md - Instrucciones para Claude Code

Este archivo proporciona contexto a Claude cuando trabaja con este proyecto.

## Resumen del Proyecto

Framework de automatización de pruebas con Playwright para:
- **Tests de UI** - Pruebas de interfaz usando Page Object Model
- **Tests de API** - Pruebas de backend/servicios REST
- **Tests E2E** - Flujos completos con validación en base de datos

## Stack Tecnológico

- **Runtime**: Node.js + TypeScript
- **Framework de Tests**: Playwright
- **Bases de Datos**: PostgreSQL, SQL Server, MySQL
- **Generación de Datos**: Faker.js

## Estructura del Proyecto

```
src/
├── api/api-client.ts           # Cliente HTTP para tests de API
├── config/                     # Configuraciones de ambiente y BD
├── database/                   # Cliente multi-BD y helpers
├── fixtures/test-fixtures.ts   # Fixtures personalizados
├── pages/                      # Page Objects (POM)
├── types/                      # Interfaces TypeScript
└── utils/                      # Helpers y generadores
tests/
├── api/*.api.spec.ts           # Tests de API
├── ui/*.spec.ts                # Tests de UI
└── e2e/*.spec.ts               # Tests End-to-End
```

## Patrones de Diseño

1. **Page Object Model** - Cada página tiene su clase en `src/pages/`
2. **Singleton** - DatabaseClient usa instancia única
3. **Factory** - Creación de clientes de BD según tipo
4. **Fixture Pattern** - Inyección de dependencias de Playwright

## Convenciones de Código

### Nomenclatura de Archivos
- Page Objects: `nombre.page.ts`
- Tests UI: `nombre.spec.ts`
- Tests API: `nombre.api.spec.ts`

### Selectores
Siempre usar `data-testid`:
```typescript
page.locator('[data-testid="elemento"]')
```

### Crear Page Object
```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class MiPage extends BasePage {
  readonly miElemento: Locator;

  constructor(page: Page) {
    super(page);
    this.miElemento = page.locator('[data-testid="mi-elemento"]');
  }
}
```

### Crear Test
```typescript
import { test, expect } from '../../src/fixtures';

test.describe('Mi módulo', () => {
  test('debe funcionar', async ({ loginPage, db }) => {
    // Test code
  });
});
```

## Fixtures Disponibles

- `loginPage` - Page Object de Login
- `dashboardPage` - Page Object de Dashboard
- `apiClient` - Cliente API sin auth
- `authenticatedApiClient` - Cliente API con auth
- `db` - Helper de base de datos

## Comandos

```bash
npm test              # Ejecutar todos los tests
npm run test:ui       # Solo tests de UI
npm run test:api      # Solo tests de API
npm run test:headed   # Con navegador visible
npm run test:debug    # Modo debug
```

## Reglas Importantes

1. **Extender de BasePage** al crear Page Objects
2. **Usar fixtures** en lugar de crear instancias manuales
3. **No hardcodear** credenciales - usar `.env`
4. **Limpiar datos** de prueba después de tests
5. **Tests independientes** - cada uno debe poder ejecutarse solo

## Archivos de Configuración

- `playwright.config.ts` - Configuración de Playwright
- `.env` - Variables de entorno (no commitear)
- `tsconfig.json` - Configuración de TypeScript
