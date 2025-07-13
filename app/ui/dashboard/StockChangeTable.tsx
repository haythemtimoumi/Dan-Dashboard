'use client';

export default function StockChangeTable({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-black">{title}</h3>
        <span className="text-sm text-gray-500">{rows.length}</span>
      </div>
      
      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 font-medium text-gray-600">Ticker</th>
                <th className="text-left py-3 font-medium text-gray-600">Guru</th>
                <th className="text-right py-3 font-medium text-gray-600">Start</th>
                <th className="text-right py-3 font-medium text-gray-600">End</th>
                <th className="text-right py-3 font-medium text-gray-600">Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3">
                    <span className="font-medium">{row.ticker.toUpperCase()}</span>
                  </td>
                  <td className="py-3 text-gray-600">{row.guru}</td>
                  <td className="py-3 text-right font-mono text-gray-600">{row.start_value}</td>
                  <td className="py-3 text-right font-mono text-gray-600">{row.end_value}</td>
                  <td className="py-3 text-right">
                    <span className={`font-medium ${row.change_percent >= 0 ? 'text-black' : 'text-red-500'}`}>
                      {row.change_percent > 0 ? '+' : ''}{row.change_percent.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center">
          <p className="text-gray-400">No data</p>
        </div>
      )}
    </div>
  );
}
