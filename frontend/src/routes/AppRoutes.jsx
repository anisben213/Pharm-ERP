import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { roleHome } from '../utils/roles.js';
import ProtectedRoute from './ProtectedRoute.jsx';

import AuthLayout from '../layouts/AuthLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import StockManagerLayout from '../layouts/StockManagerLayout.jsx';
import ProductionManagerLayout from '../layouts/ProductionManagerLayout.jsx';
import PurchaseManagerLayout from '../layouts/PurchaseManagerLayout.jsx';
import QualityManagerLayout from '../layouts/QualityManagerLayout.jsx';
import SalesManagerLayout from '../layouts/SalesManagerLayout.jsx';

import Login from '../pages/Login.jsx';
import NotificationsPage from '../pages/Notifications.jsx';

import AdminDashboard from '../pages/admin/Dashboard.jsx';
import AdminUsers from '../pages/admin/Users.jsx';
import AdminProducts from '../pages/admin/Products.jsx';

import StockDashboard from '../pages/stock/Dashboard.jsx';
import StockList from '../pages/stock/Stock.jsx';
import StockMovements from '../pages/stock/Movements.jsx';
import BatchTracking from '../pages/stock/BatchTracking.jsx';
import StockAlerts from '../pages/stock/Alerts.jsx';

import ProductionDashboard from '../pages/production/Dashboard.jsx';
import ManufacturingOrders from '../pages/production/Orders.jsx';
import ProductionSchedule from '../pages/production/Schedule.jsx';

import PurchaseDashboard from '../pages/purchase/Dashboard.jsx';
import PurchaseOrders from '../pages/purchase/Orders.jsx';
import Suppliers from '../pages/purchase/Suppliers.jsx';

import QualityDashboard from '../pages/quality/Dashboard.jsx';
import PendingAnalysis from '../pages/quality/Pending.jsx';
import QualityHistory from '../pages/quality/History.jsx';

import SalesDashboard from '../pages/sales/Dashboard.jsx';
import Catalog from '../pages/sales/Catalog.jsx';
import SalesOrders from '../pages/sales/Orders.jsx';
import Delivery from '../pages/sales/Delivery.jsx';
import Clients from '../pages/sales/Clients.jsx';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? roleHome(user) : '/login'} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route path="/" element={<HomeRedirect />} />

      {/* Admin */}
      <Route element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Stock Manager */}
      <Route element={<ProtectedRoute roles={['stock_manager']}><StockManagerLayout /></ProtectedRoute>}>
        <Route path="/stock_manager" element={<StockDashboard />} />
        <Route path="/stock_manager/stock" element={<StockList />} />
        <Route path="/stock_manager/movements" element={<StockMovements />} />
        <Route path="/stock_manager/batch-tracking" element={<BatchTracking />} />
        <Route path="/stock_manager/batch-tracking/:batchNumber" element={<BatchTracking />} />
        <Route path="/stock_manager/alerts" element={<StockAlerts />} />
        <Route path="/stock_manager/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Production Manager */}
      <Route element={<ProtectedRoute roles={['production_manager']}><ProductionManagerLayout /></ProtectedRoute>}>
        <Route path="/production_manager" element={<ProductionDashboard />} />
        <Route path="/production_manager/orders" element={<ManufacturingOrders />} />
        <Route path="/production_manager/schedule" element={<ProductionSchedule />} />
        <Route path="/production_manager/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Purchase Manager */}
      <Route element={<ProtectedRoute roles={['purchase_manager']}><PurchaseManagerLayout /></ProtectedRoute>}>
        <Route path="/purchase_manager" element={<PurchaseDashboard />} />
        <Route path="/purchase_manager/orders" element={<PurchaseOrders />} />
        <Route path="/purchase_manager/suppliers" element={<Suppliers />} />
        <Route path="/purchase_manager/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Quality Manager */}
      <Route element={<ProtectedRoute roles={['quality_manager']}><QualityManagerLayout /></ProtectedRoute>}>
        <Route path="/quality_manager" element={<QualityDashboard />} />
        <Route path="/quality_manager/pending" element={<PendingAnalysis />} />
        <Route path="/quality_manager/history" element={<QualityHistory />} />
        <Route path="/quality_manager/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Sales Manager */}
      <Route element={<ProtectedRoute roles={['sales_manager']}><SalesManagerLayout /></ProtectedRoute>}>
        <Route path="/sales_manager" element={<SalesDashboard />} />
        <Route path="/sales_manager/catalog" element={<Catalog />} />
        <Route path="/sales_manager/orders" element={<SalesOrders />} />
        <Route path="/sales_manager/delivery" element={<Delivery />} />
        <Route path="/sales_manager/clients" element={<Clients />} />
        <Route path="/sales_manager/notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
