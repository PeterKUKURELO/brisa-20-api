import test from 'node:test'
import assert from 'node:assert/strict'
import { rsvpSchema } from '../src/validation.js'

test('acepta una confirmación válida y limpia espacios', () => {
  const result = rsvpSchema.safeParse({
    name: '  Ana Pérez  ',
    attendance: 'yes',
    dni: '12345678',
    song: ' SUPERESTRELLA ',
    message: '',
  })

  assert.equal(result.success, true)
  assert.equal(result.data.name, 'Ana Pérez')
  assert.equal(result.data.song, 'SUPERESTRELLA')
})

test('rechaza DNI, asistencia y campos inesperados inválidos', () => {
  const result = rsvpSchema.safeParse({
    name: 'Ana Pérez',
    attendance: 'maybe',
    dni: '1234',
    unexpected: true,
  })

  assert.equal(result.success, false)
})
