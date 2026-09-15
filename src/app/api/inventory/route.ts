import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

export async function POST(req: Request) {
  try {
    const { storeId, productId, stockToAdd } = await req.json();

    const numericStoreId = parseInt(storeId);
    const numericProductId = parseInt(productId);
    const addedStock = parseInt(stockToAdd) || 1;

    // Cek apakah inventory sudah ada
    let inventory = await prisma.storeInventory.findFirst({
      where: {
        storeId: numericStoreId,
        productId: numericProductId,
      },
    });

    if (inventory) {
      // Update stok
      inventory = await prisma.storeInventory.update({
        where: { id: inventory.id },
        data: { stock: inventory.stock + addedStock },
      });
    } else {
      // Buat inventory baru + QR Key Unik
      const qrKey = `QR-${numericStoreId}-${numericProductId}-${Date.now().toString().slice(-4)}`;
      inventory = await prisma.storeInventory.create({
        data: {
          storeId: numericStoreId,
          productId: numericProductId,
          stock: addedStock,
          qrCodeKey: qrKey,
        },
      });
    }

    // Generate QR Image Data URL (Direct Link to Checkout Page)
    const checkoutUrl = `http://localhost:3000/checkout/${inventory.qrCodeKey}`;
    const qrImageDataUrl = await QRCode.toDataURL(checkoutUrl);

    return NextResponse.json({
      success: true,
      inventory,
      checkoutUrl,
      qrImageDataUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}