import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { roleHome } from '../utils/roles.js';

// Layouts
import AuthLayout from '../layouts/AuthLayout.jsx';
import StockManagerLayout from '../layouts/StockManagerLayout.jsx';
import WarehouseKeeperLayout from '../layouts/WarehouseKeeperLayout.jsx';
import ProductionManagerLayout from '../layouts/ProductionManagerLayout.jsx';
import QualityManagerLayout from '../layouts/QualityManagerLayout.jsx';
import PurchaseManagerLayout from '../layouts/PurchaseManagerLayout.jsx';
import SalesManagerLayout from '../layouts/SalesManagerLayout.jsx';
import LabTechnicianLayout from '../layouts/LabTechnicianLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';

// Auth
import Login from '../pages/Login.jsx';

// Stock
import StockDashboard from '../pages/stock/Dashboard.jsx';
import StockProducts from '../pages/stock/Products.jsx';
import StockLevels from '../pages/stock/StockLevels.jsx';
import StockMovements from '../pages/stock/StockMovements.jsx';
import StockBatches from '../pages/stock/BatchTracking.jsx';
import StockAlerts from '../pages/stock/Alerts.jsx';
import StockReports from '../pages/stock/Reports.jsx';
import StockDeliveryNotes from '../pages/stock/DeliveryNotes.jsx';
import StockLocations from '../pages/stock/Locations.jsx';

// Warehouse
import WarehouseDashboard from '../pages/warehouse/Dashboard.jsx';
import WarehouseRecord from '../pages/warehouse/RecordMovement.jsx';
import WarehouseLocations from '../pages/warehouse/StorageLocations.jsx';
import WarehouseMovements from '../pages/warehouse/MyMovements.jsx';

// Production
import ProductionDashboard from '../pages/production/Dashboard.jsx';
import ManufacturingOrders from '../pages/production/ManufacturingOrders.jsx';
import ProductionOrderDetail from '../pages/production/OrderDetail.jsx';
import ProductionSchedule from '../pages/production/Schedule.jsx';
import ProductionBatchNumbers from '../pages/production/BatchNumbers.jsx';
import ProductionReports from '../pages/production/Reports.jsx';

// Quality
import QualityDashboard from '../pages/quality/Dashboard.jsx';
import QualityControlFiles from '../pages/quality/ControlFiles.jsx';
import QualityValidation from '../pages/quality/BatchValidation.jsx';
import QualityNonConformities from '../pages/quality/NonConformities.jsx';
import QualityRecalls from '../pages/quality/BatchRecalls.jsx';
import QualityHistory from '../pages/quality/History.jsx';
import QualityCertificates from '../pages/quality/Certificates.jsx';

// Lab
import LabDashboard from '../pages/lab/Dashboard.jsx';
import LabControlFiles from '../pages/lab/MyControlFiles.jsx';
import LabResults from '../pages/lab/EnterResults.jsx';
import LabCertificates from '../pages/lab/Certificates.jsx';

// Purchase
import PurchaseDashboard from '../pages/purchase/Dashboard.jsx';
import PurchaseRequests from '../pages/purchase/Requests.jsx';
import PurchaseOrdersPage from '../pages/purchase/PurchaseOrders.jsx';
import PurchaseSuppliers from '../pages/purchase/Suppliers.jsx';
import PurchaseTracking from '../pages/purchase/Tracking.jsx';

// Sales
import SalesDashboard from '../pages/sales/Dashboard.jsx';
import SalesCatalog from '../pages/sales/Catalog.jsx';
import SalesOrders from '../pages/sales/Orders.jsx';
import SalesOrderDetail from '../pages/sales/OrderDetail.jsx';
import SalesDeliveries from '../pages/sales/Deliveries.jsx';
import SalesInvoices from '../pages/sales/Invoices.jsx';
import SalesReturns from '../pages/sales/Returns.jsx';
import SalesClients from '../pages/sales/Clients.jsx';

// Admin
import AdminDashboard from '../pages/admin/Dashboard.jsx';
import AdminUsers from '../pages/admin/Users.jsx';
import AdminRoles from '../pages/admin/Roles.jsx';
import AdminLogs from '../pages/admin/Logs.jsx';
import AdminSettings from '../pages/admin/Settings.jsx';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={roleHome(user)} replace />;
}

const protect = (roles, el) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>;

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Stock Manager */}
      <Route path="/stock_manager" element={protect(['stock_manager', 'admin'], <StockManagerLayout />)}>
        <Route index element={<StockDashboard />} />
        <Route path="products"        element={<StockProducts />} />
        <Route path="levels"          element={<StockLevels />} />
        <Route path="locations"       element={<StockLocations />} />
        <Route path="movements"       element={<StockMovements />} />
        <Route path="delivery-notes"  element={<StockDeliveryNotes />} />
        <Route path="batches"         element={<StockBatches />} />
        <Route path="batches/:id"     element={<StockBatches />} />
        <Route path="alerts"          element={<StockAlerts />} />
        <Route path="reports"         element={<StockReports />} />
      </Route>

      {/* Warehouse Keeper */}
      <Route path="/warehouse_keeper" element={protect(['warehouse_keeper', 'admin', 'stock_manager'], <WarehouseKeeperLayout />)}>
        <Route index element={<WarehouseDashboard />} />
        <Route path="record"     element={<WarehouseRecord />} />
        <Route path="locations"  element={<WarehouseLocations />} />
        <Route path="movements"  element={<WarehouseMovements />} />
      </Route>

      {/* Production Manager */}
      <Route path="/production_manager" element={protect(['production_manager', 'admin'], <ProductionManagerLayout />)}>
        <Route index element={<ProductionDashboard />} />
        <Route path="orders"        element={<ManufacturingOrders />} />
        <Route path="orders/:id"    element={<ProductionOrderDetail />} />
        <Route path="schedule"      element={<ProductionSchedule />} />
        <Route path="batches"       element={<ProductionBatchNumbers />} />
        <Route path="reports"       element={<ProductionReports />} />
      </Route>

      {/* Quality Manager */}
      <Route path="/quality_manager" element={protect(['quality_manager', 'admin'], <QualityManagerLayout />)}>
        <Route index element={<QualityDashboard />} />
        <Route path="control-files"     element={<QualityControlFiles />} />
        <Route path="validation"        element={<QualityValidation />} />
        <Route path="non-conformities"  element={<QualityNonConformities />} />
        <Route path="recalls"           element={<QualityRecalls />} />
        <Route path="history"           element={<QualityHistory />} />
        <Route path="certificates"      element={<QualityCertificates />} />
      </Route>

      {/* Lab Technician */}
      <Route path="/lab_technician" element={protect(['lab_technician', 'admin', 'quality_manager'], <LabTechnicianLayout />)}>
        <Route index element={<LabDashboard />} />
        <Route path="control-files" element={<LabControlFiles />} />
        <Route path="results"       element={<LabResults />} />
        <Route path="certificates"  element={<LabCertificates />} />
      </Route>

      {/* Purchase Manager */}
      <Route path="/purchase_manager" element={protect(['purchase_manager', 'admin'], <PurchaseManagerLayout />)}>
        <Route index element={<PurchaseDashboard />} />
        <Route path="requests"   element={<PurchaseRequests />} />
        <Route path="orders"     element={<PurchaseOrdersPage />} />
        <Route path="suppliers"  element={<PurchaseSuppliers />} />
        <Route path="tracking"   element={<PurchaseTracking />} />
      </Route>

      {/* Sales Manager */}
      <Route path="/sales_manager" element={protect(['sales_manager', 'admin'], <SalesManagerLayout />)}>
        <Route index element={<SalesDashboard />} />
        <Route path="catalog"        element={<SalesCatalog />} />
        <Route path="orders"         element={<SalesOrders />} />
        <Route path="orders/:id"     element={<SalesOrderDetail />} />
        <Route path="deliveries"     element={<SalesDeliveries />} />
        <Route path="invoices"       element={<SalesInvoices />} />
        <Route path="returns"        element={<SalesReturns />} />
        <Route path="clients"        element={<SalesClients />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={protect(['admin'], <AdminLayout />)}>
        <Route index element={<AdminDashboard />} />
        <Route path="users"     element={<AdminUsers />} />
        <Route path="roles"     element={<AdminRoles />} />
        <Route path="logs"      element={<AdminLogs />} />
        <Route path="settings"  element={<AdminSettings />} />
        <Route path="stock"     element={<StockLevels />} />
      </Route>

      {/* Root + 404 */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
