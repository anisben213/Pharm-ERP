const { z } = require('zod');

exports.createSchema = {
  body: z.object({
    productId: z.string().min(1),
    quantity: z.number().positive(),
  }),
};

exports.completeSchema = {
  body: z.object({
    consumedBatches: z.array(z.object({
      batchId: z.string().min(1),
      quantity: z.number().positive(),
    })).min(1),
    finishedBatchNumber: z.string().optional(),
    expiryDate: z.string().datetime().optional(),
  }),
};
