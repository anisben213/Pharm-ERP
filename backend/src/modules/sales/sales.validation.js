const { z } = require('zod');

exports.createSchema = {
  body: z.object({
    customerId: z.string().min(1),
    lines: z.array(
      z.object({
        batchId:   z.string().optional(),
        productId: z.string().optional(),
        quantity:  z.number().positive(),
        unitPrice: z.number().nonnegative().optional().default(0),
      }).refine((d) => d.batchId || d.productId, {
        message: 'Each line needs batchId or productId',
      })
    ).min(1),
  }),
};
