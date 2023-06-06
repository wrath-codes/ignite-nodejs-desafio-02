import fastify from 'fastify'
import { knex } from "./database"

const app = fastify()

app.get('/', async () => {
  const tables = knex('sqlite_schema').select('*')
  return tables
})

app.listen({
  port: 6969
}).then(() => {
  console.log('HTTP server listening at http://localhost:6969')
})