import { NextRequest, NextResponse } from 'next/server';

const defaultBffBaseUrl = 'http://127.0.0.1:3001';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyBffRequest(request, params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyBffRequest(request, params);
}

async function proxyBffRequest(request: NextRequest, paramsPromise: Promise<{ path: string[] }>) {
  const { path } = await paramsPromise;
  const target = new URL(`/${path.join('/')}`, process.env.BFF_BASE_URL ?? defaultBffBaseUrl);
  target.search = request.nextUrl.search;

  try {
    const response = await fetch(target, {
      method: request.method,
      headers: {
        accept: request.headers.get('accept') ?? 'application/json',
        'content-type': request.headers.get('content-type') ?? 'application/json',
        ...(request.headers.get('authorization') ? { authorization: request.headers.get('authorization') as string } : {}),
        ...(request.headers.get('session-id') ? { 'session-id': request.headers.get('session-id') as string } : {}),
        ...(request.headers.get('x-actor-id') ? { 'x-actor-id': request.headers.get('x-actor-id') as string } : {}),
      },
      body: request.method === 'GET' ? undefined : await request.text(),
      cache: 'no-store',
    });

    return new NextResponse(await response.text(), {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch {
    return NextResponse.json(
      {
        errors: [
          {
            code: 'BFF_PROXY_UNAVAILABLE',
            message: 'BFF projection read endpoint is unavailable.',
            category: 'transport',
          },
        ],
      },
      { status: 503 },
    );
  }
}
