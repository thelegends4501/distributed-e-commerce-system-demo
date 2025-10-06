import { NextResponse } from 'next/server';

const logs: Array<{
  id: string;
  timestamp: number;
  service: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  message: string;
}> = [];

let logIdCounter = 0;

export const dynamic = 'force-dynamic';

// Generate simulated logs
function generateLog() {
  const services = ['gateway', 'auth', 'inventory', 'order', 'payment'];
  const service = services[Math.floor(Math.random() * services.length)];
  
  const logTemplates = {
    gateway: [
      { severity: 'info' as const, message: 'Routing request to {{service}} service' },
      { severity: 'info' as const, message: 'Load balancing: Selected instance {{instance}}' },
      { severity: 'warning' as const, message: 'High load detected: {{count}} concurrent requests' },
    ],
    auth: [
      { severity: 'success' as const, message: 'User authentication successful: user_{{id}}' },
      { severity: 'warning' as const, message: 'Failed login attempt from IP {{ip}}' },
      { severity: 'info' as const, message: 'JWT token issued for user_{{id}}' },
    ],
    inventory: [
      { severity: 'info' as const, message: 'Stock level check: Product {{id}} has {{stock}} units' },
      { severity: 'warning' as const, message: 'Low stock alert: Product {{id}} below threshold' },
      { severity: 'success' as const, message: 'Inventory reserved: {{units}} units for order {{orderId}}' },
      { severity: 'error' as const, message: 'Insufficient stock for Product {{id}}' },
    ],
    order: [
      { severity: 'info' as const, message: 'New {{priority}} order received: order_{{id}}' },
      { severity: 'success' as const, message: 'Order {{id}} processed successfully in {{time}}ms' },
      { severity: 'warning' as const, message: 'Order queue length: {{count}} pending orders' },
      { severity: 'info' as const, message: 'VIP order preempted {{count}} normal orders' },
    ],
    payment: [
      { severity: 'success' as const, message: 'Payment processed: ${{amount}} for order {{orderId}}' },
      { severity: 'error' as const, message: 'Payment failed: Insufficient funds for order {{orderId}}' },
      { severity: 'info' as const, message: 'Initiating 2-phase commit for order {{orderId}}' },
      { severity: 'warning' as const, message: 'Payment retry attempt {{attempt}}/3 for order {{orderId}}' },
    ],
  };

  const templates = logTemplates[service as keyof typeof logTemplates];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const message = template.message
    .replace('{{service}}', services[Math.floor(Math.random() * services.length)])
    .replace('{{instance}}', `${Math.floor(Math.random() * 5) + 1}`)
    .replace('{{count}}', `${Math.floor(Math.random() * 20) + 5}`)
    .replace('{{id}}', `${Math.floor(Math.random() * 1000)}`)
    .replace('{{orderId}}', `ORD${Math.floor(Math.random() * 10000)}`)
    .replace('{{stock}}', `${Math.floor(Math.random() * 100)}`)
    .replace('{{units}}', `${Math.floor(Math.random() * 10) + 1}`)
    .replace('{{time}}', `${Math.floor(Math.random() * 500) + 100}`)
    .replace('{{amount}}', `${(Math.random() * 500 + 50).toFixed(2)}`)
    .replace('{{priority}}', Math.random() > 0.7 ? 'VIP' : 'normal')
    .replace('{{attempt}}', `${Math.floor(Math.random() * 3) + 1}`)
    .replace('{{ip}}', `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`);

  return {
    id: `log_${logIdCounter++}`,
    timestamp: Date.now(),
    service,
    severity: template.severity,
    message,
  };
}

// Generate initial logs
if (logs.length === 0) {
  for (let i = 0; i < 50; i++) {
    logs.push(generateLog());
  }
}

// Continuously generate logs
setInterval(() => {
  logs.push(generateLog());
  // Keep only last 200 logs
  if (logs.length > 200) {
    logs.splice(0, logs.length - 200);
  }
}, 2000);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service');
  const severity = searchParams.get('severity');
  
  let filteredLogs = [...logs];
  
  if (service && service !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.service === service);
  }
  
  if (severity && severity !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.severity === severity);
  }
  
  return NextResponse.json({
    logs: filteredLogs.slice(-100), // Return last 100 logs
  });
}

export async function DELETE() {
  logs.length = 0;
  logIdCounter = 0;
  return NextResponse.json({ success: true });
}