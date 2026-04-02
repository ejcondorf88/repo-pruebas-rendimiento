// Utilidades simples para PetTech K6

import { check } from 'k6';

// Check básico de status 200
export function checkOk(response, name) {
  return check(response, {
    [`${name} status is 200`]: (r) => r.status === 200,
  });
}

// Check de status específico
export function checkStatus(response, name, expectedStatus) {
  return check(response, {
    [`${name} status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
  });
}

// Check de duración máxima
export function checkDuration(response, name, maxMs) {
  return check(response, {
    [`${name} duration < ${maxMs}ms`]: (r) => r.timings.duration < maxMs,
  });
}

// Check combinado: status + duración
export function checkResponse(response, name, expectedStatus = 200, maxMs = 2000) {
  const statusOk = checkStatus(response, name, expectedStatus);
  const durationOk = checkDuration(response, name, maxMs);
  return statusOk && durationOk;
}

// Extrae JSON de response con manejo de error
export function parseJson(response) {
  try {
    return JSON.parse(response.body);
  } catch (e) {
    console.error(`Error parsing JSON: ${response.body}`);
    return null;
  }
}

// Extrae primer ID de una lista
export function getFirstId(response, path = null) {
  const body = parseJson(response);
  if (!body) return null;
  
  let items = body;
  if (path) {
    items = body[path];
  }
  if (Array.isArray(items) && items.length > 0) {
    return items[0].id;
  }
  
  return null;
}

// Verifica si response tiene un campo
export function hasField(response, field) {
  const body = parseJson(response);
  if (!body) return false;
  return body.hasOwnProperty(field);
}

// Log de error simple
export function logError(step, response) {
  console.error(`[${step}] Failed: ${response.status} - ${response.body}`);
}
