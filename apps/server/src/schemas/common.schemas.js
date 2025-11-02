import {z} from 'zod';

export const idSchema = z.uuidv4();

export const idParamsSchema = z.object({
    id: idSchema
})