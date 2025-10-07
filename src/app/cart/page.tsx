"use client";

import { useEffect, useState } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShoppingBag, ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";

interface CartItem {
  id: number;
  userId: string;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    stock: number;
    category: string;
  };
}

interface CartData {
  items: CartItem[];
  total: number;
}

export default function CartPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchCart();
    }
  }, [session]);

  const fetchCart = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cart?userId=${session?.user.id}`);
      const data = await response.json();
      setCart(data);
    } catch (error) {
      toast.error("Failed to load cart");
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const response = await fetch(`/api/cart?id=${cartItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (response.ok) {
        fetchCart();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update quantity");
      }
    } catch (error) {
      toast.error("Failed to update quantity");
    }
  };

  const removeItem = async (cartItemId: number) => {
    try {
      const response = await fetch(`/api/cart?id=${cartItemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Item removed from cart");
        fetchCart();
      } else {
        toast.error("Failed to remove item");
      }
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const handleCheckout = async () => {
    if (!session?.user) return;

    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/e-commerce/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (response.ok) {
        const order = await response.json();
        toast.success(
          `Order placed successfully! ${order.priority === "vip" ? "🌟 VIP Priority Processing" : ""}`
        );
        await fetchCart(); // Refresh cart to show it's empty
        router.push("/orders");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to place order");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to place order");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

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
              <span className="text-sm text-muted-foreground">
                {session?.user.name}
              </span>
              <Link href="/shop">
                <Button variant="ghost">Continue Shopping</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/shop">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shop
            </Button>
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

        {isEmpty ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Add some products to get started
              </p>
              <Link href="/shop">
                <Button>Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <Link href={`/shop/${item.product.id}`}>
                          <h3 className="font-semibold text-lg hover:underline mb-1">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {item.product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-12 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg">
                              ${((item.product.price * item.quantity) / 100).toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Items ({cart.items.reduce((sum, item) => sum + item.quantity, 0)})
                    </span>
                    <span>${(cart.total / 100).toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${(cart.total / 100).toFixed(2)}</span>
                    </div>
                  </div>
                  {session?.user.email?.includes("vip") && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium flex items-center gap-2">
                        <span>🌟</span>
                        VIP Priority Processing
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {isCheckingOut ? "Processing..." : "Checkout"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}