import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(req: Request) {
  try {
    const { storeId, amount, proofUrl } = await req.json();

    const store = await prisma.store.findUnique({ where: { id: parseInt(storeId) } });
    if (!store) return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 });

    // 1. Catat Transaksi Withdraw
    const withdrawal = await prisma.withdrawal.create({
      data: {
        storeId: parseInt(storeId),
        amount: parseFloat(amount),
        proofUrl: proofUrl || '',
      },
    });

    // 2. Kirim Notifikasi WA ke Mitra
    const message = 
`💸 *NOTIFIKASI PENCAIRAN KOMISI (WITHDRAW)*

Halo *${store.name}*,
Komisi penjualan konsinyasi Anda telah berhasil dicairkan!

💰 *Jumlah Transfer:* Rp ${parseFloat(amount).toLocaleString('id-ID')}
📅 *Tanggal:* ${new Date().toLocaleString('id-ID')}
${proofUrl ? `🖼️ *Bukti Transfer:* ${proofUrl}` : ''}

Terima kasih atas kerja samanya!`;

    await sendWhatsAppMessage(store.phone, message);

    return NextResponse.json({ success: true, withdrawal });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}