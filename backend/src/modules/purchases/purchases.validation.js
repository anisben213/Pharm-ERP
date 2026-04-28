const { z } = require('zod');

exports.createSchema = {
  body: z.object({
    supplierId: z.string().min(1),
    lines: z.array(z.object({
      productId: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
    })).min(1),
  }),
};
