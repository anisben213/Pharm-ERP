// Maps backend Role enum -> frontend role key used for layouts/routes.
export const BACKEND_TO_KEY = {
  ADMIN: 'admin',
  PURCHASER: 'purchase_manager',
  STOCK_MANAGER: 'stock_manager',
  WAREHOUSE_KEEPER: 'warehouse_keeper',
  PRODUCTION_MANAGER: 'production_manager',
  QUALITY_CONTROLLER: 'quality_manager',
  LAB_TECHNICIAN: 'lab_technician',
  SALES_AGENT: 'sales_manager',
};

export const ROLE_KEYS = [
  'admin',
  'stock_manager',
  'warehouse_keeper',
  'production_manager',
  'quality_manager',
  'purchase_manager',
  'sales_manager',
  'lab_technician',
];

export const ROLE_LABEL = {
  admin: 'Administrator',
  stock_manager: 'Stock Manager',
  warehouse_keeper: 'Warehouse Keeper',
  production_manager: 'Production Manager',
  quality_manager: 'Quality Manager',
  purchase_manager: 'Purchase Manager',
  sales_manager: 'Sales Manager',
  lab_technician: 'Lab Technician',
};

export const roleKey = (user) => {
  if (!user) return null;
  return BACKEND_TO_KEY[user.role] || String(user.role || '').toLowerCase();
};

export const roleHome = (user) => {
  const k = roleKey(user);
  return k ? `/${k}` : '/login';
};
