const { z } = require('zod');

exports.registerSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
    fullName: z.string().min(2).max(100),
    role: z
      .enum(['ADMIN', 'PURCHASER', 'STOCK_MANAGER', 'WAREHOUSE_KEEPER', 'PRODUCTION_MANAGER', 'QUALITY_CONTROLLER', 'LAB_TECHNICIAN', 'SALES_AGENT'])
      .optional(),
  }),
};

exports.loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
};
