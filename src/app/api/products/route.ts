import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sku, name, category, price, stock, photoUrl } = body;

    // 1. SIMPAN LANGSUNG KE SUPABASE
    const newProduct = await prisma.product.create({
      data: {
        sku,
        name,
        category: category || 'TOPI',
        price: parseFloat(price),
        photoUrl: photoUrl || null,
      },
    });

    // Alokasikan ke seluruh toko mitra di Supabase
    const allStores = await prisma.store.findMany();
    for (const store of allStores) {
      await prisma.storeInventory.create({
        data: {
          storeId: store.id,
          productId: newProduct.id,
          stock: stock ? Number(stock) : 10,
          qrCodeKey: `QR-${store.id}-${newProduct.id}-${Date.now()}`,
        },
      });
    }

    // 2. KIRIM DARI SERVER KE GOOGLE SHEETS WEBHOOK
    const sheetsWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL;
    if (sheetsWebhookUrl) {
      await fetch(sheetsWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_PRODUCT',
          sku: newProduct.sku,
          name: newProduct.name,
          category: newProduct.category,
          price: newProduct.price,
          stock: stock || 10,
        }),
      }).catch((err) => console.error('Error sync Google Sheets from Server:', err));
    }

    return NextResponse.json(newProduct);
  } catch (err: any) {
    console.error('Error insert product:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}