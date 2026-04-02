# PetTech K6 - Pruebas de Rendimiento

Repositorio de pruebas de rendimiento para la plataforma PetTech de adopción de mascotas.

## 📋 Descripción

Este proyecto contiene scripts de prueba de carga utilizando [k6](https://k6.io) para validar el rendimiento de la API REST de PetTech.

**Flujo crítico probado:**
1. Login de familia adoptante
2. Listar mascotas disponibles
3. Ver detalle de mascota
4. Enviar solicitud de adopción

## 🚀 Requisitos

- [k6](https://k6.io/docs/get-started/installation/) instalado
- API de PetTech ejecutándose (por defecto en `http://localhost:8080`)

## 📁 Estructura del Proyecto

```
pettech-k6/
├── scripts/
│   └── flujo-adopcion.js    # Script principal de prueba
├── reports/                  # Reportes generados (JSON, HTML)
├── README.md
└── .gitignore
```

## ⚙️ Configuración

### Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `BASE_URL` | URL base de la API | `http://localhost:8080` |
| `FAMILIA_EMAIL` | Email de la familia de prueba | `familia@test.com` |
| `FAMILIA_PASSWORD` | Contraseña de la familia | `password123` |

## 🏃 Ejecución de Pruebas

### Ejecución básica

```bash
# Ejecutar con valores por defecto (localhost)
k6 run scripts/flujo-adopcion.js

# Ejecutar con URL personalizada
k6 run --env BASE_URL=https://api.pettech.com scripts/flujo-adopcion.js

# Ejecutar con credenciales personalizadas
k6 run --env FAMILIA_EMAIL=mi_familia@test.com --env FAMILIA_PASSWORD=mi_pass scripts/flujo-adopcion.js

# Combinar todas las variables
k6 run \
  --env BASE_URL=https://api.pettech.com \
  --env FAMILIA_EMAIL=familia@test.com \
  --env FAMILIA_PASSWORD=password123 \
  scripts/flujo-adopcion.js
```

### Ejecución con salida a archivo

```bash
# Guardar resultados en formato JSON
k6 run --out json=reports/resultado.json scripts/flujo-adopcion.js

# Guardar en múltiples formatos
k6 run \
  --out json=reports/resultado.json \
  --out csv=reports/resultado.csv \
  scripts/flujo-adopcion.js
```

## 📊 Generación de Reportes

### Reporte en HTML (usando k6-reporter)

```bash
# Instalar dependencias (si usas el reporter avanzado)
npm install

# Ejecutar con reporte HTML
k6 run scripts/flujo-adopcion.js --out json=reports/raw.json
```

### Ver métricas en tiempo real

Durante la ejecución, k6 muestra métricas en consola:

```
http_req_duration.........: avg=450.23ms min=123.45ms med=400.12ms max=1890.23ms p(95)=890.12ms
http_req_failed...........: 0.02%  ✓ 1234 ✗ 2
checks....................: 98.5% ✓ 2468 ✗ 37
```

### Métricas Clave

| Métrica | Descripción | Threshold |
|---------|-------------|-----------|
| `http_req_duration` | Duración de requests | p(95) < 2000ms |
| `http_req_failed` | Tasa de errores | < 5% |
| `login_duration` | Tiempo de login | p(95) < 2000ms |
| `list_mascotas_duration` | Tiempo listado mascotas | p(95) < 2000ms |
| `detail_mascota_duration` | Tiempo detalle mascota | p(95) < 2000ms |
| `adopcion_duration` | Tiempo solicitud adopción | p(95) < 2000ms |

## 🔧 Configuración de Carga

El script está configurado con:

- **Rampa de subida**: 30 segundos hasta 10 usuarios concurrentes
- **Carga sostenida**: 1 minuto a 10 usuarios concurrentes
- **Rampa de bajada**: 30 segundos hasta 0 usuarios

**Tiempo total de ejecución**: ~2 minutos

Para modificar la carga, edita las `stages` en `scripts/flujo-adopcion.js`:

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // 1 minuto a 50 usuarios
    { duration: '3m', target: 50 },   // 3 minutos a 50 usuarios
    { duration: '1m', target: 0 },    // 1 minuto bajando a 0
  ],
};
```

## ✅ Checks Implementados

Cada paso del flujo incluye validaciones:

1. **Login**: Status 200, respuesta contiene token, duración < 2000ms
2. **Listar Mascotas**: Status 200, retorna array, duración < 2000ms
3. **Detalle Mascota**: Status 200, contiene ID correcto, duración < 2000ms
4. **Solicitud Adopción**: Status 201/200, duración < 2000ms

## 🐛 Troubleshooting

### Error de conexión
```
ERRO[0000] dial tcp localhost:8080: connect: connection refused
```
**Solución**: Verifica que la API esté ejecutándose en el puerto correcto.

### Error de autenticación (401)
```
login status is 200: false
```
**Solución**: Verifica las credenciales con `--env FAMILIA_EMAIL` y `--env FAMILIA_PASSWORD`.

### Thresholds fallidos
Si los thresholds no se cumplen, k6 saldrá con código de error. Para ignorar:
```bash
k6 run --no-thresholds scripts/flujo-adopcion.js
```

## 📝 Notas

- Los tiempos de `sleep()` entre pasos simulan comportamiento real de usuario
- El script maneja errores graciosamente: si un paso falla, aborta el flujo
- Los logs muestran el progreso y errores detallados

## 👥 Contribución

Para agregar nuevos flujos de prueba:

1. Crea un archivo en `scripts/nuevo-flujo.js`
2. Sigue el patrón de grupos y checks del flujo de adopción
3. Actualiza este README con instrucciones

## 📄 Licencia

Proyecto interno PetTech - Uso exclusivo para pruebas de calidad.
