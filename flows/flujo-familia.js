// Flujo de Familia Adoptante
// El flujo crítico: login → listar → ver detalle → solicitar adopción

import { sleep, group } from 'k6';
import { Trend } from 'k6/metrics';
import * as http from '../lib/http-client.js';
import * as utils from '../lib/utils.js';
import { FAMILIA_CREDENTIALS, getAdopcionPayload } from '../data/test-data.js';

// Métricas personalizadas para este flujo
const loginDuration = new Trend('flujo_familia_login_duration');
const listDuration = new Trend('flujo_familia_list_duration');
const detailDuration = new Trend('flujo_familia_detail_duration');
const adopcionDuration = new Trend('flujo_familia_adopcion_duration');

// Ejecuta el flujo completo de familia
// Retorna true si todo ok, false si falló
export function ejecutarFlujo() {
  let mascotaId = null;
  let success = true;

  // Paso 1: Login
  group('01 - Login Familia', () => {
    http.clearAuthToken(); // Limpia token anterior
    
    const response = http.login(
      FAMILIA_CREDENTIALS.email,
      FAMILIA_CREDENTIALS.password
    );
    
    loginDuration.add(response.timings.duration);
    
    const loginOk = utils.checkResponse(response, 'Login', 200);
    const hasToken = utils.check(response, 'Login has token', () => {
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
  group('02 - Listar Mascotas', () => {
    const response = http.get('/mascotas?estado=disponible');
    
    listDuration.add(response.timings.duration);
    
    const listOk = utils.checkResponse(response, 'List mascotas', 200);
    const isArray = utils.check(response, 'List returns array', (r) => {
      const body = utils.parseJson(r);
      return body && (Array.isArray(body) || Array.isArray(body.results) || Array.isArray(body.data));
    });
    
    if (!listOk || !isArray) {
      utils.logError('List mascotas', response);
      success = false;
      return;
    }
    
    // Extraer primer mascota para el siguiente paso
    mascotaId = utils.getFirstId(response, 'results');
    if (!mascotaId) {
      mascotaId = utils.getFirstId(response);
    }
    
    sleep(2);
  });

  if (!success || !mascotaId) {
    console.error('No se encontró mascota disponible');
    return false;
  }

  // Paso 3: Ver detalle de mascota
  group('03 - Detalle Mascota', () => {
    const response = http.get(`/mascotas/${mascotaId}`);
    
    detailDuration.add(response.timings.duration);
    
    const detailOk = utils.checkResponse(response, 'Detail mascota', 200);
    const hasId = utils.check(response, 'Detail has correct ID', (r) => {
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

  // Paso 4: Enviar solicitud de adopción
  group('04 - Solicitud Adopcion', () => {
    const payload = getAdopcionPayload(mascotaId);
    const response = http.post('/adopciones', payload);
    
    adopcionDuration.add(response.timings.duration);
    
    // Puede ser 200 o 201
    const adopcionOk = utils.check(response, 'Adopcion success', (r) => {
      return r.status === 200 || r.status === 201;
    });
    
    const durationOk = utils.checkDuration(response, 'Adopcion', 2000);
    
    if (!adopcionOk || !durationOk) {
      utils.logError('Adopcion', response);
      success = false;
      return;
    }
    
    console.log(`✓ Solicitud enviada para mascota ${mascotaId}`);
    sleep(3);
  });

  return success;
}
