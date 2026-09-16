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

    // 2. Tentukan URL Tujuan (Direct ke Flip.id API atau Direct Struk)
    let targetPaymentUrl = `https://capshoegrab.vercel.app/receipt/${orderNumber}`;

    // 3. Panggil API Flip.id jika Secret Key tersedia
    if (process.env.FLIP_SECRET_KEY) {
      try {
        const authHeader = Buffer.from(`${process.env.FLIP_SECRET_KEY}:`).toString('base64');
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
        if (flipData && flipData.link_url) {
          // Direct URL Payment Gateway Flip.id Asli
          targetPaymentUrl = flipData.link_url;
        }
      } catch (e) {
        console.error('Flip API Error fallback:', e);
      }
    }

    // 4. Generate QR Code Unik Berdasarkan Payment URL Resmi Flip.id
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