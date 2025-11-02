import { z } from 'zod';
import dotenv from 'dotenv'

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['production', 'local']).default('local'),
    SERVER_PORT: z.coerce.number().default(5000),

    DATABASE_URL: z.string(),

    REDIS_HOST: z.string(),
    REDIS_PORT: z.string(),

    LOG_LEVEL: z.string(),

    JWT_SECRET: z.string(),
})

const result = envSchema.safeParse(process.env)

if (result.error) {
    console.log('Errors while validating env file...');
    console.log(z.prettifyError(result.error))
    process.exit(1)
}

export const ENV = result.data;