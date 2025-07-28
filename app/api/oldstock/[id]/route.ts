import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://www.mytickerlist.com/api';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    const response = await fetch(`${API_BASE_URL}/oldstock/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete old stock API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete old stock' },
      { status: 500 }
    );
  }
}