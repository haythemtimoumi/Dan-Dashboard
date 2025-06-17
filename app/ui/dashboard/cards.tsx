import {
  ChartBarIcon,
  StarIcon,
  ScaleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { fetchStockStats } from '@/app/lib/data';

const iconMap = {
  totalStocks: DocumentTextIcon,
  highlightedStocks: StarIcon,
  rule1Stocks: ScaleIcon,
  magicFormulaStocks: ChartBarIcon,
};

export default async function CardWrapper() {
  const {
    totalStocks,
    highlightedStocks,
    rule1Stocks,
    magicFormulaStocks,
  } = await fetchStockStats();
  
  return (
    <>
      <Card title="Total Stocks" value={totalStocks} type="totalStocks" />
      <Card title="Highlighted Stocks" value={highlightedStocks} type="highlightedStocks" />
      <Card title="Rule 1 Stocks" value={rule1Stocks} type="rule1Stocks" />
      <Card title="Magic Formula Stocks" value={magicFormulaStocks} type="magicFormulaStocks" />
    </>
  );
}

export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: number | string;
  type: 'totalStocks' | 'highlightedStocks' | 'rule1Stocks' | 'magicFormulaStocks';
}) {
  const Icon = iconMap[type];

  return (
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-4">
        {Icon ? <Icon className="h-5 w-5 text-gray-700" /> : null}
        <h3 className="ml-2 text-sm font-medium">{title}</h3>
      </div>
      <p
        className={`${lusitana.className}
          truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
      >
        {value}
      </p>
    </div>
  );
}