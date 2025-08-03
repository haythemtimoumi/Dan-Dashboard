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
    
    // Check if ticker already exists in scraper_tasks
    const existingTickerResult = await client.query(
      'SELECT id FROM scraper_tasks WHERE symbol = $1 AND guru_id = $2',
      [symbol.toUpperCase(), danGuruId]
    );
    
    if (existingTickerResult.rows.length > 0) {
      await client.query('COMMIT');
      return NextResponse.json({ message: t.alreadyLinked, ticker_id: existingTickerResult.rows[0].id });
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
    return NextResponse.json({ error: 'Failed to create ticker' }, { status: 500 });
  } finally {
    client.release();
  }
}