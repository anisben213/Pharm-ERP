import { useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import useFetch from '../../hooks/useFetch.js';
import { productionService } from '../../services/index.js';
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid } from 'lucide-react';

const DAY_LABELS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_META = {
  PLANNED:     { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-300',   dot: 'bg-amber-400'   },
  IN_PROGRESS: { bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300',    dot: 'bg-blue-500'    },
  COMPLETED:   { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  CANCELLED:   { bg: 'bg-slate-100',   text: 'text-slate-500',   border: 'border-slate-200',   dot: 'bg-slate-400'   },
};
const ALL_STATUSES = Object.keys(STATUS_META);

function isoDay(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function startOfWeekMon(d) {
  const x = new Date(d); x.setHours(0,0,0,0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

function OrderPill({ order, compact }) {
  const m = STATUS_META[order.status] || STATUS_META.PLANNED;
  if (compact) return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border ${m.bg} ${m.text} ${m.border} truncate`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.dot}`} />
      <span className="truncate">{order.product?.name || order.productName || order.reference}</span>
    </div>
  );
  return (
    <div className={`p-2 rounded-lg border text-xs ${m.bg} ${m.text} ${m.border}`}>
      <div className="font-mono font-semibold">{order.reference}</div>
      <div className="truncate mt-0.5">{order.product?.name || order.productName || '—'}</div>
      <div className="mt-1 flex items-center gap-1">
        <span className={`w-2 h-2 rounded-full ${m.dot}`} />
        <span className="capitalize text-[11px]">{order.status.replace('_', ' ')}</span>
      </div>
      {order.quantity && <div className="mt-0.5 text-[11px] opacity-70">Qty: {order.quantity}</div>}
    </div>
  );
}

/* ─── MONTH VIEW ─────────────────────────────────────── */
function MonthView({ year, month, orderMap, onDayClick, selectedDay }) {
  const today = isoDay(new Date());
  // grid starts on the Monday of the week containing the 1st
  const firstDay = new Date(year, month, 1);
  const gridStart = startOfWeekMon(firstDay);
  const cells = Array.from({ length: 42 }).map((_, i) => {
    const d = new Date(gridStart); d.setDate(d.getDate() + i); return d;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 divide-x divide-slate-100">
        {cells.map((d, i) => {
          const key   = isoDay(d);
          const isToday    = key === today;
          const isSelected = key === selectedDay;
          const isCurMonth = d.getMonth() === month;
          const orders = orderMap[key] || [];
          const visible = orders.slice(0, 3);
          const extra  = orders.length - 3;
          return (
            <div
              key={i}
              onClick={() => onDayClick(key)}
              className={`min-h-[110px] p-1.5 cursor-pointer border-b border-slate-100 transition-colors
                ${!isCurMonth ? 'bg-slate-50/60' : 'bg-white hover:bg-slate-50'}
                ${isSelected ? 'ring-2 ring-inset ring-primary' : ''}
              `}
            >
              <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1
                ${isToday ? 'bg-primary text-white' : isCurMonth ? 'text-ink-800' : 'text-slate-400'}
              `}>
                {d.getDate()}
              </div>
              <div className="space-y-0.5">
                {visible.map((o) => <OrderPill key={o.id} order={o} compact />)}
                {extra > 0 && <div className="text-[10px] text-primary font-medium pl-1">+{extra} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── WEEK VIEW ─────────────────────────────────────── */
function WeekView({ weekStart, orderMap }) {
  const today = isoDay(new Date());
  const days  = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  });
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="grid grid-cols-7 divide-x divide-slate-200">
        {days.map((d, i) => {
          const key    = isoDay(d);
          const isToday = key === today;
          const orders  = orderMap[key] || [];
          return (
            <div key={i} className={`min-h-[320px] flex flex-col ${isToday ? 'bg-primary-50' : 'bg-white'}`}>
              <div className={`py-3 text-center border-b border-slate-200 ${isToday ? 'border-primary' : ''}`}>
                <div className="text-xs font-semibold text-slate-500 uppercase">{DAY_LABELS[i]}</div>
                <div className={`mx-auto mt-1 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold
                  ${isToday ? 'bg-primary text-white' : 'text-ink-800'}
                `}>
                  {d.getDate()}
                </div>
              </div>
              <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                {orders.length === 0
                  ? <p className="text-xs text-slate-300 text-center pt-6">—</p>
                  : orders.map((o) => <OrderPill key={o.id} order={o} compact={false} />)
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── DAY DETAIL SIDEBAR ─────────────────────────────── */
function DayDetail({ date, orders, onClose }) {
  if (!date) return null;
  const d = new Date(date);
  return (
    <div className="card border-l-4 border-primary">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-ink-800">
          {d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
      </div>
      {orders.length === 0
        ? <p className="text-sm text-slate-400">No orders planned for this day.</p>
        : (
          <div className="space-y-2">
            {orders.map((o) => {
              const m = STATUS_META[o.status] || STATUS_META.PLANNED;
              return (
                <div key={o.id} className={`p-3 rounded-lg border ${m.bg} ${m.border}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-sm font-semibold ${m.text}`}>{o.reference}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.bg} ${m.text} border ${m.border}`}>
                      {o.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-ink-700">{o.product?.name || o.productName || '—'}</div>
                  {o.quantity && <div className="text-xs text-slate-500 mt-0.5">Qty: {o.quantity}</div>}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────── */
export default function ProductionSchedule() {
  const { data, loading } = useFetch(() => productionService.list().then((r) => r.orders), []);

  const today = new Date();
  const [view, setView]               = useState('month');           // 'month' | 'week'
  const [cursor, setCursor]           = useState(new Date(today));   // drives month/week nav
  const [statusFilter, setStatusFilter] = useState([]);              // [] = all
  const [selectedDay, setSelectedDay] = useState(null);

  // Derived nav state
  const year       = cursor.getFullYear();
  const month      = cursor.getMonth();
  const weekStart  = startOfWeekMon(cursor);

  function navigate(dir) {
    setCursor((prev) => {
      const d = new Date(prev);
      if (view === 'month') d.setMonth(d.getMonth() + dir);
      else                  d.setDate(d.getDate() + dir * 7);
      return d;
    });
    setSelectedDay(null);
  }
  function goToday() { setCursor(new Date(today)); setSelectedDay(null); }

  // Filtered orders
  const filtered = useMemo(() => {
    const all = data || [];
    return statusFilter.length === 0 ? all : all.filter((o) => statusFilter.includes(o.status));
  }, [data, statusFilter]);

  // Build day→orders map
  const orderMap = useMemo(() => {
    const map = {};
    for (const o of filtered) {
      if (!o.plannedDate) continue;
      const key = isoDay(new Date(o.plannedDate));
      if (!map[key]) map[key] = [];
      map[key].push(o);
    }
    return map;
  }, [filtered]);

  function toggleStatus(s) {
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const navLabel = view === 'month'
    ? `${MONTH_NAMES[month]} ${year}`
    : (() => {
        const end = new Date(weekStart); end.setDate(end.getDate() + 6);
        return `${weekStart.toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${end.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}`;
      })();

  const selectedOrders = selectedDay ? (orderMap[selectedDay] || []) : [];

  return (
    <div className="space-y-4">
      <PageHeader title="Production Schedule" subtitle="Calendar view of planned manufacturing orders." />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View toggle */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
          <button
            onClick={() => setView('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${view === 'month' ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutGrid size={14} /> Month
          </button>
          <button
            onClick={() => setView('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-l border-slate-200 transition-colors ${view === 'week' ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            <CalendarDays size={14} /> Week
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-ink-800 min-w-[180px] text-center">{navLabel}</span>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <ChevronRight size={16} />
          </button>
          <button onClick={goToday} className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Today
          </button>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          <span className="text-xs text-slate-500 mr-1">Filter:</span>
          {ALL_STATUSES.map((s) => {
            const m = STATUS_META[s];
            const active = statusFilter.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all
                  ${active ? `${m.bg} ${m.text} ${m.border}` : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
              >
                <span className={`w-2 h-2 rounded-full ${active ? m.dot : 'bg-slate-300'}`} />
                {s.replace('_', ' ')}
              </button>
            );
          })}
          {statusFilter.length > 0 && (
            <button onClick={() => setStatusFilter([])} className="text-xs text-slate-400 hover:text-slate-600 ml-1">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      {!loading && (
        <div className="flex gap-3 flex-wrap">
          {ALL_STATUSES.map((s) => {
            const m = STATUS_META[s];
            const count = (data || []).filter((o) => o.status === s).length;
            return (
              <div key={s} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${m.bg} ${m.text} ${m.border}`}>
                <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                {s.replace('_', ' ')}: {count}
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar */}
      {loading ? (
        <div className="h-[500px] bg-slate-100 rounded-xl animate-pulse" />
      ) : view === 'month' ? (
        <MonthView
          year={year}
          month={month}
          orderMap={orderMap}
          selectedDay={selectedDay}
          onDayClick={(key) => setSelectedDay((prev) => prev === key ? null : key)}
        />
      ) : (
        <WeekView weekStart={weekStart} orderMap={orderMap} />
      )}

      {/* Day detail panel (month view only) */}
      {view === 'month' && selectedDay && (
        <DayDetail
          date={selectedDay}
          orders={selectedOrders}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
