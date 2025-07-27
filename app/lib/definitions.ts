// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.

// Stock data model
export type Stock = {
  id: string;
  ticker: string;
  sentiment_score: number;
  signal_score: number;
  pe: number;
  buy_price: number;
  guru: string;
  source: 'rule1' | 'manual'| 'target'| 'monitor'| 'guru_list'| 'dan_portfolio_list';
  highlight: boolean;
  created_at: string;
  updated_at: string;
  screenshot?: string; // Optional screenshot field for chart image
  date?: string; // Optional date field for historical data
  dividend?: string | null; // Optional dividend field
  cash_per_share?: string; // Optional cash per share field
  current_ratio?: number; // Optional current ratio field
  rule1_score?: number | null; // Optional Rule 1 score
  moat_score?: number | null; // Optional moat score
  management_score?: number | null; // Optional management score
  // New API fields
  last_price?: number; // Current price (replaces current_ratio)
  per_upside?: number; // Upside percentage (replaces pe)
  last_gr?: string; // Last saved composite growth rate (replaces dividend)
  long_gr?: string; // Analyst estimated long-term growth rate (replaces cash_per_share)
  pbt?: string; // Payback time (replaces guru)
  last_action?: string; // Last action taken on the stock
  per_portfolio?: number; // Percentage of portfolio
};

export type StocksTable = {
  id: string;
  ticker: string;
  sentiment_score: number;
  signal_score: number;
  pe: number;
  buy_price: number;
  guru: string;
  source: 'rule1' | 'manual' | 'target' | 'monitor' | 'guru_list' | 'dan_portfolio_list';
  highlight: boolean;
  created_at: string;
  updated_at: string;
  screenshot?: string; // Optional screenshot field for chart image
  date?: string; // Optional date field for historical data
  dividend?: string | null; // Optional dividend field
  cash_per_share?: string; // Optional cash per share field
  current_ratio?: number; // Optional current ratio field
  rule1_score?: number | null; // Optional Rule 1 score
  moat_score?: number | null; // Optional moat score
  management_score?: number | null; // Optional management score
  // New API fields
  last_price?: number; // Current price (replaces current_ratio)
  per_upside?: number; // Upside percentage (replaces pe)
  last_gr?: string; // Last saved composite growth rate (replaces dividend)
  long_gr?: string; // Analyst estimated long-term growth rate (replaces cash_per_share)
  pbt?: string; // Payback time (replaces guru)
  last_action?: string; // Last action taken on the stock
  per_portfolio?: number; // Percentage of portfolio
};

export type LatestStock = {
  id: string;
  ticker: string;
  sentiment_score: number;
  highlight: boolean;
};

export type StockForm = {
  id?: string;
  ticker: string;
  sentiment_score: number;
  signal_score: number;
  pe: number;
  buy_price: number;
  guru: string;
  source: 'rule1' | 'manual' | 'target' | 'monitor' | 'guru_list' | 'dan_portfolio_list';
  highlight: boolean;
};

export type DailyChanges = {
  current: Stock[];
  new: Stock[];
  removed: Stock[];
};

export type StockStats = {
  totalStocks: number;
  highlightedStocks: number;
  rule1Stocks: number;
  magicFormulaStocks: number;
};

export type StockChange = {
  ticker: string;
  source: string;
  guru: string;
  metric: string;
  start_value: number;
  end_value: number;
  change_percent: number;
  change: number;
  status: string;
};