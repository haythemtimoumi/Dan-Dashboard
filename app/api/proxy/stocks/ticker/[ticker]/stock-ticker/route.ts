import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: { ticker: string } }) {
  try {
    const { ticker } = params;
    const body = await request.json();
    
    const response = await fetch(`http://localhost:8000/api/stocks/ticker/${ticker}/stock-ticker`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MjcxNDQxNywiZXhwIjoxNzUyODAwODE3fQ.FB0oi_TFyDaz56zWp8s0HC59pdBjVAlnfpf64zqSwqM'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to update stock ticker' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating stock ticker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}