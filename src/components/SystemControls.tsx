"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Zap, Database } from 'lucide-react';

interface ServiceInstance {
  id: string;
  type: string;
  status: string;
  faultInjected?: boolean;
}

export function SystemControls() {
  const [services, setServices] = useState<ServiceInstance[]>([]);
  const [loadBalancing, setLoadBalancing] = useState<'round-robin' | 'least-load'>('round-robin');
  const [consistencyMode, setConsistencyMode] = useState<'strong' | 'eventual'>('strong');

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/services/health');
        const data = await res.json();
        setServices(data.services);
        setLoadBalancing(data.loadBalancingStrategy);
      } catch (error) {
        console.error('Failed to fetch health:', error);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLoadBalancingChange = async (strategy: 'round-robin' | 'least-load') => {
    try {
      await fetch('/api/services/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setLoadBalancing',
          loadBalancingStrategy: strategy,
        }),
      });
      setLoadBalancing(strategy);
    } catch (error) {
      console.error('Failed to update load balancing:', error);
    }
  };

  const handleConsistencyChange = async (mode: 'strong' | 'eventual') => {
    try {
      await fetch('/api/services/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setConsistency',
          consistencyMode: mode,
        }),
      });
      setConsistencyMode(mode);
    } catch (error) {
      console.error('Failed to update consistency:', error);
    }
  };

  const handleFaultToggle = async (serviceId: string, inject: boolean) => {
    try {
      await fetch('/api/services/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'injectFault',
          serviceId,
          faultInjected: inject,
        }),
      });
    } catch (error) {
      console.error('Failed to inject fault:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Load Balancing Strategy
        </h2>

        <div className="space-y-3">
          <Select value={loadBalancing} onValueChange={handleLoadBalancingChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="round-robin">Round Robin</SelectItem>
              <SelectItem value="least-load">Least Load</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">
            {loadBalancing === 'round-robin' 
              ? 'Distributes requests evenly across all healthy services'
              : 'Routes requests to the service with the lowest current load'}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Consistency Mode
        </h2>

        <div className="space-y-3">
          <Select value={consistencyMode} onValueChange={handleConsistencyChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strong">Strong Consistency</SelectItem>
              <SelectItem value="eventual">Eventual Consistency</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">
            {consistencyMode === 'strong'
              ? 'Inventory updates are immediately visible across all services'
              : 'Inventory updates may take 2 seconds to propagate'}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Fault Injection
        </h2>

        <div className="space-y-3">
          {services.map(service => (
            <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <span className="font-medium text-sm">{service.id}</span>
                {service.faultInjected && (
                  <Badge variant="destructive">Fault Active</Badge>
                )}
              </div>
              <Switch
                checked={service.faultInjected || false}
                onCheckedChange={(checked) => handleFaultToggle(service.id, checked)}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Injecting faults simulates service failures to test resilience and fault tolerance
        </div>
      </Card>
    </div>
  );
}