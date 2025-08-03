import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('http://localhost:3000/api/stocks/last-date');
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error fetching last date from Dan-API:', error);
  }
  
  return NextResponse.json({ last_date: '2025-07-31' });
}