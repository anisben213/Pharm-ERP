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
  create: (body) => api.post('/sales', body).then((r) => r.data),
  deliver: (id) => api.post(`/sales/${id}/deliver`).then((r) => r.data),
};

export const stockService = {
  movements: (params) => api.get('/stock/movements', { params }).then(wrap('movements')),
  summary: () => api.get('/stock/summary').then(wrap('summary')),
  createMovement: (body) => api.post('/stock/movements', body).then((r) => r.data),
  blockBatch: (batchId, reason) => api.post(`/stock/block/${batchId}`, { reason }).then((r) => r.data),
  expiring: (days = 90) => api.get('/stock/expiring', { params: { days } }).then(wrap('batches')),
};

export const logsService = {
  list: (params) => api.get('/logs', { params }).then(wrap('logs')),
};

export const supplierService = {
  list: () => api.get('/suppliers').then(wrap('suppliers')),
  create: (body) => api.post('/suppliers', body).then((r) => r.data),
};

export const customerService = {
  list: () => api.get('/customers').then(wrap('customers')),
  create: (body) => api.post('/customers', body).then((r) => r.data),
};
