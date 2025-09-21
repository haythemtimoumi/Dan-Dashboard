import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const date = searchParams.get('date');

  if (!ticker || !date) {
    return NextResponse.json(
      { error: 'Ticker and date parameters are required' },
      { status: 400 }
    );
  }

  try {
    const mockData = {
      ticker: ticker.toUpperCase(),
      date: date,
      scraper_data: {
        active: true,
        target: true,
        company_name: `${ticker.toUpperCase()} Company`
      },
      stock_analysis: {
        ticker_used: `T.${ticker.toUpperCase()}`,
        data: {
          signal_score: Math.floor(Math.random() * 100),
          sentiment_score: Math.floor(Math.random() * 100),
          screenshot: `https://www.stockscores.com/chart.asp?TickerSymbol=T.${ticker.toUpperCase()}&TimeRange=180&Interval=d&Volume=1&ChartType=CandleStick&Stockscores=1&ChartWidth=1100&ChartHeight=480&LogScale=&Band=&avgType1=&movAvg1=&avgType2=&movAvg2=&Indicator1=None&Indicator2=None&Indicator3=None&Indicator4=None&endDate=&CompareWith=&entryPrice=&stopLossPrice=&candles=redgreen`,
          per_upside: null,
          last_price: null
        }
      },
      rule1_analysis: {
        ticker_used: `TSE:${ticker.toUpperCase()}`,
        data: null
      }
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error fetching ticker data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticker data' },
      { status: 500 }
    );
  }
}