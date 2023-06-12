import { appRoutes } from "./routes";
import fastify from "fastify";

export const app = fastify()
app.register(appRoutes)