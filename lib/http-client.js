// HTTP Client para PetTech - Django REST API
// Maneja tokens JWT (access + refresh)

import http from 'k6/http';
import { FULL_API_URL, DEFAULT_HEADERS, ENDPOINTS } from '../config/default.js';

// Tokens JWT
let accessToken = null;
let refreshToken = null;

// Setea el access token
export function setAccessToken(token) {
  accessToken = token;
}

// Setea el refresh token
export function setRefreshToken(token) {
  refreshToken = token;
}

// Limpia tokens
export function clearAuthTokens() {
  accessToken = null;
  refreshToken = null;
}

// Construye headers con auth
function getHeaders(customHeaders = {}) {
  const headers = { ...DEFAULT_HEADERS, ...customHeaders };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
}

// GET
export function get(endpoint, customHeaders = {}) {
  return http.get(`${FULL_API_URL}${endpoint}`, {
    headers: getHeaders(customHeaders),
  });
}

// POST
export function post(endpoint, body, customHeaders = {}) {
  return http.post(`${FULL_API_URL}${endpoint}`, JSON.stringify(body), {
    headers: getHeaders(customHeaders),
  });
}

// PATCH
export function patch(endpoint, body, customHeaders = {}) {
  return http.patch(`${FULL_API_URL}${endpoint}`, JSON.stringify(body), {
    headers: getHeaders(customHeaders),
  });
}

// DELETE
export function del(endpoint, customHeaders = {}) {
  return http.del(`${FULL_API_URL}${endpoint}`, null, {
    headers: getHeaders(customHeaders),
  });
}

// Login JWT - Django REST
export function login(email, password) {
  clearAuthTokens();
  const response = post(ENDPOINTS.auth.login, { email, password });

  if (response.status === 200) {
    try {
      const body = JSON.parse(response.body);
      if (body.access) {
        setAccessToken(body.access);
        setRefreshToken(body.refresh);
      }
    } catch (e) {
      console.error('Error parsing login response:', e);
    }
  }

  return response;
}

// Refresh token
export function refreshAccessToken() {
  if (!refreshToken) {
    return null;
  }

  const response = post(ENDPOINTS.auth.refresh, { refresh: refreshToken });

  if (response.status === 200) {
    try {
      const body = JSON.parse(response.body);
      if (body.access) {
        setAccessToken(body.access);
      }
    } catch (e) {
      console.error('Error refreshing token:', e);
    }
  }

  return response;
}

// Verifica autenticación
export function isAuthenticated() {
  return accessToken !== null;
}

// Obtiene info del token
export function getTokenInfo() {
  return { accessToken, refreshToken };
}
