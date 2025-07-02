'use client';

import { useFormState } from 'react-dom';
import { Button } from '@/app/ui/button';
import { updateStock } from '@/app/lib/actions';
import { Stock } from '@/app/lib/definitions';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function EditStockForm({
  stock,
}: {
  stock: Stock;
}) {
  const initialState = { message: null, errors: {} };
  const updateStockWithId = updateStock.bind(null, stock.id);
  const [state, dispatch] = useFormState(updateStockWithId, initialState);

  useEffect(() => {
    if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={dispatch}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Ticker */}
        <div className="mb-4">
          <label htmlFor="ticker" className="mb-2 block text-sm font-medium">
            Ticker Symbol
          </label>
          <input
            id="ticker"
            name="ticker"
            type="text"
            defaultValue={stock.ticker}
            className="peer block w-full rounded-md border border-gray-200 py-2 text-sm outline-2 placeholder:text-gray-500"
            placeholder="Enter ticker symbol (e.g., AAPL)"
            aria-describedby="ticker-error"
          />
          {state.errors?.ticker && (
            <div id="ticker-error" className="mt-2 text-sm text-red-500">
              {state.errors.ticker[0]}
            </div>
          )}
        </div>

        {/* Sentiment Score */}
        <div className="mb-4">
          <label htmlFor="sentiment_score" className="mb-2 block text-sm font-medium">
            Sentiment Score
          </label>
          <input
            id="sentiment_score"
            name="sentiment_score"
            type="number"
            step="0.01"
            defaultValue={stock.sentiment_score}
            className="peer block w-full rounded-md border border-gray-200 py-2 text-sm outline-2 placeholder:text-gray-500"
            placeholder="Enter sentiment score (-100 to 100)"
            aria-describedby="sentiment-error"
          />
          {state.errors?.sentiment_score && (
            <div id="sentiment-error" className="mt-2 text-sm text-red-500">
              {state.errors.sentiment_score[0]}
            </div>
          )}
        </div>

        {/* Signal Score */}
        <div className="mb-4">
          <label htmlFor="signal_score" className="mb-2 block text-sm font-medium">
            Signal Score
          </label>
          <input
            id="signal_score"
            name="signal_score"
            type="number"
            step="0.01"
            defaultValue={stock.signal_score}
            className="peer block w-full rounded-md border border-gray-200 py-2 text-sm outline-2 placeholder:text-gray-500"
            placeholder="Enter signal score (-100 to 100)"
            aria-describedby="signal-error"
          />
          {state.errors?.signal_score && (
            <div id="signal-error" className="mt-2 text-sm text-red-500">
              {state.errors.signal_score[0]}
            </div>
          )}
        </div>

        {/* PE Ratio */}
        <div className="mb-4">
          <label htmlFor="pe" className="mb-2 block text-sm font-medium">
            PE Ratio
          </label>
          <input
            id="pe"
            name="pe"
            type="number"
            step="0.01"
            defaultValue={stock.pe}
            className="peer block w-full rounded-md border border-gray-200 py-2 text-sm outline-2 placeholder:text-gray-500"
            placeholder="Enter PE ratio"
            aria-describedby="pe-error"
          />
          {state.errors?.pe && (
            <div id="pe-error" className="mt-2 text-sm text-red-500">
              {state.errors.pe[0]}
            </div>
          )}
        </div>

        {/* Target Buy Price */}
        <div className="mb-4">
          <label htmlFor="buy_price" className="mb-2 block text-sm font-medium">
            Target Buy Price
          </label>
          <input
            id="buy_price"
            name="buy_price"
            type="number"
            step="0.01"
            defaultValue={stock.buy_price}
            className="peer block w-full rounded-md border border-gray-200 py-2 text-sm outline-2 placeholder:text-gray-500"
            placeholder="Enter target buy price"
            aria-describedby="buy-price-error"
          />
          {state.errors?.buy_price && (
            <div id="buy-price-error" className="mt-2 text-sm text-red-500">
              {state.errors.buy_price[0]}
            </div>
          )}
        </div>

        {/* Guru */}
        <div className="mb-4">
          <label htmlFor="guru" className="mb-2 block text-sm font-medium">
            Guru
          </label>
          <input
            id="guru"
            name="guru"
            type="text"
            defaultValue={stock.guru}
            className="peer block w-full rounded-md border border-gray-200 py-2 text-sm outline-2 placeholder:text-gray-500"
            placeholder="Enter guru name"
            aria-describedby="guru-error"
          />
          {state.errors?.guru && (
            <div id="guru-error" className="mt-2 text-sm text-red-500">
              {state.errors.guru[0]}
            </div>
          )}
        </div>

        {/* Source */}
        <div className="mb-4">
          <label htmlFor="source" className="mb-2 block text-sm font-medium">
            Source
          </label>
          <select
            id="source"
            name="source"
            className="peer block w-full rounded-md border border-gray-200 py-2 text-sm outline-2 placeholder:text-gray-500"
            aria-describedby="source-error"
            defaultValue={stock.source}
          >
            <option value="" disabled>
              Select a source
            </option>
            <option value="Rule 1">Rule 1</option>
            <option value="Magic Formula">Magic Formula</option>
          </select>
          {state.errors?.source && (
            <div id="source-error" className="mt-2 text-sm text-red-500">
              {state.errors.source[0]}
            </div>
          )}
        </div>

        {/* Highlight */}
        <div className="mb-4">
          <div className="flex items-center">
            <input
              id="highlight"
              name="highlight"
              type="checkbox"
              defaultChecked={stock.highlight}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
            />
            <label htmlFor="highlight" className="ml-2 block text-sm font-medium">
              Highlight this stock
            </label>
          </div>
          {state.errors?.highlight && (
            <div className="mt-2 text-sm text-red-500">
              {state.errors.highlight[0]}
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Button type="submit">Update Stock</Button>
      </div>
    </form>
  );
}