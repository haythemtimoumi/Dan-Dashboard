import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: String(process.env.POSTGRES_PASSWORD || ''),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let query = `
      SELECT DISTINCT ON (st.symbol)
        st.id,
        st.symbol as ticker,
        st.target,
        st.color,
        st.id as ticker_id,
        g.guru_name as guru,
        st.list_type as source,
        st.created_at,
        COALESCE(s.sentiment_score, 0) as sentiment_score,
        COALESCE(s.signal_score, 0) as signal_score,
        COALESCE(s.rule1_score, 0) as rule1_score,
        COALESCE(s.moat_score, 0) as moat_score,
        COALESCE(s.management_score, 0) as management_score,
        COALESCE(s.buy_price, 0) as buy_price,
        COALESCE(s.last_price, 0) as last_price,
        COALESCE(s.per_upside, 0) as per_upside,
        COALESCE(s.long_gr, 0) as long_gr,
        COALESCE(s.last_gr, 0) as last_gr,
        COALESCE(s.pbt, 0) as pbt,
        COALESCE(s.full_name, '') as full_name
      FROM scraper_tasks st
      LEFT JOIN guru g ON st.guru_id = g.id
      LEFT JOIN stocks s ON st.symbol = s.ticker
      WHERE st.active = true
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (target === 'true') {
      query += ` AND st.target = true`;
    }
    
    if (startDate) {
      query += ` AND st.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      query += ` AND st.created_at <= $${paramIndex}`;
      params.push(endDate + ' 23:59:59');
      paramIndex++;
    }
    
    query += ` ORDER BY st.symbol, st.created_at DESC`;
    
    const result = await client.query(query, params);
    
    return NextResponse.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json({ error: 'Failed to fetch stocks' }, { status: 500 });
  } finally {
    client.release();
  }
}