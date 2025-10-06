// Service Registry - tracks all microservices and their health status
export type ServiceStatus = 'healthy' | 'degraded' | 'down';
export type ServiceType = 'gateway' | 'auth' | 'inventory' | 'order' | 'payment';

export interface ServiceInstance {
  id: string;
  type: ServiceType;
  status: ServiceStatus;
  load: number; // 0-100
  requestCount: number;
  errorCount: number;
  lastHealthCheck: Date;
  faultInjected?: boolean;
}

class ServiceRegistry {
  private services: Map<string, ServiceInstance> = new Map();
  private loadBalancingStrategy: 'round-robin' | 'least-load' = 'round-robin';
  private roundRobinCounters: Map<ServiceType, number> = new Map();

  constructor() {
    // Initialize service instances (simulating multiple instances per service)
    this.initializeServices();
  }

  private initializeServices() {
    const serviceTypes: ServiceType[] = ['gateway', 'auth', 'inventory', 'order', 'payment'];
    
    serviceTypes.forEach(type => {
      // Create 2 instances per service for load balancing
      for (let i = 1; i <= 2; i++) {
        const service: ServiceInstance = {
          id: `${type}-${i}`,
          type,
          status: 'healthy',
          load: 0,
          requestCount: 0,
          errorCount: 0,
          lastHealthCheck: new Date(),
          faultInjected: false,
        };
        this.services.set(service.id, service);
      }
    });
  }

  getAllServices(): ServiceInstance[] {
    return Array.from(this.services.values());
  }

  getServicesByType(type: ServiceType): ServiceInstance[] {
    return Array.from(this.services.values()).filter(s => s.type === type);
  }

  getService(id: string): ServiceInstance | undefined {
    return this.services.get(id);
  }

  updateServiceStatus(id: string, status: ServiceStatus) {
    const service = this.services.get(id);
    if (service) {
      service.status = status;
      service.lastHealthCheck = new Date();
    }
  }

  updateServiceLoad(id: string, load: number) {
    const service = this.services.get(id);
    if (service) {
      service.load = Math.min(100, Math.max(0, load));
    }
  }

  incrementRequestCount(id: string) {
    const service = this.services.get(id);
    if (service) {
      service.requestCount++;
      // Simulate load increase
      service.load = Math.min(100, service.load + Math.random() * 5);
    }
  }

  incrementErrorCount(id: string) {
    const service = this.services.get(id);
    if (service) {
      service.errorCount++;
    }
  }

  decreaseLoad(id: string) {
    const service = this.services.get(id);
    if (service) {
      service.load = Math.max(0, service.load - Math.random() * 3);
    }
  }

  // Load balancing - select best service instance
  selectService(type: ServiceType): ServiceInstance | null {
    const services = this.getServicesByType(type).filter(s => s.status !== 'down');
    
    if (services.length === 0) return null;

    if (this.loadBalancingStrategy === 'round-robin') {
      const counter = this.roundRobinCounters.get(type) || 0;
      const selected = services[counter % services.length];
      this.roundRobinCounters.set(type, counter + 1);
      return selected;
    } else {
      // Least load strategy
      return services.reduce((prev, current) => 
        prev.load < current.load ? prev : current
      );
    }
  }

  setLoadBalancingStrategy(strategy: 'round-robin' | 'least-load') {
    this.loadBalancingStrategy = strategy;
  }

  getLoadBalancingStrategy(): 'round-robin' | 'least-load' {
    return this.loadBalancingStrategy;
  }

  injectFault(id: string, shouldFault: boolean) {
    const service = this.services.get(id);
    if (service) {
      service.faultInjected = shouldFault;
      service.status = shouldFault ? 'down' : 'healthy';
    }
  }

  // Simulate gradual load decrease over time
  decreaseAllLoads() {
    this.services.forEach(service => {
      service.load = Math.max(0, service.load - 0.5);
    });
  }
}

// Singleton instance
export const serviceRegistry = new ServiceRegistry();

// Auto-decrease load every second
if (typeof window === 'undefined') {
  setInterval(() => {
    serviceRegistry.decreaseAllLoads();
  }, 1000);
}