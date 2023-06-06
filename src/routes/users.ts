import { FastifyInstance } from "fastify";
import { knex } from "../database"
import { randomUUID } from "node:crypto";
import { z } from "zod";

export async function userRoutes(app: FastifyInstance) {
  // Create a new user
  app.post('/create', async (request, reply) => {

    const createUserBodySchema = z.object({
      email: z.string().email(),
      name: z.string(),
    })

    const { email, name } = createUserBodySchema.parse(request.body)

    const userExists = await knex('users').where({ email }).first()
    if (userExists) {
      return reply.status(409).send({
        error: 'User already exists'
      })
    }

    const user = await knex('users').insert({
      id: randomUUID(),
      email,
      name,
    })

    return reply.status(201).send()
  })
}