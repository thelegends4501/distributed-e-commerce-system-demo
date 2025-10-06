import { NextResponse } from 'next/server';
import { orderQueue, Order } from '@/lib/services/OrderQueue';
import { inventoryManager } from '@/lib/services/InventoryManager';
import { serviceRegistry } from '@/lib/services/ServiceRegistry';

export async function GET() {
  const service = serviceRegistry.selectService('order');
  
  if (!service) {
    return NextResponse.json({ error: 'Order service unavailable' }, { status: 503 });
  }

  serviceRegistry.incrementRequestCount(service.id);

  if (service.faultInjected) {
    serviceRegistry.incrementErrorCount(service.id);
    setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);
    return NextResponse.json({ error: 'Service fault injected' }, { status: 500 });
  }

  const orders = orderQueue.getAllOrders();
  const queueStatus = orderQueue.getQueueStatus();
  
  setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);

  return NextResponse.json({
    orders,
    queueStatus,
    serviceId: service.id,
  });
}

export async function POST(request: Request) {
  const service = serviceRegistry.selectService('order');
  
  if (!service) {
    return NextResponse.json({ error: 'Order service unavailable' }, { status: 503 });
  }

  serviceRegistry.incrementRequestCount(service.id);

  if (service.faultInjected) {
    serviceRegistry.incrementErrorCount(service.id);
    setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);
    return NextResponse.json({ error: 'Service fault injected' }, { status: 500 });
  }

  const body = await request.json();
  const { userId, productId, quantity, priority } = body;

  // Get product info
  const product = inventoryManager.getProduct(productId);
  
  if (!product) {
    setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // Reserve stock
  const reservation = await inventoryManager.reserveStock(productId, quantity);
  
  if (!reservation.success) {
    setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);
    return NextResponse.json({ error: reservation.error }, { status: 400 });
  }

  // Create order
  const order: Order = {
    id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    productId,
    productName: product.name,
    quantity,
    priority: priority || 'normal',
    status: 'pending',
    createdAt: new Date(),
  };

  orderQueue.addOrder(order);

  // Simulate async order processing
  setTimeout(async () => {
    const result = await inventoryManager.commitReservation(productId, quantity);
    if (result.success) {
      orderQueue.updateOrderStatus(order.id, 'completed');
    } else {
      orderQueue.updateOrderStatus(order.id, 'failed', result.error);
      await inventoryManager.releaseReservation(productId, quantity);
    }
  }, priority === 'vip' ? 1000 : 2000);

  setTimeout(() => serviceRegistry.decreaseLoad(service.id), 100);

  return NextResponse.json({
    order,
    serviceId: service.id,
  });
}