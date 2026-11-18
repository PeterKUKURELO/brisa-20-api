import { z } from 'zod'

const optionalText = (maximum) => z.string().trim().max(maximum).optional().default('')

export const rsvpSchema = z.object({
  name: z.string().trim().min(2).max(120),
  attendance: z.enum(['yes', 'no']),
  dni: z.string().regex(/^\d{8}$/),
  song: optionalText(180),
  message: optionalText(600),
}).strict()
