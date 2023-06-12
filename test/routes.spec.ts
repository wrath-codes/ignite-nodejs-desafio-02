import { afterAll, beforeAll, beforeEach, describe, it } from "vitest"

import { app } from '../src/app'
import { execSync } from "node:child_process"
import { knex } from "../src/database"
import { randomUUID } from "node:crypto"
import request from "supertest"

describe('Routes', () => {
  beforeAll(async () => {
    await app.ready()
  })
  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  // Should be able to create a new user
  it('should be able to create a new user', async () => {
    await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com'
      })
      .expect(201)
  })

  // Should not be able to create a new user with an existing email
  it('should not be able to create a new user with an existing email', async () => {
    await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com'
      })
      .expect(201)

    await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com'
      })
      .expect(409)
  })

  // Should be able to create a new meal
  it('should be able to create a new meal', async () => {
    await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com'
      })
      .expect(201)

    const user = await knex('users').where({ email: 'johndoe@example.com' }).first()


    const response = await request(app.server)
      .post(`/users/${user.id}/meals/create`)
      .send({
        name: 'Bolo de cenoura',
        description: 'Bolo de cenoura com cobertura de chocolate',
        in_diet: true,
        day: '2021-10-10',
        hour: '12:00'
      })
      .expect(201)
  })

  // Should not be able to create a new meal with a non-existing user
  it('should not be able to create a new meal with a non-existing user', async () => {
    const user_id = randomUUID()

    const response = await request(app.server)
      .post(`/users/${user_id}/meals/create`)
      .send({
        name: 'Bolo de cenoura',
        description: 'Bolo de cenoura com cobertura de chocolate',
        in_diet: true
      })
      .expect(404)
  })

  // Should be able to edit a meal
  it('should be able to edit a meal', async () => {
    await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com'
      })
      .expect(201)

    const user = await knex('users').where({ email: 'johndoe@example.com' }).first()


    await request(app.server)
      .post(`/users/${user.id}/meals/create`)
      .send({
        name: 'Bolo de cenoura',
        description: 'Bolo de cenoura com cobertura de chocolate',
        in_diet: true,
        day: '2021-10-10',
        hour: '12:00'
      })
      .expect(201)

    const meal = await knex('meals').where({ name: 'Bolo de cenoura' }).first()

    const response = await request(app.server)
      .put(`/users/${user.id}/meals/${meal.id}/update`)
      .send({
        name: 'Bolo de Abacaxi',
        description: 'Bolo de Abacaxi com cobertura de leite condensado',
        in_diet: false,
        day: '2021-10-11',
        hour: '13:00'
      })
      .expect(200)
  })

  // Should not be able to edit a meal with a non-existing user
  it('should not be able to edit a meal with a non-existing user', async () => {
    const user_id = randomUUID()

    const response = await request(app.server)
      .put(`/users/${user_id}/meals/1/update`)
      .send({
        name: 'Bolo de Abacaxi',
        description: 'Bolo de Abacaxi com cobertura de leite condensado',
        in_diet: false
      })
      .expect(404)
  })

  // Should not be able to edit a non-existing meal
  it('should not be able to edit a non-existing meal', async () => {
    await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com'
      })
      .expect(201)

    const user = await knex('users').where({
      email: 'johndoe@example.com'
    }).first()

    const response = await request(app.server)
      .put(`/users/${user.id}/meals/1/update`)
      .send({
        name: 'Bolo de Abacaxi',
        description: 'Bolo de Abacaxi com cobertura de leite condensado',
        in_diet: false
      })
      .expect(404)
  })

  // Should be able to delete a meal
  it('should be able to delete a meal', async () => {
    await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com'
      })
      .expect(201)

    const user = await knex('users').where({ email: 'johndoe@example.com' }).first()


    await request(app.server)
      .post(`/users/${user.id}/meals/create`)
      .send({
        name: 'Bolo de cenoura',
        description: 'Bolo de cenoura com cobertura de chocolate',
        in_diet: true,
        day: '2021-10-10',
        hour: '12:00'
      })
      .expect(201)

    const meal = await knex('meals').where({ name: 'Bolo de cenoura' }).first()

    const response = await request(app.server)
      .delete(`/users/${user.id}/meals/${meal.id}/delete`)
      .expect(200)
  })

  // Should not be able to delete a meal with a non-existing user
  it('should not be able to delete a meal with a non-existing user', async () => {
    const user_id = randomUUID()

    const response = await request(app.server)
      .delete(`/users/${user_id}/meals/1/delete`)
      .expect(404)
  })

  // Should not be able to delete a non-existing meal
  it('should not be able to delete a non-existing meal', async () => {
    await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com'
      })
      .expect(201)

    const user = await knex('users').where({ email: 'johndoe@example.com' }).first()

    const response = await request(app.server)
      .delete(`/users/${user.id}/meals/1/delete`)
      .expect(404)
  })

  // Should be able to list all meals
  it('should be able to list all meals', async () => {
    await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com'
      })
      .expect(201)

    const user = await knex('users').where({
      email: 'johndoe@example.com'
    }).first()

    await request(app.server)
      .post(`/users/${user.id}/meals/create`)
      .send({
        name: 'Bolo de cenoura',
        description: 'Bolo de cenoura com cobertura de chocolate',
        in_diet: true,
      })

    await request(app.server)
      .post(`/users/${user.id}/meals/create`)
      .send({
        name: 'Bolo de Abacaxi',
        description: 'Bolo de Abacaxi com cobertura de leite condensado',
        in_diet: false
      })

    const response = await request(app.server)
      .get(`/users/${user.id}/meals`)
      .expect(200)
  })

  // Should not be able to list all meals with a non-existing user
  it('should not be able to list all meals with a non-existing user', async () => {
    const user_id = randomUUID()

    const response = await request(app.server)
      .get(`/users/${user_id}/meals`)
      .expect(404)
  })

  // Should be able to list a meal by id
  it('should be able to list a meal by id', async () => {
    await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com'
      })

    const user = await knex('users').where({
      email: 'johndoe@example.com'
    }).first()

    await request(app.server)
      .post(`/users/${user.id}/meals/create`)
      .send({
        name: 'Bolo de cenoura',
        description: 'Bolo de cenoura com cobertura de chocolate',
        in_diet: true,
      })

    const meal = await knex('meals').where({
      name: 'Bolo de cenoura'
    }).first()

    const response = await request(app.server)
      .get(`/users/${user.id}/meals/${meal.id}`)
      .expect(200)
  })

  // Should not be able to list a meal with a non-existing user
  it('should not be able to list a meal with a non-existing user', async () => {
    const user_id = randomUUID()

    const response = await request(app.server)
      .get(`/users/${user_id}/meals/1`)
      .expect(404)
  })

  // Should not be able to list a non-existing meal
  it('should not be able to list a non-existing meal', async () => {
    await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com'
      })

    const user = await knex('users').where({
      email: 'johndoe@example.com'
    }).first()

    const response = await request(app.server)
      .get(`/users/${user.id}/meals/1`)
      .expect(404)
  })

  // Should be able to list user metrics
  it('should be able to list user metrics', async () => {
    await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com'
      })

    const user = await knex('users').where({
      email: 'johndoe@example.com'
    }).first()

    await request(app.server)
      .post(`/users/${user.id}/meals/create`)
      .send({
        name: 'Bolo de cenoura',
        description: 'Bolo de cenoura com cobertura de chocolate',
        in_diet: true,
        day: '2021-10-10',
        hour: '12:00'
      })

    await request(app.server)
      .post(`/users/${user.id}/meals/create`)
      .send({
        name: 'Bolo de Abacaxi',
        description: 'Bolo de Abacaxi com cobertura de leite condensado',
        in_diet: false,
        day: '2021-10-11',
        hour: '12:00'
      })

    await request(app.server)
      .post(`/users/${user.id}/meals/create`)
      .send({
        name: 'Sanduíche Natural',
        description: 'Sanduíche Natural de frango',
        in_diet: true,
        day: '2021-10-11',
        hour: '12:00'
      })

    const response = await request(app.server)
      .get(`/users/${user.id}/metrics`)
      .expect(200)
  })

  // Should not be able to list user metrics with a non-existing user
  it('should not be able to list user metrics with a non-existing user', async () => {
    const user_id = randomUUID()

    const response = await request(app.server)
      .get(`/users/${user_id}/metrics`)
      .expect(404)
  })
})