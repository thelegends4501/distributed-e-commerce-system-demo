import { NextResponse } from 'next/server';
import { serviceRegistry } from '@/lib/services/ServiceRegistry';

export async function POST(request: Request) {
  const service = serviceRegistry.selectService('gateway');
  
  if (!service) {
    return NextResponse.json({ error: 'Gateway service unavailable' }, { status: 503 });
  }

  serviceRegistry.incrementRequestCount(service.id);

  if (service.faultInjected) {
    serviceRegistry.incrementErrorCount(service.id);
    setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);
    return NextResponse.json({ error: 'Gateway fault injected' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { targetService, method = 'GET', data } = body;

    // Route request to target service
    const targetServiceEndpoint = getServiceEndpoint(targetService);
    
    if (!targetServiceEndpoint) {
      setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);
      return NextResponse.json({ error: 'Invalid target service' }, { status: 400 });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${targetServiceEndpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });

    const result = await response.json();
    setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);

    return NextResponse.json({
      success: response.ok,
      data: result,
      serviceId: service.id,
    });
  } catch (error) {
    console.error('Gateway routing error:', error);
    serviceRegistry.incrementErrorCount(service.id);
    setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);
    return NextResponse.json({ 
      error: 'Gateway failed to route request',
      serviceId: service.id 
    }, { status: 500 });
  }
}

export async function GET() {
  const service = serviceRegistry.selectService('gateway');
  
  if (!service) {
    return NextResponse.json({ error: 'Gateway service unavailable' }, { status: 503 });
  }

  serviceRegistry.incrementRequestCount(service.id);
  setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);

  return NextResponse.json({
    status: 'operational',
    serviceId: service.id,
    availableRoutes: ['auth', 'inventory', 'order', 'payment'],
  });
}

function getServiceEndpoint(serviceName: string): string | null {
  const endpoints: Record<string, string> = {
    auth: '/api/auth',
    inventory: '/api/inventory',
    order: '/api/orders',
    payment: '/api/payment',
  };
  return endpoints[serviceName] || null;
}