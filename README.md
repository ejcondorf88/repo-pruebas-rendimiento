# PetTech K6 - Pruebas de Rendimiento

Repositorio de pruebas de rendimiento para la plataforma PetTech de adopción de mascotas.

## 📁 Estructura del Proyecto (Arquitectura Simple)

```
pettech-k6/
├── config/
│   └── default.js          # URLs, timeouts, thresholds
├── data/
│   └── test-data.js        # Credenciales y datos de prueba
├── lib/
│   ├── http-client.js      # Wrapper simple de HTTP
│   └── utils.js            # Funciones helper
├── flows/
│   ├── flujo-familia.js    # Flujo de familia adoptante
│   └── flujo-admin.js      # Flujo de administrador
├── scripts/
│   └── load-test.js        # Punto de entrada
├── reports/
└── README.md
```

## 🚀 Cómo funciona

### Flujo de Familia Adoptante (`flows/flujo-familia.js`)

```
1. POST /auth/login              → Login familia
2. GET  /mascotas?estado=disponible → Listar mascotas
3. GET  /mascotas/:id            → Ver detalle
4. POST /adopciones              → Solicitar adopción
```

### Ejecutar las pruebas

```bash
# Ejecutar test de carga
k6 run scripts/load-test.js

# Con URL personalizada
k6 run --env BASE_URL=https://api.pettech.com scripts/load-test.js

# Con credenciales personalizadas
k6 run \
  --env FAMILIA_EMAIL=mi_familia@test.com \
  --env FAMILIA_PASSWORD=mi_pass \
  scripts/load-test.js
```

### Ejecutar flujo específico

```bash
# Ejecutar solo flujo de familia
k6 run flows/flujo-familia.js

# Ejecutar solo flujo de admin
k6 run flows/flujo-admin.js
```

## 📊 Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `BASE_URL` | URL base de la API | `http://localhost:8080` |
| `FAMILIA_EMAIL` | Email de familia | `familia@test.com` |
| `FAMILIA_PASSWORD` | Password de familia | `password123` |
| `ADMIN_EMAIL` | Email de admin | `admin@test.com` |
| `ADMIN_PASSWORD` | Password de admin | `admin123` |

### Cambiar Configuración

Edita `config/default.js`:

```javascript
// Cambiar URL
export const BASE_URL = __ENV.BASE_URL || 'https://api.pettech.com';

// Cambiar thresholds
export const THRESHOLDS = {
  http_req_duration: ['p(95)<1000'], // 1000ms en vez de 2000ms
  http_req_failed: ['rate<0.01'],      // 1% error en vez de 5%
};

// Cambiar carga
export const DEFAULT_STAGES = [
  { duration: '1m', target: 50 },   // 1 min a 50 usuarios
  { duration: '3m', target: 50 },   // 3 min a 50 usuarios
  { duration: '1m', target: 0 },     // 1 min bajando
];
```

## ➕ Agregar Nuevo Flujo

1. **Crea archivo** en `flows/flujo-nuevo.js`:

```javascript
import { group } from 'k6';
import * as http from '../lib/http-client.js';
import * as utils from '../lib/utils.js';

export function ejecutarFlujo() {
  // Paso 1: Login
  group('01 - Login', () => {
    const response = http.login('user@test.com', 'pass');
    // ... checks
  });
  
  // Paso 2: Tu lógica
  // ...
  
  return true; // o false si falló
}
```

2. **Importa en** `scripts/load-test.js`:

```javascript
import { ejecutarFlujo as ejecutarFlujoNuevo } from '../flows/flujo-nuevo.js';

export default function () {
  ejecutarFlujoNuevo();
}
```

## 📈 Métricas

Durante la ejecución se muestran:

- `http_req_duration`: Duración de requests
- `http_req_failed`: Tasa de errores
- `flujo_familia_login_duration`: Tiempo de login
- `flujo_familia_list_duration`: Tiempo listado
- etc.

## 🔧 Agregar Nuevo Endpoint

Edita `lib/http-client.js`:

```javascript
// Agregar método PUT
export function put(endpoint, body, customHeaders = {}) {
  return http.put(`${BASE_URL}${endpoint}`, JSON.stringify(body), {
    headers: getHeaders(customHeaders),
  });
}
```

## 🐛 Troubleshooting

### "No token found"
Verifica credenciales con `--env FAMILIA_EMAIL` y `--env FAMILIA_PASSWORD`

### "Connection refused"
Verifica que la API esté corriendo en `http://localhost:8080`

### Tests muy lentos
Ajusta `sleep()` en los flows o cambia los thresholds

## 📝 Notas

- **Simple**: Sin clases, sin herencia, solo funciones puras
- **Modular**: Cada flujo es independiente
- **Reusable**: Usa `lib/http-client.js` para no repetir HTTP
- **Extensible**: Agregar flujo = crear archivo + importar
