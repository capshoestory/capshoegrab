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
      return NextResponse.json(
        { error: 'Produk tidak ditemukan atau stok habis di toko ini.' },
        { status: 400 }
      );
    }

    const price = inventory.product.price;
    const paymentFee = price * 0.007; // Biaya QRIS 0.7%
    const storeCommissionRate = inventory.store.commissionRate;
    const storeCommissionAmount = price * (storeCommissionRate / 100);
    const netSupplierAmount = price - paymentFee - storeCommissionAmount;
    const orderNumber = `INV-${Date.now()}`;

    // Base URL Domain Publik Vercel
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://capshoegrab.vercel.app';

    // Buat Tagihan Langsung ke Flip.id
    const flipBill = await createFlipBill({
      title: `${inventory.product.name} - ${inventory.store.name}`,
      amount: price,
      type: 'SINGLE',
      redirectUrl: `${baseUrl}/checkout/success?order=${orderNumber}`,
    });

    // Simpan Transaksi Pending
    await prisma.order.create({
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
      paymentUrl: flipBill.link_url, // URL Halaman Pembayaran Flip.id
    });
  } catch (err: any) {
    console.error('Error Checkout Flip:', err);
    return NextResponse.json({ error: err.message || 'Gagal membuat tagihan pembayaran' }, { status: 500 });
  }
}