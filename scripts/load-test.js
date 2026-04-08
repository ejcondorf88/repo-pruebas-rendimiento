// PetTech K6 - Load Test
// Test de carga normal: 10-30 usuarios, 3-4 minutos
// Objetivo: Verificar comportamiento bajo carga esperada

import { Trend } from 'k6/metrics';
import { DEFAULT_STAGES, THRESHOLDS } from '../config/default.js';
import { ejecutarFlujo as ejecutarFlujoFamilia } from '../flows/flujo-familia.js';
import { ejecutarFlujo as ejecutarFlujoAdmin } from '../flows/flujo-admin.js';

export const options = {
  stages: DEFAULT_STAGES,
  thresholds: THRESHOLDS,
};

// Métricas de éxito por flujo
const flujoFamiliaSuccess = new Trend('load_flujo_familia_success');
const flujoAdminSuccess = new Trend('load_flujo_admin_success');

export default function () {
  // Alternamos entre flujos según el ID del VU
  const vu = __VU;

  if (vu % 2 === 0) {
    // Usuarios pares: Familia
    const success = ejecutarFlujoFamilia();
    flujoFamiliaSuccess.add(success ? 1 : 0);
  } else {
    // Usuarios impares: Admin
    const success = ejecutarFlujoAdmin();
    flujoAdminSuccess.add(success ? 1 : 0);
  }
}
