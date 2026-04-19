import { FastifyRequest, FastifyReply } from 'fastify'
import { ForbiddenError, UnauthorizedError } from '../errors'
import { UserRole } from '@sportnexus/types'

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch {
    throw new UnauthorizedError()
  }
}

export function requireRole(roles: UserRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch {
      throw new UnauthorizedError()
    }
    const user = request.user as { id: string; role: UserRole }
    if (!roles.includes(user.role)) {
      throw new ForbiddenError()
    }
  }
}
