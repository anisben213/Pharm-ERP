import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import EmptyState from './EmptyState.jsx';
import { TableSkeleton } from './Skeleton.jsx';

/**
 * Reusable data table.
 *
 * Props:
 *  - columns: [{ key, header, sortable?, render?(row), className?, accessor?(row) }]
 *  - data:    array of row objects
 *  - loading: boolean
 *  - searchKeys: array of row keys to search on (string fields)
 *  - filters: [{ key, label, options: [{value, label}], accessor?(row) }]
 *  - actions: function(row) -> JSX (icon buttons rendered in actions column)
 *  - onRowClick: function(row)
 *  - rightToolbar: JSX rendered top-right (e.g. "Create" button)
 *  - pageSize: default 10
 *  - empty: { icon, title, message, action }
 */
export default function Table({
  columns = [],
  data = [],
  loading = false,
  searchKeys = [],
  filters = [],
  actions,
  onRowClick,
  rightToolbar,
  pageSize = 10,
  empty,
}) {
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = data || [];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        searchKeys.some((k) => {
          const v = r?.[k];
          return v != null && String(v).toLowerCase().includes(q);
        })
      );
    }
    for (const f of filters) {
      const val = filterValues[f.key];
      if (val) {
        rows = rows.filter((r) => {
          const v = f.accessor ? f.accessor(r) : r?.[f.key];
          return String(v) === String(val);
        });
      }
    }
    if (sort.key) {
      const col = columns.find((c) => c.key === sort.key);
      const acc = col?.accessor || ((r) => r?.[sort.key]);
      rows = [...rows].sort((a, b) => {
        const av = acc(a), bv = acc(b);
        if (av == null) return 1;
        if (bv == null) return -1;
        if (av < bv) return sort.dir === 'asc' ? -1 : 1;
        if (av > bv) return sort.dir === 'asc' ?  1 : -1;
        return 0;
      });
    }
    return rows;
  }, [data, search, filterValues, sort, columns, filters, searchKeys]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (col) => {
    if (!col.sortable) return;
    setSort((s) => s.key === col.key
      ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { key: col.key, dir: 'asc' });
  };

  if (loading) return <TableSkeleton cols={columns.length + (actions ? 1 : 0)} />;

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between p-4 border-b border-slate-100">
        <div className="flex-1 max-w-md relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search size={15} />
          </span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search…"
            className="input pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((f) => (
            <select
              key={f.key}
              value={filterValues[f.key] || ''}
              onChange={(e) => { setFilterValues((v) => ({ ...v, [f.key]: e.target.value })); setPage(1); }}
              className="input w-auto min-w-[140px]"
            >
              <option value="">{f.label}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}
          {rightToolbar}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c)}
                  className={`label-xs px-4 py-3 ${c.sortable ? 'cursor-pointer select-none hover:text-ink-800' : ''} ${c.className || ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {c.sortable && (
                      <span className="text-slate-400">
                        {sort.key === c.key ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {actions && <th className="label-xs px-4 py-3 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)}>
                  <EmptyState
                    icon={empty?.icon ?? '🔍'}
                    title={empty?.title ?? 'No results'}
                    message={empty?.message ?? 'Try adjusting your search or filters.'}
                    action={empty?.action}
                  />
                </td>
              </tr>
            ) : pageRows.map((row, i) => (
              <tr
                key={row.id ?? i}
                onClick={() => onRowClick?.(row)}
                className={`border-t border-slate-100 table-row-hover ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 align-middle ${c.className || ''}`}>
                    {c.render ? c.render(row) : (c.accessor ? c.accessor(row) : row[c.key]) ?? '—'}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm">
          <span className="text-slate-500">
            {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              className="btn-outline px-3 py-1.5"
              disabled={safePage === 1}
              onClick={() => setPage(safePage - 1)}
            >‹ Previous</button>
            {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
              const p = i + 1;
              const isActive = p === safePage;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${isActive ? 'bg-primary text-white' : 'hover:bg-slate-100'}`}
                >{p}</button>
              );
            })}
            <button
              className="btn-outline px-3 py-1.5"
              disabled={safePage === totalPages}
              onClick={() => setPage(safePage + 1)}
            >Next ›</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Small icon button used inside the actions column. */
export function IconButton({ icon, title, onClick, color = 'slate' }) {
  const colors = {
    slate: 'text-slate-500 hover:text-ink-800 hover:bg-slate-100',
    primary: 'text-primary hover:bg-primary-50',
    danger: 'text-danger hover:bg-danger-50',
    success: 'text-success-600 hover:bg-success-50',
  };
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer ${colors[color] || colors.slate}`}
    >
      {icon}
    </button>
  );
}
