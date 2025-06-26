import { Stock } from './app/lib/definitions';

// This should compile if our fix worked
const testStock: Stock = {
  id: '1',
  ticker: 'AAPL',
  sentiment_score: 85,
  signal_score: 90,
  pe: 25,
  buy_price: 150,
  guru: 'Warren Buffett',
  source: 'rule1', // This should now be valid
  highlight: true,
  created_at: '2023-01-01',
  updated_at: '2023-01-01'
};

// Test the filter that was causing the error
const stocks: Stock[] = [testStock];
const rule1Stocks = stocks.filter(stock => stock.source === 'rule1').length;
console.log(`rule1 stocks: ${rule1Stocks}`);