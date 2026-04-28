const { z } = require('zod');

const roleEnum = z.enum([
  'ADMIN', 'PURCHASER', 'STOCK_MANAGER', 'WAREHOUSE_KEEPER', 'PRODUCTION_MANAGER', 'QUALITY_CONTROLLER', 'LAB_TECHNICIAN', 'SALES_AGENT',
]);

exports.createSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2),
    role: roleEnum,
  }),
};

exports.updateSchema = {
  body: z.object({
    fullName: z.string().min(2).optional(),
    role: roleEnum.optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8).optional(),
  }),
};
