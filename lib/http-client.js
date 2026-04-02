// HTTP Client simple para PetTech
// Wrapper básico sobre k6/http para no repetir código

import http from 'k6/http';
import { BASE_URL, DEFAULT_HEADERS } from '../config/default.js';

// Guarda el token actual entre requests
let currentToken = null;

// Setea el token para usar en requests autenticados
export function setAuthToken(token) {
  currentToken = token;
}

// Limpia el token
export function clearAuthToken() {
  currentToken = null;
}

// Construye headers con auth si existe
function getHeaders(customHeaders = {}) {
  const headers = { ...DEFAULT_HEADERS, ...customHeaders };
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }
  return headers;
}

// GET simple
export function get(endpoint, customHeaders = {}) {
  return http.get(`${BASE_URL}${endpoint}`, {
    headers: getHeaders(customHeaders),
  });
}

// POST con body
export function post(endpoint, body, customHeaders = {}) {
  return http.post(`${BASE_URL}${endpoint}`, JSON.stringify(body), {
    headers: getHeaders(customHeaders),
  });
}

// PATCH con body
export function patch(endpoint, body, customHeaders = {}) {
  return http.patch(`${BASE_URL}${endpoint}`, JSON.stringify(body), {
    headers: getHeaders(customHeaders),
  });
}

// DELETE
export function del(endpoint, customHeaders = {}) {
  return http.del(`${BASE_URL}${endpoint}`, null, {
    headers: getHeaders(customHeaders),
  });
}

// Login y guarda token automáticamente
export function login(email, password) {
  const response = post('/auth/login', { email, password });
  
  if (response.status === 200) {
    try {
      const body = JSON.parse(response.body);
      const token = body.token || body.access_token;
      if (token) {
        setAuthToken(token);
      }
    } catch (e) {
      console.error('Error parsing login response');
    }
  }
  
  return response;
}

// Verifica si hay token
export function isAuthenticated() {
  return currentToken !== null;
}
