// Flujo de Administrador - Django REST API
// Admin: login → listar → crear mascota → actualizar → ver solicitudes → aprobar → ver adopciones → calendario

import { sleep, group, check } from 'k6';
import { Trend } from 'k6/metrics';
import * as http from '../lib/http-client.js';
import * as utils from '../lib/utils.js';
import { ADMIN_CREDENTIALS, MASCOTA_TEST_DATA } from '../data/test-data.js';
import { ENDPOINTS } from '../config/default.js';

// Métricas personalizadas
const loginDuration = new Trend('flujo_admin_login_duration');
const listMascotasDuration = new Trend('flujo_admin_list_mascotas_duration');
const createMascotaDuration = new Trend('flujo_admin_create_mascota_duration');
const updateMascotaDuration = new Trend('flujo_admin_update_mascota_duration');
const listSolicitudesDuration = new Trend('flujo_admin_list_solicitudes_duration');
const aprobarDuration = new Trend('flujo_admin_aprobar_duration');
const listAdopcionesDuration = new Trend('flujo_admin_list_adopciones_duration');
const calendarioDuration = new Trend('flujo_admin_calendario_duration');

export function ejecutarFlujo() {
  let mascotaId = null;
  let solicitudId = null;
  let adopcionId = null;
  let success = true;

  // Paso 1: Login como admin
  group('01 - Login Admin', () => {
    http.clearAuthTokens();

    const response = http.login(
      ADMIN_CREDENTIALS.email,
      ADMIN_CREDENTIALS.password
    );

    loginDuration.add(response.timings.duration);

    const loginOk = utils.checkResponse(response, 'Login Admin', 200, 500);
    const hasToken = check(response, 'Admin has token', () => {
      return http.isAuthenticated();
    });

    if (!loginOk || !hasToken) {
      utils.logError('Login Admin', response);
      success = false;
      return;
    }

    sleep(1);
  });

  if (!success) return false;

  // Paso 2: Listar todas las mascotas
  group('02 - Listar Todas las Mascotas', () => {
    const response = http.get(ENDPOINTS.mascotas.list);

    listMascotasDuration.add(response.timings.duration);

    const listOk = utils.checkResponse(response, 'List all mascotas', 200, 500);
    if (!listOk) {
      utils.logError('List mascotas', response);
    }

    sleep(1);
  });

  // Paso 3: Crear nueva mascota
  group('03 - Crear Mascota', () => {
    const uniqueMascota = {
      ...MASCOTA_TEST_DATA,
      nombre: `${MASCOTA_TEST_DATA.nombre}_${Date.now()}`,
    };

    const response = http.post(ENDPOINTS.mascotas.list, uniqueMascota);

    createMascotaDuration.add(response.timings.duration);

    const createOk = utils.checkResponse(response, 'Create mascota', 201, 500);

    if (createOk) {
      const body = utils.parseJson(response);
      if (body && body.id) {
        mascotaId = body.id;
        console.log(`✓ Mascota creada: ID ${mascotaId}`);
      }
    } else {
      utils.logError('Create mascota', response);
    }

    sleep(2);
  });

  // Paso 4: Actualizar mascota
  if (mascotaId) {
    group('04 - Actualizar Mascota', () => {
      const updateData = {
        descripcion: 'Actualizada por admin en prueba',
        estado: 'DISPONIBLE',
      };

      const response = http.patch(ENDPOINTS.mascotas.detail(mascotaId), updateData);

      updateMascotaDuration.add(response.timings.duration);

      const updateOk = utils.checkResponse(response, 'Update mascota', 200, 500);
      if (!updateOk) {
        utils.logError('Update mascota', response);
      }

      sleep(1);
    });
  }

  // Paso 5: Ver solicitudes pendientes
  group('05 - Listar Solicitudes', () => {
    const response = http.get(ENDPOINTS.solicitudes.list);

    listSolicitudesDuration.add(response.timings.duration);

    const listOk = utils.checkResponse(response, 'List solicitudes', 200, 500);

    if (listOk) {
      const body = utils.parseJson(response);
      if (Array.isArray(body) && body.length > 0) {
        const pendiente = body.find(s => s.estado === 'PENDIENTE');
        if (pendiente) {
          solicitudId = pendiente.id;
          console.log(`✓ Solicitud pendiente encontrada: ID ${solicitudId}`);
        }
      }
    } else {
      utils.logError('List solicitudes', response);
    }

    sleep(2);
  });

  // Paso 6: Aprobar solicitud
  if (solicitudId) {
    group('06 - Aprobar Solicitud', () => {
      const response = http.post(ENDPOINTS.solicitudes.aprobar(solicitudId), {});

      aprobarDuration.add(response.timings.duration);

      const aprobarOk = check(response, 'Aprobar solicitud', (r) => {
        return r.status === 200 || r.status === 201;
      });

      if (aprobarOk) {
        const body = utils.parseJson(response);
        if (body && body.id) {
          adopcionId = body.id;
          console.log(`✓ Solicitud aprobada, adopción: ID ${adopcionId}`);
        }
      } else {
        utils.logError('Aprobar solicitud', response);
      }

      sleep(2);
    });
  }

  // Paso 7: Ver adopciones
  group('07 - Listar Adopciones', () => {
    const response = http.get(ENDPOINTS.adopciones.list);

    listAdopcionesDuration.add(response.timings.duration);

    const listOk = utils.checkResponse(response, 'List adopciones', 200, 500);
    if (!listOk) {
      utils.logError('List adopciones', response);
    }

    sleep(1);
  });

  // Paso 8: Ver calendario de vacunación
  if (adopcionId) {
    group('08 - Ver Calendario Vacunación', () => {
      const response = http.get(ENDPOINTS.adopciones.calendario(adopcionId));

      calendarioDuration.add(response.timings.duration);

      const calendarioOk = utils.checkResponse(response, 'Get calendario', 200, 500);
      if (!calendarioOk) {
        utils.logError('Get calendario', response);
      }

      sleep(2);
    });
  }

  return success;
}
