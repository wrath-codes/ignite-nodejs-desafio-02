import { FastifyInstance } from "fastify";
import dayjs from "dayjs";
import { knex } from "../database"
import { randomUUID } from "node:crypto";
import { z } from "zod";

export async function appRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request, reply) => {
    console.log(`[${request.method}] ${request.url}`)
  })

  // Create a new user
  app.post('/users/create', async (request, reply) => {

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

  // get user
  app.get('/users', async (request, reply) => {
    const getUserBodySchema = z.object({
      email: z.string().email(),
    })

    const { email } = getUserBodySchema.parse(request.body)

    const user = await knex('users').where({ email }).first()

    if (!user) {
      return reply.status(404).send({
        error: 'User not found'
      })
    }

    return reply.status(200).send({
      user
    })
  })

  // Create Meal
  app.post('/users/:user_id/meals/create', async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      in_diet: z.boolean().optional(),
      day: z.string().optional(),
      hour: z.string().optional(),
    })

    const createMealParamsSchema = z.object({
      user_id: z.string(),
    })

    const { name, description, in_diet, day, hour } = createMealBodySchema.parse(request.body)
    const { user_id } = createMealParamsSchema.parse(request.params)

    const userExists = await knex('users').where({ id: user_id }).first()


    if (!userExists) {
      return reply.status(404).send({
        error: 'User not found'
      })
    }

    let when

    if (day && hour) {
      when = dayjs(`${day} ${hour}`).toDate()
    }

    const meal = await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      in_diet,
      user_id,
      when: when ? when : new Date(),
    })

    return reply.status(201).send({
      meal
    })
  })

  // Update Meal
  app.put('/users/:user_id/meals/:meal_id/update', async (request, reply) => {
    const updateMealBodySchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      in_diet: z.boolean().optional(),
      day: z.string().optional(),
      hour: z.string().optional(),
    })

    const updateMealParamsSchema = z.object({
      user_id: z.string(),
      meal_id: z.string(),
    })

    const { name, description, in_diet, day, hour } = updateMealBodySchema.parse(request.body)
    const { user_id, meal_id } = updateMealParamsSchema.parse(request.params)

    const userExists = await knex('users').where({ id: user_id }).first()

    if (!userExists) {
      return reply.status(404).send({
        error: 'User not found'
      })
    }

    const mealExists = await knex('meals').where({ id: meal_id }).first()

    if (!mealExists) {
      return reply.status(404).send({
        error: 'Meal not found'
      })
    }

    let when

    if (day && hour) {
      when = dayjs(`${day} ${hour}`).toDate()
    } else if (day && !hour) {
      when = dayjs(`${day} ${dayjs(mealExists.when).format('HH:mm')}`).toDate()
    } else if (!day && hour) {
      when = dayjs(`${dayjs(mealExists.when).format('YYYY-MM-DD')} ${hour}`).toDate()
    } else {
      when = mealExists.when
    }

    const meal = await knex('meals').where({ id: meal_id }).update({
      name,
      description,
      in_diet,
      when
    })

    return reply.status(200).send()
  })

  // Delete Meal
  app.delete('/users/:user_id/meals/:meal_id/delete', async (request, reply) => {
    const deleteMealParamsSchema = z.object({
      user_id: z.string(),
      meal_id: z.string(),
    })

    const { user_id, meal_id } = deleteMealParamsSchema.parse(request.params)

    const userExists = await knex('users').where({ id: user_id }).first()

    if (!userExists) {
      return reply.status(404).send({
        error: 'User not found'
      })
    }

    const mealExists = await knex('meals').where({ id: meal_id }).first()

    if (!mealExists) {
      return reply.status(404).send({
        error: 'Meal not found'
      })
    }

    const meal = await knex('meals').where({ id: meal_id }).delete()

    return reply.status(200).send()
  })

  // Get all user meals
  app.get('/users/:user_id/meals', async (request, reply) => {
    const getMealsParamsSchema = z.object({
      user_id: z.string(),
    })

    const { user_id } = getMealsParamsSchema.parse(request.params)

    const userExists = await knex('users').where({ id: user_id }).first()

    if (!userExists) {
      return reply.status(404).send({
        error: 'User not found'
      })
    }

    const meals = await knex('meals').where({ user_id })

    if (meals.length === 0) {
      return {
        meals: []
      }
    }

    return reply.status(200).send(meals)
  })

  // get a single meal
  app.get('/users/:user_id/meals/:meal_id', async (request, reply) => {
    const getMealParamsSchema = z.object({
      user_id: z.string(),
      meal_id: z.string(),
    })

    const { user_id, meal_id } = getMealParamsSchema.parse(request.params)

    const userExists = await knex('users').where({ id: user_id }).first()

    if (!userExists) {
      return reply.status(404).send({
        error: 'User not found'
      })
    }

    const mealExists = await knex('meals').where({ id: meal_id }).first()

    if (!mealExists) {
      return reply.status(404).send({
        error: 'Meal not found'
      })
    }

    return reply.status(200).send(mealExists)
  })

  // Get user metrics
  app.get('/users/:user_id/metrics', async (request, reply) => {
    const getMetricsParamsSchema = z.object({
      user_id: z.string(),
    })

    const { user_id } = getMetricsParamsSchema.parse(request.params)

    const userExists = await knex('users').where({ id: user_id }).first()

    if (!userExists) {
      return reply.status(404).send({
        error: 'User not found'
      })
    }

    const totalMeals = await knex('meals').where({ user_id }).count()
    const inDietMeals = await knex('meals').where({ user_id, in_diet: true }).count()
    const notInDietMeals = await knex('meals').where({ user_id, in_diet: false }).count()

    // more days in sequence in diet
    const allMeals = await knex('meals').where({ user_id })

    let daysInSequence = 0

    allMeals.forEach((meal, index) => {
      if (index === 0) {
        if (meal.in_diet) {
          daysInSequence = 1
        }
      } else {
        if (meal.in_diet) {
          daysInSequence += 1
        } else {
          daysInSequence = 0
        }
      }
    })

    const metrics = {
      totalMeals: totalMeals[0]['count(*)'],
      inDietMeals: inDietMeals[0]['count(*)'],
      notInDietMeals: notInDietMeals[0]['count(*)'],
      daysInSequence,
    }

    return reply.status(200).send(metrics)

  })
}


