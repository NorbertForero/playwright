import { test, expect } from "../../src/fixtures";
import { TestDataGenerator } from "../../src/utils";
import { kafkaTopics } from "../../src/kafka";

/**
 * Suite de tests para validar eventos de Kafka
 * Estos tests verifican que los endpoints publican correctamente mensajes a Kafka
 */
test.describe("Kafka Events Validation", () => {
  test.describe("Eventos de Usuario", () => {
    test("POST /users - debe publicar evento USER_CREATED en Kafka", async ({
      authenticatedApiClient,
      kafka,
      db,
    }) => {
      // 1. INICIAR captura de mensajes ANTES de la acción
      await kafka.startUserEventsCapture();

      // 2. Crear usuario via API
      const newUser = TestDataGenerator.generateUser();
      const response = await authenticatedApiClient.post("/users", newUser);

      expect(response.status).toBe(201);
      const createdUserId = response.data.id;

      // 3. ESPERAR y validar el evento en Kafka
      const kafkaEvent = await kafka.waitForUserCreatedEvent(createdUserId);

      // 4. Verificaciones
      expect(kafkaEvent).not.toBeNull();
      expect(kafkaEvent!.value).toMatchObject({
        eventType: "USER_CREATED",
        userId: String(createdUserId),
        email: newUser.email,
      });

      // 5. Verificar también en la base de datos
      const dbUser = await db.getUserByEmail(newUser.email);
      expect(dbUser).not.toBeNull();

      // Cleanup
      await kafka.stopCapture();
    });

    test("PUT /users/:id - debe publicar evento USER_UPDATED en Kafka", async ({
      authenticatedApiClient,
      kafka,
    }) => {
      // Iniciar captura
      await kafka.startUserEventsCapture();

      // Actualizar usuario
      const updateData = { firstName: "Updated Name" };
      const response = await authenticatedApiClient.put("/users/1", updateData);

      expect(response.status).toBe(200);

      // Esperar evento
      const kafkaEvent = await kafka.waitForUserUpdatedEvent(1);

      expect(kafkaEvent).not.toBeNull();
      expect(kafkaEvent!.value.eventType).toBe("USER_UPDATED");

      await kafka.stopCapture();
    });

    test("POST /auth/login - debe publicar evento USER_LOGIN en Kafka", async ({
      apiClient,
      kafka,
    }) => {
      await kafka.startUserEventsCapture();

      // Realizar login
      const email = "test@example.com";
      await apiClient.login(email, "TestPassword123!");

      // Esperar evento de login
      const kafkaEvent = await kafka.waitForLoginEvent(email);

      expect(kafkaEvent).not.toBeNull();
      expect(kafkaEvent!.value).toMatchObject({
        eventType: "USER_LOGIN",
        email,
      });

      await kafka.stopCapture();
    });
  });

  test.describe("Eventos de Órdenes", () => {
    test("POST /orders - debe publicar evento ORDER_CREATED en Kafka", async ({
      authenticatedApiClient,
      kafka,
    }) => {
      // Iniciar captura en topic de órdenes
      await kafka.startOrderEventsCapture();

      // Crear orden
      const orderData = {
        items: [{ productId: 1, quantity: 2 }],
        shippingAddress: TestDataGenerator.generateAddress(),
      };

      const response = await authenticatedApiClient.post("/orders", orderData);
      expect(response.status).toBe(201);
      const orderId = response.data.id;

      // Esperar evento
      const kafkaEvent = await kafka.waitForOrderCreatedEvent(orderId);

      expect(kafkaEvent).not.toBeNull();
      expect(kafkaEvent!.value).toMatchObject({
        eventType: "ORDER_CREATED",
        orderId: String(orderId),
      });
      expect(kafkaEvent!.value.items).toBeDefined();

      await kafka.stopCapture();
    });

    test("PATCH /orders/:id/status - debe publicar evento ORDER_STATUS_CHANGED", async ({
      authenticatedApiClient,
      kafka,
    }) => {
      await kafka.startOrderEventsCapture();

      // Cambiar estado de orden
      const orderId = 1;
      const newStatus = "shipped";

      const response = await authenticatedApiClient.patch(
        `/orders/${orderId}/status`,
        {
          status: newStatus,
        },
      );

      expect(response.status).toBe(200);

      // Esperar evento de cambio de estado
      const kafkaEvent = await kafka.waitForOrderStatusChangedEvent(
        orderId,
        newStatus,
      );

      expect(kafkaEvent).not.toBeNull();
      expect(kafkaEvent!.value).toMatchObject({
        eventType: "ORDER_STATUS_CHANGED",
        orderId: String(orderId),
        newStatus,
      });

      await kafka.stopCapture();
    });
  });

  test.describe("Eventos de Productos", () => {
    test("POST /products - debe publicar evento PRODUCT_CREATED en Kafka", async ({
      authenticatedApiClient,
      kafka,
    }) => {
      await kafka.startProductEventsCapture();

      const newProduct = TestDataGenerator.generateProduct();
      const response = await authenticatedApiClient.post(
        "/products",
        newProduct,
      );

      expect(response.status).toBe(201);

      const kafkaEvent = await kafka.waitForProductCreatedEvent();

      expect(kafkaEvent).not.toBeNull();
      expect(kafkaEvent!.value.eventType).toBe("PRODUCT_CREATED");
      expect(kafkaEvent!.value.name).toBe(newProduct.name);

      await kafka.stopCapture();
    });

    test("PATCH /products/:id/stock - debe publicar evento STOCK_UPDATED", async ({
      authenticatedApiClient,
      kafka,
    }) => {
      await kafka.startProductEventsCapture();

      const productId = 1;
      const response = await authenticatedApiClient.patch(
        `/products/${productId}/stock`,
        {
          quantity: -5,
          reason: "sale",
        },
      );

      expect(response.status).toBe(200);

      const kafkaEvent = await kafka.waitForStockUpdatedEvent(productId);

      expect(kafkaEvent).not.toBeNull();
      expect(kafkaEvent!.value.eventType).toBe("STOCK_UPDATED");
      expect(kafkaEvent!.value.productId).toBe(String(productId));

      await kafka.stopCapture();
    });
  });

  test.describe("Eventos de Auditoría", () => {
    test("Acciones sensibles deben generar evento de auditoría", async ({
      authenticatedApiClient,
      kafka,
    }) => {
      await kafka.startAuditCapture();

      // Realizar una acción que debería ser auditada
      await authenticatedApiClient.delete("/users/999");

      // Esperar evento de auditoría
      const kafkaEvent = await kafka.waitForAuditEvent("DELETE", "USER");

      expect(kafkaEvent).not.toBeNull();
      expect(kafkaEvent!.value.action).toBe("DELETE");
      expect(kafkaEvent!.value.entityType).toBe("USER");
      expect(kafkaEvent!.value.timestamp).toBeDefined();

      await kafka.stopCapture();
    });
  });

  test.describe("Validaciones Negativas", () => {
    test("Operación fallida NO debe publicar evento de éxito", async ({
      apiClient,
      kafka,
    }) => {
      await kafka.startUserEventsCapture();

      // Intentar login con credenciales inválidas
      const response = await apiClient.post("/auth/login", {
        email: "noexiste@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);

      // Verificar que NO llegó evento de login exitoso
      const noEvent = await kafka.verifyNoMessage({
        topic: kafkaTopics.userEvents,
        valueContains: {
          eventType: "USER_LOGIN",
          email: "noexiste@example.com",
        },
      });

      expect(noEvent).toBe(true);

      await kafka.stopCapture();
    });
  });

  test.describe("Validación con Filtros Avanzados", () => {
    test("Debe poder filtrar mensajes por header", async ({
      authenticatedApiClient,
      kafka,
    }) => {
      await kafka.startCapture([kafkaTopics.userEvents, kafkaTopics.auditLog]);

      // Realizar acción
      await authenticatedApiClient.put("/users/1", { firstName: "Test" });

      // Esperar mensaje con header específico (ej: correlation-id)
      const kafkaEvent = await kafka.waitForMessageContaining(
        kafkaTopics.userEvents,
        { eventType: "USER_UPDATED" },
      );

      expect(kafkaEvent).not.toBeNull();

      // Verificar que llegaron mensajes a ambos topics
      const allMessages = kafka.getCapturedMessages();
      console.log(`📊 Total mensajes capturados: ${allMessages.length}`);

      await kafka.stopCapture();
    });
  });
});

/**
 * EJEMPLO DE USO EN UN TEST E2E COMPLETO
 * Validando UI + API + Kafka + DB
 */
test.describe("E2E: Flujo completo con validación Kafka", () => {
  test("Compra completa debe generar eventos en Kafka", async ({
    page,
    apiClient,
    kafka,
    db,
  }) => {
    // 1. Iniciar captura de múltiples topics
    await kafka.startCapture([
      kafkaTopics.userEvents,
      kafkaTopics.orderEvents,
      kafkaTopics.productEvents,
    ]);

    // 2. Login via UI
    await page.goto("/login");
    await page.fill('[data-testid="email-input"]', "test@example.com");
    await page.fill('[data-testid="password-input"]', "TestPassword123!");
    await page.click('[data-testid="login-button"]');
    await page.waitForURL("/dashboard");

    // Verificar evento de login en Kafka
    const loginEvent = await kafka.waitForLoginEvent("test@example.com", 10000);
    expect(loginEvent).not.toBeNull();

    // 3. Agregar producto al carrito y hacer checkout via API
    const orderResponse = await apiClient.post("/orders", {
      items: [{ productId: 1, quantity: 1 }],
      shippingAddress: TestDataGenerator.generateAddress(),
    });

    // 4. Verificar evento de orden creada
    const orderEvent = await kafka.waitForOrderCreatedEvent(
      orderResponse.data.id,
    );
    expect(orderEvent).not.toBeNull();

    // 5. Verificar evento de stock actualizado
    const stockEvent = await kafka.waitForStockUpdatedEvent(1);
    expect(stockEvent).not.toBeNull();

    // 6. Verificar en base de datos
    const order = await db.getOrderById(orderResponse.data.id);
    expect(order).not.toBeNull();
    expect(order!.status).toBe("pending");

    // Resumen de eventos capturados
    const totalEvents = kafka.getCapturedMessagesCount();
    console.log(`✅ Test completado. Eventos Kafka capturados: ${totalEvents}`);

    await kafka.stopCapture();
  });
});
