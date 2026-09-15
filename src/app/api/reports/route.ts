import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      include: {
        inventories: {
          include: {
            product: true,
          },
        },
        orders: {
          where: { status: 'PAID' },
          include: {
            items: true,
          },
        },
        withdrawals: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const reportData = stores.map((store) => {
      let totalQty = 0;
      let totalGrossSales = 0;
      let totalQrisFee = 0;
      let totalStoreCommission = 0;
      let totalNetSupplier = 0;

      store.orders.forEach((order) => {
        totalGrossSales += order.totalAmount;
        totalQrisFee += order.paymentFee;

        order.items.forEach((item) => {
          totalQty += 1;
          totalStoreCommission += item.storeCommissionAmount;
          totalNetSupplier += item.netSupplierAmount;
        });
      });

      // Total nominal yang sudah ditarik/dicairkan
      const totalWithdrawn = store.withdrawals.reduce((sum, w) => sum + w.amount, 0);
      const remainingCommission = totalStoreCommission - totalWithdrawn;

      // Cek sisa stok & reminder limited stock (< 5 pcs)
      const stockList = store.inventories.map((inv) => ({
        inventoryId: inv.id,
        productId: inv.productId,
        productName: inv.product.name,
        sku: inv.product.sku,
        price: inv.product.price,
        stock: inv.stock,
        isLowStock: inv.stock < 5,
      }));

      const lowStockCount = stockList.filter((s) => s.isLowStock).length;

      return {
        storeId: store.id,
        storeName: store.name,
        commissionRate: store.commissionRate,
        phone: store.phone,
        username: store.username,
        password: store.password,
        totalQty,
        totalGrossSales,
        totalQrisFee,
        totalStoreCommission,
        totalWithdrawn,
        remainingCommission,
        totalNetSupplier,
        stockList,
        lowStockCount,
        withdrawals: store.withdrawals,
      };
    });

    return NextResponse.json(reportData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal mengambil laporan' }, { status: 500 });
  }
}