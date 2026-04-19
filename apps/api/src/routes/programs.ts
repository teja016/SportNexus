import { FastifyInstance } from 'fastify'
import { prisma } from '@sportnexus/db'
import { NotFoundError } from '../errors'

export default async function programRoutes(fastify: FastifyInstance) {
  // GET /api/programs/:programId/slots
  fastify.get('/:programId/slots', async (request, reply) => {
    const { programId } = request.params as { programId: string }

    const program = await prisma.sportProgram.findUnique({
      where: { id: programId },
      include: {
        slots: { where: { isActive: true } },
        academy: {
          select: { id: true, name: true, address: true, transportAvailable: true },
        },
      },
    })

    if (!program) throw new NotFoundError('Program')
    return reply.send({ success: true, data: program })
  })

  // GET /api/programs/:programId/slots/:slotId/availability
  fastify.get('/:programId/slots/:slotId/availability', async (request, reply) => {
    const { slotId } = request.params as { programId: string; slotId: string }

    const slot = await prisma.slot.findUnique({ where: { id: slotId } })
    if (!slot) throw new NotFoundError('Slot')

    return reply.send({
      success: true,
      data: {
        available: slot.enrolledCount < slot.totalCapacity,
        total: slot.totalCapacity,
        enrolled: slot.enrolledCount,
        remaining: Math.max(0, slot.totalCapacity - slot.enrolledCount),
      },
    })
  })
}
