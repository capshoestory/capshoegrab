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

    // 1. Buat Record Order Pending di Supabase
    await prisma.order.create({
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

    const secretKey = process.env.FLIP_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: 'FLIP_SECRET_KEY belum dipasang di Vercel Environment Variables' },
        { status: 400 }
      );
    }

    // 2. Request Link Pembayaran ke Flip.id API
    const authHeader = Buffer.from(`${secretKey}:`).toString('base64');
    const flipApiUrl = process.env.FLIP_API_URL || 'https://bigbox_sandbox.flip.id/api/v2';

    const response = await fetch(`${flipApiUrl}/pwf/bill`, {
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

    if (!response.ok || !flipData.link_url) {
      console.error('Flip Response Error:', flipData);
      return NextResponse.json(
        { error: `Gagal dari Flip API: ${flipData.message || JSON.stringify(flipData)}` },
        { status: 400 }
      );
    }

    const targetPaymentUrl = flipData.link_url;

    // 3. QR Code Mengarah 100% ke Payment Link Flip.id
    const qrImageDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      targetPaymentUrl
    )}`;

    return NextResponse.json({
      success: true,
      orderNumber,
      qrImageDataUrl,
      paymentUrl: targetPaymentUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}