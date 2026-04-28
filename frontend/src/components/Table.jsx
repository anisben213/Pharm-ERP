export default function Table({ columns, rows, onRowClick }) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-100">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-2 text-left font-semibold text-slate-700">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="p-6 text-center text-slate-400">
                No records
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'hover:bg-slate-50 cursor-pointer' : ''}
            >
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-2">
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
