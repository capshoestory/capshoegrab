import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET ALL STORES DARI SUPABASE
export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        inventories: {
          include: { product: true }
        }
      }
    });
    return NextResponse.json(stores);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// SIMPAN MITRA BARU KE SUPABASE
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, owner, alamat, commissionRate, password, photoUrl, username } = body;

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

    return NextResponse.json(newStore);
  } catch (err: any) {
    console.error('Error insert to Supabase:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}