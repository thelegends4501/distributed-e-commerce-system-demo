import { NextResponse } from 'next/server';
import { serviceRegistry } from '@/lib/services/ServiceRegistry';
import { inventoryManager } from '@/lib/services/InventoryManager';

export async function POST(request: Request) {
  const body = await request.json();
  const { action, serviceId, loadBalancingStrategy, consistencyMode, faultInjected } = body;

  if (action === 'setLoadBalancing' && loadBalancingStrategy) {
    serviceRegistry.setLoadBalancingStrategy(loadBalancingStrategy);
    return NextResponse.json({ success: true, strategy: loadBalancingStrategy });
  }

  if (action === 'injectFault' && serviceId !== undefined) {
    serviceRegistry.injectFault(serviceId, faultInjected);
    return NextResponse.json({ success: true, serviceId, faultInjected });
  }

  if (action === 'setConsistency' && consistencyMode) {
    inventoryManager.setConsistencyMode(consistencyMode);
    return NextResponse.json({ success: true, mode: consistencyMode });
  }

  return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
}