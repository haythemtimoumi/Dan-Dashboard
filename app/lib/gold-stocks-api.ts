export interface CompanyAnalysis {
  id: number;
  ticker_id: number;
  company_name: string;
  full_symbol: string;
  exchange: string;
  currency: string;
  price: string;
  category: string;
  categories?: string[];
  upside: string;
  downside: string;
  quality: string;
  risk: string;
  cash_flow_growth: string;
  free_cash_multiple: string;
  source_url: string;
  created_at: string;
  company_url: string;
  company_email: string;
  signal_score: number | null;
  sentiment_score: number | null;
  analysis_date: string;
  analysis_created_at: string;
  target?: boolean;
}

export async function fetchRecentDate(): Promise<string> {
  try {
    const response = await fetch('/api/proxy/stocks/companies/recent-date');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return new Date(data.recent_date).toISOString().split('T')[0];
  } catch (error) {
    console.error('Error fetching recent date:', error);
    throw error;
  }
}

export async function fetchCompanyAnalysis(date?: string): Promise<CompanyAnalysis[]> {
  try {
    const url = new URL('/api/proxy/stocks/companies-with-analysis', window.location.origin);
    if (date) {
      url.searchParams.set('date', date);
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching company analysis:', error);
    throw error;
  }
}