import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, like, or, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Single product by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, parseInt(id)))
        .limit(1);

      if (product.length === 0) {
        return NextResponse.json(
          { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(product[0], { status: 200 });
    }

    // List products with filters
    let query = db.select().from(products);
    const conditions = [];

    // Category filter
    if (category) {
      conditions.push(eq(products.category, category));
    }

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.description, `%${search}%`)
        )
      );
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    // Apply pagination and ordering
    const results = await query
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, image, category, stock } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json(
        { error: 'Description is required and must be a non-empty string', code: 'INVALID_DESCRIPTION' },
        { status: 400 }
      );
    }

    if (!price || typeof price !== 'number' || price <= 0 || !Number.isInteger(price)) {
      return NextResponse.json(
        { error: 'Price is required and must be a positive integer (in cents)', code: 'INVALID_PRICE' },
        { status: 400 }
      );
    }

    if (!image || typeof image !== 'string' || image.trim() === '') {
      return NextResponse.json(
        { error: 'Image URL is required and must be a non-empty string', code: 'INVALID_IMAGE' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string' || category.trim() === '') {
      return NextResponse.json(
        { error: 'Category is required and must be a non-empty string', code: 'INVALID_CATEGORY' },
        { status: 400 }
      );
    }

    // Validate optional stock field
    if (stock !== undefined && (typeof stock !== 'number' || stock < 0 || !Number.isInteger(stock))) {
      return NextResponse.json(
        { error: 'Stock must be a non-negative integer if provided', code: 'INVALID_STOCK' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = name.trim();
    const sanitizedDescription = description.trim();
    const sanitizedImage = image.trim();
    const sanitizedCategory = category.trim();

    // Create new product
    const newProduct = await db
      .insert(products)
      .values({
        name: sanitizedName,
        description: sanitizedDescription,
        price,
        image: sanitizedImage,
        category: sanitizedCategory,
        stock: stock !== undefined ? stock : 100,
        createdAt: new Date()
      })
      .returning();

    return NextResponse.json(newProduct[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, parseInt(id)))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, price, image, category, stock } = body;

    // Validate fields if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json(
        { error: 'Name must be a non-empty string if provided', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (description !== undefined && (typeof description !== 'string' || description.trim() === '')) {
      return NextResponse.json(
        { error: 'Description must be a non-empty string if provided', code: 'INVALID_DESCRIPTION' },
        { status: 400 }
      );
    }

    if (price !== undefined && (typeof price !== 'number' || price <= 0 || !Number.isInteger(price))) {
      return NextResponse.json(
        { error: 'Price must be a positive integer (in cents) if provided', code: 'INVALID_PRICE' },
        { status: 400 }
      );
    }

    if (image !== undefined && (typeof image !== 'string' || image.trim() === '')) {
      return NextResponse.json(
        { error: 'Image URL must be a non-empty string if provided', code: 'INVALID_IMAGE' },
        { status: 400 }
      );
    }

    if (category !== undefined && (typeof category !== 'string' || category.trim() === '')) {
      return NextResponse.json(
        { error: 'Category must be a non-empty string if provided', code: 'INVALID_CATEGORY' },
        { status: 400 }
      );
    }

    if (stock !== undefined && (typeof stock !== 'number' || stock < 0 || !Number.isInteger(stock))) {
      return NextResponse.json(
        { error: 'Stock must be a non-negative integer if provided', code: 'INVALID_STOCK' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (price !== undefined) updates.price = price;
    if (image !== undefined) updates.image = image.trim();
    if (category !== undefined) updates.category = category.trim();
    if (stock !== undefined) updates.stock = stock;

    // Update product
    const updatedProduct = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedProduct[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, parseInt(id)))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete product
    const deletedProduct = await db
      .delete(products)
      .where(eq(products.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Product deleted successfully',
        product: deletedProduct[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}