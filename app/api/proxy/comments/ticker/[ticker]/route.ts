import { NextRequest, NextResponse } from 'next/server';

const DAN_API_BASE_URL = process.env.DAN_API_BASE_URL || 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const { ticker } = params;
    
    const response = await fetch(`${DAN_API_BASE_URL}/api/comments/ticker/${ticker}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    const comments = await response.json();
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const { ticker } = params;
    const body = await request.json();
    
    const response = await fetch(`${DAN_API_BASE_URL}/api/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticker: ticker.toUpperCase(),
        comment_text: body.comment_text,
        user_id: body.user_id || 1, // Default user ID
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create comment: ${response.statusText}`);
    }

    const comment = await response.json();
    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}