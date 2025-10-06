"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, Package, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  reserved: number;
}

interface Order {
  id: string;
  productName: string;
  quantity: number;
  priority: 'vip' | 'normal';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

interface QueueStatus {
  vipQueue: number;
  normalQueue: number;
  processing: boolean;
  processingOrder: Order | null;
}

export function OrderInterface() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [priority, setPriority] = useState<'vip' | 'normal'>('normal');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inventoryRes, ordersRes] = await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/orders')
        ]);
        
        const inventoryData = await inventoryRes.json();
        const ordersData = await ordersRes.json();
        
        setProducts(inventoryData.products || []);
        setOrders(ordersData.orders || []);
        setQueueStatus(ordersData.queueStatus);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePlaceOrder = async () => {
    if (!selectedProduct) return;

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-' + Math.random().toString(36).substr(2, 9),
          productId: selectedProduct,
          quantity,
          priority,
        }),
      });

      if (res.ok) {
        setQuantity(1);
      }
    } catch (error) {
      console.error('Failed to place order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Place Order
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Product</label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - ${product.price} (Stock: {product.stock - product.reserved})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Quantity</label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Priority</label>
            <Select value={priority} onValueChange={(v) => setPriority(v as 'vip' | 'normal')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="vip">VIP (Fast Track)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handlePlaceOrder} 
            disabled={!selectedProduct || loading}
            className="w-full"
          >
            Place Order
          </Button>
        </div>

        {queueStatus && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-3">Queue Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>VIP Queue:</span>
                <Badge variant="secondary">{queueStatus.vipQueue}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Normal Queue:</span>
                <Badge variant="secondary">{queueStatus.normalQueue}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Processing:</span>
                <Badge variant={queueStatus.processing ? "default" : "outline"}>
                  {queueStatus.processing ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Recent Orders
        </h2>

        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {orders.slice(0, 20).map(order => (
              <div key={order.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className="font-medium text-sm">{order.productName}</span>
                  </div>
                  <Badge variant={order.priority === 'vip' ? 'default' : 'outline'}>
                    {order.priority.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Quantity: {order.quantity}</div>
                  <div>Status: {order.status}</div>
                  <div>ID: {order.id}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}