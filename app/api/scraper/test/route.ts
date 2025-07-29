import { NextRequest, NextResponse } from 'next/server';

const SCRAPER_BASE_URL = 'http://stock-ticker.dev';

export async function GET() {
  try {
    // Test basic connectivity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${SCRAPER_BASE_URL}/services`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      status: response.status,
      statusText: response.statusText,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Scraper connectivity test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}