import { NextRequest, NextResponse } from 'next/server';

async function proxyRequest(request: NextRequest, method: string, params: { path: string[] }) {
  const path = params.path.join('/');
  
  // Exclude tickers route from proxy to allow local API to handle it
  if (path === 'tickers') {
    return NextResponse.json({ error: 'Route handled locally' }, { status: 404 });
  }
  
  const url = new URL(request.url);
  const queryString = url.search;
  
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  
  const body = ['POST', 'PUT'].includes(method) ? await request.text() : undefined;
  
  try {
    const response = await fetch(`https://www.mytickerlist.com/api/${path}${queryString}`, {
      method,
      headers,
      body,
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, 'GET', params);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, 'POST', params);
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, 'PUT', params);
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, 'DELETE', params);
}