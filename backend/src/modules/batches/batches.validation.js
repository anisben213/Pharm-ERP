const { z } = require('zod');

exports.updateStatusSchema = {
  body: z.object({
    status: z.enum([
      'CREATED','IN_QUARANTINE','APPROVED','REJECTED','IN_PRODUCTION','RELEASED','SOLD','RECALLED','EXPIRED',
    ]),
    version: z.number().int().nonnegative(),
  }),
};
