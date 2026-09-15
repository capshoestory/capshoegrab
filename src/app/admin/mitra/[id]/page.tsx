'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function DetailMitraAdminPage() {
  const params = useParams();
  const router = useRouter();
  const currentStoreId = params.id as string;

  // Data State
  const [allStores, setAllStores] = useState<any[]>([]);
  const [storeData, setStoreData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Category State
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Form Tambah Stock State
  const [selectedProductForAdd, setSelectedProductForAdd] = useState('');
  const [addStockQty, setAddStockQty] = useState('5');

  // Modal QR Code State
  const [qrModalData, setQrModalData] = useState<any>(null);

  const fetchData = async () => {
    try {
      const resReports = await fetch('/api/reports');
      const reports = await resReports.json();

      if (Array.isArray(reports)) {
        setAllStores(reports);
        const current = reports.find((s: any) => s.storeId.toString() === currentStoreId);
        setStoreData(current || reports[0]);
      }

      const resProducts = await fetch('/api/products');
      if (resProducts.ok) setProducts(await resProducts.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentStoreId]);

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    router.push('/');
  };

  const handleSelectStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    router.push(`/admin/mitra/${newId}`);
  };

  // HANDLER TAMBAH STOCK PRODUK
  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdd) {
      alert('Pilih produk terlebih dahulu!');
      return;
    }

    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: storeData.storeId,
        productId: selectedProductForAdd,
        stockToAdd: addStockQty,
      }),
    });

    if (res.ok) {
      alert('Stok berhasil ditambahkan!');
      fetchData();
    } else {
      alert('Gagal menambahkan stok');
    }
  };

  // HANDLER CREATE / GENERATE QR CODE BARANG
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: storeData.storeId,
        productId: productId,
        stockToAdd: 0, // hanya generate QR tanpa nambah stok
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setQrModalData(data);
    } else {
      alert('Gagal membuat QR Code: ' + data.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ECE9E2] flex items-center justify-center text-xs tracking-[0.2em] uppercase text-[#7A7568]">
        Memuat Monitoring Mitra...
      </div>
    );
  }

  // Stock list & filtering
  const stockList = storeData?.stockList || [];
  const filteredStock = stockList.filter(
    (item: any) =>
      selectedCategory === 'ALL' ||
      (item.category || 'TOPI').toUpperCase() === selectedCategory.toUpperCase()
  );

  const totalStockCount = stockList.reduce((sum: number, i: any) => sum + i.stock, 0);

  return (
    <div className="min-h-screen bg-[#ECE9E2] text-[#4A4741] font-sans antialiased pb-20 selection:bg-[#B3A898] selection:text-white">
      
      {/* HEADER LOGO & LOG OUT */}
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

      {/* NAVIGATION BAR */}
      <div className="bg-[#D3CFC3] border-b border-[#C3BFAF] px-6">
        <div className="max-w-4xl mx-auto flex justify-center gap-2 pt-2">
          <button onClick={() => router.push('/admin')} className="px-8 py-3 text-xs uppercase tracking-[0.2em] font-medium text-[#686356] hover:bg-[#C8C4B7] rounded-t-md">
            Dashboard
          </button>
          <button onClick={() => router.push('/admin')} className="px-8 py-3 text-xs uppercase tracking-[0.2em] font-medium text-[#686356] hover:bg-[#C8C4B7] rounded-t-md">
            Stock
          </button>
          <button className="px-8 py-3 text-xs uppercase tracking-[0.2em] font-semibold bg-[#ECE9E2] text-[#3D3A34] shadow-sm rounded-t-md">
            Mitra
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-10">

        {/* SECTION TITLE: MONITORING MITRA */}
        <div className="text-center space-y-4">
          <h2 className="font-serif text-base tracking-[0.3em] uppercase text-[#3D3A34] font-medium">
            Monitoring Mitra
          </h2>

          {/* DROPDOWN SELECT NAMA TOKO */}
          <div className="flex justify-center items-center gap-4 text-xs tracking-[0.15em] uppercase text-[#4A4741] font-medium">
            <span>Nama Toko</span>
            <select
              value={storeData?.storeId}
              onChange={handleSelectStoreChange}
              className="bg-[#ECE9E2] border border-[#B3AE9F] px-4 py-2 text-xs tracking-[0.15em] uppercase font-semibold outline-none"
            >
              {allStores.map((s) => (
                <option key={s.storeId} value={s.storeId}>
                  {s.storeName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* OWNER INFO & 3 METRIC CARDS */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#C0BBB0] pb-3 text-[10px] tracking-[0.15em] uppercase text-[#7A7568]">
            <div>
              <span className="text-[#3D3A34] font-semibold">Owner: </span>
              <span>Aminullah</span>
            </div>
            <div>
              <span className="text-[#3D3A34] font-semibold">Alamat: </span>
              <span>Mantang</span>
            </div>
            <div>
              <span className="text-[#3D3A34] font-semibold">Contact: </span>
              <span>{storeData?.phone || '081333939393'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            {/* Store Photo */}
            <div className="w-full h-32 bg-[#D8D4C8] border border-[#C0BBB0] overflow-hidden flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&auto=format&fit=crop&q=60"
                alt="Store Showcase"
                className="w-full h-full object-cover grayscale opacity-90"
              />
            </div>

            {/* Total Stock */}
            <div className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 text-center h-32 flex flex-col justify-between">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#736E60] font-medium">Total Stock</p>
              <p className="font-serif text-3xl font-light text-[#3D3A34]">{totalStockCount}</p>
              <div></div>
            </div>

            {/* Terjual Bulan Ini */}
            <div className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 text-center h-32 flex flex-col justify-between">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#736E60] font-medium">Terjual Bulan Ini</p>
              <p className="font-serif text-3xl font-light text-[#3D3A34]">{storeData?.totalQty || 0}</p>
              <div></div>
            </div>

            {/* Profit Sharing */}
            <div className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 text-center h-32 flex flex-col justify-between">
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
        </div>

        {/* SECTION TITLE: STOCK TOKO */}
        <div className="text-center pt-4">
          <h2 className="font-serif text-base tracking-[0.3em] uppercase text-[#3D3A34] font-medium">
            Stock Toko
          </h2>
        </div>

        {/* SHORT BY CATEGORY HEADER */}
        <div className="flex justify-between items-center text-[10px] tracking-[0.15em] uppercase text-[#4A4741] font-medium px-1">
          <div className="flex items-center gap-3">
            <span>Short By Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#ECE9E2] border border-[#B3AE9F] p-1.5 text-[10px] tracking-[0.15em] uppercase outline-none"
            >
              <option value="ALL">ALL CATEGORIES</option>
              <option value="TOPI">TOPI</option>
              <option value="PAKAIAN">PAKAIAN</option>
              <option value="AKSESORIS">AKSESORIS</option>
              <option value="SEPATU">SEPATU</option>
              <option value="UMUM">UMUM</option>
            </select>
          </div>

          <div className="text-right text-[#7A7568]">
            UP ▲
          </div>
        </div>

        {/* LISTING STOCK TOKO WITH TAMBAH STOCK & CREATE QR BUTTONS */}
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
                  className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
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

                  {/* TWO ACTION BUTTONS: TAMBAH STOCK & CREATE QR */}
                  <div className="flex sm:flex-col gap-2 w-full sm:w-36">
                    <button
                      onClick={() => {
                        setSelectedProductForAdd(item.productId.toString());
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                      }}
                      className={`flex-1 py-2 text-[8px] tracking-[0.15em] uppercase font-bold transition ${
                        isLowStock
                          ? 'bg-[#FF3B30] text-white hover:bg-[#E02D22]'
                          : 'bg-[#965848] text-white hover:bg-[#80483C]'
                      }`}
                    >
                      Tambah Stock
                    </button>

                    <button
                      onClick={() => handleCreateQR(item.productId)}
                      className="flex-1 bg-[#80483C] hover:bg-[#68392F] text-white py-2 text-[8px] tracking-[0.15em] uppercase font-bold transition"
                    >
                      Create QR
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* SECTION TAMBAH STOCK FORM CARD (PERSIS SEMENTARA MOCKUP) */}
        <div className="pt-4 flex justify-center">
          <div className="w-full max-w-xl bg-[#C8C4B7] border border-[#B3AE9F] p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-sm tracking-[0.25em] uppercase text-[#3D3A34] font-medium border-b border-[#B3AE9F] pb-2">
              Tambah Stock
            </h3>

            <form onSubmit={handleAddStockSubmit} className="space-y-3 text-[10px] tracking-[0.15em] uppercase text-[#4A4741] font-medium">
              <div className="flex items-center justify-between gap-4">
                <label className="w-28">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 bg-[#ECE9E2] border border-[#B3AE9F] p-1.5 text-xs outline-none"
                >
                  <option value="ALL">ALL CATEGORIES</option>
                  <option value="TOPI">TOPI</option>
                  <option value="PAKAIAN">PAKAIAN</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="w-28">Pilih Product</label>
                <select
                  value={selectedProductForAdd}
                  onChange={(e) => setSelectedProductForAdd(e.target.value)}
                  required
                  className="flex-1 bg-[#ECE9E2] border border-[#B3AE9F] p-1.5 text-xs outline-none"
                >
                  <option value="">-- PILIH PRODUCT --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="w-28">Jumlah Stock</label>
                <input
                  type="number"
                  value={addStockQty}
                  onChange={(e) => setAddStockQty(e.target.value)}
                  required
                  className="flex-1 bg-[#ECE9E2] border border-[#B3AE9F] p-1.5 text-xs outline-none font-bold"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-[#965848] hover:bg-[#80483C] text-white px-6 py-2 text-[9px] tracking-[0.2em] uppercase font-medium transition"
                >
                  Tambah Stock
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SECTION HISTORY TRANSAKSI (PERSIS MOCK-UP) */}
        <div className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-40 pt-2">
              <h3 className="font-serif text-sm tracking-[0.3em] uppercase text-[#3D3A34] font-medium">
                History
              </h3>
            </div>

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

      {/* POPUP MODAL DISPLAY QR CODE READY TO PRINT/DOWNLOAD */}
      {qrModalData && (
        <div className="fixed inset-0 bg-[#3D3A34]/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#ECE9E2] border border-[#B3AE9F] max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <h3 className="font-serif text-sm tracking-[0.2em] uppercase text-[#3D3A34] font-semibold border-b border-[#C0BBB0] pb-2">
              Tag QR Code Konsinyasi
            </h3>

            <div className="bg-white p-4 border border-[#B3AE9F] inline-block rounded-md">
              <img
                src={qrModalData.qrImageDataUrl}
                alt="QR Code Tag"
                className="w-48 h-48 mx-auto"
              />
              <p className="text-[10px] font-mono text-[#7A7568] mt-2">
                {qrModalData.inventory.qrCodeKey}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={qrModalData.qrImageDataUrl}
                download={`TAG-${qrModalData.inventory.qrCodeKey}.png`}
                className="block w-full bg-[#965848] hover:bg-[#80483C] text-white py-2 text-[9px] tracking-[0.2em] uppercase font-medium shadow-xs"
              >
                Download Gambar QR Tag
              </a>

              <button
                onClick={() => setQrModalData(null)}
                className="w-full bg-[#D8D4C8] hover:bg-[#C8C2B3] py-2 text-[9px] tracking-[0.2em] uppercase font-medium text-[#4A4741]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}