import fastify from 'fastify'
import { knex } from "./database"
import { mealRoutes } from "./routes/meals"
import { userRoutes } from "./routes/users"

const app = fastify()

app.get('/', async () => {
  const tables = knex('sqlite_schema').select('*')
  return tables
})

app.register(userRoutes, { prefix: '/users' })


app.listen({
  port: 6969
}).then(() => {
  console.log('HTTP server listening at http://localhost:6969')
})