import { StockChange } from '@/app/lib/data';

type Props = {
  title: string;
  rows: StockChange[];
};

export default function StockChangeTable({ title, rows }: Props) {
  return (
    <div className="overflow-auto bg-white p-4 rounded-xl shadow w-full">
      <h2 className="text-sm font-medium mb-2">{title}</h2>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="p-2 text-left">Ticker</th>
            <th className="p-2 text-left">Guru</th>
            <th className="p-2 text-right">Start</th>
            <th className="p-2 text-right">End</th>
            <th className="p-2 text-right">Change %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              <td className="p-2 font-semibold text-blue-700">{row.ticker.toUpperCase()}</td>
              <td className="p-2">{row.guru}</td>
              <td className="p-2 text-right">{row.start_value}</td>
              <td className="p-2 text-right">{row.end_value}</td>
              <td className={`p-2 text-right font-bold ${row.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {row.change_percent}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
