import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cartItems, products } from '@/db/schema';
import { eq, and, sum, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId parameter is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    // Get cart items with product details using join
    const items = await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        product: {
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          image: products.image,
          stock: products.stock,
          category: products.category,
        }
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));

    // Calculate total
    const total = items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    return NextResponse.json({
      items,
      total
    }, { status: 200 });

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

    // Validation
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json({ 
        error: 'Valid userId is required',
        code: 'INVALID_USER_ID' 
      }, { status: 400 });
    }

    if (!productId || isNaN(parseInt(productId.toString()))) {
      return NextResponse.json({ 
        error: 'Valid productId is required',
        code: 'INVALID_PRODUCT_ID' 
      }, { status: 400 });
    }

    if (!quantity || isNaN(parseInt(quantity.toString())) || parseInt(quantity.toString()) <= 0) {
      return NextResponse.json({ 
        error: 'Quantity must be a positive integer',
        code: 'INVALID_QUANTITY' 
      }, { status: 400 });
    }

    const productIdInt = parseInt(productId.toString());
    const quantityInt = parseInt(quantity.toString());

    // Check if product exists and get stock
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, productIdInt))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json({ 
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Check if item already exists in cart
    const existingItem = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, userId),
          eq(cartItems.productId, productIdInt)
        )
      )
      .limit(1);

    if (existingItem.length > 0) {
      // Update existing item - add to existing quantity
      const newQuantity = existingItem[0].quantity + quantityInt;

      // Check stock availability for new total quantity
      if (newQuantity > product[0].stock) {
        return NextResponse.json({ 
          error: `Insufficient stock. Available: ${product[0].stock}, Requested: ${newQuantity}`,
          code: 'INSUFFICIENT_STOCK' 
        }, { status: 400 });
      }

      const updated = await db
        .update(cartItems)
        .set({
          quantity: newQuantity
        })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();

      // Get updated item with product details
      const updatedWithProduct = await db
        .select({
          id: cartItems.id,
          userId: cartItems.userId,
          productId: cartItems.productId,
          quantity: cartItems.quantity,
          createdAt: cartItems.createdAt,
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            image: products.image,
            stock: products.stock,
            category: products.category,
          }
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.id, updated[0].id))
        .limit(1);

      return NextResponse.json(updatedWithProduct[0], { status: 201 });
    } else {
      // Check stock availability for new item
      if (quantityInt > product[0].stock) {
        return NextResponse.json({ 
          error: `Insufficient stock. Available: ${product[0].stock}, Requested: ${quantityInt}`,
          code: 'INSUFFICIENT_STOCK' 
        }, { status: 400 });
      }

      // Insert new cart item
      const newItem = await db
        .insert(cartItems)
        .values({
          userId,
          productId: productIdInt,
          quantity: quantityInt,
          createdAt: new Date()
        })
        .returning();

      // Get created item with product details
      const createdWithProduct = await db
        .select({
          id: cartItems.id,
          userId: cartItems.userId,
          productId: cartItems.productId,
          quantity: cartItems.quantity,
          createdAt: cartItems.createdAt,
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            image: products.image,
            stock: products.stock,
            category: products.category,
          }
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.id, newItem[0].id))
        .limit(1);

      return NextResponse.json(createdWithProduct[0], { status: 201 });
    }

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
        error: 'Valid cart item ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const body = await request.json();
    const { quantity } = body;

    if (!quantity || isNaN(parseInt(quantity.toString())) || parseInt(quantity.toString()) <= 0) {
      return NextResponse.json({ 
        error: 'Quantity must be a positive integer',
        code: 'INVALID_QUANTITY' 
      }, { status: 400 });
    }

    const cartItemId = parseInt(id);
    const quantityInt = parseInt(quantity.toString());

    // Get cart item with product info
    const cartItem = await db
      .select({
        cartItem: cartItems,
        product: products
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.id, cartItemId))
      .limit(1);

    if (cartItem.length === 0) {
      return NextResponse.json({ 
        error: 'Cart item not found',
        code: 'CART_ITEM_NOT_FOUND' 
      }, { status: 404 });
    }

    // Check stock availability
    if (quantityInt > cartItem[0].product.stock) {
      return NextResponse.json({ 
        error: `Insufficient stock. Available: ${cartItem[0].product.stock}, Requested: ${quantityInt}`,
        code: 'INSUFFICIENT_STOCK' 
      }, { status: 400 });
    }

    // Update quantity
    const updated = await db
      .update(cartItems)
      .set({
        quantity: quantityInt
      })
      .where(eq(cartItems.id, cartItemId))
      .returning();

    // Get updated item with product details
    const updatedWithProduct = await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        product: {
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          image: products.image,
          stock: products.stock,
          category: products.category,
        }
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.id, updated[0].id))
      .limit(1);

    return NextResponse.json(updatedWithProduct[0], { status: 200 });

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
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');

    // Case 1: Delete entire cart for a user (clear cart)
    if (userId && !id && !productId) {
      const deleted = await db
        .delete(cartItems)
        .where(eq(cartItems.userId, userId))
        .returning();

      return NextResponse.json({
        message: 'Cart cleared successfully',
        deletedCount: deleted.length
      }, { status: 200 });
    }

    // Case 2: Delete by cart item ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid cart item ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const cartItemId = parseInt(id);

      // Get cart item details before deleting
      const cartItem = await db
        .select({
          id: cartItems.id,
          userId: cartItems.userId,
          productId: cartItems.productId,
          quantity: cartItems.quantity,
          createdAt: cartItems.createdAt,
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            image: products.image,
            stock: products.stock,
            category: products.category,
          }
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.id, cartItemId))
        .limit(1);

      if (cartItem.length === 0) {
        return NextResponse.json({ 
          error: 'Cart item not found',
          code: 'CART_ITEM_NOT_FOUND' 
        }, { status: 404 });
      }

      await db
        .delete(cartItems)
        .where(eq(cartItems.id, cartItemId));

      return NextResponse.json({
        message: 'Cart item deleted successfully',
        deleted: cartItem[0]
      }, { status: 200 });
    }

    // Case 3: Delete by userId and productId
    if (userId && productId) {
      if (isNaN(parseInt(productId))) {
        return NextResponse.json({ 
          error: 'Valid productId is required',
          code: 'INVALID_PRODUCT_ID' 
        }, { status: 400 });
      }

      const productIdInt = parseInt(productId);

      // Get cart item details before deleting
      const cartItem = await db
        .select({
          id: cartItems.id,
          userId: cartItems.userId,
          productId: cartItems.productId,
          quantity: cartItems.quantity,
          createdAt: cartItems.createdAt,
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            image: products.image,
            stock: products.stock,
            category: products.category,
          }
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(
          and(
            eq(cartItems.userId, userId),
            eq(cartItems.productId, productIdInt)
          )
        )
        .limit(1);

      if (cartItem.length === 0) {
        return NextResponse.json({ 
          error: 'Cart item not found',
          code: 'CART_ITEM_NOT_FOUND' 
        }, { status: 404 });
      }

      await db
        .delete(cartItems)
        .where(
          and(
            eq(cartItems.userId, userId),
            eq(cartItems.productId, productIdInt)
          )
        );

      return NextResponse.json({
        message: 'Cart item deleted successfully',
        deleted: cartItem[0]
      }, { status: 200 });
    }

    // No valid parameters provided
    return NextResponse.json({ 
      error: 'Either id or userId with productId parameters are required',
      code: 'MISSING_PARAMETERS' 
    }, { status: 400 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}