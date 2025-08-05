import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// French/English support
const messages = {
  fr: {
    symbolRequired: 'Le symbole est requis',
    alreadyLinked: 'Déjà lié',
    tickerCreated: 'Ticker créé avec succès',
    failedToCreate: 'Échec de la création du ticker'
  },
  en: {
    symbolRequired: 'Symbol is required',
    alreadyLinked: 'Already linked',
    tickerCreated: 'Ticker created successfully',
    failedToCreate: 'Failed to create ticker'
  }
};

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { symbol, scrape_type = 'daily', active = true, target = true, color = 'neutral', language = 'en' } = await request.json();
    const t = messages[language as keyof typeof messages] || messages.en;
    
    if (!symbol) {
      return NextResponse.json({ error: t.symbolRequired }, { status: 400 });
    }
    
    // Always use 'dan' as guru
    const guruResult = await client.query(
      'SELECT id FROM guru WHERE guru_name = $1',
      ['dan']
    );
    
    let danGuruId: number;
    if (guruResult.rows.length > 0) {
      danGuruId = guruResult.rows[0].id;
    } else {
      // Create dan guru if it doesn't exist
      const newGuruResult = await client.query(
        'INSERT INTO guru (guru_name, description) VALUES ($1, $2) RETURNING id',
        ['dan', 'Dashboard added stocks']
      );
      danGuruId = newGuruResult.rows[0].id;
    }
    
    // Check if ticker already exists in scraper_tasks (symbol is unique)
    const existingTickerResult = await client.query(
      'SELECT id, guru_id FROM scraper_tasks WHERE symbol = $1',
      [symbol.toUpperCase()]
    );
    
    if (existingTickerResult.rows.length > 0) {
      const existingId = existingTickerResult.rows[0].id;
      // Update existing ticker to be target and set dan as guru
      await client.query(
        'UPDATE scraper_tasks SET target = $1, guru_id = $2, active = $3, color = $4 WHERE id = $5',
        [target, danGuruId, active, color, existingId]
      );
      
      // Ensure guru_ticker_map entry exists
      const mapExists = await client.query(
        'SELECT 1 FROM guru_ticker_map WHERE guru_id = $1 AND scraper_task_id = $2',
        [danGuruId, existingId]
      );
      
      if (mapExists.rows.length === 0) {
        await client.query(
          'INSERT INTO guru_ticker_map (guru_id, scraper_task_id) VALUES ($1, $2)',
          [danGuruId, existingId]
        );
      }
      
      await client.query('COMMIT');
      return NextResponse.json({ message: t.alreadyLinked, ticker_id: existingId });
    }
    
    // Insert into scraper_tasks
    const tickerResult = await client.query(
      'INSERT INTO scraper_tasks (symbol, guru_id, scrape_type, active, target, color, list_type, current_step, scrape_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [symbol.toUpperCase(), danGuruId, scrape_type, active, target, color, 'manual', 'rule1', 'pending']
    );
    
    const tickerId = tickerResult.rows[0].id;
    
    // Insert into guru_ticker_map with correct column name
    await client.query(
      'INSERT INTO guru_ticker_map (guru_id, scraper_task_id) VALUES ($1, $2)',
      [danGuruId, tickerId]
    );
    
    await client.query('COMMIT');
    
    return NextResponse.json({ 
      message: t.tickerCreated, 
      ticker_id: tickerId,
      guru_id: danGuruId
    });
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating ticker:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json({ error: `Failed to create ticker: ${error.message}` }, { status: 500 });
  } finally {
    client.release();
  }
}