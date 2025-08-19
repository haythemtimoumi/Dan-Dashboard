import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  
  if (!from || !to) {
    return NextResponse.json({ error: 'Missing from or to parameters' }, { status: 400 });
  }
  
  try {
    // Fetch data from the local backend API
    const apiUrl = `http://localhost:3000/api/stocks/tickers/changes?from=${from}&to=${to}`;

    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MjcxNDQxNywiZXhwIjoxNzUyODAwODE3fQ.FB0oi_TFyDaz56zWp8s0HC59pdBjVAlnfpf64zqSwqM'
      },
    });
    
    if (!response.ok) {
      console.error('Backend API error:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch ticker changes from backend' }, { status: response.status });
    }
    
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching ticker changes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}