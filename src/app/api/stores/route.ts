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
    console.error('Error create store:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, phone, owner, alamat, commissionRate, password, photoUrl } = body;

    const updatedStore = await prisma.store.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(owner && { owner }),
        ...(alamat && { alamat }),
        ...(commissionRate !== undefined && { commissionRate: Number(commissionRate) }),
        ...(password && { password }),
        ...(photoUrl !== undefined && { photoUrl }),
      },
    });

    return NextResponse.json(updatedStore);
  } catch (err: any) {
    console.error('Error update store:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}