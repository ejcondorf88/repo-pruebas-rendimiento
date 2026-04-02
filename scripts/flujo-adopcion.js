/**
 * PetTech - Prueba de Rendimiento: Flujo de Adopción
 * Escenario: Familia adoptante completa el proceso de solicitud de adopción
 * 
 * Flujo:
 * 1. Login de familia adoptante (POST /auth/login)
 * 2. Listar mascotas disponibles (GET /mascotas?estado=disponible)
 * 3. Ver detalle de mascota (GET /mascotas/:id)
 * 4. Enviar solicitud de adopción (POST /adopciones)
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// ============================================
// CONFIGURACIÓN
// ============================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const FAMILIA_EMAIL = __ENV.FAMILIA_EMAIL || 'familia@test.com';
const FAMILIA_PASSWORD = __ENV.FAMILIA_PASSWORD || 'password123';

// Métricas personalizadas
const loginDuration = new Trend('login_duration');
const listMascotasDuration = new Trend('list_mascotas_duration');
const detailMascotaDuration = new Trend('detail_mascota_duration');
const adopcionDuration = new Trend('adopcion_duration');

const errorRate = new Rate('errors');

// Opciones de carga
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Rampa de subida: 30s a 10 usuarios
    { duration: '1m', target: 10 },    // Carga sostenida: 1 minuto a 10 usuarios
    { duration: '30s', target: 0 },    // Rampa de bajada: 30s a 0 usuarios
  ],
  thresholds: {
    // 95% de requests bajo 2000ms
    http_req_duration: ['p(95)<2000'],
    // Menos del 5% de errores
    http_req_failed: ['rate<0.05'],
    // Métricas personalizadas
    login_duration: ['p(95)<2000'],
    list_mascotas_duration: ['p(95)<2000'],
    detail_mascota_duration: ['p(95)<2000'],
    adopcion_duration: ['p(95)<2000'],
  },
};

// Headers comunes
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// ============================================
// FLUJO PRINCIPAL
// ============================================

export default function () {
  let authToken = null;
  let mascotaId = null;

  // Paso 1: Login de familia adoptante
  group('01 - Login Familia', () => {
    const loginPayload = {
      email: FAMILIA_EMAIL,
      password: FAMILIA_PASSWORD,
    };

    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify(loginPayload),
      { headers }
    );

    // Check de éxito
    const loginSuccess = check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'login response has token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.token !== undefined || body.access_token !== undefined;
        } catch (e) {
          return false;
        }
      },
      'login duration < 2000ms': (r) => r.timings.duration < 2000,
    });

    // Registrar métricas
    loginDuration.add(loginRes.timings.duration);
    if (!loginSuccess) {
      errorRate.add(1);
      console.error(`Login failed: ${loginRes.status} - ${loginRes.body}`);
      return;
    } else {
      errorRate.add(0);
    }

    // Extraer token
    try {
      const body = JSON.parse(loginRes.body);
      authToken = body.token || body.access_token;
    } catch (e) {
      console.error('Error parsing login response');
      return;
    }

    sleep(1);
  });

  if (!authToken) {
    console.error('No auth token, aborting test');
    return;
  }

  // Headers con autenticación
  const authHeaders = {
    ...headers,
    'Authorization': `Bearer ${authToken}`,
  };

  // Paso 2: Listar mascotas disponibles
  group('02 - Listar Mascotas Disponibles', () => {
    const listRes = http.get(
      `${BASE_URL}/mascotas?estado=disponible`,
      { headers: authHeaders }
    );

    const listSuccess = check(listRes, {
      'list mascotas status is 200': (r) => r.status === 200,
      'list mascotas returns array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body) || Array.isArray(body.results) || Array.isArray(body.data);
        } catch (e) {
          return false;
        }
      },
      'list mascotas duration < 2000ms': (r) => r.timings.duration < 2000,
    });

    listMascotasDuration.add(listRes.timings.duration);
    if (!listSuccess) {
      errorRate.add(1);
      console.error(`List mascotas failed: ${listRes.status}`);
      return;
    } else {
      errorRate.add(0);
    }

    // Extraer ID de primera mascota para el siguiente paso
    try {
      const body = JSON.parse(listRes.body);
      const mascotas = body.results || body.data || body;
      if (Array.isArray(mascotas) && mascotas.length > 0) {
        mascotaId = mascotas[0].id;
      }
    } catch (e) {
      console.error('Error parsing mascotas list');
    }

    sleep(2);
  });

  if (!mascotaId) {
    console.error('No mascota ID found, aborting test');
    return;
  }

  // Paso 3: Ver detalle de mascota
  group('03 - Ver Detalle Mascota', () => {
    const detailRes = http.get(
      `${BASE_URL}/mascotas/${mascotaId}`,
      { headers: authHeaders }
    );

    const detailSuccess = check(detailRes, {
      'detail mascota status is 200': (r) => r.status === 200,
      'detail mascota has id': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.id === mascotaId || body.id === parseInt(mascotaId);
        } catch (e) {
          return false;
        }
      },
      'detail mascota duration < 2000ms': (r) => r.timings.duration < 2000,
    });

    detailMascotaDuration.add(detailRes.timings.duration);
    if (!detailSuccess) {
      errorRate.add(1);
      console.error(`Detail mascota failed: ${detailRes.status}`);
      return;
    } else {
      errorRate.add(0);
    }

    sleep(2);
  });

  // Paso 4: Enviar solicitud de adopción
  group('04 - Enviar Solicitud Adopción', () => {
    const adopcionPayload = {
      mascota_id: mascotaId,
      mensaje: 'Estamos muy interesados en adoptar a esta mascota. Tenemos experiencia previa y un hogar adecuado.',
    };

    const adopcionRes = http.post(
      `${BASE_URL}/adopciones`,
      JSON.stringify(adopcionPayload),
      { headers: authHeaders }
    );

    const adopcionSuccess = check(adopcionRes, {
      'adopcion status is 201': (r) => r.status === 201,
      'adopcion status is 200': (r) => r.status === 200, // Algunas APIs devuelven 200
      'adopcion duration < 2000ms': (r) => r.timings.duration < 2000,
    });

    adopcionDuration.add(adopcionRes.timings.duration);
    if (!adopcionSuccess) {
      errorRate.add(1);
      console.error(`Adopcion failed: ${adopcionRes.status} - ${adopcionRes.body}`);
    } else {
      errorRate.add(0);
      console.log(`Solicitud de adopción enviada exitosamente para mascota ${mascotaId}`);
    }

    sleep(3);
  });
}
