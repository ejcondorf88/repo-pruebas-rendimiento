# PetTech K6 - Pruebas de Rendimiento para Django REST API

Repositorio completo de pruebas de rendimiento para PetTech, una plataforma de adopción de mascotas construida con **Django 5.0.6 + Django REST Framework + JWT Auth**.

## 📋 Información del Proyecto

- **Backend**: Django 5.0.6 + Django REST Framework
- **Autenticación**: JWT (djangorestframework-simplejwt 5.3.1)
- **Testing**: k6 (latest)
- **Base URL**: `http://localhost:8000`
- **Versión API**: `/api/v1/`

## 📁 Estructura del Proyecto

```
pettech-k6/
├── config/
│   └── default.js              # URLs Django, thresholds, stages
├── data/
│   └── test-data.js            # Credenciales reales de prueba
├── lib/
│   ├── http-client.js          # Cliente HTTP con JWT
│   └── utils.js                # Helpers y checks
├── flows/
│   ├── flujo-familia.js        # Flujo completo de familia (6 pasos)
│   ├── flujo-admin.js          # Flujo de administrador (8 pasos)
│   ├── flujo-adopcion.js       # Flujo end-to-end de adopción (4 fases)
│   └── flujo-mascotas.js       # CRUD completo de mascotas
├── scripts/
│   ├── load-test.js            # Test de carga (10-30 usuarios)
│   ├── stress-test.js          # Test de estrés (hasta 200 usuarios)
│   ├── spike-test.js           # Test de pico (10→100 usuarios)
│   └── soak-test.js            # Test de soak (1 hora, 30 usuarios)
├── reports/
│   └── .gitkeep
└── README.md
```

## 🔐 Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|-----------|
| **Admin** | `admin@pettech.com` | `Admin1234!` |
| **Familia** | `familiatest@pettech.com` | `Test1234!` |

## 🚀 Ejecución de Tests

### Test de Carga (Load Test)

```bash
# Carga normal: 10-30 usuarios, ~4 minutos
k6 run scripts/load-test.js

# Con URL de producción
k6 run --env BASE_URL=https://api.pettech.com scripts/load-test.js
```

### Test de Estrés (Stress Test)

```bash
# Busca el punto de ruptura: hasta 200 usuarios, ~19 minutos
k6 run scripts/stress-test.js
```

### Test de Pico (Spike Test)

```bash
# Pico súbito: 10→100 usuarios en 30s, ~4.5 minutos
k6 run scripts/spike-test.js
```

### Test de Soak (Soak Test)

```bash
# Larga duración: 30 usuarios por 1 hora
k6 run scripts/soak-test.js
```

### Ejecutar Flujos Individuales

```bash
# Solo flujo de familia
k6 run flows/flujo-familia.js

# Solo flujo de admin
k6 run flows/flujo-admin.js

# Flujo de adopción completo (familia + admin)
k6 run flows/flujo-adopcion.js

# CRUD de mascotas
k6 run flows/flujo-mascotas.js
```

## 🎯 Flujos Implementados

### 1. Flujo de Familia (`flows/flujo-familia.js`)

```
1. POST /auth/login/                    → Login JWT
2. GET /mascotas/?estado=DISPONIBLE     → Listar mascotas
3. GET /mascotas/{id}/                   → Ver detalle
4. POST /familias/mia/                   → Crear familia
5. POST /familias/mia/condiciones-hogar/→ Crear condiciones
6. POST /solicitudes/                   → Crear solicitud
```

### 2. Flujo de Admin (`flows/flujo-admin.js`)

```
1. POST /auth/login/              → Login admin
2. GET /mascotas/                 → Listar todas
3. POST /mascotas/                → Crear mascota
4. PATCH /mascotas/{id}/          → Actualizar
5. GET /solicitudes/              → Ver pendientes
6. POST /solicitudes/{id}/aprobar/→ Aprobar solicitud
7. GET /adopciones/               → Ver adopciones
8. GET /adopciones/{id}/calendario/→ Calendario vacunas
```

### 3. Flujo de Adopción Completo (`flows/flujo-adopcion.js`)

```
FASE 1 - Admin:    Login → Crear mascota disponible
FASE 2 - Familia:  Login → Listar → Crear familia → 
                   Condiciones → Crear solicitud
FASE 3 - Admin:    Login → Aprobar solicitud
FASE 4 - Ambos:    Consultar calendario de vacunación
```

### 4. Flujo de Mascotas CRUD (`flows/flujo-mascotas.js`)

```
1. Login admin
2. GET /mascotas/          → Listar
3. POST /mascotas/         → Crear
4. GET /mascotas/{id}/     → Detalle
5. PATCH /mascotas/{id}/   → Actualizar
6. GET /mascotas/{id}/     → Verificar cambios
7. DELETE /mascotas/{id}/  → Eliminar
8. GET /mascotas/{id}/     → Verificar 404
```

## ⚙️ Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `BASE_URL` | URL base de la API | `http://localhost:8000` |
| `FAMILIA_EMAIL` | Email de familia | `familiatest@pettech.com` |
| `FAMILIA_PASSWORD` | Password de familia | `Test1234!` |
| `ADMIN_EMAIL` | Email de admin | `admin@pettech.com` |
| `ADMIN_PASSWORD` | Password de admin | `Admin1234!` |

### Configuración de Carga (`config/default.js`)

```javascript
// Thresholds estrictos para Django
export const THRESHOLDS = {
  http_req_duration: ['p(95)<500'],  // 95% bajo 500ms
  http_req_failed: ['rate<0.01'],     // < 1% errores
};

// Stages Load Test
export const DEFAULT_STAGES = [
  { duration: '30s', target: 10 },   // Warmup
  { duration: '1m', target: 30 },    // Ramp up
  { duration: '2m', target: 30 },   // Hold
  { duration: '30s', target: 0 },   // Ramp down
];
```

## 📊 Métricas

### Métricas HTTP Estándar

- `http_req_duration`: Duración de requests (p(95) < 500ms)
- `http_req_failed`: Tasa de errores (< 1%)
- `http_reqs`: Total de requests

### Métricas de Flujo Personalizadas

| Métrica | Descripción |
|---------|-------------|
| `flujo_familia_login_duration` | Tiempo login familia |
| `flujo_familia_solicitud_duration` | Tiempo crear solicitud |
| `flujo_admin_create_mascota_duration` | Tiempo crear mascota |
| `flujo_admin_aprobar_duration` | Tiempo aprobar solicitud |
| `adopcion_admin_aprobar_duration` | Tiempo aprobación en flujo completo |
| `mascotas_create_duration` | Tiempo CRUD crear |

## 🛠️ Extensión

### Agregar Nuevo Flujo

1. **Crear archivo** `flows/mi-flujo.js`:

```javascript
import { group } from 'k6';
import * as http from '../lib/http-client.js';
import * as utils from '../lib/utils.js';
import { ENDPOINTS } from '../config/default.js';

export function ejecutarFlujo() {
  group('Paso 1', () => {
    const response = http.get(ENDPOINTS.mascotas.list);
    utils.checkResponse(response, 'List', 200);
  });
  return true;
}
```

2. **Usar en script**:

```javascript
import { ejecutarFlujo as ejecutarMiFlujo } from '../flows/mi-flujo.js';

export default function () {
  ejecutarMiFlujo();
}
```

### Agregar Nuevo Endpoint

Editar `lib/http-client.js`:

```javascript
// Nuevo método PUT para Django
export function put(endpoint, body, customHeaders = {}) {
  return http.put(`${FULL_API_URL}${endpoint}`, JSON.stringify(body), {
    headers: getHeaders(customHeaders),
  });
}
```

## 🔍 Troubleshooting

### "401 Unauthorized"
```bash
# Verificar credenciales
k6 run --env FAMILIA_EMAIL=correcto@test.com --env FAMILIA_PASSWORD=Correct123! scripts/load-test.js
```

### "Connection refused"
```bash
# Verificar Django corriendo
python manage.py runserver 0.0.0.0:8000
# o
k6 run --env BASE_URL=http://localhost:8000 scripts/load-test.js
```

### Tokens JWT expirados
El cliente HTTP maneja automáticamente el refresh token. Verificar en `lib/http-client.js`.

### Thresholds fallidos
Los tests de stress/spike tienen thresholds relajados. Revisar métricas en reporte final.

## 📈 Generar Reportes

```bash
# JSON output
k6 run --out json=reports/resultado.json scripts/load-test.js

# CSV output
k6 run --out csv=reports/resultado.csv scripts/load-test.js

# Múltiples formatos
k6 run \
  --out json=reports/resultado.json \
  --out csv=reports/resultado.csv \
  scripts/load-test.js
```

## 🧪 Endpoints de la API

### Auth (`/api/v1/auth/`)
- `POST /auth/login/` - Login JWT (retorna access + refresh)
- `POST /auth/registro/` - Registro familia
- `POST /auth/token/refresh/` - Renovar token
- `GET /auth/perfil/` - Perfil usuario

### Mascotas (`/api/v1/mascotas/`)
- `GET /mascotas/` - Listar (filtros: `?estado=DISPONIBLE&especie=PERRO`)
- `POST /mascotas/` - Crear (solo Admin)
- `GET /mascotas/{id}/` - Detalle
- `PATCH /mascotas/{id}/` - Actualizar (solo Admin)
- `DELETE /mascotas/{id}/` - Eliminar (solo Admin)

### Familias (`/api/v1/familias/`)
- `GET /familias/` - Listar todas (Admin)
- `GET /familias/mia/` - Mi familia
- `POST /familias/mia/` - Crear familia
- `PATCH /familias/mia/` - Actualizar
- `POST /familias/mia/condiciones-hogar/` - Crear condiciones

### Solicitudes (`/api/v1/solicitudes/`)
- `GET /solicitudes/` - Listar
- `POST /solicitudes/` - Crear (Familia)
- `GET /solicitudes/{id}/` - Detalle
- `POST /solicitudes/{id}/aprobar/` - Aprobar (Admin)
- `POST /solicitudes/{id}/rechazar/` - Rechazar (Admin)

### Adopciones (`/api/v1/adopciones/`)
- `GET /adopciones/` - Listar
- `GET /adopciones/{id}/calendario/` - Calendario vacunación

## 📝 Notas de Arquitectura

- **JWT Handling**: El `http-client.js` gestiona automáticamente access + refresh tokens
- **Módulos ES6**: Sin clases, solo funciones puras con import/export
- **Reutilizable**: Todos los flujos usan el mismo cliente HTTP
- **Extensible**: Agregar flujo = crear archivo + importar
- **Scalable**: Cada VU ejecuta flujos independientes

---

**PetTech QA Team** | Pruebas de Rendimiento con k6

---

## 🏗️ Arquitectura y Desarrollo

### Spec-Driven Development (SDD)

Este proyecto fue desarrollado siguiendo **SDD (Spec-Driven Development)**, una metodología que define especificaciones claras antes de la implementación.

**Artefactos SDD almacenados en Engram:**
- `sdd/pettech-k6-arquitectura/proposal` - Propuesta de arquitectura scalable
- `architecture/pettech-k6-complete-project-django-rest-api` - Documentación completa del proyecto

**Proceso SDD seguido:**
1. **Exploración** (`sdd-explore`) - Análisis de requerimientos y endpoints
2. **Propuesta** (`sdd-propose`) - Arquitectura modular junior-friendly
3. **Especificación** (`sdd-spec`) - Requisitos detallados por flujo
4. **Diseño** (`sdd-design`) - Estructura de archivos y contratos
5. **Implementación** (`sdd-apply`) - Código siguiendo las specs
6. **Verificación** (`sdd-verify`) - Tests funcionales

### 🤖 OpenCode Agent + Agent Teams

Este proyecto fue desarrollado con **OpenCode Agent** utilizando la arquitectura **Agent Teams Lite**:

#### Modelos Utilizados

| Rol | Modelo | Descripción |
|-----|--------|-------------|
| **Orchestrator** | **Kimi K2.5** | Coordina, delega y toma decisiones arquitectónicas |
| **Exploración** | Claude Sonnet | Investigación de código y análisis estructural |
| **Implementación** | Claude Sonnet | Escritura de código y aplicación de specs |
| **Verificación** | Claude Sonnet | Validación contra especificaciones |

#### Sistema de Skills

**Skills SDD utilizadas:**
- `sdd-init` - Inicialización del contexto SDD
- `sdd-explore` - Exploración de requisitos
- `sdd-propose` - Creación de propuestas
- `sdd-spec` - Escritura de especificaciones
- `sdd-design` - Diseño técnico
- `sdd-tasks` - Desglose de tareas
- `sdd-apply` - Implementación
- `sdd-verify` - Verificación
- `sdd-archive` - Archivado

**Otras skills:**
- `skill-registry` - Registro de habilidades del proyecto

#### 🧠 Engram - Memoria Persistente

**¿Qué es Engram?**
Sistema de memoria persistente que sobrevive entre sesiones y compaciones de contexto.

**Uso en este proyecto:**
```javascript
// Guardar artefactos SDD
mem_save({
  title: "PetTech K6 Architecture Proposal",
  type: "architecture",
  topic_key: "sdd/pettech-k6-arquitectura/proposal",
  content: "..."
});

// Recuperar contexto
mem_search({ query: "k6 architecture", project: "pettech-k6" });
mem_get_observation({ id: "observation_id" });
```

**Topic Keys utilizados:**
- `sdd-init/pettech-k6` - Contexto del proyecto
- `sdd/pettech-k6-arquitectura/proposal` - Propuesta inicial
- `sdd/pettech-k6-arquitectura/spec` - Especificaciones
- `sdd/pettech-k6-arquitectura/design` - Diseño técnico
- `sdd/pettech-k6-arquitectura/tasks` - Tareas de implementación
- `architecture/pettech-k6-complete-project` - Estado final

**Protocolo de Memoria:**
- ✅ Auto-guardado después de decisiones arquitectónicas
- ✅ Persistencia de bugfixes y descubrimientos
- ✅ Recuperación de sesiones previas
- ✅ Session summaries antes de cierre

#### Agent Teams - Flujo de Trabajo

```
Usuario solicita feature
        ↓
[Orchestrator - Kimi K2.5] Analiza y delega
        ↓
[Skills SDD] Ejecutan fases secuenciales
        ↓
[Engram] Persiste artefactos
        ↓
[Implementación] Código final
```

**Ventajas de Agent Teams:**
- 🎯 **Especialización**: Cada agente tiene un rol definido
- 🔄 **Iteración**: Cada fase puede revisarse antes de continuar
- 📚 **Memoria**: Contexto persistente entre sesiones
- 🎨 **Consistencia**: Mismo estándar en todo el proyecto
- 📊 **Trazabilidad**: Decisiones documentadas en Engram

### Beneficios del Enfoque

- ✅ **Arquitectura documentada** antes de escribir código
- ✅ **Decisiones trazables** en memoria persistente
- ✅ **Estructura escalable** desde el diseño inicial
- ✅ **Código consistente** con patrones definidos
- ✅ **Recuperación** de contexto tras compresiones
- ✅ **Múltiples modelos** según la complejidad de la tarea

---

**Desarrollado con ❤️ para PetTech usando:**
**SDD + OpenCode Agent Teams + Kimi K2.5 + Engram**
