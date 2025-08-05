const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'stocklist',
  user: 'haystockuser',
  password: 'zro=+)1*-D9X',
  ssl: false,
});

async function testAddTicker() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const symbol = 'HCI';
    const target = true;
    const active = true;
    const color = 'neutral';
    
    // Get dan guru
    const guruResult = await client.query(
      'SELECT id FROM guru WHERE guru_name = $1',
      ['dan']
    );
    
    const danGuruId = guruResult.rows[0].id;
    console.log('Dan guru ID:', danGuruId);
    
    // Check if ticker exists
    const existingTickerResult = await client.query(
      'SELECT id, guru_id FROM scraper_tasks WHERE symbol = $1',
      [symbol.toUpperCase()]
    );
    
    if (existingTickerResult.rows.length > 0) {
      const existingId = existingTickerResult.rows[0].id;
      console.log('Ticker exists, updating:', existingId);
      
      // Update existing ticker
      await client.query(
        'UPDATE scraper_tasks SET target = $1, guru_id = $2, active = $3, color = $4 WHERE id = $5',
        [target, danGuruId, active, color, existingId]
      );
      
      console.log('Updated successfully');
    } else {
      console.log('Creating new ticker');
      // Create new ticker logic here
    }
    
    await client.query('COMMIT');
    console.log('Transaction committed');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

testAddTicker();