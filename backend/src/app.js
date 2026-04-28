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
const customerRoutes = require('./modules/customers/customers.routes');
const purchaseRoutes = require('./modules/purchases/purchases.routes');
const productionRoutes = require('./modules/production/production.routes');
const qualityRoutes = require('./modules/quality/quality.routes');
const batchRoutes = require('./modules/batches/batches.routes');
const stockRoutes = require('./modules/stock/stock.routes');
const salesRoutes = require('./modules/sales/sales.routes');
const logsRoutes = require('./modules/logs/logs.routes');

const app = express();

// --- Security headers ---
app.use(helmet());

// --- CORS ---
app.use(cors({ origin: env.cors.origin, credentials: true }));

// --- Body parsers ---
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// --- Sanitization: XSS, NoSQL injection, HTTP param pollution ---
app.use(mongoSanitize());
app.use(xssClean());
app.use(hpp());

// --- Logs ---
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// --- Global rate limit (defense-in-depth) ---
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// --- Health ---
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: env.nodeEnv }));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/logs', logsRoutes);

// --- 404 ---
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// --- Error handler ---
app.use(errorMiddleware);

module.exports = app;
