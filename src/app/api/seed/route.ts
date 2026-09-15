import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const store = await prisma.store.findFirst();
    const product = await prisma.product.findFirst();

    if (!store || !product) {
      return NextResponse.json(
        { error: 'Harap isi Toko dan Produk terlebih dahulu via Dashboard!' },
        { status: 400 }
      );
    }

    const inventory = await prisma.storeInventory.upsert({
      where: { qrCodeKey: 'QR-DEMO-001' },
      update: { stock: 10 },
      create: {
        storeId: store.id,
        productId: product.id,
        qrCodeKey: 'QR-DEMO-001',
        stock: 10,
      },
    });

    return NextResponse.json({
      message: 'Berhasil membuat data stok & QR Code dummy!',
      inventory,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}