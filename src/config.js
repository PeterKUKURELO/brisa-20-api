import 'dotenv/config'

function required(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Falta la variable de entorno ${name}`)
  return value
}

function integer(name, fallback) {
  const value = process.env[name]
  if (!value) return fallback

  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed)) throw new Error(`${name} debe ser un número entero`)
  return parsed
}

function boolean(name, fallback = false) {
  const value = process.env[name]
  if (value === undefined) return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function origins() {
  const raw = required('FRONTEND_ORIGINS')

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.some((origin) => typeof origin !== 'string')) throw new Error()
    return parsed.map((origin) => origin.replace(/\/$/, ''))
  } catch {
    throw new Error('FRONTEND_ORIGINS debe ser un arreglo JSON de URLs')
  }
}

const adminApiKey = required('ADMIN_API_KEY')
if (adminApiKey.length < 32) {
  throw new Error('ADMIN_API_KEY debe tener al menos 32 caracteres')
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  host: process.env.HOST || '127.0.0.1',
  port: integer('PORT', 3001),
  trustProxy: integer('TRUST_PROXY', 1),
  frontendOrigins: origins(),
  adminApiKey,
  db: {
    host: required('DB_HOST'),
    port: integer('DB_PORT', 3306),
    name: required('DB_NAME'),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    useTls: boolean('DB_USE_TLS'),
    tlsRejectUnauthorized: boolean('DB_TLS_REJECT_UNAUTHORIZED', true),
    sslCa: process.env.DB_SSL_CA?.replace(/\\n/g, '\n') || '',
    connectionLimit: integer('DB_CONNECTION_LIMIT', 3),
  },
}
