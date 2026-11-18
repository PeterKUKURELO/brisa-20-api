# brisa-20-api

API Express para registrar confirmaciones en MySQL y servir el listado protegido al panel de administración.

## Repositorio recomendado

```text
brisa-20-api
```

## Endpoints

| Método | Ruta | Acceso | Uso |
| --- | --- | --- | --- |
| `POST` | `/api/rsvps` | Público, limitado por IP | Crea o actualiza una respuesta por DNI |
| `GET` | `/api/rsvps` | `ADMIN_API_KEY` | Lista las respuestas para el panel |
| `GET` | `/api/health` | Público | Comprueba la conexión con MySQL |

## Crear la tabla

La migración se ejecuta una sola vez, antes de recibir respuestas:

```bash
mysql -h TU_HOST -P 3306 -u TU_USUARIO -p TU_BASE < migrations/001_create_rsvps.sql
```

El DNI es único. Si una persona vuelve a responder, se actualiza el registro existente.

## Desarrollo local

Requiere Node.js 20 o superior.

```bash
npm ci
cp .env.example .env
npm test
npm run dev
```

## Variables de Vercel

Configura únicamente en el proyecto API:

```dotenv
NODE_ENV=production
TRUST_PROXY=1
FRONTEND_ORIGINS=["https://brisa-20-web.vercel.app"]

DB_HOST=tu-host-mysql
DB_PORT=3306
DB_NAME=tu-base
DB_USER=tu-usuario
DB_PASSWORD=tu-contrasena
DB_USE_TLS=true
DB_CONNECTION_LIMIT=3
DB_SSL_CA=

ADMIN_API_KEY=una-clave-aleatoria-de-al-menos-32-caracteres
```

No agregues el prefijo `VITE_` a credenciales o claves privadas. Si tu proveedor entrega una CA propia, coloca su contenido en `DB_SSL_CA`, conservando los saltos como `\n`.

## Despliegue en Vercel

1. Crea un repositorio Git llamado `brisa-20-api` y sube esta carpeta.
2. En Vercel selecciona **Add New → Project** e importa el repositorio.
3. Vercel detectará la aplicación Express desde `src/server.js`.
4. Agrega todas las variables indicadas para Production.
5. Despliega y comprueba:

```bash
curl https://brisa-20-api.vercel.app/api/health
```

Si el nombre asignado por Vercel cambia, usa la URL real del despliegue en `VITE_RSVP_API_URL` dentro del proyecto web.

## Seguridad

- Rota cualquier contraseña que haya sido compartida previamente.
- Usa TLS para MySQL remoto.
- Limita los permisos del usuario MySQL a la tabla `brisa_rsvps`.
- Guarda `ADMIN_API_KEY` únicamente en Vercel y en un gestor de contraseñas.
- Configura en `FRONTEND_ORIGINS` el dominio exacto del frontend.
- No expongas una base MySQL privada solo para conectarla a Vercel. Si requiere una IP de salida fija, utiliza una opción de conectividad adecuada o aloja la API junto a la base.

## Verificación

```bash
npm test
npm audit
node --check src/server.js
```

La carpeta `deploy/` conserva plantillas opcionales para CentOS, Nginx y systemd; Vercel no las utiliza.
