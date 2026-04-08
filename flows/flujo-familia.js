// Flujo de Familia Adoptante - Django REST API
// Flujo completo: login → listar → detalle → crear familia → condiciones → solicitud

import { sleep, group, check } from 'k6';
import { Trend } from 'k6/metrics';
import * as http from '../lib/http-client.js';
import * as utils from '../lib/utils.js';
import { FAMILIA_CREDENTIALS, FAMILIA_TEST_DATA } from '../data/test-data.js';
import { ENDPOINTS } from '../config/default.js';

// Métricas personalizadas
const loginDuration = new Trend('flujo_familia_login_duration');
const listDuration = new Trend('flujo_familia_list_duration');
const detailDuration = new Trend('flujo_familia_detail_duration');
const familiaDuration = new Trend('flujo_familia_crear_duration');
const condicionesDuration = new Trend('flujo_familia_condiciones_duration');
const solicitudDuration = new Trend('flujo_familia_solicitud_duration');

export function ejecutarFlujo() {
  let mascotaId = null;
  let success = true;

  // Paso 1: Login
  group('01 - Login Familia', () => {
    http.clearAuthTokens();

    const response = http.login(
      FAMILIA_CREDENTIALS.email,
      FAMILIA_CREDENTIALS.password
    );

    loginDuration.add(response.timings.duration);

    const loginOk = utils.checkResponse(response, 'Login', 200, 500);
    const hasToken = check(response, 'Login has access token', () => {
      return http.isAuthenticated();
    });

    if (!loginOk || !hasToken) {
      utils.logError('Login', response);
      success = false;
      return;
    }

    sleep(1);
  });

  if (!success) return false;

  // Paso 2: Listar mascotas disponibles
  group('02 - Listar Mascotas Disponibles', () => {
    const response = http.get(`${ENDPOINTS.mascotas.list}?estado=DISPONIBLE`);

    listDuration.add(response.timings.duration);

    const listOk = utils.checkResponse(response, 'List mascotas', 200, 500);
    const isArray = check(response, 'List returns array', (r) => {
      const body = utils.parseJson(r);
      return body && Array.isArray(body);
    });

    if (!listOk || !isArray) {
      utils.logError('List mascotas', response);
      success = false;
      return;
    }

    mascotaId = utils.getFirstId(response);

    sleep(2);
  });

  if (!success || !mascotaId) {
    console.error('No se encontró mascota disponible');
    return false;
  }

  // Paso 3: Ver detalle de mascota
  group('03 - Detalle Mascota', () => {
    const response = http.get(ENDPOINTS.mascotas.detail(mascotaId));

    detailDuration.add(response.timings.duration);

    const detailOk = utils.checkResponse(response, 'Detail mascota', 200, 500);
    const hasId = check(response, 'Detail has correct ID', (r) => {
      const body = utils.parseJson(r);
      return body && body.id === parseInt(mascotaId);
    });

    if (!detailOk || !hasId) {
      utils.logError('Detail mascota', response);
      success = false;
      return;
    }

    sleep(2);
  });

  if (!success) return false;

  // Paso 4: Crear/Chequear familia
  group('04 - Crear Familia', () => {
    const response = http.post(ENDPOINTS.familias.miFamilia, FAMILIA_TEST_DATA);

    familiaDuration.add(response.timings.duration);

    // Puede ser 201 (creado) o 400 (ya existe)
    const familiaOk = check(response, 'Familia created or exists', (r) => {
      return r.status === 201 || r.status === 200 || r.status === 400;
    });

    if (!familiaOk) {
      utils.logError('Crear familia', response);
    }

    sleep(1);
  });

  // Paso 5: Crear condiciones de hogar
  group('05 - Crear Condiciones Hogar', () => {
    const condicionesData = {
      tipo_vivienda: 'CASA',
      propiedad_vivienda: 'PROPIA',
      tiene_patio: true,
      numero_personas: 4,
      tiene_ninos: true,
      tamano_hogar: 'MEDIANO',
      tiene_mascotas_actualmente: false,
      otras_mascotas: [],
      tiempo_solo_horas: 4,
      ingresos_estimados: '2_4SMLV',
      experiencia_mascotas: 'Hemos tenido perros antes',
      motivacion: 'Queremos darle un hogar a un animal necesitado',
      acuerdo_responsabilidad: true,
    };

    const response = http.post(ENDPOINTS.familias.condiciones, condicionesData);

    condicionesDuration.add(response.timings.duration);

    const condicionesOk = check(response, 'Condiciones created', (r) => {
      return r.status === 201 || r.status === 200 || r.status === 400;
    });

    if (!condicionesOk) {
      utils.logError('Crear condiciones', response);
    }

    sleep(1);
  });

  // Paso 6: Enviar solicitud de adopción
  group('06 - Solicitud Adopcion', () => {
    const payload = {
      mascota: parseInt(mascotaId),
      mensaje: 'Estamos muy interesados en adoptar. Tenemos experiencia previa.',
    };

    const response = http.post(ENDPOINTS.solicitudes.list, payload);

    solicitudDuration.add(response.timings.duration);

    const solicitudOk = check(response, 'Solicitud creada', (r) => {
      return r.status === 201 || r.status === 200;
    });

    const durationOk = utils.checkDuration(response, 'Solicitud', 500);

    if (!solicitudOk || !durationOk) {
      utils.logError('Solicitud', response);
      success = false;
      return;
    }

    console.log(`✓ Solicitud enviada para mascota ${mascotaId}`);
    sleep(3);
  });

  return success;
}
