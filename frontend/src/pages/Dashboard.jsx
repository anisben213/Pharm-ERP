import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import {
  batchService, stockService, purchaseService, salesService, productionService,
} from '../services';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_COLORS = {
  CREATED: '#94a3b8',
  IN_QUARANTINE: '#f59e0b',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
  IN_PRODUCTION: '#3b82f6',
  RELEASED: '#14b8a6',
  SOLD: '#6366f1',
  RECALLED: '#dc2626',
  EXPIRED: '#64748b',
};

function Card({ label, value, color = 'slate', hint }) {
  return (
    <div className={`bg-white rounded-lg shadow p-5 border-l-4 border-${color}-500`}>
      <div className="text-slate-500 text-sm">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [batches, setBatches] = useState([]);
  const [summary, setSummary] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [production, setProduction] = useState([]);
  const [expiring, setExpiring] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState('');
  const [productType, setProductType] = useState('');

  useEffect(() => {
    batchService.list().then((d) => setBatches(d.batches || [])).catch(() => {});
    stockService.summary().then((d) => setSummary(d.summary || [])).catch(() => {});
    stockService.expiring(90).then((d) => setExpiring(d.batches || [])).catch(() => {});
    purchaseService.list().then((d) => setPurchases(d.orders || [])).catch(() => {});
    salesService.list().then((d) => setSales(d.orders || [])).catch(() => {});
    productionService.list().then((d) => setProduction(d.orders || [])).catch(() => {});
  }, []);

  const inRange = (iso) => {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    const f = new Date(fromDate).getTime();
    const tt = new Date(toDate).getTime() + 24 * 3600 * 1000;
    return t >= f && t <= tt;
  };

  const filteredBatches = useMemo(() => {
    const s = search.trim().toLowerCase();
    return batches.filter((b) => {
      if (statusFilter && b.status !== statusFilter) return false;
      if (productType && b.product?.type !== productType) return false;
      if (s && !(
        b.batchNumber?.toLowerCase().includes(s) ||
        b.product?.name?.toLowerCase().includes(s) ||
        b.product?.sku?.toLowerCase().includes(s)
      )) return false;
      if (b.createdAt && !inRange(b.createdAt)) return false;
      return true;
    });
  }, [batches, search, statusFilter, productType, fromDate, toDate]);

  const filteredPurchases = useMemo(
    () => purchases.filter((p) => inRange(p.createdAt)),
    [purchases, fromDate, toDate]
  );
  const filteredSales = useMemo(
    () => sales.filter((s) => inRange(s.createdAt)),
    [sales, fromDate, toDate]
  );
  const filteredProduction = useMemo(
    () => production.filter((p) => inRange(p.createdAt || p.startedAt)),
    [production, fromDate, toDate]
  );

  // Chart data: batches by status (pie)
  const statusData = useMemo(() => {
    const map = {};
    filteredBatches.forEach((b) => { map[b.status] = (map[b.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredBatches]);

  // Chart data: stock by product (bar)
  const stockBarData = useMemo(() => {
    const map = {};
    summary.forEach((s) => {
      const key = s.product?.name || 'Unknown';
      map[key] = (map[key] || 0) + s.quantity;
    });
    return Object.entries(map)
      .map(([name, qty]) => ({ name, qty: Math.round(qty) }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }, [summary]);

  // Chart data: daily activity timeline (line)
  const timelineData = useMemo(() => {
    const dayMap = {};
    const bump = (iso, key) => {
      if (!iso) return;
      const d = iso.slice(0, 10);
      if (!dayMap[d]) dayMap[d] = { date: d, purchases: 0, sales: 0, production: 0 };
      dayMap[d][key] += 1;
    };
    filteredPurchases.forEach((p) => bump(p.createdAt, 'purchases'));
    filteredSales.forEach((s) => bump(s.createdAt, 'sales'));
    filteredProduction.forEach((p) => bump(p.createdAt || p.startedAt, 'production'));
    return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredPurchases, filteredSales, filteredProduction]);

  const totalStock = summary.reduce((s, r) => s + r.quantity, 0);
  const recalledCount = filteredBatches.filter((b) => b.status === 'RECALLED').length;
  const rejectedCount = filteredBatches.filter((b) => b.status === 'REJECTED').length;

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.fullName || user?.email}`}
        subtitle={`Role: ${user?.role}`}
      />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-slate-500 mb-1">Search</label>
          <input
            type="text"
            placeholder="Batch #, product, SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">To</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
            <option value="">All</option>
            {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Product Type</label>
          <select value={productType} onChange={(e) => setProductType(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
            <option value="">All</option>
            <option value="RAW_MATERIAL">RAW_MATERIAL</option>
            <option value="FINISHED_PRODUCT">FINISHED_PRODUCT</option>
            <option value="PACKAGING">PACKAGING</option>
          </select>
        </div>
        <button
          onClick={() => { setSearch(''); setStatusFilter(''); setProductType(''); }}
          className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5"
        >
          Clear
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
        <Card label="Batches" value={filteredBatches.length} color="blue" />
        <Card label="Total Stock" value={totalStock.toFixed(0)} color="emerald" hint="all units combined" />
        <Card label="Purchases" value={filteredPurchases.length} color="indigo" />
        <Card label="Sales" value={filteredSales.length} color="cyan" />
        <Card label="Production" value={filteredProduction.length} color="violet" />
        <Card label="Expiring ≤90d" value={expiring.length} color="amber" />
      </div>

      {(recalledCount > 0 || rejectedCount > 0) && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {recalledCount > 0 && <Card label="Recalled" value={recalledCount} color="red" hint="in selection" />}
          {rejectedCount > 0 && <Card label="Rejected" value={rejectedCount} color="rose" hint="in selection" />}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold mb-3">Batch Status Distribution</h2>
          {statusData.length === 0 ? (
            <div className="text-slate-500 text-sm h-64 flex items-center justify-center">No data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {statusData.map((d) => (
                    <Cell key={d.name} fill={STATUS_COLORS[d.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold mb-3">Top Products by Stock</h2>
          {stockBarData.length === 0 ? (
            <div className="text-slate-500 text-sm h-64 flex items-center justify-center">No data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stockBarData} margin={{ left: 0, right: 10, top: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={60} fontSize={11} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="qty" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5 mb-4">
        <h2 className="font-semibold mb-3">Activity Timeline (purchases · sales · production)</h2>
        {timelineData.length === 0 ? (
          <div className="text-slate-500 text-sm h-48 flex items-center justify-center">No orders in selected range.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="purchases" stroke="#6366f1" strokeWidth={2} dot />
              <Line type="monotone" dataKey="sales" stroke="#06b6d4" strokeWidth={2} dot />
              <Line type="monotone" dataKey="production" stroke="#8b5cf6" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent batches (filtered) */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Recent Batches ({filteredBatches.length})</h2>
          <button onClick={() => nav('/batches')} className="text-sm text-blue-600 hover:underline">View all →</button>
        </div>
        {filteredBatches.length === 0 ? (
          <div className="text-slate-500 text-sm">No batches match filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2">Batch #</th>
                  <th>Product</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.slice(0, 8).map((b) => (
                  <tr key={b.id} className="border-t hover:bg-slate-50 cursor-pointer" onClick={() => nav(`/batches/${b.id}`)}>
                    <td className="py-2 text-blue-600">{b.batchNumber}</td>
                    <td>{b.product?.name}</td>
                    <td>{Number(b.remainingQty)} {b.product?.unit}</td>
                    <td><StatusBadge value={b.status} /></td>
                    <td>{b.expiryDate?.slice(0, 10) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
