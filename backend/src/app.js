const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');

const env = require('./config/env');
const errorMiddleware = require('./middleware/errorMiddleware');

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes');
const productRoutes = require('./modules/products/products.routes');
const supplierRoutes = require('./modules/suppliers/suppliers.routes');
const clientRoutes = require('./modules/clients/clients.routes');
const purchaseOrderRoutes = require('./modules/purchaseOrders/purchaseOrders.routes');
const manufacturingOrderRoutes = require('./modules/manufacturingOrders/manufacturingOrders.routes');
const qualityControlRoutes = require('./modules/qualityControls/qualityControls.routes');
const stockRoutes = require('./modules/stock/stock.routes');
const salesOrderRoutes = require('./modules/salesOrders/salesOrders.routes');
const deliveryNoteRoutes = require('./modules/deliveryNotes/deliveryNotes.routes');
const notificationRoutes = require('./modules/notifications/notifications.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.cors.origin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xssClean());
app.use(hpp());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 600 }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', env: env.nodeEnv }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/manufacturing-orders', manufacturingOrderRoutes);
app.use('/api/quality-controls', qualityControlRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/delivery-notes', deliveryNoteRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.use(errorMiddleware);

module.exports = app;
