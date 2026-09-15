import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.token !== process.env.FLIP_VALIDATION_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized token' }, { status: 401 });
    }

    const data = JSON.parse(body.data);

    if (data.status === 'SUCCESSFUL') {
      const orderNumber = data.custom_id;

      const order = await prisma.order.update({
        where: { orderNumber },
        include: { store: true, items: { include: { product: true } } },
        data: { status: 'PAID' },
      });

      for (const item of order.items) {
        await prisma.storeInventory.updateMany({
          where: { storeId: order.storeId, productId: item.productId },
          data: { stock: { decrement: 1 } },
        });

        const sheetsWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
        if (sheetsWebhookUrl) {
          fetch(sheetsWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'NEW_SALE',
              orderNumber: order.orderNumber,
              storeName: order.store.name,
              productName: item.product.name,
              price: item.price,
              date: new Date().toISOString(),
            }),
          }).catch(console.error);
        }
      }

      // NOMOR WA ADMIN
      const adminWa = process.env.ADMIN_WA_PHONE || '6285924761500';
      const notifMsg = `*PEMBAYARAN BERHASIL (CAPSHOE GRAB)*\nNo Invoice: ${order.orderNumber}\nToko: ${order.store.name}\nTotal: IDR ${order.totalAmount.toLocaleString('id-ID')}`;

      console.log(`[WA NOTIF SENT TO ADMIN ${adminWa} & MITRA ${order.store.phone}]: ${notifMsg}`);
    }

    return NextResponse.json({ status: 'OK' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}