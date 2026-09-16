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

    // 1. Simpan Record Order Pending ke Supabase
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

    // 2. Format Sanitasi API Key & URL Endpoint
    const rawSecretKey = process.env.FLIP_SECRET_KEY || '';
    const secretKey = rawSecretKey.replace(/['"]+/g, '').trim();

    let rawFlipUrl = process.env.FLIP_API_URL || 'https://bigbox-sandbox.flip.id/api/v2';
    // Mengganti underscore yang tidak sengaja terketik di domain sandbox
    rawFlipUrl = rawFlipUrl.replace('bigbox_sandbox', 'bigbox-sandbox').replace(/[\[\]'"]+/g, '').trim();
    if (rawFlipUrl.endsWith('/')) {
      rawFlipUrl = rawFlipUrl.slice(0, -1);
    }

    if (!secretKey) {
      return NextResponse.json(
        { error: 'FLIP_SECRET_KEY belum dikonfigurasi di Vercel Environment Variables' },
        { status: 400 }
      );
    }

    const targetEndpoint = `${rawFlipUrl}/pwf/bill`;
    const authHeader = Buffer.from(`${secretKey}:`).toString('base64');

    // 3. Eksekusi Request HTTP dengan Penanganan SSL/Network Timeout
    const response = await fetch(targetEndpoint, {
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
      console.error('Flip API Error Response:', flipData);
      return NextResponse.json(
        { error: `Flip API Response: ${flipData.message || JSON.stringify(flipData)}` },
        { status: 400 }
      );
    }

    const targetPaymentUrl = flipData.link_url;

    // 4. Generate QR Code ke Payment Link Resmi Flip
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
    console.error('Fetch Error:', err);
    return NextResponse.json({ error: `Fetch Error: ${err.message || 'Gagal terhubung ke Flip API'}` }, { status: 500 });
  }
}