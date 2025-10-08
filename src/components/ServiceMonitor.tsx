"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface ServiceInstance {
  id: string;
  type: string;
  status: 'healthy' | 'degraded' | 'down';
  load: number;
  requestCount: number;
  errorCount: number;
  lastHealthCheck: string;
  faultInjected?: boolean;
}

export function ServiceMonitor() {
  const [services, setServices] = useState<ServiceInstance[]>([]);
  const [strategy, setStrategy] = useState<string>('round-robin');

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/services/health');
        const data = await res.json();
        setServices(data.services || []);
        setStrategy(data.loadBalancingStrategy || 'round-robin');
      } catch (error) {
        console.error('Failed to fetch health:', error);
        setServices([]);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'down': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const serviceTypes = ['gateway', 'auth', 'inventory', 'order', 'payment'];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Service Health Monitor</h2>
        <Badge variant="outline">Strategy: {strategy}</Badge>
      </div>

      <div className="space-y-4">
        {serviceTypes.map(type => {
          const typeServices = (services || []).filter(s => s.type === type);
          
          return (
            <div key={type} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold capitalize">{type} Service</h3>
                <div className="flex gap-2">
                  {typeServices.map(service => (
                    <div key={service.id} className="flex items-center gap-1">
                      {getStatusIcon(service.status)}
                      <span className="text-xs text-muted-foreground">{service.id}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {typeServices.map(service => (
                  <div key={service.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Load</span>
                      <span className="font-medium">{service.load.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getStatusColor(service.status)}`}
                        style={{ width: `${service.load}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Requests: {service.requestCount}</span>
                      <span>Errors: {service.errorCount}</span>
                    </div>
                    {service.faultInjected && (
                      <Badge variant="destructive" className="text-xs">Fault Injected</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}