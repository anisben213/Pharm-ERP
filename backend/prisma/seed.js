// Seed for PharmaLab ERP — simplified redesign
// Demo timeline anchored around 2026-05-07
const { PrismaClient, Role, ProductCategory, BatchType, BatchStatus,
  MovementType, ManufacturingStatus, PurchaseStatus, QCResult, QCOrigin,
  SalesStatus, DeliveryStatus, NotificationType } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const today = new Date('2026-05-07T09:00:00Z');
const daysAgo = (n) => new Date(today.getTime() - n * 24 * 60 * 60 * 1000);
const daysAhead = (n) => new Date(today.getTime() + n * 24 * 60 * 60 * 1000);

async function main() {
  console.log('Seeding PharmaLab ERP...');

  // Wipe (order matters)
  await prisma.notification.deleteMany();
  await prisma.deliveryNote.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.qualityControl.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.manufacturingOrder.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.client.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.product.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // ── USERS ──────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const userHash = await bcrypt.hash('User@123', 10);

  const usersData = [
    { username: 'admin', fullName: 'System Administrator', email: 'admin@pharmalab.local', role: Role.ADMIN, passwordHash: adminHash },
    { username: 'stock', fullName: 'Sara Stock', email: 'stock@pharmalab.local', role: Role.STOCK_MANAGER, passwordHash: userHash },
    { username: 'production', fullName: 'Pierre Production', email: 'production@pharmalab.local', role: Role.PRODUCTION_MANAGER, passwordHash: userHash },
    { username: 'purchase', fullName: 'Paula Purchase', email: 'purchase@pharmalab.local', role: Role.PURCHASE_MANAGER, passwordHash: userHash },
    { username: 'quality', fullName: 'Quentin Quality', email: 'quality@pharmalab.local', role: Role.QUALITY_MANAGER, passwordHash: userHash },
    { username: 'sales', fullName: 'Selma Sales', email: 'sales@pharmalab.local', role: Role.SALES_MANAGER, passwordHash: userHash },
  ];
  const users = {};
  for (const u of usersData) {
    const created = await prisma.user.create({ data: { ...u, lastLogin: daysAgo(1) } });
    users[u.role] = created;
  }
  console.log(`✓ ${Object.keys(users).length} users`);

  // ── PRODUCTS ───────────────────────────────────────────────
  const productsData = [
    { name: 'Paracetamol API', category: ProductCategory.RAW_MATERIAL, unit: 'kg', minStockLevel: 50 },
    { name: 'Amoxicillin API', category: ProductCategory.RAW_MATERIAL, unit: 'kg', minStockLevel: 30 },
    { name: 'Microcrystalline Cellulose', category: ProductCategory.RAW_MATERIAL, unit: 'kg', minStockLevel: 80 },
    { name: 'Magnesium Stearate', category: ProductCategory.RAW_MATERIAL, unit: 'kg', minStockLevel: 20 },
    { name: 'Paracetamol 500mg Tablet', category: ProductCategory.FINISHED_PRODUCT, unit: 'box', minStockLevel: 200 },
    { name: 'Amoxicillin 500mg Capsule', category: ProductCategory.FINISHED_PRODUCT, unit: 'box', minStockLevel: 150 },
    { name: 'Ibuprofen 400mg Tablet', category: ProductCategory.FINISHED_PRODUCT, unit: 'box', minStockLevel: 180 },
  ];
  const products = [];
  for (const p of productsData) {
    products.push(await prisma.product.create({ data: { ...p, createdById: users.ADMIN.id } }));
  }
  const byName = (n) => products.find((p) => p.name === n);
  console.log(`✓ ${products.length} products`);

  // ── SUPPLIERS / CLIENTS ────────────────────────────────────
  const suppliers = [];
  for (const s of [
    { name: 'ChemPure Industries', contact: '+212522001122', email: 'contact@chempure.ma' },
    { name: 'BioSource Labs', contact: '+212522334455', email: 'sales@biosource.eu' },
    { name: 'PharmaMed Supply', contact: '+212522667788', email: 'info@pharmamed.fr' },
  ]) suppliers.push(await prisma.supplier.create({ data: s }));

  const clients = [];
  for (const c of [
    { name: 'City Hospital Rabat', contact: '+212537123456', email: 'pharmacy@cityhospital.ma', address: 'Av. Mohammed V, Rabat' },
    { name: 'MediPharma Casablanca', contact: '+212522987654', email: 'orders@medipharma.ma', address: 'Bd Zerktouni, Casablanca' },
    { name: 'Grande Pharmacie Marrakech', contact: '+212524555111', email: 'gp@marrakech.ma', address: 'Place Jemaa el-Fna, Marrakech' },
    { name: 'Polyclinique Atlas Fes', contact: '+212535444222', email: 'contact@atlasfes.ma', address: 'Av. Hassan II, Fès' },
  ]) clients.push(await prisma.client.create({ data: c }));
  console.log(`✓ ${suppliers.length} suppliers · ${clients.length} clients`);

  // ── HELPERS ────────────────────────────────────────────────
  let rmCounter = 1;
  let lotCounter = 1;
  let poCounter = 1;
  let moCounter = 1;
  let soCounter = 1;
  let dnCounter = 1;
  const year = today.getUTCFullYear();
  const seq = (n) => String(n).padStart(3, '0');

  // ── PURCHASE ORDERS + RM BATCHES ───────────────────────────
  // Two received & validated, one received & rejected (blocked), one in progress
  async function createReceivedRM({ supplier, product, quantity, daysOld, validated, expiryDays = 730 }) {
    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber: `PO-${year}-${seq(poCounter++)}`,
        supplierId: supplier.id,
        productId: product.id,
        quantity,
        orderDate: daysAgo(daysOld + 5),
        status: PurchaseStatus.RECEIVED,
        userId: users.PURCHASE_MANAGER.id,
      },
    });
    const batch = await prisma.batch.create({
      data: {
        batchNumber: `RM-${year}-${seq(rmCounter++)}`,
        productId: product.id,
        manufactureDate: daysAgo(daysOld),
        expiryDate: daysAhead(expiryDays),
        quantity,
        status: validated ? BatchStatus.VALIDATED : BatchStatus.REJECTED,
        batchType: BatchType.RM,
        origin: QCOrigin.PURCHASE,
        createdAt: daysAgo(daysOld),
      },
    });
    await prisma.purchaseOrder.update({ where: { id: order.id }, data: { batchId: batch.id } });
    await prisma.qualityControl.create({
      data: {
        batchId: batch.id,
        controlDate: daysAgo(daysOld - 1),
        result: validated ? QCResult.VALIDATED : QCResult.REJECTED,
        notes: validated ? 'All specs within range.' : 'Moisture out of spec — blocked.',
        userId: users.QUALITY_MANAGER.id,
        origin: QCOrigin.PURCHASE,
      },
    });
    if (validated) {
      await prisma.stockMovement.create({
        data: {
          batchId: batch.id,
          type: MovementType.ENTRY,
          quantity,
          date: daysAgo(daysOld - 1),
          reason: 'QC validated — entered stock',
          userId: users.QUALITY_MANAGER.id,
        },
      });
    }
    return { order, batch };
  }

  await createReceivedRM({ supplier: suppliers[0], product: byName('Paracetamol API'), quantity: 500, daysOld: 30, validated: true });
  await createReceivedRM({ supplier: suppliers[1], product: byName('Amoxicillin API'), quantity: 200, daysOld: 25, validated: true });
  await createReceivedRM({ supplier: suppliers[2], product: byName('Microcrystalline Cellulose'), quantity: 600, daysOld: 20, validated: true });
  await createReceivedRM({ supplier: suppliers[0], product: byName('Magnesium Stearate'), quantity: 80, daysOld: 15, validated: true });
  // One rejected (blocked)
  await createReceivedRM({ supplier: suppliers[1], product: byName('Paracetamol API'), quantity: 100, daysOld: 10, validated: false });

  // One in-progress (sent, no batch yet)
  await prisma.purchaseOrder.create({
    data: {
      orderNumber: `PO-${year}-${seq(poCounter++)}`,
      supplierId: suppliers[2].id,
      productId: byName('Amoxicillin API').id,
      quantity: 150,
      orderDate: daysAgo(2),
      status: PurchaseStatus.SENT,
      userId: users.PURCHASE_MANAGER.id,
    },
  });
  // One pending QC (received)
  const poPending = await prisma.purchaseOrder.create({
    data: {
      orderNumber: `PO-${year}-${seq(poCounter++)}`,
      supplierId: suppliers[0].id,
      productId: byName('Microcrystalline Cellulose').id,
      quantity: 300,
      orderDate: daysAgo(3),
      status: PurchaseStatus.RECEIVED,
      userId: users.PURCHASE_MANAGER.id,
    },
  });
  const pendingRMBatch = await prisma.batch.create({
    data: {
      batchNumber: `RM-${year}-${seq(rmCounter++)}`,
      productId: byName('Microcrystalline Cellulose').id,
      manufactureDate: daysAgo(1),
      expiryDate: daysAhead(540),
      quantity: 300,
      status: BatchStatus.PENDING_QC,
      batchType: BatchType.RM,
      origin: QCOrigin.PURCHASE,
      createdAt: daysAgo(1),
    },
  });
  await prisma.purchaseOrder.update({ where: { id: poPending.id }, data: { batchId: pendingRMBatch.id } });
  await prisma.notification.create({
    data: {
      recipientRole: Role.QUALITY_MANAGER,
      message: `New RM batch ${pendingRMBatch.batchNumber} pending analysis`,
      type: NotificationType.INFO,
      relatedId: pendingRMBatch.id,
      relatedType: 'batch',
      createdAt: daysAgo(1),
    },
  });

  console.log(`✓ purchase orders + RM batches`);

  // ── MANUFACTURING ORDERS + LOT BATCHES ─────────────────────
  async function createClosedLOT({ product, quantity, daysOld, validated, expiryDays = 540 }) {
    const lotNum = `LOT-${year}-${seq(lotCounter++)}`;
    const batch = await prisma.batch.create({
      data: {
        batchNumber: lotNum,
        productId: product.id,
        manufactureDate: daysAgo(daysOld),
        expiryDate: daysAhead(expiryDays),
        quantity,
        status: validated ? BatchStatus.VALIDATED : BatchStatus.REJECTED,
        batchType: BatchType.LOT,
        origin: QCOrigin.PRODUCTION,
        createdAt: daysAgo(daysOld + 5),
      },
    });
    const order = await prisma.manufacturingOrder.create({
      data: {
        orderNumber: `MO-${year}-${seq(moCounter++)}`,
        productId: product.id,
        plannedDate: daysAgo(daysOld + 5),
        quantity,
        status: ManufacturingStatus.CLOSED,
        batchId: batch.id,
        userId: users.PRODUCTION_MANAGER.id,
        createdAt: daysAgo(daysOld + 5),
      },
    });
    await prisma.qualityControl.create({
      data: {
        batchId: batch.id,
        controlDate: daysAgo(daysOld - 1),
        result: validated ? QCResult.VALIDATED : QCResult.REJECTED,
        notes: validated ? 'Dissolution and assay within spec.' : 'Failed dissolution — rework required.',
        userId: users.QUALITY_MANAGER.id,
        origin: QCOrigin.PRODUCTION,
      },
    });
    if (validated) {
      await prisma.stockMovement.create({
        data: {
          batchId: batch.id,
          type: MovementType.ENTRY,
          quantity,
          date: daysAgo(daysOld - 1),
          reason: 'QC validated — entered stock',
          userId: users.QUALITY_MANAGER.id,
        },
      });
    }
    return { order, batch };
  }

  const lot1 = await createClosedLOT({ product: byName('Paracetamol 500mg Tablet'), quantity: 1200, daysOld: 28, validated: true });
  const lot2 = await createClosedLOT({ product: byName('Amoxicillin 500mg Capsule'), quantity: 800, daysOld: 21, validated: true });
  const lot3 = await createClosedLOT({ product: byName('Ibuprofen 400mg Tablet'), quantity: 1000, daysOld: 14, validated: true });
  // Rejected with rework
  const lotRejected = await createClosedLOT({ product: byName('Paracetamol 500mg Tablet'), quantity: 500, daysOld: 7, validated: false });
  const reworkOrder = await prisma.manufacturingOrder.create({
    data: {
      orderNumber: `MO-${year}-${seq(moCounter++)}`,
      productId: byName('Paracetamol 500mg Tablet').id,
      plannedDate: daysAhead(2),
      quantity: 500,
      status: ManufacturingStatus.IN_PROGRESS,
      userId: users.PRODUCTION_MANAGER.id,
      reworkOfId: lotRejected.order.id,
      createdAt: daysAgo(6),
    },
  });
  const reworkBatch = await prisma.batch.create({
    data: {
      batchNumber: `LOT-${year}-${seq(lotCounter++)}`,
      productId: byName('Paracetamol 500mg Tablet').id,
      manufactureDate: today,
      expiryDate: daysAhead(540),
      quantity: 500,
      status: BatchStatus.IN_PROGRESS,
      batchType: BatchType.LOT,
      origin: QCOrigin.PRODUCTION,
    },
  });
  await prisma.manufacturingOrder.update({ where: { id: reworkOrder.id }, data: { batchId: reworkBatch.id } });
  await prisma.notification.create({
    data: {
      recipientRole: Role.PRODUCTION_MANAGER,
      message: `Batch ${lotRejected.batch.batchNumber} rejected — new order ${reworkOrder.orderNumber} created for rework`,
      type: NotificationType.WARNING,
      relatedId: reworkOrder.id,
      relatedType: 'manufacturing_order',
      createdAt: daysAgo(6),
    },
  });

  // One pending QC LOT (closed, awaiting analysis)
  const pendingLot = await prisma.batch.create({
    data: {
      batchNumber: `LOT-${year}-${seq(lotCounter++)}`,
      productId: byName('Ibuprofen 400mg Tablet').id,
      manufactureDate: daysAgo(2),
      expiryDate: daysAhead(540),
      quantity: 700,
      status: BatchStatus.PENDING_QC,
      batchType: BatchType.LOT,
      origin: QCOrigin.PRODUCTION,
    },
  });
  await prisma.manufacturingOrder.create({
    data: {
      orderNumber: `MO-${year}-${seq(moCounter++)}`,
      productId: byName('Ibuprofen 400mg Tablet').id,
      plannedDate: daysAgo(4),
      quantity: 700,
      status: ManufacturingStatus.PENDING_QC,
      batchId: pendingLot.id,
      userId: users.PRODUCTION_MANAGER.id,
      createdAt: daysAgo(5),
    },
  });
  await prisma.notification.create({
    data: {
      recipientRole: Role.QUALITY_MANAGER,
      message: `New LOT batch ${pendingLot.batchNumber} pending analysis`,
      type: NotificationType.INFO,
      relatedId: pendingLot.id,
      relatedType: 'batch',
      createdAt: daysAgo(2),
    },
  });

  // One scheduled (in_progress, future date)
  await prisma.manufacturingOrder.create({
    data: {
      orderNumber: `MO-${year}-${seq(moCounter++)}`,
      productId: byName('Amoxicillin 500mg Capsule').id,
      plannedDate: daysAhead(5),
      quantity: 600,
      status: ManufacturingStatus.IN_PROGRESS,
      userId: users.PRODUCTION_MANAGER.id,
    },
  });

  console.log(`✓ manufacturing orders + LOT batches`);

  // ── SALES ──────────────────────────────────────────────────
  async function createSalesOrder({ client, items, status, daysOld }) {
    let total = 0;
    for (const it of items) total += it.quantity * 50; // dummy price
    const order = await prisma.salesOrder.create({
      data: {
        orderNumber: `SO-${year}-${seq(soCounter++)}`,
        clientId: client.id,
        orderDate: daysAgo(daysOld),
        status,
        totalAmount: total,
        userId: users.SALES_MANAGER.id,
        createdAt: daysAgo(daysOld),
      },
    });
    for (const it of items) {
      await prisma.salesOrderItem.create({
        data: {
          salesOrderId: order.id,
          batchId: it.batch.id,
          productId: it.batch.productId,
          quantity: it.quantity,
        },
      });
      if (status !== SalesStatus.PENDING) {
        await prisma.stockMovement.create({
          data: {
            batchId: it.batch.id,
            type: MovementType.EXIT,
            quantity: it.quantity,
            date: daysAgo(daysOld - 1),
            reason: `Sales order ${order.orderNumber}`,
            userId: users.SALES_MANAGER.id,
          },
        });
      }
    }
    return order;
  }

  const so1 = await createSalesOrder({
    client: clients[0],
    items: [{ batch: lot1.batch, quantity: 200 }, { batch: lot2.batch, quantity: 100 }],
    status: SalesStatus.DELIVERED,
    daysOld: 18,
  });
  await prisma.deliveryNote.create({
    data: {
      noteNumber: `DN-${year}-${seq(dnCounter++)}`,
      salesOrderId: so1.id,
      deliveryDate: daysAgo(17),
      status: DeliveryStatus.DELIVERED,
    },
  });

  const so2 = await createSalesOrder({
    client: clients[1],
    items: [{ batch: lot3.batch, quantity: 150 }],
    status: SalesStatus.CONFIRMED,
    daysOld: 3,
  });
  await prisma.deliveryNote.create({
    data: {
      noteNumber: `DN-${year}-${seq(dnCounter++)}`,
      salesOrderId: so2.id,
      deliveryDate: daysAhead(1),
      status: DeliveryStatus.PREPARED,
    },
  });
  await prisma.notification.create({
    data: {
      recipientRole: Role.STOCK_MANAGER,
      message: `Sales order ${so2.orderNumber} confirmed — prepare delivery for ${clients[1].name}`,
      type: NotificationType.INFO,
      relatedId: so2.id,
      relatedType: 'sales_order',
      createdAt: daysAgo(3),
    },
  });

  await createSalesOrder({
    client: clients[2],
    items: [{ batch: lot1.batch, quantity: 80 }],
    status: SalesStatus.PENDING,
    daysOld: 1,
  });

  console.log(`✓ sales orders + delivery notes`);

  console.log('\nSeed complete.');
  console.log('Login credentials:');
  console.log('  admin / Admin@123');
  console.log('  stock / production / purchase / quality / sales — all User@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
