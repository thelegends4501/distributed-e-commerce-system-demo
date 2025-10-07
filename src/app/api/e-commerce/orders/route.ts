import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, products, cartItems, user } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId && !id) {
      return NextResponse.json({ 
        error: 'userId parameter is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    // Get single order with items
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const order = await db.select()
        .from(orders)
        .where(eq(orders.id, parseInt(id)))
        .limit(1);

      if (order.length === 0) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const items = await db.select()
        .from(orderItems)
        .where(eq(orderItems.orderId, parseInt(id)));

      return NextResponse.json({
        ...order[0],
        items
      }, { status: 200 });
    }

    // Get list of orders for user
    let query = db.select()
      .from(orders)
      .where(eq(orders.userId, userId!))
      .orderBy(desc(orders.createdAt));

    if (status) {
      query = db.select()
        .from(orders)
        .where(and(eq(orders.userId, userId!), eq(orders.status, status)))
        .orderBy(desc(orders.createdAt));
    }

    const results = await query.limit(limit).offset(offset);
    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId, quantity } = body;

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json({ 
        error: 'Valid userId is required',
        code: 'INVALID_USER_ID' 
      }, { status: 400 });
    }

    // Get user info to determine priority
    const userData = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userInfo = userData[0];
    const priority = userInfo.isVip ? 'vip' : 'normal';

    let orderItemsData: Array<{
      productId: number;
      productName: string;
      quantity: number;
      price: number;
    }> = [];

    // Single product order
    if (productId) {
      if (!quantity || quantity <= 0) {
        return NextResponse.json({ 
          error: 'Valid quantity is required',
          code: 'INVALID_QUANTITY' 
        }, { status: 400 });
      }

      const product = await db.select()
        .from(products)
        .where(eq(products.id, parseInt(productId)))
        .limit(1);

      if (product.length === 0) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      if (product[0].stock < quantity) {
        return NextResponse.json({ 
          error: 'Insufficient stock',
          code: 'INSUFFICIENT_STOCK' 
        }, { status: 400 });
      }

      orderItemsData.push({
        productId: product[0].id,
        productName: product[0].name,
        quantity: parseInt(quantity),
        price: product[0].price
      });

      // Reduce stock
      await db.update(products)
        .set({ stock: product[0].stock - quantity })
        .where(eq(products.id, parseInt(productId)));

    } else {
      // Order from cart
      const cart = await db.select()
        .from(cartItems)
        .where(eq(cartItems.userId, userId));

      if (cart.length === 0) {
        return NextResponse.json({ 
          error: 'Cart is empty',
          code: 'EMPTY_CART' 
        }, { status: 400 });
      }

      // Validate all products and check stock
      for (const item of cart) {
        const product = await db.select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (product.length === 0) {
          return NextResponse.json({ 
            error: `Product ${item.productId} not found`,
            code: 'PRODUCT_NOT_FOUND' 
          }, { status: 404 });
        }

        if (product[0].stock < item.quantity) {
          return NextResponse.json({ 
            error: `Insufficient stock for ${product[0].name}`,
            code: 'INSUFFICIENT_STOCK' 
          }, { status: 400 });
        }

        orderItemsData.push({
          productId: product[0].id,
          productName: product[0].name,
          quantity: item.quantity,
          price: product[0].price
        });

        // Reduce stock
        await db.update(products)
          .set({ stock: product[0].stock - item.quantity })
          .where(eq(products.id, item.productId));
      }

      // Clear cart after processing
      await db.delete(cartItems)
        .where(eq(cartItems.userId, userId));
    }

    // Calculate total
    const total = orderItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order
    const newOrder = await db.insert(orders)
      .values({
        userId,
        status: 'pending',
        priority,
        total,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Create order items
    const items = await Promise.all(
      orderItemsData.map(item =>
        db.insert(orderItems)
          .values({
            orderId: newOrder[0].id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price
          })
          .returning()
      )
    );

    return NextResponse.json({
      ...newOrder[0],
      items: items.map(item => item[0])
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Status must be one of: pending, processing, completed, failed',
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Check if order exists
    const existingOrder = await db.select()
      .from(orders)
      .where(eq(orders.id, parseInt(id)))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updated = await db.update(orders)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if order exists
    const existingOrder = await db.select()
      .from(orders)
      .where(eq(orders.id, parseInt(id)))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only allow deletion if status is pending
    if (existingOrder[0].status !== 'pending') {
      return NextResponse.json({ 
        error: 'Cannot delete non-pending orders',
        code: 'CANNOT_DELETE_NON_PENDING' 
      }, { status: 400 });
    }

    // Get order items to restore stock
    const items = await db.select()
      .from(orderItems)
      .where(eq(orderItems.orderId, parseInt(id)));

    // Restore stock for each item
    for (const item of items) {
      const product = await db.select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (product.length > 0) {
        await db.update(products)
          .set({ stock: product[0].stock + item.quantity })
          .where(eq(products.id, item.productId));
      }
    }

    // Delete order (cascade will delete order items)
    const deleted = await db.delete(orders)
      .where(eq(orders.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Order cancelled successfully',
      order: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}