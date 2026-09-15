'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function MitraDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;

  const [storeData, setStoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const fetchStoreData = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (Array.isArray(data)) {
        const myStore = data.find((s: any) => s.storeId.toString() === storeId);
        setStoreData(myStore);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, [storeId]);

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    localStorage.removeItem('mitra_store_id');
    router.push('/');
  };

  // ORDER STOCK VIA WA ADMIN
  const handleOrderStockWA = (productName: string, sku: string, currentStock: number) => {
    const adminPhone = '6281234567890'; // Sesuaikan nomor WA Admin
    const message = `Halo Admin, kami dari *${storeData?.storeName}* ingin melakukan *ORDER STOCK* (Stok Menipis):%0A%0A📦 *Nama Produk:* ${productName}%0A🏷️ *SKU:* ${sku}%0A📊 *Sisa Stok Saat Ini:* ${currentStock} Pcs%0A%0AMohon bantuan pengiriman penambahan stok. Terima kasih!`;
    window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');
  };

  // AJUKAN PENARIKAN VIA WA ADMIN
  const handleAjukanPenarikanWA = () => {
    const adminPhone = '6281234567890';
    const remainingProfit = storeData?.remainingCommission || storeData?.totalStoreCommission || 0;
    const message = `Halo Admin, kami dari *${storeData?.storeName}* ingin *MENGAJUKAN PENARIKAN / WITHDRAW PROFIT SHARING*:%0A%0A💰 *Nominal Komisi:* IDR ${remainingProfit.toLocaleString('id-ID')}%0A%0AMohon konfirmasi pencairan dan pengiriman bukti transfer. Terima kasih!`;
    window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ECE9E2] flex items-center justify-center text-xs tracking-[0.2em] uppercase text-[#7A7568]">
        Memuat Dashboard Mitra...
      </div>
    );
  }

  // Filter Stock List
  const stockList = storeData?.stockList || [];
  const filteredStock = stockList.filter(
    (item: any) =>
      selectedCategory === 'ALL' ||
      (item.category || 'TOPI').toUpperCase() === selectedCategory.toUpperCase()
  );

  const totalStockCount = stockList.reduce((sum: number, i: any) => sum + i.stock, 0);
  const totalVariants = stockList.length;

  return (
    <div className="min-h-screen bg-[#ECE9E2] text-[#4A4741] font-sans antialiased pb-20 selection:bg-[#B3A898] selection:text-white">
      
      {/* HEADER LOGO & LOG OUT (TANPA TAB NAVIGASI KHUSUS MITRA) */}
      <header className="bg-[#D3CFC3] px-6 py-4 border-b border-[#C3BFAF] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-[#7A7568] rounded-t-full flex items-center justify-center">
            <span className="text-[10px] tracking-tighter text-[#7A7568] font-serif">CS</span>
          </div>
          <div>
            <h1 className="font-serif tracking-[0.25em] text-sm uppercase text-[#4A4741] font-medium leading-tight">
              Capshoe
            </h1>
            <h1 className="font-serif tracking-[0.3em] text-xs uppercase text-[#7A7568] font-light leading-tight">
              Grab
            </h1>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs uppercase tracking-[0.2em] font-medium text-[#686356] hover:text-[#2C2A25] transition"
        >
          Log Out
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-10 space-y-12">

        {/* WELCOME BANNER */}
        <div className="text-center space-y-1">
          <h2 className="font-serif text-sm tracking-[0.25em] uppercase text-[#635F54] font-medium">
            Selamat Datang Di Halaman
          </h2>
          <h2 className="font-serif text-sm tracking-[0.25em] uppercase text-[#635F54] font-medium">
            Dashboard Mitra.
          </h2>
        </div>

        {/* 4 METRIC CARDS SUMMARY */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 text-center min-h-[140px] flex flex-col justify-between shadow-xs">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#736E60] font-medium">Total Stock</p>
            <p className="font-serif text-3xl font-light text-[#3D3A34]">{totalStockCount}</p>
            <div></div>
          </div>

          <div className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 text-center min-h-[140px] flex flex-col justify-between shadow-xs">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#736E60] font-medium">Total Varian Produk</p>
            <p className="font-serif text-3xl font-light text-[#3D3A34]">{totalVariants}</p>
            <div></div>
          </div>

          <div className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 text-center min-h-[140px] flex flex-col justify-between shadow-xs">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#736E60] font-medium">Terjual Bulan Ini</p>
            <p className="font-serif text-3xl font-light text-[#3D3A34]">{storeData?.totalQty || 0}</p>
            <div></div>
          </div>

          <div className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 text-center min-h-[140px] flex flex-col justify-between shadow-xs">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#736E60] font-medium">Profit Sharing</p>
            <div className="space-y-0.5">
              <p className="text-[9px] tracking-[0.15em] text-[#736E60] font-mono uppercase">IDR.</p>
              <p className="font-serif text-lg font-semibold text-[#3D3A34]">
                {(storeData?.totalStoreCommission || 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div></div>
          </div>
        </div>

        {/* BUTTON: AJUKAN PENARIKAN */}
        <div className="text-center">
          <button
            onClick={handleAjukanPenarikanWA}
            className="bg-[#965848] hover:bg-[#80483C] text-white px-10 py-3 text-xs tracking-[0.25em] uppercase font-medium transition shadow-xs"
          >
            Ajukan Penarikan
          </button>
        </div>

        {/* SECTION TITLE: STOCK TOKO */}
        <div className="text-center pt-4">
          <h2 className="font-serif text-base tracking-[0.3em] uppercase text-[#3D3A34] font-medium">
            Stock Toko
          </h2>
        </div>

        {/* SHORT BY CATEGORY & NAVIGATION INDICATORS */}
        <div className="flex justify-between items-center text-[10px] tracking-[0.15em] uppercase text-[#4A4741] font-medium px-1">
          <div className="flex items-center gap-3">
            <span>Short By Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#ECE9E2] border border-[#B3AE9F] p-1.5 text-[10px] tracking-[0.15em] uppercase outline-none font-semibold"
            >
              <option value="ALL">ALL CATEGORIES</option>
              <option value="TOPI">TOPI</option>
              <option value="PAKAIAN">PAKAIAN</option>
              <option value="AKSESORIS">AKSESORIS</option>
              <option value="SEPATU">SEPATU</option>
              <option value="UMUM">UMUM</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-[#7A7568]">
            <span>UP</span>
            <span className="text-sm font-bold">▲</span>
          </div>
        </div>

        {/* TABLE HEADER LABELS */}
        <div className="hidden sm:grid grid-cols-12 gap-2 text-center text-[9px] tracking-[0.15em] uppercase text-[#7A7568] px-4 font-medium">
          <div className="col-span-2 text-left">Photo</div>
          <div className="col-span-2">SKU</div>
          <div className="col-span-3">Nama Product</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-1">Stock</div>
          <div className="col-span-2 text-right">Price</div>
        </div>

        {/* LISTING STOCK TOKO ITEMS WITH RED BUTTON FOR LOW STOCK */}
        <div className="space-y-4">
          {filteredStock.length === 0 ? (
            <div className="border border-[#B3AE9F] bg-[#ECE9E2] p-8 text-center text-xs tracking-[0.15em] uppercase text-[#7A7568]">
              Tidak ada produk dialokasikan ke toko ini.
            </div>
          ) : (
            filteredStock.map((item: any) => {
              const isLowStock = item.stock < 5;

              return (
                <div
                  key={item.inventoryId}
                  className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs"
                >
                  {/* Photo Thumbnail */}
                  <div className="w-16 h-16 bg-[#D8D4C8] border border-[#C0BBB0] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&auto=format&fit=crop&q=60"
                      alt={item.productName}
                      className="w-full h-full object-cover grayscale opacity-90"
                    />
                  </div>

                  {/* Stock Details Grid */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-2 w-full text-center text-xs font-mono">
                    <div className="bg-[#E2DDD3] p-2 border border-[#D0CAB9] uppercase">
                      <p className="text-[7px] text-[#7A7568] sm:hidden">SKU</p>
                      {item.sku || 'TOP-01'}
                    </div>

                    <div className="bg-[#E2DDD3] p-2 border border-[#D0CAB9] uppercase font-sans font-medium text-[11px]">
                      <p className="text-[7px] text-[#7A7568] sm:hidden">NAMA</p>
                      {item.productName}
                    </div>

                    <div className="bg-[#E2DDD3] p-2 border border-[#D0CAB9] uppercase text-[11px]">
                      <p className="text-[7px] text-[#7A7568] sm:hidden">CATEGORY</p>
                      {item.category || 'TOPI'}
                    </div>

                    <div className={`bg-[#E2DDD3] p-2 border border-[#D0CAB9] font-bold ${isLowStock ? 'text-red-600' : 'text-[#3D3A34]'}`}>
                      <p className="text-[7px] text-[#7A7568] sm:hidden">STOCK</p>
                      {item.stock}
                    </div>

                    <div className="bg-[#E2DDD3] p-2 border border-[#D0CAB9] font-sans font-semibold text-[11px] col-span-2 sm:col-span-1">
                      <p className="text-[7px] text-[#7A7568] sm:hidden">PRICE</p>
                      IDR. {item.price ? item.price.toLocaleString('id-ID') : '300.000'}
                    </div>
                  </div>

                  {/* ORDER STOCK BUTTON (TOMBOL MERAH TERANG JIKA STOK < 5) */}
                  <button
                    onClick={() => handleOrderStockWA(item.productName, item.sku, item.stock)}
                    className={`w-full sm:w-auto px-6 py-2.5 text-[9px] tracking-[0.2em] uppercase font-bold transition shadow-xs ${
                      isLowStock
                        ? 'bg-[#FF3B30] hover:bg-[#E02D22] text-white animate-pulse'
                        : 'bg-[#965848] hover:bg-[#80483C] text-white'
                    }`}
                  >
                    Order Stock
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* DOWN ARROW INDICATOR */}
        <div className="flex justify-end items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-[#7A7568] font-medium pr-1">
          <span>DOWN</span>
          <span className="text-sm font-bold">▼</span>
        </div>

        {/* SECTION HISTORY TRANSAKSI & PENARIKAN */}
        <div className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            
            {/* HISTORY TITLE */}
            <div className="w-full md:w-40 pt-2">
              <h3 className="font-serif text-sm tracking-[0.3em] uppercase text-[#3D3A34] font-medium">
                History
              </h3>
            </div>

            {/* HISTORY LISTING BOX */}
            <div className="flex-1 w-full bg-[#FAF8F5] border border-[#D3CFC3] p-6 shadow-xs font-mono text-[11px] text-[#4A4741] space-y-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#E8E4D8] pb-2 gap-1">
                <span className="text-[#7A7568]">12-02-2026 _ 14.00</span>
                <span className="font-semibold text-[#3D3A34]">Penjualan TOP-01-TOPI MLB - 1 Buah - 300.000,-</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#E8E4D8] pb-2 gap-1">
                <span className="text-[#7A7568]">11-02-2026 _ 14.00</span>
                <span className="font-semibold text-[#965848]">Penarikan Bulan Agustus - 250.000,-</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#E8E4D8] pb-2 gap-1">
                <span className="text-[#7A7568]">22-06-2026 _ 14.00</span>
                <span className="font-semibold text-[#3D3A34]">Penjualan TOP-01-TOPI MLB - 1 Buah - 300.000,-</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-1 gap-1">
                <span className="text-[#7A7568]">08-10-2026 _ 14.00</span>
                <span className="font-semibold text-[#2D7A4D]">Penambahan Stock TOP-01TOPI MLB - 5 Buah</span>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}