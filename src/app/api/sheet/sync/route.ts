import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, type, data, secretToken } = body;

    // Verifikasi Keamanan (Token Rahasia)
    const SECRET_KEY = process.env.SHEETS_SYNC_SECRET || 'capshoe-secret-123';
    if (secretToken !== SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized token' }, { status: 401 });
    }

    // 1. UPDATE / SYNC STOK INVENTORY TOKO MITRA
    if (type === 'INVENTORY_UPDATE') {
      const { storeId, productId, stock } = data;

      const updatedInventory = await prisma.storeInventory.updateMany({
        where: {
          storeId: Number(storeId),
          productId: Number(productId),
        },
        data: {
          stock: Number(stock),
        },
      });

      return NextResponse.json({ success: true, updatedInventory });
    }

    // 2. UPDATE / SYNC NAMA PRODUK ATAU HARGA
    if (type === 'PRODUCT_UPDATE') {
      const { productId, sku, name, price, category } = data;

      const updatedProduct = await prisma.product.update({
        where: { id: Number(productId) },
        data: {
          ...(sku && { sku }),
          ...(name && { name }),
          ...(price && { price: Number(price) }),
          ...(category && { category }),
        },
      });

      return NextResponse.json({ success: true, updatedProduct });
    }

    return NextResponse.json({ error: 'Action type tidak dikenali' }, { status: 400 });
  } catch (err: any) {
    console.error('Error Sync from Google Sheets:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}