import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const response = await fetch(
      `https://mytickerlist.com/api/stocks/${params.id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader || ''
        }
      }
    );
    
    console.log('Delete response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Delete API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to delete stock: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete API Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete stock' },
      { status: 500 }
    );
  }
}