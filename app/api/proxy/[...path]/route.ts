import { NextRequest, NextResponse } from 'next/server';

async function proxyRequest(request: NextRequest, method: string, params: { path: string[] }) {
  const path = params.path.join('/');
  const url = new URL(request.url);
  const queryString = url.search;
  
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  
  const body = method === 'POST' ? await request.text() : undefined;
  
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