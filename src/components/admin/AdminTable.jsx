export default function AdminTable({ columns, rows = [], empty = 'Everything is clear right now.' }) {
  if (!rows.length) return <div className="card p-4 text-sm text-slate-300">{empty}</div>

  return (
    <div className="card overflow-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead className="bg-[#113527] text-left text-xs uppercase text-slate-300">
          <tr>{columns.map((c) => <th key={c.key} className="px-3 py-2">{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-line/40">
              {columns.map((c) => <td key={c.key} className="px-3 py-2">{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

