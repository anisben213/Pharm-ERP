// Generates next sequential code: PREFIX-YYYY-XXX
const prisma = require('../config/db');

const FN = {
  RM: () => prisma.batch.findMany({ where: { batchType: 'RM' }, select: { batchNumber: true } }),
  LOT: () => prisma.batch.findMany({ where: { batchType: 'LOT' }, select: { batchNumber: true } }),
  PO: () => prisma.purchaseOrder.findMany({ select: { orderNumber: true } }),
  MO: () => prisma.manufacturingOrder.findMany({ select: { orderNumber: true } }),
  SO: () => prisma.salesOrder.findMany({ select: { orderNumber: true } }),
  DN: () => prisma.deliveryNote.findMany({ select: { noteNumber: true } }),
};

async function nextCode(prefix) {
  const year = new Date().getUTCFullYear();
  const fn = FN[prefix];
  if (!fn) throw new Error(`Unknown prefix ${prefix}`);
  const rows = await fn();
  const re = new RegExp(`^${prefix}-${year}-(\\d{3,})$`);
  let max = 0;
  for (const r of rows) {
    const num = r.batchNumber || r.orderNumber || r.noteNumber;
    const m = num && num.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const next = String(max + 1).padStart(3, '0');
  return `${prefix}-${year}-${next}`;
}

module.exports = { nextCode };
