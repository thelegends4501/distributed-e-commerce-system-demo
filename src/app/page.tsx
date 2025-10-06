"use client";

import { ServiceMonitor } from '@/components/ServiceMonitor';
import { OrderInterface } from '@/components/OrderInterface';
import { InventoryControl } from '@/components/InventoryControl';
import { SystemControls } from '@/components/SystemControls';
import { ServerLogs } from '@/components/ServerLogs';
import { Server } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Server className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Distributed E-Commerce System</h1>
              <p className="text-muted-foreground">
                Real-time microservices monitoring with load balancing, fault tolerance & priority queuing
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <ServiceMonitor />
            <OrderInterface />
            <ServerLogs />
          </div>

          <div className="space-y-6">
            <SystemControls />
            <InventoryControl />
          </div>
        </div>
      </main>
    </div>
  );
}