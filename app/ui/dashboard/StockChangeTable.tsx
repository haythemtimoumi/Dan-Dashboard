'use client';

export default function StockChangeTable({ title, rows }: { title: string, rows: any[] }) {
  return (
    <div className="rounded-xl shadow-lg bg-white p-5 border border-gray-100 hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {rows.length} stocks
        </span>
      </h3>
      
      {rows.length > 0 ? (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky top-0 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Ticker</th>
                <th className="sticky top-0 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Guru</th>
                <th className="sticky top-0 bg-gray-50 px-4 py-3 text-right font-semibold text-gray-700 border-b border-gray-200">Start</th>
                <th className="sticky top-0 bg-gray-50 px-4 py-3 text-right font-semibold text-gray-700 border-b border-gray-200">End</th>
                <th className="sticky top-0 bg-gray-50 px-4 py-3 text-right font-semibold text-gray-700 border-b border-gray-200">Change %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50 transition-colors duration-150">
                  <td className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center">
                      <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs mr-2">
                        {row.ticker.substring(0, 2).toUpperCase()}
                      </span>
                      <span className="font-medium text-blue-700">{row.ticker.toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{row.guru}</td>
                  <td className="px-4 py-3 border-b border-gray-100 text-right font-mono text-gray-700">{row.start_value}</td>
                  <td className="px-4 py-3 border-b border-gray-100 text-right font-mono text-gray-700">{row.end_value}</td>
                  <td className="px-4 py-3 border-b border-gray-100 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${row.change_percent >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {row.change_percent > 0 ? '+' : ''}{row.change_percent.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">No data available</p>
        </div>
      )}
    </div>
  );
}
