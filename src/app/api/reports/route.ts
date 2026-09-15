import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      include: {
        orders: {
          where: { status: 'PAID' },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        inventories: {
          include: {
            product: true,
          },
        },
      },
    });

    const reportData = stores.map((store: any) => {
      let totalGrossSales = 0;
      let totalStoreCommission = 0;
      let totalQty = 0;

      store.orders.forEach((order: any) => {
        order.items.forEach((item: any) => {
          totalGrossSales += item.price;
          totalStoreCommission += item.storeCommissionAmount;
          totalQty += 1;
        });
      });

      const totalStock = store.inventories.reduce(
        (sum: number, inv: any) => sum + inv.stock,
        0
      );

      const stockList = store.inventories.map((inv: any) => ({
        inventoryId: inv.id,
        productId: inv.productId,
        productName: inv.product.name,
        sku: inv.product.sku,
        category: inv.product.category,
        price: inv.product.price,
        stock: inv.stock,
        qrCodeKey: inv.qrCodeKey,
      }));

      return {
        storeId: store.id,
        storeName: store.name,
        owner: store.owner,
        alamat: store.alamat,
        phone: store.phone,
        photoUrl: store.photoUrl,
        commissionRate: store.commissionRate,
        password: store.password,
        totalGrossSales,
        totalStoreCommission,
        totalQty,
        totalStock,
        stockList,
      };
    });

    return NextResponse.json(reportData);
  } catch (err: any) {
    console.error('Error generating reports:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}