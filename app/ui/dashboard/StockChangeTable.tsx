'use client';

export default function StockChangeTable({ title, rows }: { title: string, rows: any[] }) {
  return (
    <div className="rounded-xl shadow bg-white p-4 overflow-x-auto">
      <h3 className="text-md font-semibold text-gray-700 mb-3">{title}</h3>
      <table className="min-w-full text-sm border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left font-medium text-gray-600">Ticker</th>
            <th className="p-2 text-left font-medium text-gray-600">Guru</th>
            <th className="p-2 text-right font-medium text-gray-600">Start</th>
            <th className="p-2 text-right font-medium text-gray-600">End</th>
            <th className="p-2 text-right font-medium text-gray-600">Change %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t even:bg-gray-50 hover:bg-gray-100">
              <td className="p-2 text-blue-700 font-semibold">{row.ticker.toUpperCase()}</td>
              <td className="p-2 text-gray-700">{row.guru}</td>
              <td className="p-2 text-right text-gray-700">{row.start_value}</td>
              <td className="p-2 text-right text-gray-700">{row.end_value}</td>
              <td className={`p-2 text-right font-bold ${row.change_percent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {row.change_percent > 0 ? '+' : ''}{row.change_percent.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
