import { NextResponse } from 'next/server';
import { inventoryManager } from '@/lib/services/InventoryManager';
import { serviceRegistry } from '@/lib/services/ServiceRegistry';

export async function GET() {
  const service = serviceRegistry.selectService('inventory');
  
  if (!service) {
    return NextResponse.json({ error: 'Inventory service unavailable' }, { status: 503 });
  }

  serviceRegistry.incrementRequestCount(service.id);

  // Simulate fault injection
  if (service.faultInjected) {
    serviceRegistry.incrementErrorCount(service.id);
    setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);
    return NextResponse.json({ error: 'Service fault injected' }, { status: 500 });
  }

  const products = inventoryManager.getAllProducts();
  
  setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);

  return NextResponse.json({
    products,
    serviceId: service.id,
    consistencyMode: inventoryManager.getConsistencyMode(),
  });
}

export async function POST(request: Request) {
  const service = serviceRegistry.selectService('inventory');
  
  if (!service) {
    return NextResponse.json({ error: 'Inventory service unavailable' }, { status: 503 });
  }

  serviceRegistry.incrementRequestCount(service.id);

  if (service.faultInjected) {
    serviceRegistry.incrementErrorCount(service.id);
    setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);
    return NextResponse.json({ error: 'Service fault injected' }, { status: 500 });
  }

  const body = await request.json();
  const { action, productId, quantity } = body;

  if (action === 'replenish') {
    const success = inventoryManager.replenishStock(productId, quantity);
    setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);
    return NextResponse.json({ success, serviceId: service.id });
  }

  setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}