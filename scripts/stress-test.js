// PetTech K6 - Stress Test
// Test de estrés: hasta 200 usuarios para encontrar el límite del sistema
// Objetivo: Determinar punto de ruptura y degradación

import { Trend } from 'k6/metrics';
import { STRESS_STAGES, THRESHOLDS } from '../config/default.js';
import { ejecutarFlujo as ejecutarFlujoFamilia } from '../flows/flujo-familia.js';
import { ejecutarFlujo as ejecutarFlujoAdmin } from '../flows/flujo-admin.js';

export const options = {
  stages: STRESS_STAGES,
  thresholds: {
    ...THRESHOLDS,
    // Relajamos thresholds para stress test
    http_req_duration: ['p(95)<2000'], // 2s en stress es aceptable
    http_req_failed: ['rate<0.10'],   // Hasta 10% errores
  },
};

// Métricas
const flujoFamiliaSuccess = new Trend('stress_flujo_familia_success');
const flujoAdminSuccess = new Trend('stress_flujo_admin_success');
const concurrentUsers = new Trend('stress_concurrent_users');

export function setup() {
  console.log('🔥 STRESS TEST: Buscando punto de ruptura del sistema');
  console.log('Rampa: 50 → 100 → 150 → 200 usuarios');
  console.log('Duración total: ~19 minutos');
  return { startTime: Date.now() };
}

export default function (data) {
  concurrentUsers.add(__VU);

  // Distribución: 70% familias, 30% admin
  const random = Math.random();

  if (random < 0.7) {
    const success = ejecutarFlujoFamilia();
    flujoFamiliaSuccess.add(success ? 1 : 0);
  } else {
    const success = ejecutarFlujoAdmin();
    flujoAdminSuccess.add(success ? 1 : 0);
  }
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000 / 60;
  console.log(`\n✅ Stress test completado en ${duration.toFixed(1)} minutos`);
  console.log('Revisar métricas para identificar punto de degradación');
}
