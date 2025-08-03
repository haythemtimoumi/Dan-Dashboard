import { NextRequest, NextResponse } from 'next/server';

const DAN_API_BASE_URL = process.env.DAN_API_BASE_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const { tickers } = await request.json();
    
    if (!tickers || !Array.isArray(tickers)) {
      return NextResponse.json({ error: 'Invalid tickers array' }, { status: 400 });
    }

    // Batch fetch comments for all tickers from Dan-API backend
    const commentPromises = tickers.map(async (ticker: string) => {
      try {
        const response = await fetch(`${DAN_API_BASE_URL}/api/comments/ticker/${ticker}`);
        if (response.ok) {
          const comments = await response.json();
          return {
            ticker,
            hasComments: comments.length > 0,
            lastComment: comments.length > 0 ? comments.sort((a: any, b: any) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0].comment_text : null
          };
        }
        return { ticker, hasComments: false, lastComment: null };
      } catch (error) {
        console.error(`Error fetching comments for ${ticker}:`, error);
        return { ticker, hasComments: false, lastComment: null };
      }
    });

    const results = await Promise.all(commentPromises);
    
    // Convert to object for easier lookup
    const commentsData = results.reduce((acc, result) => {
      acc[result.ticker] = {
        hasComments: result.hasComments,
        lastComment: result.lastComment
      };
      return acc;
    }, {} as Record<string, { hasComments: boolean; lastComment: string | null }>);

    return NextResponse.json(commentsData);
  } catch (error) {
    console.error('Error in batch comments API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}