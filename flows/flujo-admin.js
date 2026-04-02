// Flujo de Administrador
// Ejemplo de cómo agregar nuevos flujos sin tocar el código existente

import { sleep, group } from 'k6';
import { Trend } from 'k6/metrics';
import * as http from '../lib/http-client.js';
import * as utils from '../lib/utils.js';
import { ADMIN_CREDENTIALS } from '../data/test-data.js';

// Métricas personalizadas
const loginDuration = new Trend('flujo_admin_login_duration');
const listUsuariosDuration = new Trend('flujo_admin_list_usuarios_duration');
const listMascotasDuration = new Trend('flujo_admin_list_mascotas_duration');

// Ejecuta el flujo de admin
export function ejecutarFlujo() {
  let success = true;

  // Paso 1: Login como admin
  group('01 - Login Admin', () => {
    http.clearAuthToken();
    
    const response = http.login(
      ADMIN_CREDENTIALS.email,
      ADMIN_CREDENTIALS.password
    );
    
    loginDuration.add(response.timings.duration);
    
    const loginOk = utils.checkResponse(response, 'Login Admin', 200);
    if (!loginOk || !http.isAuthenticated()) {
      utils.logError('Login Admin', response);
      success = false;
      return;
    }
    
    sleep(1);
  });

  if (!success) return false;

  // Paso 2: Listar todos los usuarios (solo admin puede)
  group('02 - Listar Usuarios', () => {
    const response = http.get('/api/v1/usuarios/');
    
    listUsuariosDuration.add(response.timings.duration);
    
    const listOk = utils.checkResponse(response, 'List usuarios', 200);
    if (!listOk) {
      utils.logError('List usuarios', response);
      success = false;
      return;
    }
    
    sleep(2);
  });

  if (!success) return false;

  // Paso 3: Listar todas las mascotas (incluyendo no disponibles)
  group('03 - Listar Todas Mascotas', () => {
    const response = http.get('/api/v1/mascotas/');
    
    listMascotasDuration.add(response.timings.duration);
    
    const listOk = utils.checkResponse(response, 'List all mascotas', 200);
    if (!listOk) {
      utils.logError('List mascotas admin', response);
      success = false;
    }
    
    sleep(2);
  });

  return success;
}
