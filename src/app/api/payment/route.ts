import { NextResponse } from 'next/server';
import { serviceRegistry } from '@/lib/services/ServiceRegistry';

export async function POST(request: Request) {
  const service = serviceRegistry.selectService('payment');
  
  if (!service) {
    return NextResponse.json({ error: 'Payment service unavailable' }, { status: 503 });
  }

  serviceRegistry.incrementRequestCount(service.id);

  if (service.faultInjected) {
    serviceRegistry.incrementErrorCount(service.id);
    setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);
    return NextResponse.json({ error: 'Payment service fault injected' }, { status: 500 });
  }

  const body = await request.json();
  const { orderId, amount, method } = body;

  // Simulate payment processing
  await new Promise(resolve => setTimeout(resolve, 500));

  // Random failure (5% chance)
  const success = Math.random() > 0.05;

  setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);

  if (success) {
    return NextResponse.json({
      success: true,
      transactionId: `txn-${Date.now()}`,
      orderId,
      amount,
      method,
      serviceId: service.id,
    });
  } else {
    serviceRegistry.incrementErrorCount(service.id);
    return NextResponse.json({
      success: false,
      error: 'Payment declined',
      orderId,
      serviceId: service.id,
    }, { status: 402 });
  }
}