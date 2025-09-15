import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Fetch data from the local backend API
    const apiUrl = `http://localhost:3000/api/stocks/tickers-with-view`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MjcxNDQxNywiZXhwIjoxNzUyODAwODE3fQ.FB0oi_TFyDaz56zWp8s0HC59pdBjVAlnfpf64zqSwqM'
      },
    });
    
    if (!response.ok) {
      console.error('Backend API error:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch tickers with view from backend' }, { status: response.status });
    }
    
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tickers with view:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}