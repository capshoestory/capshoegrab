import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validasi token keamanan Flip.id
    if (body.token !== process.env.FLIP_VALIDATION_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized token' }, { status: 401 });
    }

    const data = JSON.parse(body.data);

    if (data.status === 'SUCCESSFUL') {
      const orderNumber = data.custom_id;

      // 1. UPDATE STATUS TRANSAKSI DI SUPABASE
      const order = await prisma.order.update({
        where: { orderNumber },
        include: {
          store: true,
          items: {
            include: { product: true },
          },
        },
        data: { status: 'PAID' },
      });

      // 2. POTONG STOK TOKO MITRA DI SUPABASE & SINKRON KE GOOGLE SHEETS
      for (const item of order.items) {
        await prisma.storeInventory.updateMany({
          where: { storeId: order.storeId, productId: item.productId },
          data: { stock: { decrement: 1 } },
        });

        // Push Transaksi Real-time ke Google Sheets Webhook
        const sheetsWebhookUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL;
        if (sheetsWebhookUrl) {
          fetch(sheetsWebhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'NEW_SALE',
              orderNumber: order.orderNumber,
              storeId: order.storeId,
              storeName: order.store.name,
              sku: item.product.sku,
              productName: item.product.name,
              price: item.price,
              commissionRate: order.store.commissionRate,
            }),
          }).catch(console.error);
        }
      }

      // 3. LOGGING NOTIFIKASI WA ADMIN & MITRA
      const adminWa = process.env.ADMIN_WA_PHONE || '6285924761500';
      const notifMsg = `*PEMBAYARAN BERHASIL (CAPSHOE GRAB)*\nNo Invoice: ${order.orderNumber}\nToko: ${order.store.name}\nTotal: IDR ${order.totalAmount.toLocaleString('id-ID')}`;

      console.log(`[WA NOTIF SENT TO ADMIN ${adminWa} & MITRA ${order.store.phone}]: ${notifMsg}`);
    }

    return NextResponse.json({ status: 'OK' });
  } catch (err: any) {
    console.error('Error processing Flip Callback:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}