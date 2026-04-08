// PetTech K6 - Soak Test
// Test de soak: 30 usuarios constantes durante 1 hora
// Objetivo: Detectar memory leaks, degradación gradual, estabilidad

import { Trend } from 'k6/metrics';
import { SOAK_STAGES, THRESHOLDS } from '../config/default.js';
import { ejecutarFlujo as ejecutarFlujoFamilia } from '../flows/flujo-familia.js';
import { ejecutarFlujo as ejecutarFlujoAdmin } from '../flows/flujo-admin.js';

export const options = {
  stages: SOAK_STAGES,
  thresholds: {
    ...THRESHOLDS,
    // Thresholds estrictos para soak
    http_req_duration: ['p(95)<800'], // 800ms máximo
    http_req_failed: ['rate<0.005'],  // < 0.5% errores
  },
};

// Métricas
const flujoFamiliaSuccess = new Trend('soak_flujo_familia_success');
const flujoAdminSuccess = new Trend('soak_flujo_admin_success');
const flujoAdopcionSuccess = new Trend('soak_flujo_adopcion_success');

// Métricas por intervalo de tiempo (para detectar degradación)
const iterationCount = new Trend('soak_iteration_count');

export function setup() {
  console.log('🕐 SOAK TEST: Prueba de larga duración (1 hora)');
  console.log('Configuración: 30 usuarios concurrentes constantes');
  console.log('Objetivos:');
  console.log('  - Detectar memory leaks');
  console.log('  - Verificar estabilidad del sistema');
  console.log('  - Confirmar no hay degradación gradual');
  console.log('  - Validar reconexiones de BD\n');

  return {
    startTime: Date.now(),
    iteration: 0,
  };
}

export default function (data) {
  data.iteration++;
  iterationCount.add(data.iteration);

  // Rotamos entre flujos: 50% familia, 30% admin, 20% adopción completa
  const random = Math.random();
  let success = false;

  if (random < 0.5) {
    // 50%: Flujo de familia
    success = ejecutarFlujoFamilia();
    flujoFamiliaSuccess.add(success ? 1 : 0);
  } else if (random < 0.8) {
    // 30%: Flujo de admin
    success = ejecutarFlujoAdmin();
    flujoAdminSuccess.add(success ? 1 : 0);
  }

  // Log cada 100 iteraciones
  if (data.iteration % 100 === 0) {
    const elapsed = (Date.now() - data.startTime) / 1000 / 60;
    console.log(`⏱  ${elapsed.toFixed(1)} minutos - Iteración ${data.iteration} - VU ${__VU}`);
  }
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000 / 60;
  console.log(`\n✅ Soak test completado`);
  console.log(`Duración total: ${duration.toFixed(1)} minutos`);
  console.log(`Iteraciones totales: ${data.iteration}`);
  console.log('\nVerificar:');
  console.log('  - No hay aumento gradual en tiempos de respuesta');
  console.log('  - Consumo de memoria estable');
  console.log('  - Sin errores acumulativos');
}
