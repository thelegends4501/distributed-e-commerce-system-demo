"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShoppingBag, ShoppingCart, Minus, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  category: string;
}

export default function ProductDetailsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/products?id=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      } else {
        toast.error("Product not found");
        router.push("/shop");
      }
    } catch (error) {
      toast.error("Failed to load product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!session?.user) {
      toast.error("Please login to add items to cart");
      return;
    }

    if (!product) return;

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          productId: product.id,
          quantity,
        }),
      });

      if (response.ok) {
        toast.success(`Added ${quantity} item(s) to cart!`);
        router.push("/cart");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add to cart");
      }
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6" />
              <span className="text-xl font-bold">TechStore</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/cart">
                <Button variant="ghost">
                  <ShoppingCart className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Link href="/shop">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground capitalize">
                  {product.category}
                </span>
                {product.stock < 10 && product.stock > 0 && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded">
                    Low Stock
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-bold">
                    ${(product.price / 100).toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">per unit</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Quantity
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val >= 1 && val <= product.stock) {
                            setQuantity(val);
                          }
                        }}
                        className="w-20 text-center"
                        min={1}
                        max={product.stock}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={incrementQuantity}
                        disabled={quantity >= product.stock}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {product.stock} available
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-medium">Subtotal:</span>
                      <span className="text-2xl font-bold">
                        ${((product.price * quantity) / 100).toFixed(2)}
                      </span>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleAddToCart}
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Product Details</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Category: {product.category}</li>
                <li>Stock: {product.stock} units</li>
                <li>SKU: PROD-{product.id.toString().padStart(6, "0")}</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}