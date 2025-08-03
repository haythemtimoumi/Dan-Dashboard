import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'stocklist',
  user: 'haystockuser',
  password: 'zro=+)1*-D9X',
  ssl: false,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Get local ticker data
    let query = `
      SELECT 
        st.id,
        st.symbol as ticker,
        st.target,
        st.color,
        st.id as ticker_id,
        g.guru_name as guru,
        'manual' as source,
        st.last_updated_at
      FROM scraper_tasks st
      JOIN guru g ON st.guru_id = g.id
    `;
    
    if (target === 'true') {
      query += ' WHERE st.target = true';
    }
    
    query += ' ORDER BY st.id DESC';
    
    const result = await pool.query(query);
    
    // Fetch stock analysis data from Dan-API
    let externalData = [];
    try {
      let apiUrl = 'http://localhost:3000/api/stocks/grouped';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) apiUrl += `?${params.toString()}`;
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        externalData = await response.json();
      }
    } catch (error) {
      console.error('Error fetching external data:', error);
    }
    
    // Create a map of external data by ticker
    const externalMap = new Map();
    externalData.forEach((item: any) => {
      externalMap.set(item.ticker, item);
    });
    
    // Merge local and external data
    const data = result.rows.map(row => {
      const external = externalMap.get(row.ticker) || {};
      
      return {
        id: row.id.toString(),
        ticker: row.ticker,
        target: row.target,
        color: row.color || 'neutral',
        ticker_id: row.ticker_id,
        guru: row.guru,
        source: row.source,
        created_at: row.last_updated_at,
        date: row.last_updated_at || external.date,
        // Use external data for analysis fields
        signal_score: external.signal_score || null,
        sentiment_score: external.sentiment_score || null,
        rule1_score: external.rule1_score || null,
        moat_score: external.moat_score || null,
        management_score: external.management_score || null,
        buy_price: external.buy_price || null,
        last_price: external.last_price || null,
        per_upside: external.per_upside || null,
        long_gr: external.long_gr || null,
        last_gr: external.last_gr || null,
        pbt: external.pbt || null,
        full_name: external.full_name || null
      };
    });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Database error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}