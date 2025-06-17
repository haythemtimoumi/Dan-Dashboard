import { lusitana } from '@/app/ui/fonts';
import { fetchDailyChanges } from '@/app/lib/data';
import { getSentimentColor } from '@/app/lib/utils';
import clsx from 'clsx';

export default async function DailyChanges() {
  const { current, new: newStocks, removed } = await fetchDailyChanges();

  return (
    <div className="flex w-full flex-col md:col-span-4">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Daily Changes
      </h2>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Current Stocks */}
        <div className="flex flex-col rounded-xl bg-gray-50 p-4">
          <h3 className="text-sm font-medium mb-2">Current Stocks</h3>
          <div className="bg-white px-4 py-2 rounded-md flex-grow">
            {current.length > 0 ? (
              current.slice(0, 5).map((stock) => (
                <div 
                  key={stock.id}
                  className={clsx("py-2 border-b last:border-0", {
                    "bg-yellow-50": stock.highlight
                  })}
                >
                  <p className="text-sm font-semibold">{stock.ticker}</p>
                  <p className={`${getSentimentColor(stock.sentiment_score)} text-xs`}>
                    Score: {stock.sentiment_score}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 py-2">No current stocks</p>
            )}
            {current.length > 5 && (
              <p className="text-xs text-gray-500 pt-2">
                +{current.length - 5} more
              </p>
            )}
          </div>
        </div>
        
        {/* New Stocks */}
        <div className="flex flex-col rounded-xl bg-gray-50 p-4">
          <h3 className="text-sm font-medium mb-2">New Stocks</h3>
          <div className="bg-white px-4 py-2 rounded-md flex-grow">
            {newStocks.length > 0 ? (
              newStocks.map((stock) => (
                <div 
                  key={stock.id}
                  className={clsx("py-2 border-b last:border-0", {
                    "bg-yellow-50": stock.highlight
                  })}
                >
                  <p className="text-sm font-semibold">{stock.ticker}</p>
                  <p className={`${getSentimentColor(stock.sentiment_score)} text-xs`}>
                    Score: {stock.sentiment_score}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 py-2">No new stocks today</p>
            )}
          </div>
        </div>
        
        {/* Removed Stocks */}
        <div className="flex flex-col rounded-xl bg-gray-50 p-4">
          <h3 className="text-sm font-medium mb-2">Removed Stocks</h3>
          <div className="bg-white px-4 py-2 rounded-md flex-grow">
            {removed.length > 0 ? (
              removed.map((stock) => (
                <div 
                  key={stock.id}
                  className={clsx("py-2 border-b last:border-0", {
                    "bg-yellow-50": stock.highlight
                  })}
                >
                  <p className="text-sm font-semibold">{stock.ticker}</p>
                  <p className={`${getSentimentColor(stock.sentiment_score)} text-xs`}>
                    Score: {stock.sentiment_score}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 py-2">No removed stocks today</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}