import { NextResponse } from 'next/server';
import { eventEmitter } from '@/lib/eventEmitter';

export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const listener = (alert: any) => {
        controller.enqueue(`data: ${JSON.stringify(alert)}\n\n`);
      };
      eventEmitter.on('newAlert', listener);
      request.signal.addEventListener('abort', () => {
        eventEmitter.off('newAlert', listener);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}