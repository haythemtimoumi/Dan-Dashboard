import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://localhost:3000';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Company ID or symbol is required' },
        { status: 400 }
      );
    }

    console.log(`Proxying company request to: ${API_BASE_URL}/api/stocks/company/${id}`);

    const response = await fetch(`${API_BASE_URL}/api/stocks/company/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Company proxy API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company data from backend API' },
      { status: 500 }
    );
  }
}