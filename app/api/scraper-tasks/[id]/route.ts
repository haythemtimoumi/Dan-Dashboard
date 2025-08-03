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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Start a transaction to delete related records first
    await pool.query('BEGIN');
    
    try {
      // Delete from guru_ticker_map first (foreign key constraint)
      await pool.query(
        'DELETE FROM guru_ticker_map WHERE scraper_task_id = $1',
        [id]
      );
      
      // Then delete from scraper_tasks
      const result = await pool.query(
        'DELETE FROM scraper_tasks WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        await pool.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Ticker not found' },
          { status: 404 }
        );
      }
      
      await pool.query('COMMIT');
      
      return NextResponse.json({ 
        message: 'Ticker deleted successfully',
        deleted: result.rows[0]
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting ticker:', error);
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}