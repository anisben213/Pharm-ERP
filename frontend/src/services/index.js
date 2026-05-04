import api from './api';

// Backend list endpoints return arrays; wrap them so pages can destructure.
const wrap = (key) => (r) => ({ [key]: r.data });

export const authService = {
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const batchService = {
  list: (params) => api.get('/batches', { params }).then(wrap('batches')),
  get: (id) => api.get(`/batches/${id}`).then((r) => r.data),
  trace: (id) => api.get(`/batches/${id}/trace`).then((r) => r.data),
  updateStatus: (id, body) => api.patch(`/batches/${id}/status`, body).then((r) => r.data),
  recall: (id, reason) => api.post(`/batches/${id}/recall`, { reason }).then((r) => r.data),
  setCorrectiveAction: (id, correctiveAction) => api.patch(`/batches/${id}/corrective-action`, { correctiveAction }).then((r) => r.data),
};

export const userService = {
  list: () => api.get('/users').then(wrap('users')),
  create: (body) => api.post('/users', body).then((r) => r.data),
  update: (id, body) => api.put(`/users/${id}`, body).then((r) => r.data),
  remove: (id) => api.delete(`/users/${id}`).then((r) => r.data),
};

export const productService = {
  list: () => api.get('/products').then(wrap('products')),
  create: (body) => api.post('/products', body).then((r) => r.data),
  setMinLevel: (id, minLevel) => api.patch(`/products/${id}/min-level`, { minLevel }).then((r) => r.data),
};

export const purchaseService = {
  list: () => api.get('/purchases').then(wrap('orders')),
  create: (body) => api.post('/purchases', body).then((r) => r.data),
  confirm: (id) => api.post(`/purchases/${id}/confirm`).then((r) => r.data),
  receive: (id) => api.post(`/purchases/${id}/receive`).then((r) => r.data),
  cancel: (id) => api.post(`/purchases/${id}/cancel`).then((r) => r.data),
};

export const productionService = {
  list: () => api.get('/production').then(wrap('orders')),
  create: (body) => api.post('/production', body).then((r) => r.data),
  start: (id) => api.post(`/production/${id}/start`).then((r) => r.data),
  complete: (id, body) => api.post(`/production/${id}/complete`, body).then((r) => r.data),
};

export const qualityService = {
  list: (batchId) => api.get('/quality', { params: { batchId } }).then(wrap('checks')),
  inspect: (body) => api.post('/quality', body).then((r) => r.data),
};

export const salesService = {
  list: () => api.get('/sales').then(wrap('orders')),
  get: (id) => api.get(`/sales/${id}`).then((r) => r.data),
  create: (body) => api.post('/sales', body).then((r) => r.data),
  deliver: (id) => api.post(`/sales/${id}/deliver`).then((r) => r.data),
  returnOrder: (id) => api.post(`/sales/${id}/return`).then((r) => r.data),
};

export const stockService = {
  movements: (params) =>
    api.get('/stock/movements', { params }).then((r) => ({
      movements: (r.data || []).map((m) => ({
        ...m,
        productName: m.batch?.product?.name || '—',
        batchNumber: m.batch?.batchNumber || '—',
        note: m.note || '—',
        reference: m.reference || null,
        typeGroup: m.type?.startsWith('IN') ? 'IN' : 'OUT',
      })),
    })),
  summary: () =>
    api.get('/stock/summary').then((r) => {
      const byProduct = {};
      for (const item of r.data || []) {
        const p = item.product || {};
        if (!byProduct[item.productId]) {
          byProduct[item.productId] = {
            productId: item.productId,
            productName: p.name || '—',
            sku: p.sku || '—',
            category: p.type || '—',
            unit: p.unit || '',
            quantity: 0,
            minLevel: Number(p.minLevel ?? 0),
          };
        }
        byProduct[item.productId].quantity += Number(item.quantity || 0);
      }
      return { summary: Object.values(byProduct) };
    }),
  createMovement: (body) => api.post('/stock/movements', body).then((r) => r.data),
  blockBatch: (batchId, reason) => api.post(`/stock/block/${batchId}`, { reason }).then((r) => r.data),
  expiring: (days = 90) =>
    api.get('/stock/expiring', { params: { days } }).then((r) => ({
      batches: (r.data || []).map((b) => ({ ...b, productName: b.product?.name || '—' })),
    })),
};

export const logsService = {
  list: (params) => api.get('/logs', { params }).then(wrap('logs')),
};

export const supplierService = {
  list: () => api.get('/suppliers').then(wrap('suppliers')),
  create: (body) => api.post('/suppliers', body).then((r) => r.data),
  rate: (id, rating) => api.patch(`/suppliers/${id}/rate`, { rating }).then((r) => r.data),
};

export const customerService = {
  list: () => api.get('/customers').then(wrap('customers')),
  create: (body) => api.post('/customers', body).then((r) => r.data),
};
