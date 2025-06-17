import { ArrowPathIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { lusitana } from '@/app/ui/fonts';
import { fetchLatestStocks } from '@/app/lib/data';
import { getSentimentColor } from '@/app/lib/utils';

export default async function LatestStocks() {
  const latestStocks = await fetchLatestStocks();
  
  // Only show the top 3 stocks
  const topStocks = latestStocks.slice(0, 3);

  return (
    <div className="flex w-full flex-col md:col-span-4">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Top Stocks
      </h2>
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">
        <div className="bg-white px-6">
          {topStocks.map((stock, i) => {
            return (
              <div
                key={stock.id}
                className={clsx(
                  'flex flex-row items-center justify-between py-4',
                  {
                    'border-t': i !== 0,
                    'bg-yellow-50': stock.highlight,
                  },
                )}
              >
                <div className="flex items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold md:text-base">
                      {stock.ticker}
                    </p>
                  </div>
                </div>
                <p
                  className={`${getSentimentColor(stock.sentiment_score)} truncate text-sm font-medium md:text-base`}
                >
                  {stock.sentiment_score}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center pb-2 pt-6">
          <ArrowPathIcon className="h-5 w-5 text-gray-500" />
          <h3 className="ml-2 text-sm text-gray-500 ">Updated just now</h3>
        </div>
      </div>
    </div>
  );
}