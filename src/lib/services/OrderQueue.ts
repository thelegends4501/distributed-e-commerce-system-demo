// Order Queue - Priority queue for VIP vs Normal orders
export type OrderPriority = 'vip' | 'normal';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Order {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  quantity: number;
  priority: OrderPriority;
  status: OrderStatus;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  error?: string;
}

class OrderQueue {
  private vipQueue: Order[] = [];
  private normalQueue: Order[] = [];
  private orders: Map<string, Order> = new Map();
  private processing: boolean = false;
  private processingOrder: Order | null = null;

  addOrder(order: Order): void {
    this.orders.set(order.id, order);
    
    if (order.priority === 'vip') {
      this.vipQueue.push(order);
    } else {
      this.normalQueue.push(order);
    }

    // Start processing if not already
    if (!this.processing) {
      this.processNextOrder();
    }
  }

  getOrder(id: string): Order | undefined {
    return this.orders.get(id);
  }

  getAllOrders(): Order[] {
    return Array.from(this.orders.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  getQueueStatus() {
    return {
      vipQueue: this.vipQueue.length,
      normalQueue: this.normalQueue.length,
      processing: this.processing,
      processingOrder: this.processingOrder,
    };
  }

  private async processNextOrder() {
    // Always prioritize VIP orders
    let order: Order | undefined;
    
    if (this.vipQueue.length > 0) {
      order = this.vipQueue.shift();
    } else if (this.normalQueue.length > 0) {
      order = this.normalQueue.shift();
    }

    if (!order) {
      this.processing = false;
      this.processingOrder = null;
      return;
    }

    this.processing = true;
    this.processingOrder = order;
    order.status = 'processing';
    order.processedAt = new Date();

    // Simulate processing time (VIP orders process faster)
    const processingTime = order.priority === 'vip' ? 1000 : 2000;
    
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Random failure (5% chance)
    if (Math.random() < 0.05) {
      order.status = 'failed';
      order.error = 'Payment processing failed';
    } else {
      order.status = 'completed';
    }

    order.completedAt = new Date();
    this.orders.set(order.id, order);

    // Process next order
    this.processNextOrder();
  }

  updateOrderStatus(id: string, status: OrderStatus, error?: string) {
    const order = this.orders.get(id);
    if (order) {
      order.status = status;
      if (error) order.error = error;
      if (status === 'completed' || status === 'failed') {
        order.completedAt = new Date();
      }
    }
  }
}

// Singleton instance
export const orderQueue = new OrderQueue();