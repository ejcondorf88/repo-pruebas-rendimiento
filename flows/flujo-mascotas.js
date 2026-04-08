// Flujo de Mascotas (CRUD) - Django REST API
// Admin: CRUD completo de mascotas

import { sleep, group } from 'k6';
import { Trend } from 'k6/metrics';
import * as http from '../lib/http-client.js';
import * as utils from '../lib/utils.js';
import { ADMIN_CREDENTIALS, MASCOTA_TEST_DATA } from '../data/test-data.js';
import { ENDPOINTS } from '../config/default.js';

// Métricas personalizadas
const loginDuration = new Trend('mascotas_login_duration');
const listDuration = new Trend('mascotas_list_duration');
const createDuration = new Trend('mascotas_create_duration');
const detailDuration = new Trend('mascotas_detail_duration');
const updateDuration = new Trend('mascotas_update_duration');
const deleteDuration = new Trend('mascotas_delete_duration');
const verifyDuration = new Trend('mascotas_verify_duration');

export function ejecutarFlujo() {
  let mascotaId = null;
  let success = true;

  // Paso 1: Login Admin
  group('01 - Login Admin', () => {
    http.clearAuthTokens();

    const response = http.login(
      ADMIN_CREDENTIALS.email,
      ADMIN_CREDENTIALS.password
    );

    loginDuration.add(response.timings.duration);

    const loginOk = utils.checkResponse(response, 'Login', 200, 500);
    const hasToken = check(response, 'Has access token', () => {
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

  // Paso 2: Listar todas las mascotas
  group('02 - Listar Mascotas', () => {
    const response = http.get(ENDPOINTS.mascotas.list);

    listDuration.add(response.timings.duration);

    const listOk = utils.checkResponse(response, 'List mascotas', 200, 500);
    const isArray = check(response, 'Returns array', (r) => {
      const body = utils.parseJson(r);
      return body && Array.isArray(body);
    });

    if (!listOk || !isArray) {
      utils.logError('List mascotas', response);
    } else {
      const body = utils.parseJson(response);
      if (Array.isArray(body)) {
        console.log(`✓ Encontradas ${body.length} mascotas`);
      }
    }

    sleep(1);
  });

  // Paso 3: Crear nueva mascota
  group('03 - Crear Mascota', () => {
    const uniqueMascota = {
      ...MASCOTA_TEST_DATA,
      nombre: `CRUD_${MASCOTA_TEST_DATA.nombre}_${Date.now()}`,
      descripcion: 'Creada en prueba de carga',
    };

    const response = http.post(ENDPOINTS.mascotas.list, uniqueMascota);

    createDuration.add(response.timings.duration);

    const createOk = utils.checkResponse(response, 'Create mascota', 201, 500);

    if (createOk) {
      const body = utils.parseJson(response);
      if (body && body.id) {
        mascotaId = body.id;
        console.log(`✓ Mascota creada: ID ${mascotaId} - ${body.nombre}`);
      }
    } else {
      utils.logError('Create mascota', response);
      success = false;
      return;
    }

    sleep(2);
  });

  if (!success || !mascotaId) return false;

  // Paso 4: Obtener detalle
  group('04 - Detalle Mascota', () => {
    const response = http.get(ENDPOINTS.mascotas.detail(mascotaId));

    detailDuration.add(response.timings.duration);

    const detailOk = utils.checkResponse(response, 'Get detail', 200, 500);
    const hasCorrectId = check(response, 'Has correct ID', (r) => {
      const body = utils.parseJson(r);
      return body && body.id === parseInt(mascotaId);
    });

    if (!detailOk || !hasCorrectId) {
      utils.logError('Get detail', response);
      success = false;
      return;
    }

    const body = utils.parseJson(response);
    if (body) {
      console.log(`✓ Detalle obtenido: ${body.nombre} (${body.estado})`);
    }

    sleep(1);
  });

  if (!success) return false;

  // Paso 5: Actualizar mascota
  group('05 - Actualizar Mascota', () => {
    const updateData = {
      descripcion: `Actualizada en prueba ${Date.now()}`,
      peso: '30.00',
      estado: 'NO_DISPONIBLE',
    };

    const response = http.patch(ENDPOINTS.mascotas.detail(mascotaId), updateData);

    updateDuration.add(response.timings.duration);

    const updateOk = utils.checkResponse(response, 'Update mascota', 200, 500);

    if (updateOk) {
      const body = utils.parseJson(response);
      if (body) {
        console.log(`✓ Mascota actualizada: ${body.descripcion}`);
      }
    } else {
      utils.logError('Update mascota', response);
    }

    sleep(2);
  });

  // Paso 6: Verificar cambios
  group('06 - Verificar Cambios', () => {
    const response = http.get(ENDPOINTS.mascotas.detail(mascotaId));

    verifyDuration.add(response.timings.duration);

    const verifyOk = utils.checkResponse(response, 'Verify changes', 200, 500);

    if (verifyOk) {
      const body = utils.parseJson(response);
      if (body) {
        console.log(`✓ Verificado: ${body.nombre} - Estado: ${body.estado} - Peso: ${body.peso}`);
      }
    }

    sleep(1);
  });

  // Paso 7: Eliminar mascota
  group('07 - Eliminar Mascota', () => {
    const response = http.del(ENDPOINTS.mascotas.detail(mascotaId));

    deleteDuration.add(response.timings.duration);

    // Django REST devuelve 204 en DELETE exitoso
    const deleteOk = check(response, 'Delete mascota', (r) => {
      return r.status === 204 || r.status === 200;
    });

    if (deleteOk) {
      console.log(`✓ Mascota ${mascotaId} eliminada`);
    } else {
      utils.logError('Delete mascota', response);
    }

    sleep(2);
  });

  // Paso 8: Verificar eliminación
  group('08 - Verificar Eliminacion', () => {
    const response = http.get(ENDPOINTS.mascotas.detail(mascotaId));

    // Debería devolver 404
    const notFoundOk = check(response, 'Verify not found', (r) => {
      return r.status === 404 || r.status === 204;
    });

    if (notFoundOk) {
      console.log(`✓ Confirmado: Mascota ${mascotaId} no existe (404)`);
    } else {
      console.warn(`⚠ Mascota ${mascotaId} aún accesible con status ${response.status}`);
    }

    sleep(1);
  });

  return success;
}
