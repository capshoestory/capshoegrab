import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { amount, customerName, customerEmail, title } = await req.json();

    const secretKey = process.env.FLIP_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'FLIP_SECRET_KEY belum diatur' }, { status: 500 });
    }

    // Auth header menggunakan Basic Auth (Secret Key diencode ke Base64)
    const encodedKey = Buffer.from(`${secretKey}:`).toString('base64');

    const response = await fetch('https://bigflip.id/api/v2/pwf/bill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${encodedKey}`,
      },
      body: new URLSearchParams({
        title: title || 'Pembayaran Capshoe Grab',
        amount: amount.toString(),
        type: 'SINGLE',
        step: 'PRE_PAYMENT',
        sender_name: customerName || 'Pelanggan',
        sender_email: customerEmail || 'customer@capshoe.com',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Gagal membuat bill Flip' }, { status: response.status });
    }

    // Mengembalikan URL payment (link QRIS / Transfer dari Flip)
    return NextResponse.json({
      success: true,
      paymentUrl: data.link_url,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}