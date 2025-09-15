import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`http://localhost:8000/api/stocks/tickers-with-view`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MjcxNDQxNywiZXhwIjoxNzUyODAwODE3fQ.FB0oi_TFyDaz56zWp8s0HC59pdBjVAlnfpf64zqSwqM'
      },
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch tickers with view' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tickers with view:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}