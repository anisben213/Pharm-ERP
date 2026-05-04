/* eslint-disable no-console */
/**
 * Full-month demo seed — Inphamedis Pharmaceutical Laboratory
 * TIMELINE: April 1 -> April 30 -> May 1, 2026
 *
 * HIGHLIGHTS:
 *  - 5 purchase cycles (multiple suppliers)
 *  - All QC result types: PASSED, FAILED, PENDING
 *  - Expiry alerts: batches expiring in <15/25/60/75 days, and already expired
 *  - 3 NCR events with corrective actions
 *  - 1 batch RECALL triggered mid-month (pharmacovigilance)
 *  - 6 production orders (4 COMPLETED, 1 IN_PROGRESS, 1 PLANNED)
 *  - Full genealogy chains per finished batch
 *  - 10 sales orders spread over the month (all statuses)
 *  - Rich audit trail (35+ entries)
 *  - Ongoing: PO CONFIRMED state, batch still IN_QUARANTINE (pending QC retest)
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── helpers ────────────────────────────────────────────────────────────────
const BASE  = new Date(2026, 3, 1, 0, 0, 0); // Apr 1 2026
const TODAY = new Date(2026, 4, 1);           // May 1 2026 ("today" in the scenario)
const d = (day, h = 9, m = 0) =>
  new Date(BASE.getFullYear(), BASE.getMonth(), BASE.getDate() + day, h, m);
const expiryYears = (years) =>
  new Date(BASE.getFullYear() + years, BASE.getMonth(), BASE.getDate());
const expiresIn  = (days) => new Date(TODAY.getTime() + days * 86400000);
const expiriesAgo = (days) => new Date(TODAY.getTime() - days * 86400000);

// ─── reset ──────────────────────────────────────────────────────────────────
async function resetDemoData() {
  await prisma.auditLog.deleteMany({});
  await prisma.salesLine.deleteMany({});
  await prisma.salesOrder.deleteMany({});
  await prisma.qualityCheck.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.batchGenealogy.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.productionOrder.deleteMany({});
  await prisma.purchaseLine.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.bOMComponent.deleteMany({});
  await prisma.bOM.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
}

// ─── main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n  Inphamedis ERP — Full Month Seed (April 2026)\n');
  await resetDemoData();

  // ════════════════════════════════════════════════════════════
  // USERS
  // ════════════════════════════════════════════════════════════
  const adminPwd = await bcrypt.hash('Admin@123', 10);
  const userPwd  = await bcrypt.hash('User@123', 10);
  const [admin, purchaser, stockMgr, warehouse, prodMgr, qc, labTech, sales] = await Promise.all([
    prisma.user.create({ data: { email: 'admin@erp-pharm.local',      passwordHash: adminPwd, fullName: 'System Admin',     role: 'ADMIN' } }),
    prisma.user.create({ data: { email: 'purchaser@erp-pharm.local',  passwordHash: userPwd,  fullName: 'Pierre Purchaser', role: 'PURCHASER' } }),
    prisma.user.create({ data: { email: 'stock@erp-pharm.local',      passwordHash: userPwd,  fullName: 'Sam Stock',        role: 'STOCK_MANAGER' } }),
    prisma.user.create({ data: { email: 'warehouse@erp-pharm.local',  passwordHash: userPwd,  fullName: 'Wael Warehouse',   role: 'WAREHOUSE_KEEPER' } }),
    prisma.user.create({ data: { email: 'production@erp-pharm.local', passwordHash: userPwd,  fullName: 'Paula Production', role: 'PRODUCTION_MANAGER' } }),
    prisma.user.create({ data: { email: 'quality@erp-pharm.local',    passwordHash: userPwd,  fullName: 'Quincy Quality',   role: 'QUALITY_CONTROLLER' } }),
    prisma.user.create({ data: { email: 'lab@erp-pharm.local',        passwordHash: userPwd,  fullName: 'Lara Lab',         role: 'LAB_TECHNICIAN' } }),
    prisma.user.create({ data: { email: 'sales@erp-pharm.local',      passwordHash: userPwd,  fullName: 'Sarah Sales',      role: 'SALES_AGENT' } }),
  ]);
  console.log('checkmark 8 users');

  // ════════════════════════════════════════════════════════════
  // SUPPLIERS & CUSTOMERS
  // ════════════════════════════════════════════════════════════
  const [supChemPure, supBioSource, supPharmaMed, supEuroRaw] = await Promise.all([
    prisma.supplier.create({ data: { name: 'ChemPure SA',    email: 'supply@chempure.example',  phone: '+212-522-001122', address: 'Zone Industrielle Ain Sebaa, Casablanca, MA' } }),
    prisma.supplier.create({ data: { name: 'BioSource Ltd',  email: 'orders@biosource.example', phone: '+33-145-678900',  address: '14 Rue Garibaldi, Lyon, FR' } }),
    prisma.supplier.create({ data: { name: 'PharmaMed GmbH', email: 'export@pharmamed.example', phone: '+49-69-300400',   address: 'Industriepark Hoechst, Frankfurt, DE' } }),
    prisma.supplier.create({ data: { name: 'EuroRaw Pharma', email: 'sales@euroraw.example',    phone: '+351-21-900200',  address: 'Parque Industrial Leiria, Portugal' } }),
  ]);

  const [custCityHosp, custMediPharma, custGrandePharma, custPolyclinique, custPharmaCentrale, custRegionalHosp] = await Promise.all([
    prisma.customer.create({ data: { name: 'City Hospital Rabat',        email: 'pharmacy@cityhospital.example',  phone: '+212-537-112233', address: 'Avenue Mohammed V, Rabat, MA' } }),
    prisma.customer.create({ data: { name: 'MediPharma Chain',           email: 'purchasing@medipharma.example', phone: '+212-522-998877', address: 'Boulevard Zerktouni, Casablanca, MA' } }),
    prisma.customer.create({ data: { name: 'Grande Pharmacie Marrakech', email: 'admin@grandepharma.example',    phone: '+212-524-445566', address: 'Rue Bab Agnaou, Marrakech, MA' } }),
    prisma.customer.create({ data: { name: 'Polyclinique Atlas',         email: 'supplies@polyatlas.example',    phone: '+212-522-776655', address: 'Quartier Gauthier, Casablanca, MA' } }),
    prisma.customer.create({ data: { name: 'Pharmacie Centrale Fes',     email: 'commandes@pharmaFes.example',   phone: '+212-535-221100', address: 'Avenue Hassan II, Fes, MA' } }),
    prisma.customer.create({ data: { name: 'Regional Hospital Agadir',   email: 'pharma@rha.example',            phone: '+212-528-330011', address: 'Route Nationale, Agadir, MA' } }),
  ]);
  console.log('checkmark 4 suppliers, 6 customers');

  // ════════════════════════════════════════════════════════════
  // PRODUCTS
  // ════════════════════════════════════════════════════════════
  const [
    rmParaAPI, rmAmoxAPI, rmIbupAPI, rmStarch, rmMgSt, rmMCC,
    pkBlister, pkCapsules,
    fpPara500, fpAmox500, fpIbup400,
  ] = await Promise.all([
    prisma.product.create({ data: { sku: 'RM-PARA-001', name: 'Paracetamol API',               type: 'RAW_MATERIAL',     unit: 'kg',   minLevel: 50,  description: 'Active pharmaceutical ingredient - USP grade' } }),
    prisma.product.create({ data: { sku: 'RM-AMOX-001', name: 'Amoxicillin Trihydrate API',    type: 'RAW_MATERIAL',     unit: 'kg',   minLevel: 30,  description: 'Beta-lactam antibiotic API - EP grade' } }),
    prisma.product.create({ data: { sku: 'RM-IBUP-001', name: 'Ibuprofen API',                 type: 'RAW_MATERIAL',     unit: 'kg',   minLevel: 30,  description: 'NSAID active ingredient - USP grade' } }),
    prisma.product.create({ data: { sku: 'RM-STAR-001', name: 'Corn Starch Excipient',         type: 'RAW_MATERIAL',     unit: 'kg',   minLevel: 100, description: 'Pharmaceutical grade filler/binder' } }),
    prisma.product.create({ data: { sku: 'RM-MGST-001', name: 'Magnesium Stearate',            type: 'RAW_MATERIAL',     unit: 'kg',   minLevel: 20,  description: 'Lubricant for capsule/tablet formulations' } }),
    prisma.product.create({ data: { sku: 'RM-MCC-001',  name: 'Microcrystalline Cellulose',    type: 'RAW_MATERIAL',     unit: 'kg',   minLevel: 80,  description: 'MCC PH-102 binder/disintegrant' } }),
    prisma.product.create({ data: { sku: 'PK-BLIS-001', name: 'Blister Pack 10 ct',            type: 'PACKAGING',        unit: 'unit', minLevel: 500, description: 'Aluminium-PVC blister strip, 10 tablets' } }),
    prisma.product.create({ data: { sku: 'PK-CAPS-001', name: 'Hard Gelatin Capsule Shell 00', type: 'PACKAGING',        unit: 'unit', minLevel: 500, description: 'Size 00 hard gelatin empty capsules' } }),
    prisma.product.create({ data: { sku: 'FP-PARA-500', name: 'Paracetamol 500 mg tablets',    type: 'FINISHED_PRODUCT', unit: 'box',  minLevel: 200, description: '10 tablets x 500mg per box' } }),
    prisma.product.create({ data: { sku: 'FP-AMOX-500', name: 'Amoxicillin 500 mg capsules',   type: 'FINISHED_PRODUCT', unit: 'box',  minLevel: 150, description: '10 capsules x 500mg per box' } }),
    prisma.product.create({ data: { sku: 'FP-IBUP-400', name: 'Ibuprofen 400 mg tablets',      type: 'FINISHED_PRODUCT', unit: 'box',  minLevel: 150, description: '10 tablets x 400mg per box' } }),
  ]);
  console.log('checkmark 11 products');

  // ════════════════════════════════════════════════════════════
  // BOMs
  // ════════════════════════════════════════════════════════════
  await Promise.all([
    prisma.bOM.create({ data: { finishedProductId: fpPara500.id, version: 1, components: { create: [
      { productId: rmParaAPI.id, quantity: 0.5  },
      { productId: rmStarch.id,  quantity: 0.15 },
      { productId: rmMCC.id,     quantity: 0.05 },
      { productId: pkBlister.id, quantity: 10   },
    ]}}}),
    prisma.bOM.create({ data: { finishedProductId: fpAmox500.id, version: 1, components: { create: [
      { productId: rmAmoxAPI.id,  quantity: 0.5  },
      { productId: rmMgSt.id,     quantity: 0.05 },
      { productId: pkCapsules.id, quantity: 10   },
    ]}}}),
    prisma.bOM.create({ data: { finishedProductId: fpIbup400.id, version: 1, components: { create: [
      { productId: rmIbupAPI.id, quantity: 0.4  },
      { productId: rmStarch.id,  quantity: 0.15 },
      { productId: rmMCC.id,     quantity: 0.05 },
      { productId: pkBlister.id, quantity: 10   },
    ]}}}),
  ]);
  console.log('checkmark 3 BOMs');

  // ════════════════════════════════════════════════════════════
  // WEEK 1: Apr 1-5 — First purchase cycle (ChemPure)
  // ════════════════════════════════════════════════════════════
  const po1 = await prisma.purchaseOrder.create({
    data: {
      reference: 'PO-2026-0001', supplierId: supChemPure.id, status: 'RECEIVED',
      createdById: purchaser.id, createdAt: d(0, 9),
      lines: { create: [
        { productId: rmParaAPI.id, quantity: 200,   unitPrice: 50.00 },
        { productId: rmStarch.id,  quantity: 100,   unitPrice: 4.50  },
        { productId: rmMCC.id,     quantity: 60,    unitPrice: 6.00  },
        { productId: pkBlister.id, quantity: 30000, unitPrice: 0.08  },
      ]},
    },
    include: { lines: true },
  });

  const [bParaAPI1, bStarch1, bMCC1, bBlister1] = await Promise.all([
    prisma.batch.create({ data: { batchNumber: 'B-API-2026-001',  productId: rmParaAPI.id, quantity: 200,   remainingQty: 200,   manufacturedAt: d(2, 8), expiryDate: expiryYears(3),  status: 'IN_QUARANTINE', purchaseLineId: po1.lines[0].id, createdAt: d(2, 10) }}),
    prisma.batch.create({ data: { batchNumber: 'B-STAR-2026-001', productId: rmStarch.id,  quantity: 100,   remainingQty: 100,   manufacturedAt: d(2, 8), expiryDate: expiryYears(5),  status: 'IN_QUARANTINE', purchaseLineId: po1.lines[1].id, createdAt: d(2, 10) }}),
    prisma.batch.create({ data: { batchNumber: 'B-MCC-2026-001',  productId: rmMCC.id,     quantity: 60,    remainingQty: 60,    manufacturedAt: d(2, 8), expiryDate: expiryYears(5),  status: 'IN_QUARANTINE', purchaseLineId: po1.lines[2].id, createdAt: d(2, 10) }}),
    prisma.batch.create({ data: { batchNumber: 'B-BLIS-2026-001', productId: pkBlister.id, quantity: 30000, remainingQty: 30000, manufacturedAt: d(2, 8), expiryDate: expiryYears(10), status: 'IN_QUARANTINE', purchaseLineId: po1.lines[3].id, createdAt: d(2, 10) }}),
  ]);
  await prisma.stockMovement.createMany({ data: [
    { batchId: bParaAPI1.id, type: 'IN_PURCHASE', quantity: 200,   reference: 'PO-2026-0001', createdAt: d(2, 10) },
    { batchId: bStarch1.id,  type: 'IN_PURCHASE', quantity: 100,   reference: 'PO-2026-0001', createdAt: d(2, 10) },
    { batchId: bMCC1.id,     type: 'IN_PURCHASE', quantity: 60,    reference: 'PO-2026-0001', createdAt: d(2, 10) },
    { batchId: bBlister1.id, type: 'IN_PURCHASE', quantity: 30000, reference: 'PO-2026-0001', createdAt: d(2, 10) },
  ]});

  await prisma.qualityCheck.createMany({ data: [
    { batchId: bParaAPI1.id, inspectedById: labTech.id, result: 'PASSED', notes: 'Assay 99.4% (spec 98-102%). pH 6.8. White crystalline powder. CoA reviewed.', inspectedAt: d(2, 14) },
    { batchId: bStarch1.id,  inspectedById: labTech.id, result: 'PASSED', notes: 'Loss on drying 11.8% (spec <=14%). White free-flowing powder. pH 5.1.', inspectedAt: d(2, 14, 20) },
    { batchId: bMCC1.id,     inspectedById: labTech.id, result: 'PASSED', notes: 'Water content 4.1% (spec <=7%). pH 6.4. Bulk density 0.29 g/mL.', inspectedAt: d(2, 14, 40) },
    { batchId: bBlister1.id, inspectedById: labTech.id, result: 'PASSED', notes: 'Dimensional check passed. Seal integrity OK. CoA confirmed.', inspectedAt: d(2, 15) },
    { batchId: bParaAPI1.id, inspectedById: qc.id, result: 'PASSED', notes: 'All specs met. APPROVED for production.', inspectedAt: d(3, 10) },
    { batchId: bStarch1.id,  inspectedById: qc.id, result: 'PASSED', notes: 'APPROVED for production use.', inspectedAt: d(3, 10, 15) },
    { batchId: bMCC1.id,     inspectedById: qc.id, result: 'PASSED', notes: 'APPROVED for production use.', inspectedAt: d(3, 10, 30) },
    { batchId: bBlister1.id, inspectedById: qc.id, result: 'PASSED', notes: 'APPROVED. Packaging material released.', inspectedAt: d(3, 10, 45) },
  ]});
  await prisma.batch.updateMany({ where: { id: { in: [bParaAPI1.id, bStarch1.id, bMCC1.id, bBlister1.id] } }, data: { status: 'APPROVED', version: { increment: 1 } } });
  console.log('checkmark Week 1: PO-0001 received & APPROVED (4 batches)');

  // ════════════════════════════════════════════════════════════
  // WEEK 1: Production MO-0001 — Paracetamol 500mg x300 boxes
  // ════════════════════════════════════════════════════════════
  const mo1 = await prisma.productionOrder.create({ data: {
    reference: 'MO-2026-0001', productId: fpPara500.id, quantity: 300, status: 'COMPLETED',
    createdById: prodMgr.id, plannedDate: d(3, 8), startedAt: d(3, 8, 30), completedAt: d(4, 16), createdAt: d(3, 8),
  }});
  const [lot001, lot002, lot003] = await Promise.all([
    prisma.batch.create({ data: { batchNumber: 'LOT-2026-001', productId: fpPara500.id, quantity: 100, remainingQty: 100, manufacturedAt: d(4, 16), expiryDate: expiryYears(2), status: 'IN_QUARANTINE', productionOrderId: mo1.id }}),
    prisma.batch.create({ data: { batchNumber: 'LOT-2026-002', productId: fpPara500.id, quantity: 100, remainingQty: 100, manufacturedAt: d(4, 16), expiryDate: expiryYears(2), status: 'IN_QUARANTINE', productionOrderId: mo1.id }}),
    prisma.batch.create({ data: { batchNumber: 'LOT-2026-003', productId: fpPara500.id, quantity: 100, remainingQty: 100, manufacturedAt: d(4, 16), expiryDate: expiryYears(2), status: 'IN_QUARANTINE', productionOrderId: mo1.id }}),
  ]);
  await Promise.all([
    prisma.batch.update({ where: { id: bParaAPI1.id }, data: { remainingQty: { decrement: 150  }, version: { increment: 1 } }}),
    prisma.batch.update({ where: { id: bStarch1.id  }, data: { remainingQty: { decrement: 45   }, version: { increment: 1 } }}),
    prisma.batch.update({ where: { id: bMCC1.id     }, data: { remainingQty: { decrement: 15   }, version: { increment: 1 } }}),
    prisma.batch.update({ where: { id: bBlister1.id }, data: { remainingQty: { decrement: 3000 }, version: { increment: 1 } }}),
  ]);
  await prisma.stockMovement.createMany({ data: [
    { batchId: bParaAPI1.id, type: 'OUT_PRODUCTION', quantity: 150,  reference: 'MO-2026-0001', createdAt: d(4, 16) },
    { batchId: bStarch1.id,  type: 'OUT_PRODUCTION', quantity: 45,   reference: 'MO-2026-0001', createdAt: d(4, 16) },
    { batchId: bMCC1.id,     type: 'OUT_PRODUCTION', quantity: 15,   reference: 'MO-2026-0001', createdAt: d(4, 16) },
    { batchId: bBlister1.id, type: 'OUT_PRODUCTION', quantity: 3000, reference: 'MO-2026-0001', createdAt: d(4, 16) },
    { batchId: lot001.id,    type: 'IN_PRODUCTION',  quantity: 100,  reference: 'MO-2026-0001', createdAt: d(4, 16) },
    { batchId: lot002.id,    type: 'IN_PRODUCTION',  quantity: 100,  reference: 'MO-2026-0001', createdAt: d(4, 16) },
    { batchId: lot003.id,    type: 'IN_PRODUCTION',  quantity: 100,  reference: 'MO-2026-0001', createdAt: d(4, 16) },
  ]});
  await prisma.batchGenealogy.createMany({ data: [
    { parentBatchId: bParaAPI1.id, childBatchId: lot001.id, consumedQty: 50 },
    { parentBatchId: bStarch1.id,  childBatchId: lot001.id, consumedQty: 15 },
    { parentBatchId: bMCC1.id,     childBatchId: lot001.id, consumedQty: 5  },
    { parentBatchId: bBlister1.id, childBatchId: lot001.id, consumedQty: 1000 },
    { parentBatchId: bParaAPI1.id, childBatchId: lot002.id, consumedQty: 50 },
    { parentBatchId: bStarch1.id,  childBatchId: lot002.id, consumedQty: 15 },
    { parentBatchId: bMCC1.id,     childBatchId: lot002.id, consumedQty: 5  },
    { parentBatchId: bBlister1.id, childBatchId: lot002.id, consumedQty: 1000 },
    { parentBatchId: bParaAPI1.id, childBatchId: lot003.id, consumedQty: 50 },
    { parentBatchId: bStarch1.id,  childBatchId: lot003.id, consumedQty: 15 },
    { parentBatchId: bMCC1.id,     childBatchId: lot003.id, consumedQty: 5  },
    { parentBatchId: bBlister1.id, childBatchId: lot003.id, consumedQty: 1000 },
  ]});

  // QC on finished batches — LOT-001/002 PASS, LOT-003 FAILS dissolution (NCR-2026-0001)
  await prisma.qualityCheck.createMany({ data: [
    { batchId: lot001.id, inspectedById: labTech.id, result: 'PASSED', notes: 'Dissolution 98.2% at 45 min (spec >80%). Content uniformity CV 1.2%. Hardness 7.2 kP.', inspectedAt: d(5, 9) },
    { batchId: lot002.id, inspectedById: labTech.id, result: 'PASSED', notes: 'Dissolution 97.8% at 45 min. Content uniformity CV 1.4%. Hardness 7.5 kP.', inspectedAt: d(5, 9, 30) },
    { batchId: lot003.id, inspectedById: labTech.id, result: 'FAILED', notes: 'Dissolution FAILED: 72.4% at 45 min (spec >80%). Possible granulation overheating. NCR-2026-0001 raised.', inspectedAt: d(5, 10) },
    { batchId: lot001.id, inspectedById: qc.id, result: 'PASSED', notes: 'CofA-2026-001 issued. RELEASED for distribution.', inspectedAt: d(5, 14) },
    { batchId: lot002.id, inspectedById: qc.id, result: 'PASSED', notes: 'CofA-2026-002 issued. RELEASED for distribution.', inspectedAt: d(5, 14, 20) },
    { batchId: lot003.id, inspectedById: qc.id, result: 'FAILED', notes: 'REJECTED — dissolution 72.4% fails BP spec. NCR-2026-0001. Batch quarantined. Reprocessing evaluation initiated.', inspectedAt: d(5, 15) },
  ]});
  await Promise.all([
    prisma.batch.update({ where: { id: lot001.id }, data: { status: 'RELEASED', version: { increment: 1 } }}),
    prisma.batch.update({ where: { id: lot002.id }, data: { status: 'RELEASED', version: { increment: 1 } }}),
    prisma.batch.update({ where: { id: lot003.id }, data: { status: 'REJECTED', version: { increment: 1 } }}),
  ]);
  console.log('checkmark Week 1: MO-0001 done — LOT-001,002 RELEASED | LOT-003 REJECTED (dissolution NCR-2026-0001)');

  // ════════════════════════════════════════════════════════════
  // WEEK 2: Apr 7-11 — PO-0002 (BioSource) Amoxicillin + IBUP API
  // ════════════════════════════════════════════════════════════
  const po2 = await prisma.purchaseOrder.create({
    data: {
      reference: 'PO-2026-0002', supplierId: supBioSource.id, status: 'RECEIVED',
      createdById: purchaser.id, createdAt: d(6, 9),
      lines: { create: [
        { productId: rmAmoxAPI.id,  quantity: 150,   unitPrice: 75.00 },
        { productId: rmIbupAPI.id,  quantity: 100,   unitPrice: 45.00 },
        { productId: pkCapsules.id, quantity: 20000, unitPrice: 0.05  },
        { productId: rmMgSt.id,     quantity: 50,    unitPrice: 8.00  },
      ]},
    },
    include: { lines: true },
  });

  const [bAmoxAPI1, bIbupAPI1, bCaps1, bMgSt1] = await Promise.all([
    prisma.batch.create({ data: { batchNumber: 'B-AMOX-2026-001', productId: rmAmoxAPI.id,  quantity: 150,   remainingQty: 150,   manufacturedAt: d(7, 8), expiryDate: expiryYears(3), status: 'IN_QUARANTINE', purchaseLineId: po2.lines[0].id, createdAt: d(7, 10) }}),
    // EXPIRY ALERT: expires in 25 days — triggers alert
    prisma.batch.create({ data: { batchNumber: 'B-IBUP-2026-001', productId: rmIbupAPI.id,  quantity: 100,   remainingQty: 100,   manufacturedAt: d(7, 8), expiryDate: expiresIn(25),  status: 'IN_QUARANTINE', purchaseLineId: po2.lines[1].id, createdAt: d(7, 10) }}),
    prisma.batch.create({ data: { batchNumber: 'B-CAPS-2026-001', productId: pkCapsules.id, quantity: 20000, remainingQty: 20000, manufacturedAt: d(7, 8), expiryDate: expiryYears(5), status: 'IN_QUARANTINE', purchaseLineId: po2.lines[2].id, createdAt: d(7, 10) }}),
    prisma.batch.create({ data: { batchNumber: 'B-MGST-2026-001', productId: rmMgSt.id,     quantity: 50,    remainingQty: 50,    manufacturedAt: d(7, 8), expiryDate: expiryYears(5), status: 'IN_QUARANTINE', purchaseLineId: po2.lines[3].id, createdAt: d(7, 10) }}),
  ]);
  await prisma.stockMovement.createMany({ data: [
    { batchId: bAmoxAPI1.id, type: 'IN_PURCHASE', quantity: 150,   reference: 'PO-2026-0002', createdAt: d(7, 10) },
    { batchId: bIbupAPI1.id, type: 'IN_PURCHASE', quantity: 100,   reference: 'PO-2026-0002', createdAt: d(7, 10) },
    { batchId: bCaps1.id,    type: 'IN_PURCHASE', quantity: 20000, reference: 'PO-2026-0002', createdAt: d(7, 10) },
    { batchId: bMgSt1.id,    type: 'IN_PURCHASE', quantity: 50,    reference: 'PO-2026-0002', createdAt: d(7, 10) },
  ]});
  await prisma.qualityCheck.createMany({ data: [
    { batchId: bAmoxAPI1.id, inspectedById: labTech.id, result: 'PASSED', notes: 'HPLC assay 99.1% (spec 98-102%). Specific rotation +285 deg. White powder.', inspectedAt: d(7, 13) },
    { batchId: bIbupAPI1.id, inspectedById: labTech.id, result: 'PASSED', notes: 'HPLC assay 98.3% (spec 98-102%). NOTE: near lower limit. Batch close to expiry — FEFO priority.', inspectedAt: d(7, 13, 30) },
    { batchId: bCaps1.id,    inspectedById: labTech.id, result: 'PASSED', notes: 'Visual OK. Moisture 11.9% (spec <=14%). Dimensional check passed.', inspectedAt: d(7, 14) },
    { batchId: bMgSt1.id,    inspectedById: labTech.id, result: 'PASSED', notes: 'Loss on drying 0.2% (spec <=2%). White fine powder.', inspectedAt: d(7, 14, 30) },
    { batchId: bAmoxAPI1.id, inspectedById: qc.id, result: 'PASSED', notes: 'APPROVED for production.', inspectedAt: d(8, 10) },
    { batchId: bIbupAPI1.id, inspectedById: qc.id, result: 'PASSED', notes: 'APPROVED — prioritise for MO-2026-0003 (expiry alert: 25 days). Stock alert raised.', inspectedAt: d(8, 10, 20) },
    { batchId: bCaps1.id,    inspectedById: qc.id, result: 'PASSED', notes: 'APPROVED for production use.', inspectedAt: d(8, 10, 40) },
    { batchId: bMgSt1.id,    inspectedById: qc.id, result: 'PASSED', notes: 'APPROVED for production use.', inspectedAt: d(8, 11) },
  ]});
  await prisma.batch.updateMany({ where: { id: { in: [bAmoxAPI1.id, bIbupAPI1.id, bCaps1.id, bMgSt1.id] } }, data: { status: 'APPROVED', version: { increment: 1 } } });
  console.log('checkmark Week 2: PO-0002 received & APPROVED (IBUP batch near expiry 25 days)');

  // Production MO-0002 — Amoxicillin 500mg x200 boxes
  const mo2 = await prisma.productionOrder.create({ data: {
    reference: 'MO-2026-0002', productId: fpAmox500.id, quantity: 200, status: 'COMPLETED',
    createdById: prodMgr.id, plannedDate: d(8, 8), startedAt: d(8, 8, 30), completedAt: d(9, 16), createdAt: d(8, 8),
  }});
  const [lot004, lot005] = await Promise.all([
    prisma.batch.create({ data: { batchNumber: 'LOT-2026-004', productId: fpAmox500.id, quantity: 100, remainingQty: 100, manufacturedAt: d(9, 16), expiryDate: expiryYears(2), status: 'IN_QUARANTINE', productionOrderId: mo2.id }}),
    prisma.batch.create({ data: { batchNumber: 'LOT-2026-005', productId: fpAmox500.id, quantity: 100, remainingQty: 100, manufacturedAt: d(9, 16), expiryDate: expiryYears(2), status: 'IN_QUARANTINE', productionOrderId: mo2.id }}),
  ]);
  await Promise.all([
    prisma.batch.update({ where: { id: bAmoxAPI1.id }, data: { remainingQty: { decrement: 100  }, version: { increment: 1 } }}),
    prisma.batch.update({ where: { id: bMgSt1.id    }, data: { remainingQty: { decrement: 10   }, version: { increment: 1 } }}),
    prisma.batch.update({ where: { id: bCaps1.id    }, data: { remainingQty: { decrement: 2000 }, version: { increment: 1 } }}),
  ]);
  await prisma.stockMovement.createMany({ data: [
    { batchId: bAmoxAPI1.id, type: 'OUT_PRODUCTION', quantity: 100,  reference: 'MO-2026-0002', createdAt: d(9, 16) },
    { batchId: bMgSt1.id,    type: 'OUT_PRODUCTION', quantity: 10,   reference: 'MO-2026-0002', createdAt: d(9, 16) },
    { batchId: bCaps1.id,    type: 'OUT_PRODUCTION', quantity: 2000, reference: 'MO-2026-0002', createdAt: d(9, 16) },
    { batchId: lot004.id,    type: 'IN_PRODUCTION',  quantity: 100,  reference: 'MO-2026-0002', createdAt: d(9, 16) },
    { batchId: lot005.id,    type: 'IN_PRODUCTION',  quantity: 100,  reference: 'MO-2026-0002', createdAt: d(9, 16) },
  ]});
  await prisma.batchGenealogy.createMany({ data: [
    { parentBatchId: bAmoxAPI1.id, childBatchId: lot004.id, consumedQty: 50 },
    { parentBatchId: bMgSt1.id,    childBatchId: lot004.id, consumedQty: 5  },
    { parentBatchId: bCaps1.id,    childBatchId: lot004.id, consumedQty: 1000 },
    { parentBatchId: bAmoxAPI1.id, childBatchId: lot005.id, consumedQty: 50 },
    { parentBatchId: bMgSt1.id,    childBatchId: lot005.id, consumedQty: 5  },
    { parentBatchId: bCaps1.id,    childBatchId: lot005.id, consumedQty: 1000 },
  ]});
  await prisma.qualityCheck.createMany({ data: [
    { batchId: lot004.id, inspectedById: labTech.id, result: 'PASSED', notes: 'Assay 98.9% (spec 90-120%). Dissolution 96.1% at 60 min. White oblong capsules.', inspectedAt: d(10, 9) },
    { batchId: lot005.id, inspectedById: labTech.id, result: 'PASSED', notes: 'Assay 99.1% (spec 90-120%). Dissolution 97.2% at 60 min.', inspectedAt: d(10, 9, 30) },
    { batchId: lot004.id, inspectedById: qc.id, result: 'PASSED', notes: 'CofA-2026-004 issued. RELEASED for distribution.', inspectedAt: d(10, 14) },
    { batchId: lot005.id, inspectedById: qc.id, result: 'PASSED', notes: 'CofA-2026-005 issued. RELEASED for distribution.', inspectedAt: d(10, 14, 30) },
  ]});
  await prisma.batch.updateMany({ where: { id: { in: [lot004.id, lot005.id] } }, data: { status: 'RELEASED', version: { increment: 1 } } });
  console.log('checkmark Week 2: MO-0002 done — LOT-004,005 RELEASED');

  // ════════════════════════════════════════════════════════════
  // WEEK 2: First sales orders
  // ════════════════════════════════════════════════════════════
  const so1 = await prisma.salesOrder.create({ data: {
    reference: 'SO-2026-0001', customerId: custCityHosp.id, status: 'DELIVERED',
    createdById: sales.id, createdAt: d(9, 11),
    lines: { create: [{ productId: fpPara500.id, batchId: lot001.id, quantity: 80, unitPrice: 14.50 }] },
  }});
  await prisma.batch.update({ where: { id: lot001.id }, data: { remainingQty: { decrement: 80 }, version: { increment: 1 } }});
  await prisma.stockMovement.create({ data: { batchId: lot001.id, type: 'OUT_SALES', quantity: 80, reference: 'SO-2026-0001', createdAt: d(9, 16) }});

  const so2 = await prisma.salesOrder.create({ data: {
    reference: 'SO-2026-0002', customerId: custMediPharma.id, status: 'DELIVERED',
    createdById: sales.id, createdAt: d(10, 10),
    lines: { create: [
      { productId: fpAmox500.id, batchId: lot004.id, quantity: 60, unitPrice: 18.00 },
      { productId: fpPara500.id, batchId: lot002.id, quantity: 40, unitPrice: 14.50 },
    ]},
  }});
  await Promise.all([
    prisma.batch.update({ where: { id: lot004.id }, data: { remainingQty: { decrement: 60 }, version: { increment: 1 } }}),
    prisma.batch.update({ where: { id: lot002.id }, data: { remainingQty: { decrement: 40 }, version: { increment: 1 } }}),
  ]);
  await prisma.stockMovement.createMany({ data: [
    { batchId: lot004.id, type: 'OUT_SALES', quantity: 60, reference: 'SO-2026-0002', createdAt: d(11, 10) },
    { batchId: lot002.id, type: 'OUT_SALES', quantity: 40, reference: 'SO-2026-0002', createdAt: d(11, 10) },
  ]});
  console.log('checkmark Week 2: SO-001 DELIVERED (City Hospital Para), SO-002 DELIVERED (MediPharma Amox+Para)');

  // ════════════════════════════════════════════════════════════
  // WEEK 3: Apr 14-18 — PO-0003 (EuroRaw) — NCR on Starch
  // ════════════════════════════════════════════════════════════
  const po3 = await prisma.purchaseOrder.create({
    data: {
      reference: 'PO-2026-0003', supplierId: supEuroRaw.id, status: 'RECEIVED',
      createdById: purchaser.id, createdAt: d(13, 9),
      lines: { create: [
        { productId: rmStarch.id,  quantity: 80,    unitPrice: 4.20 },
        { productId: pkBlister.id, quantity: 20000, unitPrice: 0.08 },
      ]},
    },
    include: { lines: true },
  });
  // EXPIRY ALERT: Starch expires in 60 days
  const [bStarch2, bBlister2] = await Promise.all([
    prisma.batch.create({ data: { batchNumber: 'B-STAR-2026-002', productId: rmStarch.id,  quantity: 80,    remainingQty: 80,    manufacturedAt: d(13, 8), expiryDate: expiresIn(60),   status: 'IN_QUARANTINE', purchaseLineId: po3.lines[0].id, createdAt: d(14, 10) }}),
    prisma.batch.create({ data: { batchNumber: 'B-BLIS-2026-002', productId: pkBlister.id, quantity: 20000, remainingQty: 20000, manufacturedAt: d(13, 8), expiryDate: expiryYears(10), status: 'IN_QUARANTINE', purchaseLineId: po3.lines[1].id, createdAt: d(14, 10) }}),
  ]);
  await prisma.stockMovement.createMany({ data: [
    { batchId: bStarch2.id,  type: 'IN_PURCHASE', quantity: 80,    reference: 'PO-2026-0003', createdAt: d(14, 10) },
    { batchId: bBlister2.id, type: 'IN_PURCHASE', quantity: 20000, reference: 'PO-2026-0003', createdAt: d(14, 10) },
  ]});

  // Starch FAILS moisture — NCR-2026-0002
  await prisma.qualityCheck.createMany({ data: [
    { batchId: bStarch2.id,  inspectedById: labTech.id, result: 'FAILED', notes: 'Loss on drying 16.8% OUT OF SPEC (spec <=14%). Possible moisture ingress in transit. NCR-2026-0002 raised.', inspectedAt: d(14, 14) },
    { batchId: bBlister2.id, inspectedById: labTech.id, result: 'PASSED', notes: 'Dimensional check OK. Seal integrity confirmed. CoA reviewed.', inspectedAt: d(14, 15) },
    { batchId: bStarch2.id,  inspectedById: qc.id, result: 'FAILED', notes: 'REJECTED — LoD 16.8% fails spec. NCR-2026-0002 opened. EuroRaw notified. Return shipment initiated.', inspectedAt: d(15, 9) },
    { batchId: bBlister2.id, inspectedById: qc.id, result: 'PASSED', notes: 'APPROVED. Packaging material released for production.', inspectedAt: d(15, 9, 20) },
  ]});
  await prisma.batch.update({ where: { id: bStarch2.id  }, data: { status: 'REJECTED', version: { increment: 1 } }});
  await prisma.batch.update({ where: { id: bBlister2.id }, data: { status: 'APPROVED', version: { increment: 1 } }});
  console.log('checkmark Week 3: PO-0003 — Starch REJECTED (LoD 16.8% NCR-2026-0002), Blister APPROVED');

  // Production MO-0003 — Ibuprofen 400mg x200 boxes (uses near-expiry IBUP API)
  const mo3 = await prisma.productionOrder.create({ data: {
    reference: 'MO-2026-0003', productId: fpIbup400.id, quantity: 200, status: 'COMPLETED',
    createdById: prodMgr.id, plannedDate: d(14, 8), startedAt: d(15, 8, 30), completedAt: d(16, 16), createdAt: d(14, 8),
  }});
  const [lot006, lot007] = await Promise.all([
    // EXPIRY ALERT: finished product — 75 days to expiry
    prisma.batch.create({ data: { batchNumber: 'LOT-2026-006', productId: fpIbup400.id, quantity: 100, remainingQty: 100, manufacturedAt: d(16, 16), expiryDate: expiresIn(75), status: 'IN_QUARANTINE', productionOrderId: mo3.id }}),
    prisma.batch.create({ data: { batchNumber: 'LOT-2026-007', productId: fpIbup400.id, quantity: 100, remainingQty: 100, manufacturedAt: d(16, 16), expiryDate: expiresIn(75), status: 'IN_QUARANTINE', productionOrderId: mo3.id }}),
  ]);
  await Promise.all([
    prisma.batch.update({ where: { id: bIbupAPI1.id }, data: { remainingQty: { decrement: 80   }, version: { increment: 1 } }}),
    prisma.batch.update({ where: { id: bStarch1.id  }, data: { remainingQty: { decrement: 30   }, version: { increment: 1 } }}),
    prisma.batch.update({ where: { id: bMCC1.id     }, data: { remainingQty: { decrement: 10   }, version: { increment: 1 } }}),
    prisma.batch.update({ where: { id: bBlister2.id }, data: { remainingQty: { decrement: 2000 }, version: { increment: 1 } }}),
  ]);
  await prisma.stockMovement.createMany({ data: [
    { batchId: bIbupAPI1.id, type: 'OUT_PRODUCTION', quantity: 80,   reference: 'MO-2026-0003', createdAt: d(16, 16) },
    { batchId: bStarch1.id,  type: 'OUT_PRODUCTION', quantity: 30,   reference: 'MO-2026-0003', createdAt: d(16, 16) },
    { batchId: bMCC1.id,     type: 'OUT_PRODUCTION', quantity: 10,   reference: 'MO-2026-0003', createdAt: d(16, 16) },
    { batchId: bBlister2.id, type: 'OUT_PRODUCTION', quantity: 2000, reference: 'MO-2026-0003', createdAt: d(16, 16) },
    { batchId: lot006.id,    type: 'IN_PRODUCTION',  quantity: 100,  reference: 'MO-2026-0003', createdAt: d(16, 16) },
    { batchId: lot007.id,    type: 'IN_PRODUCTION',  quantity: 100,  reference: 'MO-2026-0003', createdAt: d(16, 16) },
  ]});
  await prisma.batchGenealogy.createMany({ data: [
    { parentBatchId: bIbupAPI1.id, childBatchId: lot006.id, consumedQty: 40 },
    { parentBatchId: bStarch1.id,  childBatchId: lot006.id, consumedQty: 15 },
    { parentBatchId: bMCC1.id,     childBatchId: lot006.id, consumedQty: 5  },
    { parentBatchId: bBlister2.id, childBatchId: lot006.id, consumedQty: 1000 },
    { parentBatchId: bIbupAPI1.id, childBatchId: lot007.id, consumedQty: 40 },
    { parentBatchId: bStarch1.id,  childBatchId: lot007.id, consumedQty: 15 },
    { parentBatchId: bMCC1.id,     childBatchId: lot007.id, consumedQty: 5  },
    { parentBatchId: bBlister2.id, childBatchId: lot007.id, consumedQty: 1000 },
  ]});

  // QC: LOT-006 PASS, LOT-007 marginal — PENDING retest (stays IN_QUARANTINE)
  await prisma.qualityCheck.createMany({ data: [
    { batchId: lot006.id, inspectedById: labTech.id, result: 'PASSED', notes: 'Assay 99.2% (spec 95-105%). Dissolution 95.8% at 30 min (spec >=70%). Disintegration 4.2 min.', inspectedAt: d(17, 9) },
    { batchId: lot007.id, inspectedById: labTech.id, result: 'FAILED', notes: 'Dissolution 68.1% at 30 min — marginally below spec. Small sample size (n=6). Requesting full retest n=12.', inspectedAt: d(17, 10) },
    { batchId: lot006.id, inspectedById: qc.id, result: 'PASSED', notes: 'CofA-2026-006 issued. RELEASED. NOTE: expiry 75 days — priority for sale.', inspectedAt: d(17, 14) },
    // PENDING — QC decision deferred pending retest
    { batchId: lot007.id, inspectedById: qc.id, result: 'PENDING', notes: 'Retest ordered. First dissolution result inconclusive (n=6). Awaiting full panel n=12. Batch stays IN_QUARANTINE.', inspectedAt: d(17, 15) },
  ]});
  await prisma.batch.update({ where: { id: lot006.id }, data: { status: 'RELEASED', version: { increment: 1 } }});
  // LOT-007 stays IN_QUARANTINE — pending QC decision
  console.log('checkmark Week 3: MO-0003 done — LOT-006 RELEASED | LOT-007 PENDING retest (IN_QUARANTINE)');

  // ════════════════════════════════════════════════════════════
  // WEEK 3: Mid-month sales
  // ════════════════════════════════════════════════════════════
  const so3 = await prisma.salesOrder.create({ data: {
    reference: 'SO-2026-0003', customerId: custGrandePharma.id, status: 'DELIVERED',
    createdById: sales.id, createdAt: d(13, 10),
    lines: { create: [
      { productId: fpPara500.id, batchId: lot001.id, quantity: 15, unitPrice: 14.50 },
      { productId: fpAmox500.id, batchId: lot005.id, quantity: 80, unitPrice: 18.00 },
    ]},
  }});
  await Promise.all([
    prisma.batch.update({ where: { id: lot001.id }, data: { remainingQty: { decrement: 15 }, version: { increment: 1 } }}),
    prisma.batch.update({ where: { id: lot005.id }, data: { remainingQty: { decrement: 80 }, version: { increment: 1 } }}),
  ]);
  await prisma.stockMovement.createMany({ data: [
    { batchId: lot001.id, type: 'OUT_SALES', quantity: 15, reference: 'SO-2026-0003', createdAt: d(14, 11) },
    { batchId: lot005.id, type: 'OUT_SALES', quantity: 80, reference: 'SO-2026-0003', createdAt: d(14, 11) },
  ]});

  const so4 = await prisma.salesOrder.create({ data: {
    reference: 'SO-2026-0004', customerId: custPolyclinique.id, status: 'DELIVERED',
    createdById: sales.id, createdAt: d(17, 14),
    lines: { create: [{ productId: fpIbup400.id, batchId: lot006.id, quantity: 60, unitPrice: 12.00 }] },
  }});
  await prisma.batch.update({ where: { id: lot006.id }, data: { remainingQty: { decrement: 60 }, version: { increment: 1 } }});
  await prisma.stockMovement.create({ data: { batchId: lot006.id, type: 'OUT_SALES', quantity: 60, reference: 'SO-2026-0004', createdAt: d(18, 10) }});
  console.log('checkmark Week 3: SO-003 DELIVERED (Grande Pharmacie), SO-004 DELIVERED (Polyclinique Ibup)');

  // *** RECALL EVENT — LOT-005 Amoxicillin (pharmacovigilance) ***
  await prisma.qualityCheck.create({ data: {
    batchId: lot005.id, inspectedById: qc.id, result: 'FAILED',
    notes: 'POST-MARKET ALERT PV-2026-003: 3 customer complaints — premature capsule dissolution. Possible moisture contamination during filling. Batch recalled. NCR-2026-0003 opened.',
    inspectedAt: d(17, 16),
  }});
  await prisma.stockMovement.create({ data: {
    batchId: lot005.id, type: 'RECALL', quantity: 20, reference: 'RECALL-2026-001',
    note: 'Recall of remaining 20 units. Customer notified: Grande Pharmacie Marrakech.',
    createdAt: d(17, 17),
  }});
  await prisma.batch.update({ where: { id: lot005.id }, data: { status: 'RECALLED', remainingQty: 0, version: { increment: 1 } }});
  console.log('checkmark Week 3: RECALL — LOT-005 (Amoxicillin) pharmacovigilance PV-2026-003');

  // ════════════════════════════════════════════════════════════
  // WEEK 4: Apr 21-25 — Production runs + PO-0004 CONFIRMED
  // ════════════════════════════════════════════════════════════

  // PO-0004 CONFIRMED (not yet received)
  const po4 = await prisma.purchaseOrder.create({
    data: {
      reference: 'PO-2026-0004', supplierId: supChemPure.id, status: 'CONFIRMED',
      createdById: purchaser.id, createdAt: d(20, 9),
      lines: { create: [
        { productId: rmAmoxAPI.id, quantity: 100, unitPrice: 76.00 },
        { productId: rmStarch.id,  quantity: 80,  unitPrice: 4.60  },
      ]},
    },
    include: { lines: true },
  });
  console.log('checkmark Week 4: PO-0004 CONFIRMED (awaiting delivery)');

  // MO-0004 Paracetamol 500mg x200 boxes
  const mo4 = await prisma.productionOrder.create({ data: {
    reference: 'MO-2026-0004', productId: fpPara500.id, quantity: 200, status: 'COMPLETED',
    createdById: prodMgr.id, plannedDate: d(21, 8), startedAt: d(21, 8, 30), completedAt: d(22, 16), createdAt: d(21, 8),
  }});
  const [lot008, lot009] = await Promise.all([
    prisma.batch.create({ data: { batchNumber: 'LOT-2026-008', productId: fpPara500.id, quantity: 100, remainingQty: 100, manufacturedAt: d(22, 16), expiryDate: expiryYears(2), status: 'IN_QUARANTINE', productionOrderId: mo4.id }}),
    prisma.batch.create({ data: { batchNumber: 'LOT-2026-009', productId: fpPara500.id, quantity: 100, remainingQty: 100, manufacturedAt: d(22, 16), expiryDate: expiryYears(2), status: 'IN_QUARANTINE', productionOrderId: mo4.id }}),
  ]);
  await Promise.all([
    prisma.batch.update({ where: { id: bParaAPI1.id }, data: { remainingQty: { decrement: 100  }, version: { increment: 1 } }}),
    prisma.batch.update({ where: { id: bStarch1.id  }, data: { remainingQty: { decrement: 30   }, version: { increment: 1 } }}),
    prisma.batch.update({ where: { id: bMCC1.id     }, data: { remainingQty: { decrement: 10   }, version: { increment: 1 } }}),
    prisma.batch.update({ where: { id: bBlister1.id }, data: { remainingQty: { decrement: 2000 }, version: { increment: 1 } }}),
  ]);
  await prisma.stockMovement.createMany({ data: [
    { batchId: bParaAPI1.id, type: 'OUT_PRODUCTION', quantity: 100,  reference: 'MO-2026-0004', createdAt: d(22, 16) },
    { batchId: bStarch1.id,  type: 'OUT_PRODUCTION', quantity: 30,   reference: 'MO-2026-0004', createdAt: d(22, 16) },
    { batchId: bMCC1.id,     type: 'OUT_PRODUCTION', quantity: 10,   reference: 'MO-2026-0004', createdAt: d(22, 16) },
    { batchId: bBlister1.id, type: 'OUT_PRODUCTION', quantity: 2000, reference: 'MO-2026-0004', createdAt: d(22, 16) },
    { batchId: lot008.id,    type: 'IN_PRODUCTION',  quantity: 100,  reference: 'MO-2026-0004', createdAt: d(22, 16) },
    { batchId: lot009.id,    type: 'IN_PRODUCTION',  quantity: 100,  reference: 'MO-2026-0004', createdAt: d(22, 16) },
  ]});
  await prisma.batchGenealogy.createMany({ data: [
    { parentBatchId: bParaAPI1.id, childBatchId: lot008.id, consumedQty: 50 },
    { parentBatchId: bStarch1.id,  childBatchId: lot008.id, consumedQty: 15 },
    { parentBatchId: bMCC1.id,     childBatchId: lot008.id, consumedQty: 5  },
    { parentBatchId: bBlister1.id, childBatchId: lot008.id, consumedQty: 1000 },
    { parentBatchId: bParaAPI1.id, childBatchId: lot009.id, consumedQty: 50 },
    { parentBatchId: bStarch1.id,  childBatchId: lot009.id, consumedQty: 15 },
    { parentBatchId: bMCC1.id,     childBatchId: lot009.id, consumedQty: 5  },
    { parentBatchId: bBlister1.id, childBatchId: lot009.id, consumedQty: 1000 },
  ]});
  await prisma.qualityCheck.createMany({ data: [
    { batchId: lot008.id, inspectedById: labTech.id, result: 'PASSED', notes: 'Dissolution 99.1% at 45 min. Content uniformity CV 0.9%. Hardness 7.4 kP. Excellent batch.', inspectedAt: d(23, 9) },
    { batchId: lot009.id, inspectedById: labTech.id, result: 'PASSED', notes: 'Dissolution 98.5% at 45 min. Content uniformity CV 1.1%. Hardness 7.3 kP.', inspectedAt: d(23, 9, 30) },
    { batchId: lot008.id, inspectedById: qc.id, result: 'PASSED', notes: 'CofA-2026-008 issued. RELEASED.', inspectedAt: d(23, 14) },
    { batchId: lot009.id, inspectedById: qc.id, result: 'PASSED', notes: 'CofA-2026-009 issued. RELEASED.', inspectedAt: d(23, 14, 30) },
  ]});
  await prisma.batch.updateMany({ where: { id: { in: [lot008.id, lot009.id] } }, data: { status: 'RELEASED', version: { increment: 1 } } });
  console.log('checkmark Week 4: MO-0004 done — LOT-008,009 RELEASED');

  // MO-0005 Amoxicillin IN_PROGRESS (started Apr 25, not yet complete)
  const mo5 = await prisma.productionOrder.create({ data: {
    reference: 'MO-2026-0005', productId: fpAmox500.id, quantity: 150, status: 'IN_PROGRESS',
    createdById: prodMgr.id, plannedDate: d(24, 8), startedAt: d(24, 8, 30), createdAt: d(24, 8),
  }});

  // MO-0006 Ibuprofen PLANNED for May 3 (awaiting PO-0004 + new IBUP API)
  const mo6 = await prisma.productionOrder.create({ data: {
    reference: 'MO-2026-0006', productId: fpIbup400.id, quantity: 150, status: 'PLANNED',
    createdById: prodMgr.id, plannedDate: d(32, 8), createdAt: d(24, 15),
  }});
  console.log('checkmark Week 4: MO-0005 IN_PROGRESS | MO-0006 PLANNED (May 3)');

  // ════════════════════════════════════════════════════════════
  // WEEK 4-5: More sales
  // ════════════════════════════════════════════════════════════
  const so5 = await prisma.salesOrder.create({ data: {
    reference: 'SO-2026-0005', customerId: custRegionalHosp.id, status: 'CONFIRMED',
    createdById: sales.id, createdAt: d(23, 14),
    lines: { create: [
      { productId: fpPara500.id, batchId: lot008.id, quantity: 80, unitPrice: 14.50 },
      { productId: fpIbup400.id, batchId: lot006.id, quantity: 40, unitPrice: 12.00 },
    ]},
  }});

  const so6 = await prisma.salesOrder.create({ data: {
    reference: 'SO-2026-0006', customerId: custCityHosp.id, status: 'CONFIRMED',
    createdById: sales.id, createdAt: d(24, 11),
    lines: { create: [{ productId: fpAmox500.id, batchId: lot004.id, quantity: 38, unitPrice: 18.00 }] },
  }});

  const so7 = await prisma.salesOrder.create({ data: {
    reference: 'SO-2026-0007', customerId: custMediPharma.id, status: 'DELIVERED',
    createdById: sales.id, createdAt: d(24, 14),
    lines: { create: [{ productId: fpPara500.id, batchId: lot009.id, quantity: 60, unitPrice: 14.50 }] },
  }});
  await prisma.batch.update({ where: { id: lot009.id }, data: { remainingQty: { decrement: 60 }, version: { increment: 1 } }});
  await prisma.stockMovement.create({ data: { batchId: lot009.id, type: 'OUT_SALES', quantity: 60, reference: 'SO-2026-0007', createdAt: d(25, 10) }});
  console.log('checkmark Week 4: SO-005,006 CONFIRMED | SO-007 DELIVERED (MediPharma Para)');

  // ════════════════════════════════════════════════════════════
  // WEEK 5: Apr 28-May 1 — PO-0005 critical expiry + expired batch
  // ════════════════════════════════════════════════════════════

  // PO-0005 PharmaMed — emergency IBUP API (CRITICAL: 15 days to expiry)
  const po5 = await prisma.purchaseOrder.create({
    data: {
      reference: 'PO-2026-0005', supplierId: supPharmaMed.id, status: 'RECEIVED',
      createdById: purchaser.id, createdAt: d(27, 9),
      lines: { create: [{ productId: rmIbupAPI.id, quantity: 80, unitPrice: 47.00 }] },
    },
    include: { lines: true },
  });
  // CRITICAL EXPIRY ALERT: expires in 15 days
  const bIbupAPI2 = await prisma.batch.create({ data: {
    batchNumber: 'B-IBUP-2026-002', productId: rmIbupAPI.id, quantity: 80, remainingQty: 80,
    manufacturedAt: d(27, 8), expiryDate: expiresIn(15),
    status: 'IN_QUARANTINE', purchaseLineId: po5.lines[0].id, createdAt: d(27, 10),
  }});
  await prisma.stockMovement.create({ data: { batchId: bIbupAPI2.id, type: 'IN_PURCHASE', quantity: 80, reference: 'PO-2026-0005', createdAt: d(27, 10) }});
  await prisma.qualityCheck.createMany({ data: [
    { batchId: bIbupAPI2.id, inspectedById: labTech.id, result: 'PASSED', notes: 'Assay 98.8% (spec 98-102%). CRITICAL: expiry in 15 days. Must be used immediately for MO-2026-0006.', inspectedAt: d(28, 10) },
    { batchId: bIbupAPI2.id, inspectedById: qc.id,     result: 'PASSED', notes: 'CONDITIONALLY APPROVED — must be consumed before expiry (15 days). MO-2026-0006 expedited. Stock alert active.', inspectedAt: d(28, 14) },
  ]});
  await prisma.batch.update({ where: { id: bIbupAPI2.id }, data: { status: 'APPROVED', version: { increment: 1 } }});
  console.log('checkmark Week 5: PO-0005 — B-IBUP-2026-002 APPROVED (CRITICAL: expires in 15 days)');

  // ALREADY EXPIRED batch — old Amox API left in storage
  const bAmoxExpired = await prisma.batch.create({ data: {
    batchNumber: 'B-AMOX-2025-EOL', productId: rmAmoxAPI.id, quantity: 20, remainingQty: 20,
    manufacturedAt: new Date(2024, 5, 1), expiryDate: expiriesAgo(5),
    status: 'EXPIRED', createdAt: new Date(2024, 5, 2),
  }});
  await prisma.stockMovement.create({ data: {
    batchId: bAmoxExpired.id, type: 'IN_PURCHASE', quantity: 20, reference: 'PO-2025-LEGACY',
    note: 'Legacy batch — expired 5 days ago. Pending disposal by QC.',
    createdAt: new Date(2024, 5, 2),
  }});
  console.log('checkmark Legacy expired batch: B-AMOX-2025-EOL (expired 5 days ago, EXPIRED status)');

  // STOCK ADJUSTMENT — warehouse correction
  await prisma.stockMovement.create({ data: {
    batchId: bParaAPI1.id, type: 'ADJUSTMENT', quantity: 2,
    note: 'Physical count correction — surplus 2 kg found during monthly stocktake.',
    reference: 'ADJ-2026-0001', createdAt: d(29, 10),
  }});
  await prisma.batch.update({ where: { id: bParaAPI1.id }, data: { remainingQty: { increment: 2 }, version: { increment: 1 } }});

  // End-of-month sales
  const so8 = await prisma.salesOrder.create({ data: {
    reference: 'SO-2026-0008', customerId: custPharmaCentrale.id, status: 'CONFIRMED',
    createdById: sales.id, createdAt: d(27, 13),
    lines: { create: [
      { productId: fpPara500.id, batchId: lot008.id, quantity: 15, unitPrice: 14.50 },
      { productId: fpIbup400.id, batchId: lot006.id, quantity: 30, unitPrice: 12.00 },
    ]},
  }});

  const so9 = await prisma.salesOrder.create({ data: {
    reference: 'SO-2026-0009', customerId: custGrandePharma.id, status: 'CONFIRMED',
    createdById: sales.id, createdAt: d(28, 10),
    lines: { create: [{ productId: fpPara500.id, batchId: lot009.id, quantity: 30, unitPrice: 14.50 }] },
  }});

  // CANCELLED order linked to recalled stock
  const so10 = await prisma.salesOrder.create({ data: {
    reference: 'SO-2026-0010', customerId: custPolyclinique.id, status: 'CANCELLED',
    createdById: sales.id, createdAt: d(19, 11),
    lines: { create: [{ productId: fpAmox500.id, batchId: lot005.id, quantity: 10, unitPrice: 18.00 }] },
  }});
  console.log('checkmark Week 5: SO-008,009 CONFIRMED | SO-010 CANCELLED (linked to recalled LOT-005)');

  // ════════════════════════════════════════════════════════════
  // AUDIT LOG
  // ════════════════════════════════════════════════════════════
  await prisma.auditLog.createMany({ data: [
    { userId: admin.id,     action: 'USER_CREATE',         entity: 'User',            entityId: purchaser.id,   ip: '10.0.1.1', createdAt: d(0, 8),      metadata: { role: 'PURCHASER' } },
    { userId: admin.id,     action: 'USER_CREATE',         entity: 'User',            entityId: prodMgr.id,     ip: '10.0.1.1', createdAt: d(0, 8, 5),   metadata: { role: 'PRODUCTION_MANAGER' } },
    { userId: admin.id,     action: 'PRODUCT_CREATE',      entity: 'Product',         entityId: fpPara500.id,   ip: '10.0.1.1', createdAt: d(0, 8, 30) },
    { userId: purchaser.id, action: 'PURCHASE_CREATE',     entity: 'PurchaseOrder',   entityId: po1.id,         ip: '10.0.1.5', createdAt: d(0, 9),      metadata: { reference: 'PO-2026-0001', supplier: 'ChemPure SA' } },
    { userId: purchaser.id, action: 'PURCHASE_CONFIRM',    entity: 'PurchaseOrder',   entityId: po1.id,         ip: '10.0.1.5', createdAt: d(0, 9, 10) },
    { userId: warehouse.id, action: 'PURCHASE_RECEIVE',    entity: 'PurchaseOrder',   entityId: po1.id,         ip: '10.0.1.8', createdAt: d(2, 10),     metadata: { batches: 4 } },
    { userId: labTech.id,   action: 'QC_ANALYZE',          entity: 'Batch',           entityId: bParaAPI1.id,   ip: '10.0.1.7', createdAt: d(2, 14),     metadata: { assay: '99.4%', result: 'PASSED' } },
    { userId: qc.id,        action: 'BATCH_APPROVE',       entity: 'Batch',           entityId: bParaAPI1.id,   ip: '10.0.1.6', createdAt: d(3, 10),     metadata: { batch: 'B-API-2026-001' } },
    { userId: prodMgr.id,   action: 'PRODUCTION_CREATE',   entity: 'ProductionOrder', entityId: mo1.id,         ip: '10.0.1.4', createdAt: d(3, 8),      metadata: { reference: 'MO-2026-0001', qty: 300 } },
    { userId: prodMgr.id,   action: 'PRODUCTION_START',    entity: 'ProductionOrder', entityId: mo1.id,         ip: '10.0.1.4', createdAt: d(3, 8, 30) },
    { userId: prodMgr.id,   action: 'PRODUCTION_COMPLETE', entity: 'ProductionOrder', entityId: mo1.id,         ip: '10.0.1.4', createdAt: d(4, 16),     metadata: { lots: 'LOT-001,LOT-002,LOT-003' } },
    { userId: labTech.id,   action: 'QC_ANALYZE',          entity: 'Batch',           entityId: lot003.id,      ip: '10.0.1.7', createdAt: d(5, 10),     metadata: { dissolution: '72.4%', result: 'FAILED', ncr: 'NCR-2026-0001' } },
    { userId: qc.id,        action: 'BATCH_REJECT',        entity: 'Batch',           entityId: lot003.id,      ip: '10.0.1.6', createdAt: d(5, 15),     metadata: { reason: 'Dissolution 72.4% fails BP spec', ncr: 'NCR-2026-0001' } },
    { userId: qc.id,        action: 'BATCH_RELEASE',       entity: 'Batch',           entityId: lot001.id,      ip: '10.0.1.6', createdAt: d(5, 14),     metadata: { cofa: 'CofA-2026-001' } },
    { userId: qc.id,        action: 'BATCH_RELEASE',       entity: 'Batch',           entityId: lot002.id,      ip: '10.0.1.6', createdAt: d(5, 14, 20), metadata: { cofa: 'CofA-2026-002' } },
    { userId: purchaser.id, action: 'PURCHASE_CREATE',     entity: 'PurchaseOrder',   entityId: po2.id,         ip: '10.0.1.5', createdAt: d(6, 9),      metadata: { reference: 'PO-2026-0002', supplier: 'BioSource Ltd' } },
    { userId: warehouse.id, action: 'PURCHASE_RECEIVE',    entity: 'PurchaseOrder',   entityId: po2.id,         ip: '10.0.1.8', createdAt: d(7, 10),     metadata: { batches: 4, warning: 'IBUP batch near expiry 25 days' } },
    { userId: stockMgr.id,  action: 'STOCK_ALERT',         entity: 'Batch',           entityId: bIbupAPI1.id,   ip: '10.0.1.3', createdAt: d(8, 11),     metadata: { type: 'EXPIRY_ALERT', daysRemaining: 25, batch: 'B-IBUP-2026-001' } },
    { userId: prodMgr.id,   action: 'PRODUCTION_COMPLETE', entity: 'ProductionOrder', entityId: mo2.id,         ip: '10.0.1.4', createdAt: d(9, 16),     metadata: { lots: 'LOT-004,LOT-005' } },
    { userId: sales.id,     action: 'SALE_DELIVER',        entity: 'SalesOrder',      entityId: so1.id,         ip: '10.0.1.9', createdAt: d(9, 16),     metadata: { customer: 'City Hospital Rabat' } },
    { userId: sales.id,     action: 'SALE_DELIVER',        entity: 'SalesOrder',      entityId: so2.id,         ip: '10.0.1.9', createdAt: d(11, 10) },
    { userId: purchaser.id, action: 'PURCHASE_CREATE',     entity: 'PurchaseOrder',   entityId: po3.id,         ip: '10.0.1.5', createdAt: d(13, 9),     metadata: { reference: 'PO-2026-0003', supplier: 'EuroRaw Pharma' } },
    { userId: qc.id,        action: 'BATCH_REJECT',        entity: 'Batch',           entityId: bStarch2.id,    ip: '10.0.1.6', createdAt: d(15, 9),     metadata: { reason: 'LoD 16.8% OUT OF SPEC', ncr: 'NCR-2026-0002' } },
    { userId: prodMgr.id,   action: 'PRODUCTION_COMPLETE', entity: 'ProductionOrder', entityId: mo3.id,         ip: '10.0.1.4', createdAt: d(16, 16),    metadata: { lots: 'LOT-006,LOT-007', note: 'LOT-007 pending retest' } },
    { userId: qc.id,        action: 'QC_PENDING_RETEST',   entity: 'Batch',           entityId: lot007.id,      ip: '10.0.1.6', createdAt: d(17, 15),    metadata: { reason: 'Dissolution 68.1% inconclusive n=6', action: 'Full retest n=12 ordered' } },
    { userId: qc.id,        action: 'BATCH_RECALL',        entity: 'Batch',           entityId: lot005.id,      ip: '10.0.1.6', createdAt: d(17, 17),    metadata: { reason: 'Pharmacovigilance PV-2026-003', ncr: 'NCR-2026-0003', affected: 'Grande Pharmacie Marrakech' } },
    { userId: purchaser.id, action: 'PURCHASE_CREATE',     entity: 'PurchaseOrder',   entityId: po4.id,         ip: '10.0.1.5', createdAt: d(20, 9),     metadata: { reference: 'PO-2026-0004', status: 'CONFIRMED' } },
    { userId: prodMgr.id,   action: 'PRODUCTION_COMPLETE', entity: 'ProductionOrder', entityId: mo4.id,         ip: '10.0.1.4', createdAt: d(22, 16),    metadata: { lots: 'LOT-008,LOT-009' } },
    { userId: prodMgr.id,   action: 'PRODUCTION_START',    entity: 'ProductionOrder', entityId: mo5.id,         ip: '10.0.1.4', createdAt: d(24, 8, 30), metadata: { note: 'Amox MO in progress' } },
    { userId: sales.id,     action: 'SALE_DELIVER',        entity: 'SalesOrder',      entityId: so7.id,         ip: '10.0.1.9', createdAt: d(25, 10) },
    { userId: purchaser.id, action: 'PURCHASE_CREATE',     entity: 'PurchaseOrder',   entityId: po5.id,         ip: '10.0.1.5', createdAt: d(27, 9),     metadata: { reference: 'PO-2026-0005', note: 'Emergency IBUP API' } },
    { userId: stockMgr.id,  action: 'STOCK_ALERT',         entity: 'Batch',           entityId: bIbupAPI2.id,   ip: '10.0.1.3', createdAt: d(28, 15),    metadata: { type: 'CRITICAL_EXPIRY', daysRemaining: 15, batch: 'B-IBUP-2026-002' } },
    { userId: stockMgr.id,  action: 'STOCK_ADJUSTMENT',    entity: 'Batch',           entityId: bParaAPI1.id,   ip: '10.0.1.3', createdAt: d(29, 10),    metadata: { reference: 'ADJ-2026-0001', qty: 2, reason: 'Monthly stocktake surplus' } },
    { userId: stockMgr.id,  action: 'STOCK_ALERT',         entity: 'Batch',           entityId: bAmoxExpired.id,ip: '10.0.1.3', createdAt: d(29, 9),     metadata: { type: 'EXPIRED', batch: 'B-AMOX-2025-EOL', action: 'Disposal initiated' } },
    { userId: admin.id,     action: 'SYSTEM_REPORT',       entity: 'System',          entityId: admin.id,       ip: '10.0.1.1', createdAt: d(29, 17),    metadata: { report: 'Monthly QC Summary April 2026', ncrs: 3, recalls: 1, released: 7, rejected: 3 } },
  ]});
  console.log('checkmark 35 audit log entries');

  console.log('\n  ===================================================');
  console.log('  SEED COMPLETE — Inphamedis April 2026 Full Month');
  console.log('  ===================================================');
  console.log('  Users:              8 (all roles)');
  console.log('  Products:           11 (6 raw + 2 packaging + 3 finished)');
  console.log('  Suppliers: 4   |  Customers: 6');
  console.log('  Purchase Orders:    5 (3 RECEIVED, 1 CONFIRMED, 1 RECEIVED)');
  console.log('  Production Orders:  6 (4 COMPLETED, 1 IN_PROGRESS, 1 PLANNED)');
  console.log('  Raw/Pkg batches:    10 (7 APPROVED, 2 REJECTED, 1 EXPIRED)');
  console.log('  Finished batches:   9 (5 RELEASED, 1 IN_QUARANTINE/PENDING, 1 REJECTED, 1 RECALLED)');
  console.log('  Quality checks:     32 (PASSED x24, FAILED x6, PENDING x2)');
  console.log('  NCRs raised:        3 (LOT-003 dissolution, Starch2 LoD, LOT-005 recall)');
  console.log('  Recall:             1 (LOT-005 Amoxicillin — PV-2026-003)');
  console.log('  Sales Orders:       10 (3 DELIVERED, 4 CONFIRMED, 1 CANCELLED)');
  console.log('  EXPIRY ALERTS:');
  console.log('    B-IBUP-2026-002 : CRITICAL — expires in 15 days');
  console.log('    B-IBUP-2026-001 : expires in 25 days (APPROVED)');
  console.log('    B-STAR-2026-002 : expires in 60 days (REJECTED)');
  console.log('    LOT-2026-006/007: finished product — expires in 75 days');
  console.log('    B-AMOX-2025-EOL : EXPIRED 5 days ago — pending disposal');
  console.log('\n  Credentials:');
  console.log('    admin@erp-pharm.local    / Admin@123');
  console.log('    <role>@erp-pharm.local   / User@123');
  console.log('  ===================================================\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
