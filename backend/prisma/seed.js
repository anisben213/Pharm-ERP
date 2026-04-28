/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetDemoData() {
  // Order matters due to FKs
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

async function main() {
  console.log('Resetting demo data…');
  await resetDemoData();

  // ---------- USERS ----------
  const pwd = await bcrypt.hash('Admin@123', 10);
  const userPwd = await bcrypt.hash('User@123', 10);

  const [admin, purchaser, stockMgr, warehouseKeeper, prodMgr, qc, labTech, sales] = await Promise.all([
    prisma.user.create({ data: { email: 'admin@erp-pharm.local',      passwordHash: pwd,    fullName: 'System Admin',         role: 'ADMIN' } }),
    prisma.user.create({ data: { email: 'purchaser@erp-pharm.local',  passwordHash: userPwd, fullName: 'Pierre Purchaser',    role: 'PURCHASER' } }),
    prisma.user.create({ data: { email: 'stock@erp-pharm.local',      passwordHash: userPwd, fullName: 'Sam Stock',           role: 'STOCK_MANAGER' } }),
    prisma.user.create({ data: { email: 'warehouse@erp-pharm.local',  passwordHash: userPwd, fullName: 'Wael Warehouse',      role: 'WAREHOUSE_KEEPER' } }),
    prisma.user.create({ data: { email: 'production@erp-pharm.local', passwordHash: userPwd, fullName: 'Paula Production',    role: 'PRODUCTION_MANAGER' } }),
    prisma.user.create({ data: { email: 'quality@erp-pharm.local',    passwordHash: userPwd, fullName: 'Quincy Quality',      role: 'QUALITY_CONTROLLER' } }),
    prisma.user.create({ data: { email: 'lab@erp-pharm.local',        passwordHash: userPwd, fullName: 'Lara Lab',            role: 'LAB_TECHNICIAN' } }),
    prisma.user.create({ data: { email: 'sales@erp-pharm.local',      passwordHash: userPwd, fullName: 'Sarah Sales',         role: 'SALES_AGENT' } }),
  ]);
  console.log('✓ 8 users created');

  // ---------- SUPPLIERS / CUSTOMERS ----------
  const [supA, supB] = await Promise.all([
    prisma.supplier.create({ data: { name: 'ChemPure SA',   email: 'sales@chempure.example',   phone: '+212-5-22-00-11-22', address: 'Casablanca, MA' } }),
    prisma.supplier.create({ data: { name: 'BioSource Ltd', email: 'orders@biosource.example', phone: '+33-1-45-67-89-00',  address: 'Lyon, FR' } }),
  ]);
  const [custA, custB, custC] = await Promise.all([
    prisma.customer.create({ data: { name: 'City Hospital Rabat', email: 'procure@cityhospital.example', phone: '+212-5-37-11-22-33', address: 'Rabat, MA' } }),
    prisma.customer.create({ data: { name: 'MediPharma Chain',    email: 'po@medipharma.example',       phone: '+212-5-22-99-88-77', address: 'Casablanca, MA' } }),
    prisma.customer.create({ data: { name: 'Grande Pharmacie',    email: 'admin@grandepharma.example',  phone: '+212-5-24-44-55-66', address: 'Marrakech, MA' } }),
  ]);
  console.log('✓ 2 suppliers, 3 customers');

  // ---------- PRODUCTS ----------
  const paracetamolAPI = await prisma.product.create({ data: { sku: 'RM-PARA-001', name: 'Paracetamol API',        type: 'RAW_MATERIAL',     unit: 'kg',   description: 'Active pharmaceutical ingredient' } });
  const starch         = await prisma.product.create({ data: { sku: 'RM-STAR-001', name: 'Corn Starch (excipient)', type: 'RAW_MATERIAL',     unit: 'kg' } });
  const blister        = await prisma.product.create({ data: { sku: 'PK-BLIS-001', name: 'Blister Pack 10ct',       type: 'PACKAGING',        unit: 'unit' } });
  const paracetamol500 = await prisma.product.create({ data: { sku: 'FP-PARA-500', name: 'Paracetamol 500 mg tabs', type: 'FINISHED_PRODUCT', unit: 'box' } });
  console.log('✓ 4 products');

  // ---------- BOM ----------
  await prisma.bOM.create({
    data: {
      finishedProductId: paracetamol500.id,
      version: 1,
      components: {
        create: [
          { productId: paracetamolAPI.id, quantity: 0.5 },
          { productId: starch.id,         quantity: 0.2 },
          { productId: blister.id,        quantity: 10 },
        ],
      },
    },
  });
  console.log('✓ BOM for Paracetamol 500 mg');

  // ---------- PURCHASE ORDERS ----------
  const poA = await prisma.purchaseOrder.create({
    data: {
      reference: 'PO-2026-0001', supplierId: supA.id, status: 'CONFIRMED', createdById: purchaser.id,
      lines: { create: [
        { productId: paracetamolAPI.id, quantity: 100, unitPrice: 50 },
        { productId: starch.id,         quantity: 50,  unitPrice: 5 },
      ]},
    },
    include: { lines: true },
  });
  const poB = await prisma.purchaseOrder.create({
    data: {
      reference: 'PO-2026-0002', supplierId: supB.id, status: 'CONFIRMED', createdById: purchaser.id,
      lines: { create: [
        { productId: blister.id,        quantity: 10000, unitPrice: 0.1 },
        { productId: paracetamolAPI.id, quantity: 80,    unitPrice: 52 },
      ]},
    },
    include: { lines: true },
  });
  console.log('✓ 2 purchase orders');

  // ---------- RECEIVE POs -> create raw batches in QUARANTINE ----------
  const now = new Date();
  const mkExpiry = (years) => new Date(now.getFullYear() + years, now.getMonth(), now.getDate());

  const rawApi1   = await prisma.batch.create({ data: { batchNumber: 'B-API-2026-001',  productId: paracetamolAPI.id, quantity: 100,   remainingQty: 100,   manufacturedAt: now, expiryDate: mkExpiry(3),  status: 'IN_QUARANTINE', purchaseLineId: poA.lines[0].id } });
  const rawStarch = await prisma.batch.create({ data: { batchNumber: 'B-STAR-2026-001', productId: starch.id,         quantity: 50,    remainingQty: 50,    manufacturedAt: now, expiryDate: mkExpiry(5),  status: 'IN_QUARANTINE', purchaseLineId: poA.lines[1].id } });
  const rawApi2   = await prisma.batch.create({ data: { batchNumber: 'B-API-2026-002',  productId: paracetamolAPI.id, quantity: 80,    remainingQty: 80,    manufacturedAt: now, expiryDate: mkExpiry(3),  status: 'IN_QUARANTINE', purchaseLineId: poB.lines[1].id } });
  const rawBlist  = await prisma.batch.create({ data: { batchNumber: 'B-BLIS-2026-001', productId: blister.id,        quantity: 10000, remainingQty: 10000, manufacturedAt: now, expiryDate: mkExpiry(10), status: 'IN_QUARANTINE', purchaseLineId: poB.lines[0].id } });

  await prisma.purchaseOrder.update({ where: { id: poA.id }, data: { status: 'RECEIVED' } });
  await prisma.purchaseOrder.update({ where: { id: poB.id }, data: { status: 'RECEIVED' } });

  await prisma.stockMovement.createMany({
    data: [
      { batchId: rawApi1.id,   type: 'IN_PURCHASE', quantity: 100,   reference: poA.reference },
      { batchId: rawStarch.id, type: 'IN_PURCHASE', quantity: 50,    reference: poA.reference },
      { batchId: rawApi2.id,   type: 'IN_PURCHASE', quantity: 80,    reference: poB.reference },
      { batchId: rawBlist.id,  type: 'IN_PURCHASE', quantity: 10000, reference: poB.reference },
    ],
  });
  console.log('✓ 4 raw-material batches received into quarantine');

  // ---------- QUALITY CONTROL ----------
  for (const b of [rawApi1, rawStarch, rawBlist]) {
    await prisma.qualityCheck.create({ data: { batchId: b.id, inspectedById: qc.id, result: 'PASSED', notes: 'Conforms to specifications' } });
    await prisma.batch.update({ where: { id: b.id }, data: { status: 'APPROVED', version: { increment: 1 } } });
  }
  await prisma.qualityCheck.create({ data: { batchId: rawApi2.id, inspectedById: qc.id, result: 'FAILED', notes: 'Assay out of spec — 92%, required 98-102%' } });
  await prisma.batch.update({ where: { id: rawApi2.id }, data: { status: 'REJECTED', version: { increment: 1 } } });
  console.log('✓ QC: 3 approved, 1 rejected');

  // ---------- PRODUCTION ORDER ----------
  const prodOrder = await prisma.productionOrder.create({
    data: {
      reference: 'MO-2026-0001',
      productId: paracetamol500.id,
      quantity: 100,
      status: 'COMPLETED',
      createdById: prodMgr.id,
      startedAt: new Date(now.getTime() - 3600_000),
      completedAt: now,
    },
  });

  const finished1 = await prisma.batch.create({
    data: {
      batchNumber: 'FB-PARA-2026-001', productId: paracetamol500.id,
      quantity: 50, remainingQty: 50,
      manufacturedAt: now, expiryDate: mkExpiry(2),
      status: 'RELEASED', version: 1,
      productionOrderId: prodOrder.id,
    },
  });
  const finished2 = await prisma.batch.create({
    data: {
      batchNumber: 'FB-PARA-2026-002', productId: paracetamol500.id,
      quantity: 50, remainingQty: 50,
      manufacturedAt: now, expiryDate: mkExpiry(2),
      status: 'RELEASED', version: 1,
      productionOrderId: prodOrder.id,
    },
  });

  // Genealogy links
  await prisma.batchGenealogy.createMany({
    data: [
      { parentBatchId: rawApi1.id,   childBatchId: finished1.id, consumedQty: 25 },
      { parentBatchId: rawStarch.id, childBatchId: finished1.id, consumedQty: 10 },
      { parentBatchId: rawBlist.id,  childBatchId: finished1.id, consumedQty: 500 },

      { parentBatchId: rawApi1.id,   childBatchId: finished2.id, consumedQty: 25 },
      { parentBatchId: rawStarch.id, childBatchId: finished2.id, consumedQty: 10 },
      { parentBatchId: rawBlist.id,  childBatchId: finished2.id, consumedQty: 500 },
    ],
  });

  await prisma.batch.update({ where: { id: rawApi1.id },   data: { remainingQty: { decrement: 50 },   version: { increment: 1 } } });
  await prisma.batch.update({ where: { id: rawStarch.id }, data: { remainingQty: { decrement: 20 },   version: { increment: 1 } } });
  await prisma.batch.update({ where: { id: rawBlist.id },  data: { remainingQty: { decrement: 1000 }, version: { increment: 1 } } });

  await prisma.stockMovement.createMany({
    data: [
      { batchId: rawApi1.id,   type: 'OUT_PRODUCTION', quantity: 50,   reference: prodOrder.reference },
      { batchId: rawStarch.id, type: 'OUT_PRODUCTION', quantity: 20,   reference: prodOrder.reference },
      { batchId: rawBlist.id,  type: 'OUT_PRODUCTION', quantity: 1000, reference: prodOrder.reference },
      { batchId: finished1.id, type: 'IN_PRODUCTION',  quantity: 50,   reference: prodOrder.reference },
      { batchId: finished2.id, type: 'IN_PRODUCTION',  quantity: 50,   reference: prodOrder.reference },
    ],
  });

  await prisma.qualityCheck.createMany({
    data: [
      { batchId: finished1.id, inspectedById: qc.id, result: 'PASSED', notes: 'Finished product released to market' },
      { batchId: finished2.id, inspectedById: qc.id, result: 'PASSED', notes: 'Finished product released to market' },
    ],
  });
  console.log('✓ Production order completed — 2 finished batches with genealogy');

  // ---------- SALES ----------
  const so1 = await prisma.salesOrder.create({
    data: {
      reference: 'SO-2026-0001', customerId: custA.id, status: 'DELIVERED', createdById: sales.id,
      lines: { create: [{ productId: paracetamol500.id, batchId: finished1.id, quantity: 30, unitPrice: 12 }] },
    },
  });
  const so2 = await prisma.salesOrder.create({
    data: {
      reference: 'SO-2026-0002', customerId: custB.id, status: 'DELIVERED', createdById: sales.id,
      lines: { create: [{ productId: paracetamol500.id, batchId: finished2.id, quantity: 40, unitPrice: 12 }] },
    },
  });
  const so3 = await prisma.salesOrder.create({
    data: {
      reference: 'SO-2026-0003', customerId: custC.id, status: 'CONFIRMED', createdById: sales.id,
      lines: { create: [{ productId: paracetamol500.id, batchId: finished1.id, quantity: 10, unitPrice: 12 }] },
    },
  });

  await prisma.batch.update({ where: { id: finished1.id }, data: { remainingQty: { decrement: 40 },                  version: { increment: 1 } } });
  await prisma.batch.update({ where: { id: finished2.id }, data: { remainingQty: { decrement: 40 }, status: 'SOLD',  version: { increment: 1 } } });

  await prisma.stockMovement.createMany({
    data: [
      { batchId: finished1.id, type: 'OUT_SALES', quantity: 30, reference: so1.reference },
      { batchId: finished2.id, type: 'OUT_SALES', quantity: 40, reference: so2.reference },
      { batchId: finished1.id, type: 'OUT_SALES', quantity: 10, reference: so3.reference },
    ],
  });
  console.log('✓ 3 sales orders (2 delivered, 1 confirmed)');

  // ---------- RECALL ----------
  const finished2Fresh = await prisma.batch.findUnique({ where: { id: finished2.id } });
  await prisma.batch.update({ where: { id: finished2.id }, data: { status: 'RECALLED', version: { increment: 1 } } });
  await prisma.stockMovement.create({
    data: {
      batchId: finished2.id, type: 'RECALL',
      quantity: finished2Fresh.remainingQty,
      reference: 'RECALL-2026-001',
      note: 'Quality complaint from customer — precautionary recall of entire finished batch',
    },
  });
  console.log('✓ Recall executed on batch FB-PARA-2026-002');

  // ---------- AUDIT LOG ----------
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id,     action: 'USER_CREATE',         entity: 'User',            entityId: purchaser.id, ip: '127.0.0.1' },
      { userId: purchaser.id, action: 'PURCHASE_CREATE',     entity: 'PurchaseOrder',   entityId: poA.id,       ip: '127.0.0.1' },
      { userId: stockMgr.id,  action: 'PURCHASE_RECEIVE',    entity: 'PurchaseOrder',   entityId: poA.id,       ip: '127.0.0.1' },
      { userId: qc.id,        action: 'QC_INSPECT',          entity: 'Batch',           entityId: rawApi2.id,   ip: '127.0.0.1', metadata: { result: 'FAILED' } },
      { userId: prodMgr.id,   action: 'PRODUCTION_COMPLETE', entity: 'ProductionOrder', entityId: prodOrder.id, ip: '127.0.0.1' },
      { userId: sales.id,     action: 'SALE_CREATE',         entity: 'SalesOrder',      entityId: so2.id,       ip: '127.0.0.1' },
      { userId: admin.id,     action: 'BATCH_RECALL',        entity: 'Batch',           entityId: finished2.id, ip: '127.0.0.1', metadata: { reason: 'Quality complaint' } },
    ],
  });
  console.log('✓ Audit log entries');

  console.log('\n=== DEMO CREDENTIALS ===');
  console.log('  admin@erp-pharm.local      / Admin@123  (Admin)');
  console.log('  purchaser@erp-pharm.local  / User@123   (Purchase Manager)');
  console.log('  stock@erp-pharm.local      / User@123   (Stock Manager)');
  console.log('  warehouse@erp-pharm.local  / User@123   (Warehouse Keeper)');
  console.log('  production@erp-pharm.local / User@123   (Production Manager)');
  console.log('  quality@erp-pharm.local    / User@123   (Quality Manager)');
  console.log('  lab@erp-pharm.local        / User@123   (Lab Technician)');
  console.log('  sales@erp-pharm.local      / User@123   (Sales Manager)');
  console.log('\nRecalled batch id:', finished2.id, ' → open /batches/' + finished2.id);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
