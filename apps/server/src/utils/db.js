import { drizzle } from "drizzle-orm/node-postgres";
import { ENV } from "./env.js";
import * as schema from "../db/schema.js";

export const db = drizzle(ENV.DATABASE_URL, {
  schema,
});
