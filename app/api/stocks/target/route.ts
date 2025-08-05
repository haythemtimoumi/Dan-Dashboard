import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function GET(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const { searchParams } = new URL(request.url);
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
        COALESCE(sa.date, st.last_updated_at) as created_at,
        COALESCE(sa.sentiment_score, 0) as sentiment_score,
        COALESCE(sa.signal_score, 0) as signal_score,
        COALESCE(sa.rule1_score, 0) as rule1_score,
        COALESCE(sa.moat_score, 0) as moat_score,
        COALESCE(sa.management_score, 0) as management_score,
        COALESCE(sa.buy_price, '0') as buy_price,
        COALESCE(sa.last_price, '0') as last_price,
        COALESCE(sa.per_upside, '0') as per_upside,
        COALESCE(sa.long_gr, '0') as long_gr,
        COALESCE(sa.last_gr, '0') as last_gr,
        COALESCE(sa.pbt, '0') as pbt,
        COALESCE(sa.full_name, '') as full_name
      FROM scraper_tasks st
      LEFT JOIN guru g ON st.guru_id = g.id
      LEFT JOIN LATERAL (
        SELECT * FROM stock_analysis 
        WHERE ticker_id = st.id 
        ORDER BY date DESC NULLS LAST 
        LIMIT 1
      ) sa ON true
      WHERE st.active = true AND st.target = true
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (startDate) {
      query += ` AND st.last_updated_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      query += ` AND st.last_updated_at <= $${paramIndex}`;
      params.push(endDate + ' 23:59:59');
      paramIndex++;
    }
    
    query += ` ORDER BY st.symbol, COALESCE(sa.date, st.last_updated_at) DESC`;
    
    const result = await client.query(query, params);
    
    return NextResponse.json(result.rows);
    
  } catch (error: any) {
    console.error('Error fetching target stocks:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json({ error: `Failed to fetch target stocks: ${error.message}` }, { status: 500 });
  } finally {
    client.release();
  }
}