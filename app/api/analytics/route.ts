import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://www.mytickerlist.com/api';

export async function GET(request: NextRequest) {
  try {
    // Fetch data from multiple endpoints
    const [stocksRes, tickersRes] = await Promise.all([
      fetch(`${API_URL}/stocks`),
      fetch(`${API_URL}/tickers/stats`)
    ]);

    if (!stocksRes.ok || !tickersRes.ok) {
      throw new Error('Failed to fetch analytics data');
    }

    const [stocks, tickerStats] = await Promise.all([
      stocksRes.json(),
      tickersRes.json()
    ]);

    // Calculate analytics
    const totalStocks = stocks.length;
    const stocksWithBuyPrice = stocks.filter((s: any) => s.buy_price && s.buy_price !== '$0').length;
    const avgSentiment = stocks.reduce((sum: number, s: any) => sum + (s.sentiment_score || 0), 0) / totalStocks;
    const avgSignal = stocks.reduce((sum: number, s: any) => sum + (s.signal_score || 0), 0) / totalStocks;
    
    // Source distribution
    const sourceDistribution = stocks.reduce((acc: any, stock: any) => {
      const source = stock.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentStocks = stocks.filter((s: any) => {
      const stockDate = new Date(s.created_at || s.date);
      return stockDate >= sevenDaysAgo;
    });

    // Top performers by sentiment
    const topPerformers = stocks
      .filter((s: any) => s.sentiment_score > 0)
      .sort((a: any, b: any) => (b.sentiment_score || 0) - (a.sentiment_score || 0))
      .slice(0, 5);

    // Growth rate analysis
    const stocksWithGrowth = stocks.filter((s: any) => s.last_gr && !isNaN(parseFloat(s.last_gr)));
    const avgGrowthRate = stocksWithGrowth.length > 0 
      ? stocksWithGrowth.reduce((sum: number, s: any) => sum + parseFloat(s.last_gr), 0) / stocksWithGrowth.length 
      : 0;

    const analytics = {
      overview: {
        totalStocks,
        totalTickers: tickerStats.total || 0,
        activeTickers: tickerStats.active || 0,
        stocksWithBuyPrice,
        avgSentiment: Math.round(avgSentiment * 100) / 100,
        avgSignal: Math.round(avgSignal * 100) / 100,
        avgGrowthRate: Math.round(avgGrowthRate * 100) / 100
      },
      distribution: {
        sources: sourceDistribution,
        sentimentRanges: {
          high: stocks.filter((s: any) => (s.sentiment_score || 0) >= 70).length,
          medium: stocks.filter((s: any) => (s.sentiment_score || 0) >= 40 && (s.sentiment_score || 0) < 70).length,
          low: stocks.filter((s: any) => (s.sentiment_score || 0) < 40).length
        }
      },
      activity: {
        recentStocks: recentStocks.length,
        dailyAverage: Math.round((recentStocks.length / 7) * 100) / 100
      },
      topPerformers: topPerformers.map((s: any) => ({
        ticker: s.ticker,
        sentiment_score: s.sentiment_score,
        signal_score: s.signal_score,
        source: s.source
      }))
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}