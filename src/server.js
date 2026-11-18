import { timingSafeEqual } from 'node:crypto'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { config } from './config.js'
import { pool } from './db.js'
import { rsvpSchema } from './validation.js'

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', config.trustProxy)
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.frontendOrigins.includes(origin.replace(/\/$/, ''))) {
      callback(null, true)
      return
    }
    callback(new Error('Origen no permitido'))
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
}))
app.use(express.json({ limit: '20kb' }))

const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiados intentos. Vuelve a intentarlo en unos minutos.' },
})

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiados intentos de acceso. Inténtalo más tarde.' },
})

function hasAdminKey(request) {
  const authorization = request.get('authorization') || ''
  const supplied = request.get('x-admin-key') || authorization.replace(/^Bearer\s+/i, '')
  if (!supplied) return false

  const expectedBuffer = Buffer.from(config.adminApiKey)
  const suppliedBuffer = Buffer.from(supplied)
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer)
}

app.get('/api/health', async (_request, response, next) => {
  try {
    await pool.query('SELECT 1')
    response.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

app.post('/api/rsvps', submissionLimiter, async (request, response) => {
  const parsed = rsvpSchema.safeParse(request.body)
  if (!parsed.success) {
    response.status(400).json({
      ok: false,
      error: 'Revisa los datos enviados.',
      fields: parsed.error.flatten().fieldErrors,
    })
    return
  }

  const { name, attendance, dni, song, message } = parsed.data

  try {
    const [result] = await pool.execute(
      `INSERT INTO brisa_rsvps (name, attendance, dni, song, message)
       VALUES (?, ?, ?, NULLIF(?, ''), NULLIF(?, ''))
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         attendance = VALUES(attendance),
         song = VALUES(song),
         message = VALUES(message),
         updated_at = CURRENT_TIMESTAMP`,
      [name, attendance, dni, song, message],
    )

    const [rows] = await pool.execute(
      'SELECT id, created_at AS createdAt, updated_at AS updatedAt FROM brisa_rsvps WHERE dni = ? LIMIT 1',
      [dni],
    )

    response.status(result.affectedRows === 1 ? 201 : 200).json({
      ok: true,
      id: rows[0].id,
      createdAt: rows[0].createdAt,
      updatedAt: rows[0].updatedAt,
    })
  } catch (error) {
    console.error('No se pudo guardar la confirmación:', error.code || error.message)
    response.status(503).json({ ok: false, error: 'No fue posible guardar tu respuesta. Inténtalo nuevamente.' })
  }
})

app.get('/api/rsvps', adminLimiter, async (request, response) => {
  if (!hasAdminKey(request)) {
    response.status(401).json({ ok: false, error: 'No autorizado' })
    return
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, name, attendance, dni, song, message, created_at, updated_at
       FROM brisa_rsvps
       ORDER BY updated_at DESC`,
    )

    response.setHeader('Cache-Control', 'no-store')
    response.json({
      ok: true,
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        attendance: row.attendance,
        dni: row.dni,
        song: row.song || '',
        message: row.message || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    })
  } catch (error) {
    console.error('No se pudo listar las confirmaciones:', error.code || error.message)
    response.status(503).json({ ok: false, error: 'No fue posible cargar las confirmaciones.' })
  }
})

app.use((_request, response) => {
  response.status(404).json({ ok: false, error: 'Ruta no encontrada' })
})

app.use((error, _request, response, _next) => {
  if (error.message === 'Origen no permitido') {
    response.status(403).json({ ok: false, error: error.message })
    return
  }

  console.error('Error inesperado:', error.message)
  response.status(500).json({ ok: false, error: 'Error interno del servidor' })
})

if (!process.env.VERCEL) {
  const server = app.listen(config.port, config.host, () => {
    console.log(`Brisa RSVP API escuchando en http://${config.host}:${config.port}`)
  })

  async function shutdown(signal) {
    console.log(`${signal}: cerrando API`)
    server.close(async () => {
      await pool.end()
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

export default app
