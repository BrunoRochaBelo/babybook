import { z } from "zod";
export const quotaSchema = z.object({
    storage: z.object({
        used: z.number(),
        limit: z.number()
    }),
    moments: z.object({
        used: z.number(),
        limit: z.number()
    }),
    recurrent: z.object({
        used: z.number(),
        limit: z.number()
    })
});
