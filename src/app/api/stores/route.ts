import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const stores = await prisma.store.findMany();
  return NextResponse.json(stores);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const store = await prisma.store.create({
      data: {
        name: body.name,
        commissionRate: parseFloat(body.commissionRate),
        phone: body.phone,
      },
    });

    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_STORE',
          id: store.id.toString(),
          name: store.name,
          commissionRate: store.commissionRate,
          phone: store.phone,
        }),
      }).catch((err) => console.error('Gagal sync Google Sheets:', err));
    }

    return NextResponse.json(store);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const store = await prisma.store.update({
      where: { id: parseInt(body.id) },
      data: {
        name: body.name,
        commissionRate: parseFloat(body.commissionRate),
        phone: body.phone,
      },
    });

    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STORE',
          id: store.id.toString(),
          name: store.name,
          commissionRate: store.commissionRate,
          phone: store.phone,
        }),
      }).catch((err) => console.error('Gagal sync Google Sheets:', err));
    }

    return NextResponse.json(store);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID dibutuhkan' }, { status: 400 });

    await prisma.store.delete({
      where: { id: parseInt(id) },
    });

    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_STORE',
          id: id,
        }),
      }).catch((err) => console.error('Gagal sync Google Sheets:', err));
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}