import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

const LOCATIONS = [
  { name: 'Warehouse A', capacity: 80, used: 64 },
  { name: 'Warehouse B', capacity: 60, used: 30 },
  { name: 'Cold Storage', capacity: 40, used: 28 },
  { name: 'Quarantine', capacity: 20, used: 12 },
];

export default function StorageLocations() {
  return (
    <div>
      <PageHeader title="Storage Locations" subtitle="Capacity overview by location." />
      {LOCATIONS.length === 0 ? (
        <EmptyState icon="📍" title="No locations" message="No storage locations configured yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {LOCATIONS.map((l) => {
            const pct = Math.round((l.used / l.capacity) * 100);
            const color = pct > 90 ? 'bg-danger' : pct > 70 ? 'bg-warning' : 'bg-success';
            return (
              <div key={l.name} className="card">
                <div className="font-medium text-ink-800 mb-1">{l.name}</div>
                <div className="text-xs text-slate-500 mb-3">{l.used} / {l.capacity} units</div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-slate-500 mt-2">{pct}% used</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
