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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { color } = await request.json();
    const { id } = params;
    
    const result = await pool.query(
      'UPDATE scraper_tasks SET color = $1 WHERE id = $2 RETURNING *',
      [color, id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Ticker not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'Color updated successfully',
      ticker: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating color:', error);
    return NextResponse.json({ error: 'Failed to update color' }, { status: 500 });
  }
}