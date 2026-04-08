// PetTech K6 - Spike Test
// Test de pico: subida súbita de 10 a 100 usuarios en 30 segundos
// Objetivo: Verificar recuperación tras pico de tráfico

import { Trend } from 'k6/metrics';
import { SPIKE_STAGES, THRESHOLDS } from '../config/default.js';
import { ejecutarFlujo as ejecutarFlujoFamilia } from '../flows/flujo-familia.js';

export const options = {
  stages: SPIKE_STAGES,
  thresholds: {
    ...THRESHOLDS,
    // Relajamos para spike test
    http_req_duration: ['p(95)<3000'], // 3s durante spike
    http_req_failed: ['rate<0.15'],   // Hasta 15% errores temporalmente
  },
};

// Métricas
const flujoSuccess = new Trend('spike_flujo_success');
const responseTimeSpike = new Trend('spike_response_time');
const currentVU = new Trend('spike_current_vu');

export function setup() {
  console.log('⚡ SPIKE TEST: Pico de tráfico súbito');
  console.log('Patrón: 10 usuarios → 100 usuarios (30s) → vuelta a 10');
  console.log('Duración total: ~4.5 minutos');
  console.log('Objetivo: Verificar recuperación del sistema\n');
  return { startTime: Date.now() };
}

export default function (data) {
  // Registramos VU actual
  currentVU.add(__VU);

  // Durante el spike, medimos tiempos de respuesta
  const startTime = Date.now();

  // Solo flujo de familia para simplificar
  const success = ejecutarFlujoFamilia();

  const endTime = Date.now();
  const duration = endTime - startTime;

  flujoSuccess.add(success ? 1 : 0);
  responseTimeSpike.add(duration);

  // Log durante spike (VUs > 50)
  if (__VU > 50 && Math.random() < 0.1) {
    console.log(`⚡ Spike active: VU ${__VU}, flujo ${success ? 'OK' : 'FAIL'}`);
  }
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\n✅ Spike test completado en ${duration.toFixed(0)} segundos`);
  console.log('Verificar que el sistema recuperó tiempos normales tras el spike');
}
