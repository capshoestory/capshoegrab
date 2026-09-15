import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

export async function POST(req: Request) {
  try {
    const { storeId, productId, stock } = await req.json();

    const qrCodeKey = `QR-${storeId}-${productId}-${Date.now().toString().slice(-4)}`;

    const inventory = await prisma.storeInventory.create({
      data: {
        storeId: parseInt(storeId),
        productId: parseInt(productId),
        qrCodeKey,
        stock: parseInt(stock),
      },
      include: {
        store: true,
        product: true,
      },
    });

    // Buat URL checkout yang tertanam di QR Code
    // Buat URL checkout yang tertanam di QR Code
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://capshoe.vercel.app';
    const checkoutUrl = `${baseUrl}/checkout/${qrCodeKey}`;
    const qrImageDataUrl = await QRCode.toDataURL(checkoutUrl, { width: 300 });

    return NextResponse.json({
      success: true,
      inventory,
      checkoutUrl,
      qrImageDataUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal membuat QR Code' }, { status: 500 });
  }
}