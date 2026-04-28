const { z } = require('zod');

exports.createSchema = {
  body: z.object({
    customerId: z.string().min(1),
    lines: z.array(z.object({
      batchId: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
    })).min(1),
  }),
};
