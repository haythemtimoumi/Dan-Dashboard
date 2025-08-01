import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const target = searchParams.get('target');
    
    let url = 'https://www.mytickerlist.com/api/stocks/grouped';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.statusText}`);
    }

    let data = await response.json();
    
    // Get colors from local database
    let colorMap = new Map();
    try {
      const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'stocklist',
        user: 'haystockuser',
        password: 'zro=+)1*-D9X',
      });
      
      await client.connect();
      const colorResult = await client.query('SELECT id, color FROM scraper_tasks');
      await client.end();
      
      colorResult.rows.forEach(row => {
        colorMap.set(row.id, row.color);
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
    }
    
    // Override colors with local database values
    data = data.map((stock: any) => ({
      ...stock,
      color: stock.ticker_id === 2288 ? 'red' : (colorMap.get(stock.ticker_id) || stock.color || 'neutral')
    }));
    
    // Filter for target stocks if requested
    if (target === 'true') {
      data = data.filter((stock: any) => stock.target === true);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching grouped stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grouped stocks' },
      { status: 500 }
    );
  }
}