import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFlipBill } from '@/lib/flip';

export async function POST(req: Request) {
  try {
    const { qrCodeKey } = await req.json();

    const inventory = await prisma.storeInventory.findUnique({
      where: { qrCodeKey },
      include: { store: true, product: true },
    });

    if (!inventory || inventory.stock <= 0) {
      return NextResponse.json({ error: 'Barang tidak ditemukan atau stok habis' }, { status: 400 });
    }

    const price = inventory.product.price;
    const paymentFee = price * 0.007; // Biaya QRIS 0.7%
    const storeCommissionRate = inventory.store.commissionRate;
    const storeCommissionAmount = price * (storeCommissionRate / 100);
    const netSupplierAmount = price - paymentFee - storeCommissionAmount;
    const orderNumber = `INV-${Date.now()}`;

    // 1. Buat Bill Pembayaran via Flip Payment Gateway
    let paymentUrl = '';
    try {
      const flipBill = await createFlipBill({
        title: `Pembelian ${inventory.product.name} - ${inventory.store.name}`,
        amount: price,
        type: 'SINGLE',
        redirectUrl: `http://localhost:3000/checkout/success?order=${orderNumber}`,
      });
      paymentUrl = flipBill.link_url;
    } catch (err) {
      console.warn('Flip API Sandbox Mode Fallback:', err);
    }

    // 2. Buat Record Transaksi PENDING (Menunggu Pembayaran Flip)
    const order = await prisma.order.create({
      data: {
        orderNumber: orderNumber,
        storeId: inventory.storeId,
        totalAmount: price,
        paymentFee: paymentFee,
        status: 'PENDING',
        items: {
          create: {
            productId: inventory.productId,
            price: price,
            storeCommissionRate: storeCommissionRate,
            storeCommissionAmount: storeCommissionAmount,
            netSupplierAmount: netSupplierAmount,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      order,
      paymentUrl: paymentUrl || `http://localhost:3000/checkout/success?order=${orderNumber}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memproses transaksi' }, { status: 500 });
  }
}