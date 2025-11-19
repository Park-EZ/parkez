import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js'

/**
 * Fastify authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export async function authenticate(request, reply) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return reply.code(401).send({ error: 'No token provided' })
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return reply.code(401).send({ error: 'Invalid or expired token' })
    }

    // Attach user info to request
    request.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    }

    // Continue to next handler
    return
  } catch (error) {
    return reply.code(401).send({ error: 'Authentication failed' })
  }
}

/**
 * Optional authentication - doesn't fail if no token, but attaches user if token is valid
 */
export async function optionalAuthenticate(request, reply) {
  try {
    const authHeader = request.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (token) {
      const decoded = verifyToken(token)
      if (decoded) {
        request.user = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name
        }
      }
    }

    // Always continue, even if no token
    return
  } catch (error) {
    // Ignore errors for optional auth
    return
  }
}


