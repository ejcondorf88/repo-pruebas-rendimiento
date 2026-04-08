// Configuración para PetTech K6 - Django REST API
// Base URL: http://localhost:8000/api/v1/

// URLs
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
export const API_VERSION = __ENV.API_VERSION || '/api/v1';
export const FULL_API_URL = `${BASE_URL}${API_VERSION}`;

// Timeouts
export const TIMEOUT = '30s';

// Thresholds estrictos para Django REST
export const THRESHOLDS = {
  // 95% de requests bajo 500ms (Django debe ser rápido)
  http_req_duration: ['p(95)<500'],
  // Menos del 1% de errores
  http_req_failed: ['rate<0.01'],
};

// Opciones de carga por defecto (Load Test)
export const DEFAULT_STAGES = [
  { duration: '30s', target: 10 },  // Warmup
  { duration: '1m', target: 30 },  // Ramp up
  { duration: '2m', target: 30 },   // Hold
  { duration: '30s', target: 0 },   // Ramp down
];

// Stages para Stress Test
export const STRESS_STAGES = [
  { duration: '2m', target: 50 },
  { duration: '5m', target: 100 },
  { duration: '5m', target: 150 },
  { duration: '5m', target: 200 },
  { duration: '2m', target: 0 },
];

// Stages para Spike Test
export const SPIKE_STAGES = [
  { duration: '30s', target: 10 },
  { duration: '30s', target: 100 },
  { duration: '2m', target: 100 },
  { duration: '30s', target: 10 },
  { duration: '1m', target: 10 },
  { duration: '30s', target: 0 },
];

// Stages para Soak Test
export const SOAK_STAGES = [
  { duration: '2m', target: 30 },
  { duration: '56m', target: 30 },
  { duration: '2m', target: 0 },
];

// Headers comunes
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Endpoints API v1
export const ENDPOINTS = {
  auth: {
    login: '/auth/login/',
    registro: '/auth/registro/',
    refresh: '/auth/token/refresh/',
    perfil: '/auth/perfil/',
  },
  mascotas: {
    list: '/mascotas/',
    detail: (id) => `/mascotas/${id}/`,
  },
  familias: {
    list: '/familias/',
    miFamilia: '/familias/mia/',
    condiciones: '/familias/mia/condiciones-hogar/',
  },
  solicitudes: {
    list: '/solicitudes/',
    detail: (id) => `/solicitudes/${id}/`,
    aprobar: (id) => `/solicitudes/${id}/aprobar/`,
    rechazar: (id) => `/solicitudes/${id}/rechazar/`,
  },
  adopciones: {
    list: '/adopciones/',
    calendario: (id) => `/adopciones/${id}/calendario/`,
  },
};
