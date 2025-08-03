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

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT id, guru_name, description FROM guru ORDER BY guru_name ASC'
    );
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching gurus:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gurus' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { guru_name, description } = await request.json();
    
    if (!guru_name) {
      return NextResponse.json(
        { error: 'Guru name is required' },
        { status: 400 }
      );
    }
    
    const result = await pool.query(
      'INSERT INTO guru (guru_name, description) VALUES ($1, $2) RETURNING *',
      [guru_name, description || '']
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating guru:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { error: 'Guru name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create guru' },
      { status: 500 }
    );
  }
}