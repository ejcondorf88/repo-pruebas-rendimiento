// Datos de prueba para PetTech
// Todo centralizado aquí para reusar en múltiples flujos

// Credenciales de familia
export const FAMILIA_CREDENTIALS = {
  email: __ENV.FAMILIA_EMAIL || 'familia@test.com',
  password: __ENV.FAMILIA_PASSWORD || 'password123',
};

// Credenciales de admin
export const ADMIN_CREDENTIALS = {
  email: __ENV.ADMIN_EMAIL || 'admin@test.com',
  password: __ENV.ADMIN_PASSWORD || 'admin123',
};

// Payload para login
export function getLoginPayload(email, password) {
  return {
    email: email,
    password: password,
  };
}

// Payload para crear solicitud de adopción
export function getAdopcionPayload(mascotaId) {
  return {
    mascota_id: mascotaId,
    mensaje: 'Estamos muy interesados en adoptar a esta mascota. Tenemos experiencia previa y un hogar adecuado.',
  };
}

// Mascota de prueba (para crear si es necesario)
export const MASCOTA_TEST_DATA = {
  nombre: 'Luna',
  especie: 'PERRO',
  raza: 'Golden Retriever',
  edad_anios: 2,
  edad_unidad: 'ANIOS',
  fecha_nacimiento: '2022-01-15',
  tamano: 'GRANDE',
  peso: 25.50,
  sexo: 'HEMBRA',
  descripcion: 'Muy juguetona y cariñosa',
  estado: 'DISPONIBLE',
  nivel_energia: 'ALTO',
  nivel_independencia: 'MEDIO',
  nivel_complejidad: 'BAJO',
  nivel_sociabilidad: 'ALTO',
  apta_ninos: true,
  costo_estimado_mensual: '1_2SMLV',
  historial_vacunas: ['Rabia', 'Parvovirus'],
  historia_mascota: 'Rescatada de la calle',
  info_adicional: 'Le gusta jugar con pelotas',
};

// Familia de prueba
export const FAMILIA_TEST_DATA = {
  nombre_familia: 'Familia Test',
  cedula: '1234567890',
  fecha_nacimiento: '1990-05-15',
  telefono: '+57 300 123 4567',
  ciudad: 'Bogotá',
  departamento: 'Cundinamarca',
  direccion: 'Calle 123 # 45-67',
  redes_sociales: '@familiatest',
};

// IDs de prueba (si existen)
export const TEST_IDS = {
  mascota: __ENV.TEST_MASCOTA_ID || '1',
};
