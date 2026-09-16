import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(stores);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, owner, alamat, commissionRate, password, photoUrl, username } = body;

    // 1. SIMPAN LANGSUNG KE SUPABASE
    const newStore = await prisma.store.create({
      data: {
        name,
        phone: phone || '',
        owner: owner || '',
        alamat: alamat || '',
        commissionRate: commissionRate ? Number(commissionRate) : 15.0,
        password: password || '123456',
        photoUrl: photoUrl || null,
        username: username || name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
      },
    });

    // 2. KIRIM DARI SERVER KE GOOGLE SHEETS WEBHOOK (ANTI-CORS BLOCKED)
    const sheetsWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL;
    if (sheetsWebhookUrl) {
      await fetch(sheetsWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_MITRA',
          id: newStore.id,
          name: newStore.name,
          owner: newStore.owner,
          alamat: newStore.alamat,
          phone: newStore.phone,
          commissionRate: newStore.commissionRate,
          password: newStore.password,
        }),
      }).catch((err) => console.error('Error sync Google Sheets from Server:', err));
    }

    return NextResponse.json(newStore);
  } catch (err: any) {
    console.error('Error create store:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}