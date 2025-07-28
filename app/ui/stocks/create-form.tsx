'use client';

import { useFormState } from 'react-dom';
import { Button } from '@/app/ui/button';
import { uploadStocksCsv } from '@/app/lib/actions';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export default function Form() {
  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(uploadStocksCsv, initialState);
  const [fileName, setFileName] = useState<string>('');

  useEffect(() => {
    if (state.message) {
      if (state.message.includes('Success')) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName('');
    }
  };

  return (
    <form action={dispatch} encType="multipart/form-data">
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-4">Upload Stocks CSV File</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload a CSV file containing stock data. The CSV should have the following columns:
            ticker, sentiment_score, signal_score, pe, target_buy_price, guru, source, highlight
          </p>
          <p className="text-xs text-blue-600 mb-4">
            Note: Ticker management is now handled in the dedicated Tickers page.
          </p>
          
          <div className="flex items-center justify-center w-full">
            <label 
              htmlFor="csv_file" 
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">CSV files only</p>
                {fileName && (
                  <p className="mt-2 text-sm text-blue-600 font-medium">{fileName}</p>
                )}
              </div>
              <input 
                id="csv_file" 
                name="csv_file" 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileChange}
                aria-describedby="file-error"
              />
            </label>
          </div>
          
          {state.errors?.csv_file && (
            <div id="file-error" className="mt-2 text-sm text-red-500">
              {state.errors.csv_file[0]}
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Button type="submit">Upload CSV</Button>
      </div>
    </form>
  );
}