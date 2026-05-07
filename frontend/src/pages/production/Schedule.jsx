import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../../components/common/Modal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { manufacturingOrderService } from '../../services/index.js';

const STATUS_BG = {
  IN_PROGRESS: 'bg-primary text-white',
  PENDING_QC: 'bg-warning text-white',
  CLOSED: 'bg-success text-white',
};

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function startOfWeek(d) {
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday-first
  const r = new Date(d);
  r.setDate(d.getDate() - diff);
  r.setHours(0, 0, 0, 0);
  return r;
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isoKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

export default function Schedule() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month');
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try { setOrders(await manufacturingOrderService.list()); }
      finally { setLoading(false); }
    })();
  }, []);

  const byDate = useMemo(() => {
    const map = {};
    for (const o of orders) {
      if (!o.plannedDate) continue;
      const k = isoKey(new Date(o.plannedDate));
      if (!map[k]) map[k] = [];
      map[k].push(o);
    }
    return map;
  }, [orders]);

  const days = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(cursor);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start); d.setDate(start.getDate() + i); return d;
      });
    }
    const start = startOfWeek(startOfMonth(cursor));
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i); return d;
    });
  }, [view, cursor]);

  const today = new Date();
  const title = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(addMonths(cursor, view === 'week' ? -0.25 : -1))}
            className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-all duration-200"><ChevronLeft size={18} /></button>
          <button onClick={() => setCursor(startOfMonth(new Date()))}
            className="px-3 py-1.5 rounded-lg text-sm hover:bg-slate-100 cursor-pointer transition-all duration-200">Today</button>
          <button onClick={() => setCursor(addMonths(cursor, view === 'week' ? 0.25 : 1))}
            className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-all duration-200"><ChevronRight size={18} /></button>
          <h2 className="text-lg font-semibold text-ink-800 ml-2">{title}</h2>
        </div>
        <div className="bg-slate-100 rounded-lg p-1 flex gap-1">
          {['month', 'week'].map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all duration-200 cursor-pointer ${
                view === v ? 'bg-white text-ink-800 shadow-sm' : 'text-slate-500 hover:text-ink-800'
              }`}>{v}</button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm bg-primary inline-block" /> In Progress</span>
          <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm bg-warning inline-block" /> Pending QC</span>
          <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm bg-success inline-block" /> Closed</span>
        </div>
      </div>

      <div className="card p-2">
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="label-xs text-center py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const k = isoKey(d);
            const dayOrders = byDate[k] || [];
            const main = dayOrders[0];
            const cellBg = main ? STATUS_BG[main.status] || 'bg-slate-100 text-ink-800' : 'bg-white text-ink-800';
            const inMonth = d.getMonth() === cursor.getMonth() || view === 'week';
            const isToday = sameDay(d, today);
            return (
              <button
                key={k}
                onClick={() => dayOrders.length && setSelected({ day: d, orders: dayOrders })}
                className={`relative min-h-[88px] rounded-lg p-2 text-left border ${
                  isToday ? 'border-primary' : 'border-slate-200'
                } ${inMonth ? '' : 'opacity-40'} ${cellBg} ${
                  dayOrders.length ? 'hover:scale-[1.02] cursor-pointer' : 'cursor-default'
                } transition-all duration-200 ease-out`}
              >
                <div className={`text-xs font-semibold mb-1 ${main ? 'text-white/90' : 'text-slate-500'}`}>
                  {d.getDate()}
                </div>
                {main && (
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold leading-tight truncate">
                      {main.batch?.product?.name || '—'}
                    </div>
                    <div className="text-[10px] opacity-90 truncate">{main.batch?.batchNumber}</div>
                    <div className="text-[10px] opacity-80">Qty {main.batch?.quantity ?? ''}</div>
                    {dayOrders.length > 1 && <div className="text-[10px] opacity-90">+{dayOrders.length - 1} more</div>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {loading && <div className="text-sm text-slate-500 mt-3">Loading…</div>}
      </div>

      {selected && (
        <Modal open onClose={() => setSelected(null)}
          title={selected.day.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}>
          <div className="space-y-3">
            {selected.orders.map((o) => (
              <div key={o.id} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-ink-800">{o.orderNumber}</div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="text-sm text-slate-600">{o.batch?.product?.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Batch <span className="text-primary font-medium">{o.batch?.batchNumber}</span> · {o.batch?.quantity} units
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
