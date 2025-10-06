// Inventory Manager - Handles product inventory with consistency models
export type ConsistencyMode = 'strong' | 'eventual';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  reserved: number;
  version: number; // For optimistic locking
}

class InventoryManager {
  private products: Map<string, Product> = new Map();
  private consistencyMode: ConsistencyMode = 'strong';
  private eventualConsistencyDelay: number = 2000; // 2 seconds

  constructor() {
    this.initializeProducts();
  }

  private initializeProducts() {
    const initialProducts: Product[] = [
      { id: 'prod-1', name: 'Laptop Pro', price: 1299, stock: 50, reserved: 0, version: 1 },
      { id: 'prod-2', name: 'Wireless Mouse', price: 29, stock: 200, reserved: 0, version: 1 },
      { id: 'prod-3', name: 'Mechanical Keyboard', price: 89, stock: 100, reserved: 0, version: 1 },
      { id: 'prod-4', name: '4K Monitor', price: 499, stock: 30, reserved: 0, version: 1 },
      { id: 'prod-5', name: 'USB-C Hub', price: 49, stock: 150, reserved: 0, version: 1 },
    ];

    initialProducts.forEach(product => {
      this.products.set(product.id, product);
    });
  }

  getAllProducts(): Product[] {
    return Array.from(this.products.values());
  }

  getProduct(id: string): Product | undefined {
    return this.products.get(id);
  }

  async reserveStock(productId: string, quantity: number): Promise<{ success: boolean; error?: string }> {
    const product = this.products.get(productId);
    
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const availableStock = product.stock - product.reserved;
    
    if (availableStock < quantity) {
      return { success: false, error: 'Insufficient stock' };
    }

    if (this.consistencyMode === 'strong') {
      // Immediate consistency - reserve instantly
      product.reserved += quantity;
      product.version++;
      return { success: true };
    } else {
      // Eventual consistency - delay the reservation
      setTimeout(() => {
        product.reserved += quantity;
        product.version++;
      }, this.eventualConsistencyDelay);
      
      return { success: true };
    }
  }

  async commitReservation(productId: string, quantity: number): Promise<{ success: boolean; error?: string }> {
    const product = this.products.get(productId);
    
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    if (product.reserved < quantity) {
      return { success: false, error: 'Invalid reservation' };
    }

    // Commit the reservation - reduce both stock and reserved
    product.stock -= quantity;
    product.reserved -= quantity;
    product.version++;

    return { success: true };
  }

  async releaseReservation(productId: string, quantity: number): Promise<void> {
    const product = this.products.get(productId);
    
    if (product) {
      product.reserved = Math.max(0, product.reserved - quantity);
      product.version++;
    }
  }

  setConsistencyMode(mode: ConsistencyMode) {
    this.consistencyMode = mode;
  }

  getConsistencyMode(): ConsistencyMode {
    return this.consistencyMode;
  }

  setEventualConsistencyDelay(delay: number) {
    this.eventualConsistencyDelay = delay;
  }

  // Simulate stock replenishment
  replenishStock(productId: string, quantity: number): boolean {
    const product = this.products.get(productId);
    if (product) {
      product.stock += quantity;
      product.version++;
      return true;
    }
    return false;
  }
}

// Singleton instance
export const inventoryManager = new InventoryManager();