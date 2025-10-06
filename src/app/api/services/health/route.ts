import { NextResponse } from 'next/server';
import { serviceRegistry } from '@/lib/services/ServiceRegistry';

export async function GET() {
  const services = serviceRegistry.getAllServices();
  
  return NextResponse.json({
    services,
    timestamp: new Date().toISOString(),
    loadBalancingStrategy: serviceRegistry.getLoadBalancingStrategy(),
  });
}