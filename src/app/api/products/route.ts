import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const products = await prisma.product.findMany();
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product = await prisma.product.create({
      data: {
        sku: body.sku,
        name: body.name,
        price: parseFloat(body.price),
      },
    });

    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_PRODUCT',
          sku: product.sku,
          name: product.name,
          price: product.price,
          category: body.category || 'Umum',
        }),
      }).catch((err) => console.error('Gagal sync Google Sheets:', err));
    }

    return NextResponse.json(product);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const product = await prisma.product.update({
      where: { id: parseInt(body.id) },
      data: {
        sku: body.sku,
        name: body.name,
        price: parseFloat(body.price),
      },
    });

    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_PRODUCT',
          sku: product.sku,
          name: product.name,
          price: product.price,
          category: body.category || 'Umum',
        }),
      }).catch((err) => console.error('Gagal sync Google Sheets:', err));
    }

    return NextResponse.json(product);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const sku = searchParams.get('sku');

    if (!id) return NextResponse.json({ error: 'ID dibutuhkan' }, { status: 400 });

    await prisma.product.delete({
      where: { id: parseInt(id) },
    });

    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (webhookUrl && sku) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_PRODUCT',
          sku: sku,
        }),
      }).catch((err) => console.error('Gagal sync Google Sheets:', err));
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}