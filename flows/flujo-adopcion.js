// Flujo de Adopción Completo - Django REST API
// Flujo end-to-end: Familia + Admin trabajan juntos para completar adopción

import { sleep, group } from 'k6';
import { Trend } from 'k6/metrics';
import * as http from '../lib/http-client.js';
import * as utils from '../lib/utils.js';
import { FAMILIA_CREDENTIALS, ADMIN_CREDENTIALS, FAMILIA_TEST_DATA } from '../data/test-data.js';
import { ENDPOINTS } from '../config/default.js';

// Métricas personalizadas
const familiaLoginDuration = new Trend('adopcion_familia_login_duration');
const adminLoginDuration = new Trend('adopcion_admin_login_duration');
const adminCreateMascotaDuration = new Trend('adopcion_admin_create_mascota');
const familiaListDuration = new Trend('adopcion_familia_list');
const familiaCreateSolicitudDuration = new Trend('adopcion_familia_solicitud');
const adminAprobarDuration = new Trend('adopcion_admin_aprobar');
const calendarioDuration = new Trend('adopcion_calendario');

export function ejecutarFlujo() {
  let mascotaId = null;
  let solicitudId = null;
  let adopcionId = null;
  let success = true;

  // ========================================
  // FASE 1: Admin crea mascota disponible
  // ========================================

  group('FASE 1 - Admin Setup', () => {
    // Login Admin
    http.clearAuthTokens();
    let response = http.login(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);

    adminLoginDuration.add(response.timings.duration);

    const adminLoginOk = utils.checkResponse(response, 'Admin Login', 200, 500);
    if (!adminLoginOk || !http.isAuthenticated()) {
      utils.logError('Admin Login', response);
      success = false;
      return;
    }

    // Crear mascota disponible
    const uniqueMascota = {
      nombre: `MascotaTest_${Date.now()}`,
      especie: 'PERRO',
      raza: 'Golden Retriever',
      edad_anios: 3,
      edad_unidad: 'ANIOS',
      tamano: 'MEDIANO',
      peso: '25.50',
      sexo: 'HEMBRA',
      descripcion: 'Mascota de prueba para adopción',
      estado: 'DISPONIBLE',
      nivel_energia: 'ALTO',
      nivel_independencia: 'MEDIO',
      nivel_complejidad: 'BAJO',
      nivel_sociabilidad: 'ALTO',
      apta_ninos: true,
      costo_estimado_mensual: '1_2SMLV',
      historial_vacunas: ['Rabia'],
      historia_mascota: 'Rescatada para pruebas',
      info_adicional: 'Para testing',
    };

    response = http.post(ENDPOINTS.mascotas.list, uniqueMascota);

    adminCreateMascotaDuration.add(response.timings.duration);

    const createOk = utils.checkResponse(response, 'Admin Create Mascota', 201, 500);
    if (createOk) {
      const body = utils.parseJson(response);
      if (body && body.id) {
        mascotaId = body.id;
        console.log(`✓ [Admin] Mascota creada: ID ${mascotaId}`);
      }
    } else {
      utils.logError('Admin Create Mascota', response);
      success = false;
      return;
    }

    sleep(1);
  });

  if (!success || !mascotaId) return false;

  // ========================================
  // FASE 2: Familia completa proceso
  // ========================================

  group('FASE 2 - Familia Proceso', () => {
    // Login Familia
    http.clearAuthTokens();
    let response = http.login(FAMILIA_CREDENTIALS.email, FAMILIA_CREDENTIALS.password);

    familiaLoginDuration.add(response.timings.duration);

    const familiaLoginOk = utils.checkResponse(response, 'Familia Login', 200, 500);
    if (!familiaLoginOk || !http.isAuthenticated()) {
      utils.logError('Familia Login', response);
      success = false;
      return;
    }

    // Listar mascotas disponibles
    response = http.get(`${ENDPOINTS.mascotas.list}?estado=DISPONIBLE`);

    familiaListDuration.add(response.timings.duration);

    const listOk = utils.checkResponse(response, 'Familia List Mascotas', 200, 500);
    if (!listOk) {
      utils.logError('Familia List Mascotas', response);
    }

    // Crear familia si no existe
    response = http.post(ENDPOINTS.familias.miFamilia, FAMILIA_TEST_DATA);
    // 201 = creada, 400 = ya existe
    if (response.status === 201) {
      console.log('✓ [Familia] Perfil creado');
    }

    // Crear condiciones de hogar
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
      motivacion: 'Queremos darle un hogar',
      acuerdo_responsabilidad: true,
    };

    response = http.post(ENDPOINTS.familias.condiciones, condicionesData);
    if (response.status === 201) {
      console.log('✓ [Familia] Condiciones creadas');
    }

    // Crear solicitud de adopción
    const solicitudPayload = {
      mascota: parseInt(mascotaId),
      mensaje: 'Estamos muy interesados en adoptar esta mascota. Tenemos experiencia previa.',
    };

    response = http.post(ENDPOINTS.solicitudes.list, solicitudPayload);

    familiaCreateSolicitudDuration.add(response.timings.duration);

    const solicitudOk = utils.checkResponse(response, 'Familia Create Solicitud', 201, 500);
    if (solicitudOk) {
      const body = utils.parseJson(response);
      if (body && body.id) {
        solicitudId = body.id;
        console.log(`✓ [Familia] Solicitud creada: ID ${solicitudId}`);
      }
    } else {
      utils.logError('Familia Create Solicitud', response);
      success = false;
      return;
    }

    sleep(2);
  });

  if (!success || !solicitudId) return false;

  // ========================================
  // FASE 3: Admin aprueba solicitud
  // ========================================

  group('FASE 3 - Admin Aprobacion', () => {
    // Login Admin
    http.clearAuthTokens();
    let response = http.login(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);

    const adminLoginOk = utils.checkResponse(response, 'Admin Re-Login', 200, 500);
    if (!adminLoginOk || !http.isAuthenticated()) {
      utils.logError('Admin Re-Login', response);
      success = false;
      return;
    }

    // Aprobar solicitud
    response = http.post(ENDPOINTS.solicitudes.aprobar(solicitudId), {});

    adminAprobarDuration.add(response.timings.duration);

    const aprobarOk = check(response, 'Admin Aprobar', (r) => {
      return r.status === 200 || r.status === 201;
    });

    if (aprobarOk) {
      const body = utils.parseJson(response);
      if (body && body.id) {
        adopcionId = body.id;
        console.log(`✓ [Admin] Solicitud aprobada, adopción: ID ${adopcionId}`);
      }
    } else {
      utils.logError('Admin Aprobar', response);
      success = false;
      return;
    }

    sleep(2);
  });

  if (!success || !adopcionId) return false;

  // ========================================
  // FASE 4: Verificación del calendario
  // ========================================

  group('FASE 4 - Verificacion Calendario', () => {
    // Familia consulta calendario
    http.clearAuthTokens();
    let response = http.login(FAMILIA_CREDENTIALS.email, FAMILIA_CREDENTIALS.password);

    response = http.get(ENDPOINTS.adopciones.calendario(adopcionId));

    calendarioDuration.add(response.timings.duration);

    const calendarioOk = utils.checkResponse(response, 'Familia Calendario', 200, 500);
    if (calendarioOk) {
      console.log(`✓ [Familia] Calendario consultado para adopción ${adopcionId}`);
    } else {
      utils.logError('Familia Calendario', response);
    }

    sleep(1);

    // Admin también consulta calendario
    http.clearAuthTokens();
    response = http.login(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);

    response = http.get(ENDPOINTS.adopciones.calendario(adopcionId));

    const adminCalendarioOk = utils.checkResponse(response, 'Admin Calendario', 200, 500);
    if (adminCalendarioOk) {
      console.log(`✓ [Admin] Calendario consultado para adopción ${adopcionId}`);
    }

    sleep(2);
  });

  console.log(`\n✅ Flujo de adopción completo finalizado:`);
  console.log(`   - Mascota: ${mascotaId}`);
  console.log(`   - Solicitud: ${solicitudId}`);
  console.log(`   - Adopción: ${adopcionId}`);

  return success;
}
