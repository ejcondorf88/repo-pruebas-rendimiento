// PetTech K6 - Load Test
// Punto de entrada principal que ejecuta los flujos

import { Trend } from 'k6/metrics';
import { THRESHOLDS, DEFAULT_STAGES } from '../config/default.js';
import { ejecutarFlujo as ejecutarFlujoFamilia } from '../flows/flujo-familia.js';

// Configuración de k6
export const options = {
  stages: DEFAULT_STAGES,
  thresholds: THRESHOLDS,
};

// Métrica de éxito general del flujo
const flujoSuccess = new Trend('flujo_success_rate');

// Función principal
export default function () {
  // Ejecuta el flujo de familia adoptante
  const success = ejecutarFlujoFamilia();
  
  // Registra el éxito del flujo completo (1 = éxito, 0 = fallo)
  flujoSuccess.add(success ? 1 : 0);
}
