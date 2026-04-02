// Configuración simple para PetTech K6
// Todas las URLs y opciones en un solo lugar

// URLs
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Timeouts
export const TIMEOUT = '30s';

// Thresholds para k6
export const THRESHOLDS = {
  // 95% de requests bajo 2000ms
  http_req_duration: ['p(95)<2000'],
  // Menos del 5% de errores
  http_req_failed: ['rate<0.05'],
};

// Opciones de carga por defecto
export const DEFAULT_STAGES = [
  { duration: '30s', target: 10 },  // Rampa subida
  { duration: '1m', target: 10 },   // Carga sostenida
  { duration: '30s', target: 0 },   // Rampa bajada
];

// Headers comunes
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
