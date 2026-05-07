import api from './api.js';

export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  forgotPassword: (username, email) => api.post('/auth/forgot-password', { username, email }).then((r) => r.data),
  resetPassword: (username, currentPassword, newPassword) =>
    api.post('/auth/reset-password', { username, currentPassword, newPassword }).then((r) => r.data),
};

export const userService = {
  list: () => api.get('/users').then((r) => r.data.users),
  create: (data) => api.post('/users', data).then((r) => r.data.user),
  update: (id, data) => api.put(`/users/${id}`, data).then((r) => r.data.user),
  deactivate: (id) => api.put(`/users/${id}/deactivate`).then((r) => r.data.user),
  activate: (id) => api.put(`/users/${id}/activate`).then((r) => r.data.user),
};

export const productService = {
  list: (params) => api.get('/products', { params }).then((r) => r.data.products),
  catalog: () => api.get('/products/catalog').then((r) => r.data.products),
  create: (data) => api.post('/products', data).then((r) => r.data.product),
  update: (id, data) => api.put(`/products/${id}`, data).then((r) => r.data.product),
};

export const supplierService = {
  list: () => api.get('/suppliers').then((r) => r.data.suppliers),
  create: (data) => api.post('/suppliers', data).then((r) => r.data.supplier),
  update: (id, data) => api.put(`/suppliers/${id}`, data).then((r) => r.data.supplier),
};

export const clientService = {
  list: () => api.get('/clients').then((r) => r.data.clients),
  create: (data) => api.post('/clients', data).then((r) => r.data.client),
  update: (id, data) => api.put(`/clients/${id}`, data).then((r) => r.data.client),
};

export const purchaseOrderService = {
  list: () => api.get('/purchase-orders').then((r) => r.data.orders),
  create: (data) => api.post('/purchase-orders', data).then((r) => r.data.order),
  receive: (id, data) => api.put(`/purchase-orders/${id}/receive`, data).then((r) => r.data.order),
};

export const manufacturingOrderService = {
  list: () => api.get('/manufacturing-orders').then((r) => r.data.orders),
  get: (id) => api.get(`/manufacturing-orders/${id}`).then((r) => r.data.order),
  create: (data) => api.post('/manufacturing-orders', data).then((r) => r.data.order),
  close: (id) => api.put(`/manufacturing-orders/${id}/close`).then((r) => r.data.order),
};

export const qualityControlService = {
  pending: () => api.get('/quality-controls/pending').then((r) => r.data.batches),
  history: () => api.get('/quality-controls/history').then((r) => r.data.controls),
  certificate: (id) => api.get(`/quality-controls/${id}/certificate`).then((r) => r.data.control),
  validate: (batchId, notes) => api.put(`/quality-controls/batch/${batchId}/validate`, { notes }).then((r) => r.data),
  reject: (batchId, notes) => api.put(`/quality-controls/batch/${batchId}/reject`, { notes }).then((r) => r.data),
};

export const stockService = {
  list: () => api.get('/stock').then((r) => r.data),
  alerts: () => api.get('/stock/alerts').then((r) => r.data),
  trace: (batchNumber) => api.get(`/stock/batch/${encodeURIComponent(batchNumber)}`).then((r) => r.data),
  movements: () => api.get('/stock/movements').then((r) => r.data.movements),
  createMovement: (data) => api.post('/stock/movements', data).then((r) => r.data.movement),
  reports: () => api.get('/stock/reports').then((r) => r.data),
};

export const salesOrderService = {
  list: () => api.get('/sales-orders').then((r) => r.data.orders),
  get: (id) => api.get(`/sales-orders/${id}`).then((r) => r.data.order),
  create: (data) => api.post('/sales-orders', data).then((r) => r.data.order),
  confirm: (id) => api.put(`/sales-orders/${id}/confirm`).then((r) => r.data.order),
};

export const deliveryNoteService = {
  list: () => api.get('/delivery-notes').then((r) => r.data.notes),
  create: (data) => api.post('/delivery-notes', data).then((r) => r.data.note),
  setStatus: (id, status) => api.put(`/delivery-notes/${id}/status`, { status }).then((r) => r.data.note),
};

export const notificationService = {
  list: () => api.get('/notifications').then((r) => r.data),
  unreadCount: () => api.get('/notifications/unread-count').then((r) => r.data.unread),
  read: (id) => api.put(`/notifications/${id}/read`).then((r) => r.data.notification),
  readAll: () => api.put('/notifications/read-all').then((r) => r.data),
};
