// Role mapping and helpers — PharmaLab ERP simplified
// Backend enum values are uppercase; we expose lowercase keys to the UI.

export const ROLES = {
  admin: 'ADMIN',
  stock_manager: 'STOCK_MANAGER',
  production_manager: 'PRODUCTION_MANAGER',
  purchase_manager: 'PURCHASE_MANAGER',
  quality_manager: 'QUALITY_MANAGER',
  sales_manager: 'SALES_MANAGER',
};

export const ROLE_LABEL = {
  admin: 'Administrator',
  stock_manager: 'Stock Manager',
  production_manager: 'Production Manager',
  purchase_manager: 'Purchase Manager',
  quality_manager: 'Quality Manager',
  sales_manager: 'Sales Manager',
};

const TO_KEY = Object.fromEntries(Object.entries(ROLES).map(([k, v]) => [v, k]));

export function roleKey(user) {
  if (!user) return null;
  if (user.role && TO_KEY[user.role]) return TO_KEY[user.role];
  return user.role?.toLowerCase?.() || null;
}

export function roleHome(user) {
  const k = roleKey(user);
  switch (k) {
    case 'admin': return '/admin';
    case 'stock_manager': return '/stock_manager';
    case 'production_manager': return '/production_manager';
    case 'purchase_manager': return '/purchase_manager';
    case 'quality_manager': return '/quality_manager';
    case 'sales_manager': return '/sales_manager';
    default: return '/login';
  }
}
