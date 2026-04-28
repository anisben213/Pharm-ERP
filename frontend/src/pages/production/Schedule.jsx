import { useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/common/Badge.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import useFetch from '../../hooks/useFetch.js';
import { productionService } from '../../services/index.js';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function startOfWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function ProductionSchedule() {
  const { data, loading } = useFetch(() => productionService.list().then((r) => r.orders), []);
  const week = startOfWeek(new Date());
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(week); d.setDate(d.getDate() + i); return d;
  });

  const ordersByDay = useMemo(() => {
    const map = Array.from({ length: 7 }).map(() => []);
    (data || []).forEach((o) => {
      if (!o.plannedDate) return;
      const od = new Date(o.plannedDate);
      const idx = Math.floor((od - week) / 86400000);
      if (idx >= 0 && idx < 7) map[idx].push(o);
    });
    return map;
  }, [data, week]);

  return (
    <div>
      <PageHeader title="Production Schedule" subtitle={`Week of ${week.toLocaleDateString()}`} />

      {loading ? <Skeleton height="h-72" /> : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {days.map((d, i) => (
            <div key={i} className="card min-h-[200px]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-ink-800">{DAYS[i]}</span>
                <span className="text-xs text-slate-500">{d.getDate()}/{d.getMonth() + 1}</span>
              </div>
              <div className="space-y-2">
                {ordersByDay[i].length === 0
                  ? <p className="text-xs text-slate-400">No orders</p>
                  : ordersByDay[i].map((o) => (
                    <div key={o.id} className="p-2 rounded-lg bg-primary-50 text-xs">
                      <div className="font-mono text-primary">{o.orderNumber || o.id}</div>
                      <div className="truncate">{o.productName || o.product?.name}</div>
                      <div className="mt-1"><Badge status={o.status} /></div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
