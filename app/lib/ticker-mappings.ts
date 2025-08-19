// Dynamic ticker mappings from database
export async function getTickerMappings(): Promise<string> {
  try {
    const { Pool } = require('pg');
    
    const pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DATABASE,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT DISTINCT st.symbol, sa.full_name 
      FROM scraper_tasks st 
      LEFT JOIN stock_analysis sa ON st.id = sa.ticker_id 
      WHERE st.active = true AND sa.full_name IS NOT NULL 
      ORDER BY st.symbol
    `);
    
    client.release();
    
    const mappings = result.rows
      .map((row: any) => `  ${row.symbol} → ${row.full_name}`)
      .join('\n');
    
    return mappings;
    
  } catch (error) {
    console.error('Error fetching ticker mappings:', error);
    // Fallback to basic mappings
    return `  VAL → Valaris Ltd
  DOCS → Doximity Inc
  AAPL → Apple Inc
  GOOGL → Alphabet Inc
  HCI → HCI Group Inc`;
  }
}