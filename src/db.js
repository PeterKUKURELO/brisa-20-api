import mysql from 'mysql2/promise'
import { config } from './config.js'

const ssl = config.db.useTls
  ? {
      rejectUnauthorized: config.db.tlsRejectUnauthorized,
      ...(config.db.sslCa ? { ca: config.db.sslCa } : {}),
    }
  : undefined

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  ssl,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  maxIdle: config.db.connectionLimit,
  idleTimeout: 60_000,
  queueLimit: 0,
  enableKeepAlive: true,
  charset: 'utf8mb4',
})
