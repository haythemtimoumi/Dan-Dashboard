import { NextRequest, NextResponse } from 'next/server';

const SCRAPER_BASE_URL = 'http://stock-ticker.dev';

// Add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    if (endpoint === 'services') {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(`${SCRAPER_BASE_URL}/services`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return addCorsHeaders(NextResponse.json(data));
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    }
    
    return addCorsHeaders(NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 }));
  } catch (error) {
    console.error('Scraper API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return addCorsHeaders(NextResponse.json({ 
      error: 'Failed to fetch scraper data', 
      details: errorMessage 
    }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, service, schedule } = body;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for service runs
    
    try {
      if (action === 'run-service' && service) {
        const response = await fetch(`${SCRAPER_BASE_URL}/run-service`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return addCorsHeaders(NextResponse.json(data));
      }
      
      if (action === 'update-timer' && schedule) {
        const response = await fetch(`${SCRAPER_BASE_URL}/update-timer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schedule }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return addCorsHeaders(NextResponse.json(data));
      }
      
      clearTimeout(timeoutId);
      return addCorsHeaders(NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 }));
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Scraper API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return addCorsHeaders(NextResponse.json({ 
      error: 'Failed to execute scraper action', 
      details: errorMessage 
    }, { status: 500 }));
  }
}