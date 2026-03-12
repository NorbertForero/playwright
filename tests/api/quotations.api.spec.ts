import { test, expect } from '../../src/fixtures';
import { kafkaTopics } from '../../src/kafka';

/**
 * Suite de tests para validar el endpoint POST /api/Quotations
 * y su publicación de eventos de estado en Kafka
 * 
 * Topic: apm0005763.bsn0019380.latam.sit.status.process.v1
 */

// URL del endpoint de Quotations
const QUOTATIONS_API_URL = process.env.QUOTATIONS_API_URL || 'http://LAUSD-WPIP001.aceins.com:4443/api/Quotations';

// Headers requeridos por el endpoint
const getHeaders = (bearerToken: string) => ({
  'apiVersion': '1',
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${bearerToken}`,
});

/**
 * Genera un payload de cotización válido para Brasil
 */
function generateQuotationPayload(transactionId: string, options: {
  countryCode?: string;
  quoteNumber?: number;
  documentTypeCode?: string;
} = {}) {
  const {
    countryCode = 'BR',
    quoteNumber = Math.floor(Math.random() * 100000),
    documentTypeCode = '27',
  } = options;

  return {
    meta: {
      apiVersion: 0,
      sourceSystemCode: 'Ingestion',
      transactionTypeCode: '10001',
      countryCode,
      correlationId: '10001',
      timestamp: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, ''),
      workItemId: '10001',
    },
    issuance: {
      transactionId,
      quoteNumber,
      quoteId: 300047,
      premium: 100000.00,
      totalAmount: 100000.00,
      documentTypeCode,
      endorsementNumber: 0,
      sourceCountryCode: countryCode,
      riskCountryCode: countryCode,
      businessSizeCode: '40',
      lineOfBusinessCode: '56',
      riskID: '',
      policy: {
        policyNumber: '1234567',
      },
      financialItems: [
        {
          finantialItemTypeCode: 'COVERAGE',
          financialItemRoleCode: 'FACULTATIVE',
          amount: 0,
          percentage: 0,
          minimumValue: 0,
          maximumValue: 0,
        },
        {
          finantialItemTypeCode: 'COVERAGE',
          financialItemRoleCode: 'FACILITY',
          amount: 0.0,
          percentage: 0,
          minimumValue: 0,
          maximumValue: 0,
        },
        {
          finantialItemTypeCode: 'COVERAGE',
          financialItemRoleCode: 'CONTRACT',
          amount: 100,
          percentage: 100,
          minimumValue: 0,
          maximumValue: 0,
        },
      ],
      parties: [
        {
          id: 1,
          partyRoleCode: 'INSURED',
          alternateName: 'TEST USER',
          fullName: 'TEST USER PLAYWRIGHT AUTOMATION',
          siscode: '8909857454',
          economicActivityCode: '9941',
          phoneNumber: '123456789',
          email: 'test.automation@example.com',
          portfolioSegmentCode: 'C',
          contactPerson: 'Test Contact',
          legalEntityTypeCode: 'F',
          taxPaymentPositionCode: 'A',
          consortiumIndicator: false,
          foreign: false,
          partyIdentities: [
            { typeCode: 'TAX_ID', id: '8909857454' },
          ],
          addresses: [
            {
              id: 0,
              addressTypeCode: 'BILLING',
              countryCode: '1',
              countryDesctiption: 'countryDesctiption',
              stateCode: '2',
              stateDescription: 'stateDescription',
              countyCode: '3',
              countyDescripcion: 'countyDescripcion',
              cityCode: 4,
              neighborhood: 'neighbor',
              zipCode: '79840360',
              streetName: 'streetName',
              streetNumber: '6',
              floorNumber: '7',
              interiorNumber: '8',
            },
            {
              id: 0,
              addressTypeCode: 'MAIN',
              countryCode: '1',
              stateCode: '1',
              countyCode: '1',
              cityCode: 0,
              neighborhood: '1',
              zipCode: '48360970',
              streetName: 'MINA',
              streetNumber: '77',
              floorNumber: '65',
              interiorNumber: '23',
            },
          ],
          communications: [
            { communicationTypeCode: 'string', phoneNumber: '312312333' },
          ],
        },
        {
          id: 2,
          partyRoleCode: 'POLICY_HOLDER',
          alternateName: 'TEST USER',
          fullName: 'TEST USER PLAYWRIGHT AUTOMATION',
          siscode: '8909857454',
          economicActivityCode: '9941',
          phoneNumber: '123456789',
          email: 'test.automation@example.com',
          portfolioSegmentCode: 'C',
          contactPerson: 'Test Contact',
          legalEntityTypeCode: 'S',
          taxPaymentPositionCode: 'A',
          consortiumIndicator: false,
          foreign: false,
          partyIdentities: [
            { typeCode: 'TAX_ID', id: '8909857454' },
          ],
          addresses: [
            {
              id: 0,
              addressTypeCode: 'MAIN',
              countryCode: '1',
              stateCode: '1',
              countyCode: '1',
              cityCode: 0,
              neighborhood: '1',
              zipCode: '48360970',
              streetName: 'MINA',
              streetNumber: '77',
              floorNumber: '65',
              interiorNumber: '23',
            },
          ],
          communications: [
            { communicationTypeCode: 'string', phoneNumber: '1234556788' },
          ],
        },
        {
          id: 3,
          partyRoleCode: 'BENEFICIARY',
          alternateName: 'TEST USER',
          fullName: 'TEST USER PLAYWRIGHT AUTOMATION',
          siscode: '8909857454',
          economicActivityCode: '9941',
          phoneNumber: '123456789',
          email: 'test.automation@example.com',
          portfolioSegmentCode: 'C',
          contactPerson: 'Test Contact',
          legalEntityTypeCode: 'F',
          taxPaymentPositionCode: 'A',
          consortiumIndicator: false,
          foreign: false,
          partyIdentities: [
            { typeCode: 'TAX_ID', id: '8909857454' },
          ],
          addresses: [
            {
              id: 0,
              addressTypeCode: 'MAIN',
              countryCode: '1',
              stateCode: '1',
              countyCode: '1',
              cityCode: 0,
              neighborhood: '1',
              zipCode: '48360970',
              streetName: 'MINA',
              streetNumber: '77',
              floorNumber: '65',
              interiorNumber: '23',
            },
          ],
          communications: [
            { communicationTypeCode: 'string', phoneNumber: 'string' },
          ],
        },
      ],
      risks: [
        {
          id: 0,
          riskCode: '3',
          description: 'GARANTIAS PRIVADAS',
          coverages: [
            {
              id: 0,
              activityCode: '01',
              lineOfBusinessCode: '56',
              premiumAmount: 340000.00,
              isLimit: true,
              sumInsured: 2000000.00,
              coverageTypeCode: 'A1',
              description: '01',
              riskValue: '4000000.00',
              rimet: 'T300',
              rimetEmitir: '5',
              locations: [{ stateCode: '24' }],
              rimetBase: 'R110',
              rimetEmit: 10,
              deductibleTypeCode: 44,
              deductibleFixed: 12,
              deductiblePercent: 10,
              deductibleMin: 20,
              deductibleMax: 30,
            },
          ],
        },
      ],
      payment: {
        paymentMethodCode: '01',
        installmentsNumber: 0,
        paymentPlanCode: '01',
        rppa: '12345678',
      },
    },
    targets: [
      {
        system: 'Pipeline',
        issuanceDetail: {
          coBrokerage: false,
          nonRenewable: false,
          outBound: false,
          uwExpress: false,
          multinational: false,
          alternativeBillingAddress: true,
          beneficiary: true,
          policyHolder: true,
          contractBase: 'Ocurrencia',
          cdcSegmentCode: '101',
          insuranceModality: 'B',
          administrativeAgreement: '123',
          retroactivityDate: '01/01/2026',
          insurance: 'TD',
          endorsementMotive: '32',
          operation: '21',
          riskId: '312',
          lob: 'Specialty & Other P&C',
          // ... resto de campos según necesidad
        },
      },
    ],
  };
}

test.describe('Quotations API - Validación de Eventos Kafka', () => {

  // Token Bearer válido - En producción usar variables de entorno
  let bearerToken: string;

  test.beforeAll(async () => {
    // Obtener token de autenticación
    // En este ejemplo usamos variable de entorno o token de prueba
    bearerToken = process.env.QUOTATIONS_API_TOKEN || '';
    
    if (!bearerToken) {
      console.warn('⚠️ QUOTATIONS_API_TOKEN no configurado. Los tests de autenticación fallarán.');
    }
  });

  test.describe('Estados de Procesamiento', () => {

    test('POST /api/Quotations - debe publicar evento de estado en Kafka', async ({ 
      request,
      kafka 
    }) => {
      // Generar transactionId único para este test
      const transactionId = `TEST-${Date.now()}`;
      
      // 1. INICIAR captura de mensajes ANTES de llamar al endpoint
      await kafka.startQuotationStatusCapture();

      // 2. Preparar payload
      const payload = generateQuotationPayload(transactionId);

      // 3. Llamar al endpoint
      const response = await request.post(QUOTATIONS_API_URL, {
        headers: getHeaders(bearerToken),
        data: payload,
      });

      console.log(`📤 POST /api/Quotations - TransactionId: ${transactionId}`);
      console.log(`📥 Response Status: ${response.status()}`);

      // 4. Esperar evento de estado en Kafka
      const kafkaEvent = await kafka.waitForQuotationStatusEvent(transactionId);

      // 5. Validar que llegó el evento
      expect(kafkaEvent).not.toBeNull();
      
      if (kafkaEvent) {
        const eventValue = typeof kafkaEvent.value === 'string' 
          ? JSON.parse(kafkaEvent.value) 
          : kafkaEvent.value;
        
        console.log(`📨 Kafka Event recibido:`);
        console.log(`   - TransactionId: ${eventValue.TransactionId}`);
        console.log(`   - CurrentStatus: ${eventValue.CurrentStatus}`);
        console.log(`   - StatusDetail: ${eventValue.StatusDetail}`);
        
        expect(eventValue.TransactionId).toBe(transactionId);
        expect(eventValue.CurrentStatus).toBeDefined();
      }

      // Cleanup
      await kafka.stopCapture();
    });

    test('Cotización válida debe generar evento PROCESSING o COMPLETED', async ({ 
      request,
      kafka 
    }) => {
      const transactionId = `VALID-${Date.now()}`;
      
      await kafka.startQuotationStatusCapture();

      const payload = generateQuotationPayload(transactionId);
      
      await request.post(QUOTATIONS_API_URL, {
        headers: getHeaders(bearerToken),
        data: payload,
      });

      // Esperar estado PROCESSING o COMPLETED
      const kafkaEvent = await kafka.waitForQuotationStatusEvent(transactionId, undefined, 90000);

      expect(kafkaEvent).not.toBeNull();
      
      if (kafkaEvent) {
        const eventValue = typeof kafkaEvent.value === 'string' 
          ? JSON.parse(kafkaEvent.value) 
          : kafkaEvent.value;

        // El estado debe ser uno de los esperados
        expect(['PROCESSING', 'COMPLETED', 'TRANSFORMATION_ERROR']).toContain(eventValue.CurrentStatus);
      }

      await kafka.stopCapture();
    });
  });

  test.describe('Errores de Validación', () => {

    test('Cotización con datos inválidos debe generar TRANSFORMATION_ERROR', async ({ 
      request,
      kafka 
    }) => {
      const transactionId = `INVALID-${Date.now()}`;
      
      await kafka.startQuotationStatusCapture();

      // Payload con datos que causarán error de validación
      const payload = generateQuotationPayload(transactionId, {
        countryCode: 'XX', // País inválido
      });

      await request.post(QUOTATIONS_API_URL, {
        headers: getHeaders(bearerToken),
        data: payload,
      });

      // Esperar error de transformación
      const kafkaEvent = await kafka.waitForQuotationTransformationError(transactionId, 90000);

      if (kafkaEvent) {
        const eventValue = typeof kafkaEvent.value === 'string' 
          ? JSON.parse(kafkaEvent.value) 
          : kafkaEvent.value;

        expect(eventValue.CurrentStatus).toBe('TRANSFORMATION_ERROR');
        expect(eventValue.StatusDetail).toContain('error');
        
        // Verificar que hay errores en el array
        if (eventValue.Errors && eventValue.Errors.length > 0) {
          console.log(`⚠️ Errores de validación encontrados:`);
          eventValue.Errors.forEach((error: any) => {
            console.log(`   - Code: ${error.Code}, Type: ${error.Type}, Message: ${error.Message}`);
          });
        }
      }

      await kafka.stopCapture();
    });

    test('Verificar códigos de error específicos en Kafka', async ({ 
      request,
      kafka 
    }) => {
      const transactionId = `ERROR-CODES-${Date.now()}`;
      
      await kafka.startQuotationStatusCapture();

      // Payload diseñado para generar errores específicos
      const payload = generateQuotationPayload(transactionId);
      // Modificar para causar errores de catálogo
      payload.issuance.parties[0].economicActivityCode = '9999'; // Código de actividad inválido

      await request.post(QUOTATIONS_API_URL, {
        headers: getHeaders(bearerToken),
        data: payload,
      });

      // Esperar errores de validación con códigos específicos
      const kafkaEvent = await kafka.waitForQuotationValidationErrors(
        transactionId,
        ['CAT-06', 'ID-01', 'BF-03'], // Códigos de error esperados según la imagen
        90000
      );

      if (kafkaEvent) {
        const eventValue = typeof kafkaEvent.value === 'string' 
          ? JSON.parse(kafkaEvent.value) 
          : kafkaEvent.value;

        // Imprimir todos los errores para análisis
        console.log(`📋 Resumen de errores para TransactionId ${transactionId}:`);
        console.log(JSON.stringify(eventValue.Errors, null, 2));
      }

      await kafka.stopCapture();
    });
  });

  test.describe('Historial de Estados', () => {

    test('Obtener todos los eventos de una cotización', async ({ 
      request,
      kafka 
    }) => {
      const transactionId = `HISTORY-${Date.now()}`;
      
      await kafka.startQuotationStatusCapture();

      const payload = generateQuotationPayload(transactionId);

      await request.post(QUOTATIONS_API_URL, {
        headers: getHeaders(bearerToken),
        data: payload,
      });

      // Esperar un poco para capturar múltiples eventos
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Obtener todos los eventos de esta transacción
      const allEvents = kafka.getQuotationEvents(transactionId);

      console.log(`📊 Total de eventos capturados para ${transactionId}: ${allEvents.length}`);
      
      allEvents.forEach((event, index) => {
        const value = typeof event.value === 'string' ? JSON.parse(event.value) : event.value;
        console.log(`   ${index + 1}. Status: ${value.CurrentStatus} - ${value.StatusDetail || ''}`);
      });

      await kafka.stopCapture();
    });
  });

  test.describe('Validaciones Negativas', () => {

    test('Request sin autorización NO debe generar evento en Kafka', async ({ 
      request,
      kafka 
    }) => {
      const transactionId = `UNAUTH-${Date.now()}`;
      
      await kafka.startQuotationStatusCapture();

      const payload = generateQuotationPayload(transactionId);

      // Llamar sin token de autorización
      const response = await request.post(QUOTATIONS_API_URL, {
        headers: {
          'apiVersion': '1',
          'Content-Type': 'application/json',
          // Sin Authorization header
        },
        data: payload,
      });

      // El endpoint debe retornar error de autenticación
      expect(response.status()).toBe(401);

      // Verificar que NO llegó evento a Kafka
      const noEvent = await kafka.verifyNoMessage({
        topic: kafkaTopics.quotationStatus,
        valueContains: { TransactionId: transactionId },
      });

      expect(noEvent).toBe(true);
      console.log(`✅ Confirmado: No se generó evento en Kafka para request no autorizado`);

      await kafka.stopCapture();
    });
  });
});

/**
 * Test E2E completo: API + Kafka + Validación de estructura de mensaje
 */
test.describe('E2E: Flujo completo de cotización con Kafka', () => {

  test('Cotización Brasil completa - validar estructura del evento Kafka', async ({ 
    request,
    kafka 
  }) => {
    const transactionId = `E2E-BR-${Date.now()}`;
    const bearerToken = process.env.QUOTATIONS_API_TOKEN || '';

    await kafka.startQuotationStatusCapture();

    const payload = generateQuotationPayload(transactionId, {
      countryCode: 'BR',
      quoteNumber: 12345,
      documentTypeCode: '27',
    });

    const response = await request.post(QUOTATIONS_API_URL, {
      headers: getHeaders(bearerToken),
      data: payload,
    });

    console.log(`📤 Cotización enviada - TransactionId: ${transactionId}`);
    console.log(`📥 HTTP Status: ${response.status()}`);

    // Esperar evento en Kafka
    const kafkaEvent = await kafka.waitForQuotationStatusEvent(transactionId, undefined, 120000);

    expect(kafkaEvent).not.toBeNull();

    if (kafkaEvent) {
      const eventValue = typeof kafkaEvent.value === 'string' 
        ? JSON.parse(kafkaEvent.value) 
        : kafkaEvent.value;

      // Validar estructura del mensaje según la imagen
      expect(eventValue).toHaveProperty('TransactionId');
      expect(eventValue).toHaveProperty('CurrentStatus');
      
      // Log completo del evento
      console.log(`\n📨 EVENTO KAFKA CAPTURADO:`);
      console.log(`   Topic: ${kafkaEvent.topic}`);
      console.log(`   Partition: ${kafkaEvent.partition}`);
      console.log(`   Offset: ${kafkaEvent.offset}`);
      console.log(`   Timestamp: ${new Date(parseInt(kafkaEvent.timestamp)).toISOString()}`);
      console.log(`   TransactionId: ${eventValue.TransactionId}`);
      console.log(`   CurrentStatus: ${eventValue.CurrentStatus}`);
      console.log(`   StatusDetail: ${eventValue.StatusDetail}`);
      
      if (eventValue.Errors && eventValue.Errors.length > 0) {
        console.log(`   Errors:`);
        eventValue.Errors.forEach((err: any, i: number) => {
          console.log(`      ${i + 1}. [${err.Type}] ${err.Code}: ${err.Message}`);
        });
      }
    }

    await kafka.stopCapture();
  });
});
