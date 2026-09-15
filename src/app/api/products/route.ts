import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET ALL PRODUCTS DARI SUPABASE
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(products);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// SIMPAN PRODUK BARU KE SUPABASE
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sku, name, category, price, photoUrl } = body;

    const newProduct = await prisma.product.create({
      data: {
        sku,
        name,
        category: category || 'TOPI',
        price: parseFloat(price),
        photoUrl: photoUrl || null,
      },
    });

    // Otomatis alokasikan inventoris ke seluruh toko mitra yang ada di Supabase
    const allStores = await prisma.store.findMany();
    for (const store of allStores) {
      await prisma.storeInventory.create({
        data: {
          storeId: store.id,
          productId: newProduct.id,
          stock: 10, // Default stok awal
          qrCodeKey: `QR-${store.id}-${newProduct.id}-${Date.now()}`,
        },
      });
    }

    return NextResponse.json(newProduct);
  } catch (err: any) {
    console.error('Error insert product to Supabase:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}