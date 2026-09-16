import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { storeId, productId, amount } = await req.json();

    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    const store = await prisma.store.findUnique({ where: { id: Number(storeId) } });

    if (!product || !store) {
      return NextResponse.json({ error: 'Produk atau Toko tidak ditemukan' }, { status: 404 });
    }

    const orderNumber = `INV-${Date.now()}`;
    const totalAmount = amount || product.price;
    const commissionRate = store.commissionRate || 15;
    const storeCommissionAmount = (totalAmount * commissionRate) / 100;
    const netSupplierAmount = totalAmount - storeCommissionAmount;

    // 1. Buat Record Order Pending di Supabase dengan field OrderItem yang lengkap
    const order = await prisma.order.create({
      data: {
        orderNumber,
        storeId: store.id,
        totalAmount,
        status: 'PENDING',
        items: {
          create: {
            productId: product.id,
            price: totalAmount,
            storeCommissionRate: commissionRate,
            storeCommissionAmount: storeCommissionAmount,
            netSupplierAmount: netSupplierAmount,
          },
        },
      },
    });

    // 2. Request QR Code Payment ke Flip.id API
    const authHeader = Buffer.from(`${process.env.FLIP_SECRET_KEY}:`).toString('base64');
    const response = await fetch(`${process.env.FLIP_API_URL}/pwf/bill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        title: `Capshoe - ${product.name}`,
        amount: totalAmount.toString(),
        type: 'SINGLE',
        step: '1',
        sender_name: store.name,
        custom_id: orderNumber,
      }),
    });

    const flipData = await response.json();

    const qrImageDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      flipData.link_url || `https://flip.id/pay/${orderNumber}`
    )}`;

    return NextResponse.json({
      success: true,
      orderNumber,
      qrImageDataUrl,
      paymentUrl: flipData.link_url,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}