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

    // 2. Tentukan Base Domain Publik (Vercel)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://capshoegrab-7z2u6w3uz-capshoe.vercel.app';

    // 3. Request Payment ke Flip.id / Buat Target Link Struk Publik
    const authHeader = Buffer.from(`${process.env.FLIP_SECRET_KEY || ''}:`).toString('base64');
    
    let targetPaymentUrl = `${baseUrl}/receipt/${orderNumber}`;

    if (process.env.FLIP_SECRET_KEY) {
      try {
        const response = await fetch(`${process.env.FLIP_API_URL || 'https://bigbox_sandbox.flip.id/api/v2'}/pwf/bill`, {
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
        if (flipData.link_url) {
          targetPaymentUrl = flipData.link_url;
        }
      } catch (e) {
        console.error('Flip API Call fallback:', e);
      }
    }

    // 4. Generate QR Code berbasis URL Publik (Bukan Localhost)
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