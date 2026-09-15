import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const params = new URLSearchParams(bodyText);
    const dataJson = params.get('data');

    if (!dataJson) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 400 });
    }

    const payload = JSON.parse(dataJson);

    // Cek Validation Token Flip untuk keamanan
    const validationToken = process.env.FLIP_VALIDATION_TOKEN;
    if (validationToken && payload.token !== validationToken) {
      return NextResponse.json({ error: 'Token validasi tidak cocok' }, { status: 403 });
    }

    // Jika Status Pembayaran Lunas (SUCCESS)
    if (payload.status === 'SUCCESS') {
      const billId = payload.bill_link_id;

      // Cari order berdasarkan reference/orderNumber
      const order = await prisma.order.findFirst({
        where: { orderNumber: { contains: String(billId) } },
        include: { store: true, items: { include: { product: true } } },
      });

      if (order && order.status !== 'PAID') {
        // 1. Update Status Order -> PAID
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'PAID' },
        });

        // 2. Potong Stok Inventory Toko
        const item = order.items[0];
        const inventory = await prisma.storeInventory.findFirst({
          where: { storeId: order.storeId, productId: item.productId },
        });

        if (inventory) {
          const updatedInv = await prisma.storeInventory.update({
            where: { id: inventory.id },
            data: { stock: Math.max(0, inventory.stock - 1) },
          });

          // 3. Kirim WA Notifikasi ke Toko & Admin
          const storePhone = order.store.phone;
          const adminPhone = process.env.ADMIN_WA_PHONE || storePhone;

          const partnerMessage = `🛍️ *NOTIFIKASI PENJUALAN FLIP.ID*\n\nAda pembayaran lunas via QRIS/Flip!\nProduk: ${item.product.name}\nTotal: Rp ${order.totalAmount.toLocaleString('id-ID')}\nSisa Stok: ${updatedInv.stock} Pcs`;

          await sendWhatsAppMessage(storePhone, partnerMessage);
          await sendWhatsAppMessage(adminPhone, partnerMessage);

          // 4. Log ke Google Sheets
          const sheetsWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
          if (sheetsWebhookUrl) {
            fetch(sheetsWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderNumber: order.orderNumber,
                storeName: order.store.name,
                productName: item.product.name,
                totalAmount: order.totalAmount,
                paymentFee: order.paymentFee,
                storeCommission: item.storeCommissionAmount,
                netSupplier: item.netSupplierAmount,
              }),
            }).catch((err) => console.error('Gagal log Sheets:', err));
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err: any) {
    console.error('Callback Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}