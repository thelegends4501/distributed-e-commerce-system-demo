"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  reserved: number;
  version: number;
}

export function InventoryControl() {
  const [products, setProducts] = useState<Product[]>([]);
  const [consistencyMode, setConsistencyMode] = useState<string>('strong');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch('/api/inventory');
        const data = await res.json();
        setProducts(data.products || []);
        setConsistencyMode(data.consistencyMode || 'strong');
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      }
    };

    fetchInventory();
    const interval = setInterval(fetchInventory, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleReplenish = async (productId: string) => {
    try {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'replenish',
          productId,
          quantity: 50,
        }),
      });
    } catch (error) {
      console.error('Failed to replenish:', error);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Package className="w-5 h-5" />
          Inventory Status
        </h2>
        <Badge variant="outline">Mode: {consistencyMode}</Badge>
      </div>

      <div className="space-y-3">
        {products.map(product => {
          const available = product.stock - product.reserved;
          const stockPercentage = (product.stock / 200) * 100;
          
          return (
            <div key={product.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">${product.price}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleReplenish(product.id)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Replenish
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Available:</span>
                  <span className="font-medium">{available}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Reserved:</span>
                  <span className="font-medium text-yellow-600">{product.reserved}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Stock:</span>
                  <span className="font-medium">{product.stock}</span>
                </div>
                
                <div className="w-full bg-secondary rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      stockPercentage > 50 ? 'bg-green-500' : 
                      stockPercentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, stockPercentage)}%` }}
                  />
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Version: {product.version}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}