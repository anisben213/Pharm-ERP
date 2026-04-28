const { z } = require('zod');

exports.inspectSchema = {
  body: z.object({
    batchId: z.string().min(1),
    result: z.enum(['PASSED', 'FAILED', 'PENDING']),
    notes: z.string().max(1000).optional(),
  }),
};
