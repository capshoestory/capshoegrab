'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stock' | 'mitra'>('dashboard');

  // Data State
  const [reports, setReports] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);

  // State Form Tambah/Edit Mitra Baru
  const [editingStore, setEditingStore] = useState<any>(null);
  const [newStoreName, setNewStoreName] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newAlamat, setNewAlamat] = useState('');
  const [newKontak, setNewKontak] = useState('');
  const [newPhotoBase64, setNewPhotoBase64] = useState('');

  // State Monitoring Mitra
  const [selectedMitraStoreId, setSelectedMitraStoreId] = useState<string>('');
  const [selectedCategoryMitra, setSelectedCategoryMitra] = useState('ALL');

  // State Form Input/Edit Product Stock
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('TOPI');
  const [photoUrl, setPhotoUrl] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');

  // State Short By Category & Search
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // State Form Add Stock di Tab Mitra
  const [selectedProductForAdd, setSelectedProductForAdd] = useState('');
  const [addStockQty, setAddStockQty] = useState('5');

  // State Modal QR Code
  const [qrModalData, setQrModalData] = useState<any>(null);

  const fetchReports = async () => {
    const res = await fetch('/api/reports');
    if (res.ok) {
      const data = await res.json();
      setReports(data);
      if (data.length > 0 && !selectedMitraStoreId) {
        setSelectedMitraStoreId(data[0].storeId.toString());
      }
    }
  };

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    if (res.ok) setProducts(await res.json());
  };

  const fetchStores = async () => {
    const res = await fetch('/api/stores');
    if (res.ok) setStores(await res.json());
  };

  useEffect(() => {
    fetchReports();
    fetchProducts();
    fetchStores();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    router.push('/');
  };

  // FUNGSI KOMPRESI GAMBAR OTOMATIS (200x200 PIXEL)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create HTML5 Canvas untuk resize 200x200 pixel
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Center-crop dan resize gambar ke 200x200
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 200, 200);

          // Render canvas ke data URL WebP (kualitas 0.8 / sangat ringan)
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.8);
          setNewPhotoBase64(compressedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // HANDLER SUBMIT MITRA BARU / EDIT MITRA
  const handleSaveMitraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newKontak) {
      alert('Nama Toko dan Kontak wajib diisi!');
      return;
    }

    if (editingStore) {
      await fetch('/api/stores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingStore.id,
          name: newStoreName,
          commissionRate: 15,
          phone: newKontak,
          owner: newOwner,
          alamat: newAlamat,
          photoUrl: newPhotoBase64,
        }),
      });
      alert('Data Mitra berhasil diperbarui!');
      setEditingStore(null);
    } else {
      await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStoreName,
          commissionRate: 15,
          phone: newKontak,
          owner: newOwner,
          alamat: newAlamat,
          photoUrl: newPhotoBase64,
          username: `mitra_${Date.now().toString().slice(-4)}`,
          password: '123456',
        }),
      });
      alert('Toko Mitra Baru Berhasil Ditambahkan!');
    }

    // Reset Form
    setNewStoreName('');
    setNewOwner('');
    setNewAlamat('');
    setNewKontak('');
    setNewPhotoBase64('');
    fetchStores();
    fetchReports();
  };

  // HANDLER SUBMIT STOK / PRODUK BARU
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProduct.id,
          sku,
          name,
          price,
          category,
        }),
      });
      alert('Stok & Data Produk Berhasil Diperbarui!');
      setEditingProduct(null);
    } else {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku,
          name,
          price,
          category,
        }),
      });
      alert('Produk Baru Berhasil Ditambahkan!');
    }
    setSku(''); setName(''); setPrice(''); setCategory('TOPI'); setPhotoUrl(''); setStock('10');
    fetchProducts();
  };

  const handleEditProductClick = (p: any) => {
    setEditingProduct(p);
    setSku(p.sku || '');
    setName(p.name || '');
    setCategory(p.category || 'TOPI');
    setPrice(p.price ? p.price.toString() : '');
    setStock('10');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // HANDLER TAMBAH STOCK UNTUK MITRA
  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdd || !selectedMitraStoreId) {
      alert('Pilih produk dan toko mitra terlebih dahulu!');
      return;
    }

    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: selectedMitraStoreId,
        productId: selectedProductForAdd,
        stockToAdd: addStockQty,
      }),
    });

    if (res.ok) {
      alert('Stok berhasil ditambahkan ke toko mitra!');
      fetchReports();
    } else {
      alert('Gagal menambahkan stok');
    }
  };

  // HANDLER CREATE QR CODE BARANG
  const handleCreateQR = async (productId: number) => {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: selectedMitraStoreId,
        productId: productId,
        stockToAdd: 0,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setQrModalData(data);
    } else {
      alert('Gagal membuat QR Code: ' + data.error);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      (p.category || 'TOPI').toUpperCase() === selectedCategory.toUpperCase();

    const matchesSearch =
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const totalStores = reports.length;
  const totalProductVariations = products.length;
  const totalItemsSoldMonth = reports.reduce((sum, r) => sum + r.totalQty, 0);
  const totalLowStockItems = reports.reduce((sum, r) => sum + r.lowStockCount, 0);

  const activeMitraData = reports.find((s) => s.storeId.toString() === selectedMitraStoreId) || reports[0];
  const activeMitraStockList = activeMitraData?.stockList || [];
  const filteredMitraStock = activeMitraStockList.filter(
    (item: any) =>
      selectedCategoryMitra === 'ALL' ||
      (item.category || 'TOPI').toUpperCase() === selectedCategoryMitra.toUpperCase()
  );
  const activeMitraTotalStock = activeMitraStockList.reduce((sum: number, i: any) => sum + i.stock, 0);

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

      {/* NAV TAB NAVIGATION (DASHBOARD - STOCK - MITRA) */}
      <div className="bg-[#D3CFC3] border-b border-[#C3BFAF] px-6">
        <div className="max-w-4xl mx-auto flex justify-center gap-2 pt-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-8 py-3 text-xs uppercase tracking-[0.2em] font-medium transition rounded-t-md ${
              activeTab === 'dashboard'
                ? 'bg-[#ECE9E2] text-[#3D3A34] shadow-sm font-semibold'
                : 'text-[#686356] hover:bg-[#C8C4B7]'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-8 py-3 text-xs uppercase tracking-[0.2em] font-medium transition rounded-t-md ${
              activeTab === 'stock'
                ? 'bg-[#ECE9E2] text-[#3D3A34] shadow-sm font-semibold'
                : 'text-[#686356] hover:bg-[#C8C4B7]'
            }`}
          >
            Stock
          </button>
          <button
            onClick={() => setActiveTab('mitra')}
            className={`px-8 py-3 text-xs uppercase tracking-[0.2em] font-medium transition rounded-t-md ${
              activeTab === 'mitra'
                ? 'bg-[#ECE9E2] text-[#3D3A34] shadow-sm font-semibold'
                : 'text-[#686356] hover:bg-[#C8C4B7]'
            }`}
          >
            Mitra
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-10">

        {/* =================================================================== */}
        {/* TAB 1: DASHBOARD MAIN PAGE (PERSIS MOCK-UP KEDUA GAMBAR) */}
        {/* =================================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-12">
            
            {/* WELCOME BANNER */}
            <div className="text-center space-y-1">
              <h2 className="font-serif text-sm tracking-[0.25em] uppercase text-[#635F54] font-medium">
                Selamat Datang Di Halaman
              </h2>
              <h2 className="font-serif text-sm tracking-[0.25em] uppercase text-[#635F54] font-medium">
                Dashboard Mitra.
              </h2>
            </div>

            {/* 4 CARDS SUMMARY */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 text-center min-h-[140px] flex flex-col justify-between shadow-xs">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#736E60] font-medium">Jumlah Mitra</p>
                <p className="font-serif text-3xl font-light text-[#3D3A34]">{totalStores}</p>
                <div></div>
              </div>

              <div className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 text-center min-h-[140px] flex flex-col justify-between shadow-xs">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#736E60] font-medium">Total Varian Produk</p>
                <p className="font-serif text-3xl font-light text-[#3D3A34]">{totalProductVariations}</p>
                <div></div>
              </div>

              <div className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 text-center min-h-[140px] flex flex-col justify-between shadow-xs">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#736E60] font-medium">Terjual Bulan Ini</p>
                <p className="font-serif text-3xl font-light text-[#3D3A34]">{totalItemsSoldMonth}</p>
                <div></div>
              </div>

              <div className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 text-center min-h-[140px] flex flex-col justify-between shadow-xs">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#736E60] font-medium">Reminder Limited Stock</p>
                <p className="font-serif text-3xl font-light text-[#8C4A3E]">{totalLowStockItems}</p>
                <div></div>
              </div>
            </div>

            {/* SECTION TITLE: DAFTAR MITRA */}
            <div className="text-center pt-4">
              <h3 className="font-serif text-base tracking-[0.3em] uppercase text-[#4A4741] font-medium">
                Daftar Mitra
              </h3>
            </div>

            {/* MITRA LISTINGS */}
            <div className="space-y-6">
              {reports.map((report) => {
                const totalStockInStore = report.stockList.reduce((sum: number, i: any) => sum + i.stock, 0);

                return (
                  <div key={report.storeId} className="flex flex-col md:flex-row gap-4 items-stretch">
                    <div className="flex-1 border border-[#B3AE9F] bg-[#ECE9E2] p-4 flex flex-col sm:flex-row gap-4 items-center shadow-xs">
                      
                      {/* Store Photo (Direct Compressed 200x200 or Default Showcase) */}
                      <div className="w-full sm:w-32 h-28 bg-[#D8D4C8] border border-[#C0BBB0] overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <img
                          src={
                            report.photoUrl ||
                            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&auto=format&fit=crop&q=60'
                          }
                          alt={report.storeName}
                          className="w-full h-full object-cover grayscale opacity-90"
                        />
                      </div>

                      <div className="flex-1 space-y-3 text-center sm:text-left w-full">
                        <div>
                          <h4 className="font-serif text-sm tracking-[0.2em] uppercase text-[#3D3A34] font-semibold">
                            {report.storeName}
                          </h4>
                          <p className="text-[10px] tracking-[0.15em] uppercase text-[#807B6E]">
                            KOPANG | {report.phone}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-[#E2DDD3] p-2 text-center border border-[#D0CAB9]">
                            <p className="text-[8px] tracking-[0.1em] uppercase text-[#7A7568]">Total Penjualan</p>
                            <p className="font-serif text-xs font-semibold text-[#3D3A34] mt-0.5">{report.totalQty}</p>
                          </div>
                          <div className="bg-[#E2DDD3] p-2 text-center border border-[#D0CAB9]">
                            <p className="text-[8px] tracking-[0.1em] uppercase text-[#7A7568]">Sisa Stock</p>
                            <p className="font-serif text-xs font-semibold text-[#3D3A34] mt-0.5">{totalStockInStore}</p>
                          </div>
                          <div className="bg-[#E2DDD3] p-2 text-center border border-[#D0CAB9]">
                            <p className="text-[8px] tracking-[0.1em] uppercase text-[#7A7568]">Order Stock</p>
                            <p className="font-serif text-xs font-semibold text-[#8C4A3E] mt-0.5">{report.lowStockCount}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-56 space-y-2 flex flex-col justify-between">
                      <div className="bg-[#E2DDD3] p-2.5 text-center border border-[#C8C2B3]">
                        <p className="text-[8px] tracking-[0.15em] uppercase text-[#7A7568]">PROFIT</p>
                        <p className="font-serif text-xs tracking-wider font-semibold text-[#3D3A34] mt-0.5">
                          IDR. {report.totalNetSupplier.toLocaleString('id-ID')}
                        </p>
                      </div>

                      <a
                        href={`https://wa.me/${report.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block bg-[#E2DDD3] hover:bg-[#D5CFC2] py-2 text-center border border-[#C8C2B3] text-[9px] tracking-[0.2em] uppercase text-[#5A564C] font-medium transition"
                      >
                        INBOX
                      </a>

                      <button
                        onClick={() => {
                          setSelectedMitraStoreId(report.storeId.toString());
                          setActiveTab('mitra');
                        }}
                        className="w-full bg-[#965848] hover:bg-[#80483C] text-white py-2.5 text-center text-[9px] tracking-[0.2em] uppercase font-medium shadow-xs transition"
                      >
                        EDIT INFO
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAGINATION / FOOTER CONTROLS */}
            <div className="flex justify-between items-center pt-4 text-[10px] tracking-[0.2em] uppercase text-[#7A7568]">
              <button className="flex items-center gap-2 hover:text-[#3D3A34] transition">
                <span>&lt;</span> BEFORE
              </button>
              <button className="flex items-center gap-2 hover:text-[#3D3A34] transition">
                NEXT <span>&gt;</span>
              </button>
            </div>

            {/* SECTION TAMBAH MITRA (PERSIS MOCK-UP GAMBAR LENGKAP BERSAMA COMPRESS UPLOAD 200x200) */}
            <div className="pt-8 border-t border-[#C0BBB0] space-y-6">
              <div className="text-center">
                <h3 className="font-serif text-base tracking-[0.3em] uppercase text-[#3D3A34] font-medium">
                  TAMBAH MITRA
                </h3>
              </div>

              <div className="bg-[#C8C4B7] border border-[#B3AE9F] p-6 shadow-xs">
                <form onSubmit={handleSaveMitraSubmit} className="flex flex-col md:flex-row gap-6 items-stretch">
                  
                  {/* UPLOAD PHOTO HERE (AUTOCONVERT TO 200x200 PIXEL WEBP) */}
                  <div className="w-full md:w-36 h-36 bg-[#644EA6] border border-[#4E398D] text-white flex flex-col items-center justify-center p-3 text-center relative flex-shrink-0 cursor-pointer overflow-hidden group">
                    {newPhotoBase64 ? (
                      <img
                        src={newPhotoBase64}
                        alt="Preview 200x200"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <p className="text-[9px] tracking-[0.15em] font-bold uppercase leading-tight">
                          UPLOAD PHOTO HERE
                        </p>
                        <p className="text-[7px] text-purple-200 mt-1 font-mono">Auto 200x200px</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  {/* FORM FIELDS: NAMA TOKO, OWNER, ALAMAT, KONTAK */}
                  <div className="flex-1 space-y-3 font-medium text-[10px] tracking-[0.15em] uppercase text-[#4A4741]">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between gap-2">
                        <label className="w-24">NAMA TOKO</label>
                        <input
                          type="text"
                          value={newStoreName}
                          onChange={(e) => setNewStoreName(e.target.value)}
                          placeholder="DESECOND"
                          required
                          className="flex-1 bg-[#ECE9E2] border border-[#B3AE9F] p-2 text-xs text-[#3D3A34] outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="w-24">KONTAK</label>
                        <input
                          type="text"
                          value={newKontak}
                          onChange={(e) => setNewKontak(e.target.value)}
                          placeholder="0812929394"
                          required
                          className="flex-1 bg-[#ECE9E2] border border-[#B3AE9F] p-2 text-xs text-[#3D3A34] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between gap-2">
                        <label className="w-24">OWNER</label>
                        <input
                          type="text"
                          value={newOwner}
                          onChange={(e) => setNewOwner(e.target.value)}
                          placeholder="ANDI"
                          className="flex-1 bg-[#ECE9E2] border border-[#B3AE9F] p-2 text-xs text-[#3D3A34] outline-none"
                        />
                      </div>

                      <div className="flex items-end justify-end pt-2 md:pt-0">
                        <button
                          type="submit"
                          className="w-full bg-[#965848] hover:bg-[#80483C] text-white py-2.5 text-[9px] tracking-[0.2em] uppercase font-bold transition shadow-xs"
                        >
                          SUBMIT
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between gap-2">
                        <label className="w-24">ALAMAT</label>
                        <input
                          type="text"
                          value={newAlamat}
                          onChange={(e) => setNewAlamat(e.target.value)}
                          placeholder="MANTANG"
                          className="flex-1 bg-[#ECE9E2] border border-[#B3AE9F] p-2 text-xs text-[#3D3A34] outline-none"
                        />
                      </div>
                    </div>

                  </div>

                </form>
              </div>
            </div>

          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: STOCK MANAGEMENT */}
        {/* =================================================================== */}
        {activeTab === 'stock' && (
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="text-center flex justify-between items-center">
                <div className="w-16"></div>
                <h2 className="font-serif text-base tracking-[0.3em] uppercase text-[#3D3A34] font-medium">
                  {editingProduct ? 'Edit Stock Product' : 'Input Stock'}
                </h2>
                {editingProduct ? (
                  <button
                    onClick={() => { setEditingProduct(null); setSku(''); setName(''); setPrice(''); }}
                    className="text-[9px] tracking-[0.15em] uppercase text-[#8C4A3E] underline font-medium"
                  >
                    Cancel
                  </button>
                ) : (
                  <div className="w-16"></div>
                )}
              </div>

              <div className="bg-[#FAF8F5] border border-[#D3CFC3] p-8 shadow-xs">
                <form onSubmit={handleSaveProduct} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] tracking-[0.15em] uppercase text-[#4A4741] font-medium w-32">SKU Product</label>
                        <input type="text" value={sku || ''} onChange={(e) => setSku(e.target.value)} placeholder="TOP-01" required className="flex-1 bg-[#FAF8F5] border border-[#B3AE9F] p-2 text-xs outline-none" />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] tracking-[0.15em] uppercase text-[#4A4741] font-medium w-32">Nama Product</label>
                        <input type="text" value={name || ''} onChange={(e) => setName(e.target.value)} placeholder="TOPI MLB" required className="flex-1 bg-[#FAF8F5] border border-[#B3AE9F] p-2 text-xs outline-none" />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] tracking-[0.15em] uppercase text-[#4A4741] font-medium w-32">Category</label>
                        <select value={category || 'TOPI'} onChange={(e) => setCategory(e.target.value)} className="flex-1 bg-[#FAF8F5] border border-[#B3AE9F] p-2 text-xs outline-none uppercase">
                          <option value="TOPI">TOPI</option>
                          <option value="PAKAIAN">PAKAIAN</option>
                          <option value="AKSESORIS">AKSESORIS</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] tracking-[0.15em] uppercase text-[#4A4741] font-medium w-32">Upload Photo</label>
                        <input type="text" value={photoUrl || ''} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="URL / Optional" className="flex-1 bg-[#FAF8F5] border border-[#B3AE9F] p-2 text-xs outline-none" />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] tracking-[0.15em] uppercase text-[#4A4741] font-medium w-32">Harga</label>
                        <input type="number" value={price || ''} onChange={(e) => setPrice(e.target.value)} placeholder="300000" required className="flex-1 bg-[#FAF8F5] border border-[#B3AE9F] p-2 text-xs outline-none" />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] tracking-[0.15em] uppercase text-[#4A4741] font-medium w-32">Stock</label>
                        <input type="number" value={stock || ''} onChange={(e) => setStock(e.target.value)} placeholder="12" required className="flex-1 bg-[#FAF8F5] border border-[#B3AE9F] p-2 text-xs outline-none" />
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 text-center">
                    <button type="submit" className="bg-[#965848] hover:bg-[#80483C] text-white px-10 py-2.5 text-xs tracking-[0.25em] uppercase font-medium transition shadow-xs">
                      {editingProduct ? 'Update Stock' : 'Submit'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="text-center">
                <h2 className="font-serif text-base tracking-[0.3em] uppercase text-[#3D3A34] font-medium">List Stock</h2>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] tracking-[0.15em] uppercase text-[#4A4741] font-medium px-1">
                <div className="flex items-center gap-3">
                  <span>Short By Category:</span>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-[#ECE9E2] border border-[#B3AE9F] p-1.5 text-[10px] tracking-[0.15em] uppercase outline-none">
                    <option value="ALL">ALL CATEGORIES</option>
                    <option value="TOPI">TOPI</option>
                    <option value="PAKAIAN">PAKAIAN</option>
                  </select>
                </div>
                <div>
                  <input type="text" placeholder="Search Product / SKU..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-[#ECE9E2] border border-[#B3AE9F] p-1.5 text-[10px] tracking-[0.1em] outline-none w-48" />
                </div>
              </div>

              <div className="space-y-4">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                    <div className="w-16 h-16 bg-[#D8D4C8] border border-[#C0BBB0] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <img src={p.photoUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&auto=format&fit=crop&q=60'} alt={p.name} className="w-full h-full object-cover grayscale opacity-90" />
                    </div>
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-2 w-full text-center text-xs font-mono">
                      <div className="bg-[#E2DDD3] p-2 border border-[#D0CAB9] uppercase">{p.sku || 'TOP-01'}</div>
                      <div className="bg-[#E2DDD3] p-2 border border-[#D0CAB9] uppercase font-sans font-medium text-[11px]">{p.name}</div>
                      <div className="bg-[#E2DDD3] p-2 border border-[#D0CAB9] uppercase text-[11px]">{p.category || 'TOPI'}</div>
                      <div className="bg-[#E2DDD3] p-2 border border-[#D0CAB9] font-bold text-[#3D3A34]">12</div>
                      <div className="bg-[#E2DDD3] p-2 border border-[#D0CAB9] font-sans font-semibold text-[11px] col-span-2 sm:col-span-1">IDR {p.price ? p.price.toLocaleString('id-ID') : '300.000'}</div>
                    </div>
                    <button onClick={() => handleEditProductClick(p)} className="w-full sm:w-auto bg-[#965848] hover:bg-[#80483C] text-white px-6 py-2.5 text-[9px] tracking-[0.2em] uppercase font-medium transition shadow-xs">Edit</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: MONITORING MITRA */}
        {/* =================================================================== */}
        {activeTab === 'mitra' && (
          <div className="space-y-10">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-base tracking-[0.3em] uppercase text-[#3D3A34] font-medium">
                Monitoring Mitra
              </h2>

              <div className="flex justify-center items-center gap-4 text-xs tracking-[0.15em] uppercase text-[#4A4741] font-medium">
                <span>Nama Toko</span>
                <select
                  value={selectedMitraStoreId}
                  onChange={(e) => setSelectedMitraStoreId(e.target.value)}
                  className="bg-[#ECE9E2] border border-[#B3AE9F] px-4 py-2 text-xs tracking-[0.15em] uppercase font-semibold outline-none shadow-xs"
                >
                  {reports.map((s) => (
                    <option key={s.storeId} value={s.storeId}>
                      {s.storeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#C0BBB0] pb-3 text-[10px] tracking-[0.15em] uppercase text-[#7A7568]">
                <div>
                  <span className="text-[#3D3A34] font-semibold">Owner: </span>
                  <span>{activeMitraData?.owner || 'Aminullah'}</span>
                </div>
                <div>
                  <span className="text-[#3D3A34] font-semibold">Alamat: </span>
                  <span>{activeMitraData?.alamat || 'Mantang'}</span>
                </div>
                <div>
                  <span className="text-[#3D3A34] font-semibold">Contact: </span>
                  <span>{activeMitraData?.phone || '081333939393'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                <div className="w-full h-32 bg-[#D8D4C8] border border-[#C0BBB0] overflow-hidden flex items-center justify-center">
                  <img
                    src={
                      activeMitraData?.photoUrl ||
                      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&auto=format&fit=crop&q=60'
                    }
                    alt="Store Showcase"
                    className="w-full h-full object-cover grayscale opacity-90"
                  />
                </div>

                <div className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 text-center h-32 flex flex-col justify-between shadow-xs">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#736E60] font-medium">Total Stock</p>
                  <p className="font-serif text-3xl font-light text-[#3D3A34]">{activeMitraTotalStock}</p>
                  <div></div>
                </div>

                <div className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 text-center h-32 flex flex-col justify-between shadow-xs">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#736E60] font-medium">Terjual Bulan Ini</p>
                  <p className="font-serif text-3xl font-light text-[#3D3A34]">{activeMitraData?.totalQty || 0}</p>
                  <div></div>
                </div>

                <div className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 text-center h-32 flex flex-col justify-between shadow-xs">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#736E60] font-medium">Profit Sharing</p>
                  <div className="space-y-0.5">
                    <p className="text-[9px] tracking-[0.15em] text-[#736E60] font-mono uppercase">IDR.</p>
                    <p className="font-serif text-lg font-semibold text-[#3D3A34]">
                      {(activeMitraData?.totalStoreCommission || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div></div>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <h2 className="font-serif text-base tracking-[0.3em] uppercase text-[#3D3A34] font-medium">Stock Toko</h2>
            </div>

            <div className="flex justify-between items-center text-[10px] tracking-[0.15em] uppercase text-[#4A4741] font-medium px-1">
              <div className="flex items-center gap-3">
                <span>Short By Category:</span>
                <select
                  value={selectedCategoryMitra}
                  onChange={(e) => setSelectedCategoryMitra(e.target.value)}
                  className="bg-[#ECE9E2] border border-[#B3AE9F] p-1.5 text-[10px] tracking-[0.15em] uppercase outline-none font-semibold"
                >
                  <option value="ALL">ALL CATEGORIES</option>
                  <option value="TOPI">TOPI</option>
                  <option value="PAKAIAN">PAKAIAN</option>
                </select>
              </div>
              <div className="text-right text-[#7A7568]">UP ▲</div>
            </div>

            <div className="space-y-4">
              {filteredMitraStock.map((item: any) => {
                const isLowStock = item.stock < 5;
                return (
                  <div key={item.inventoryId} className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                    <div className="w-16 h-16 bg-[#D8D4C8] border border-[#C0BBB0] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&auto=format&fit=crop&q=60" alt={item.productName} className="w-full h-full object-cover grayscale opacity-90" />
                    </div>
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-2 w-full text-center text-xs font-mono">
                      <div className="bg-[#E2DDD3] p-2 border border-[#D0CAB9] uppercase">{item.sku || 'TOP-01'}</div>
                      <div className="bg-[#E2DDD3] p-2 border border-[#D0CAB9] uppercase font-sans font-medium text-[11px]">{item.productName}</div>
                      <div className="bg-[#E2DDD3] p-2 border border-[#D0CAB9] uppercase text-[11px]">{item.category || 'TOPI'}</div>
                      <div className={`bg-[#E2DDD3] p-2 border border-[#D0CAB9] font-bold ${isLowStock ? 'text-red-600' : 'text-[#3D3A34]'}`}>{item.stock}</div>
                      <div className="bg-[#E2DDD3] p-2 border border-[#D0CAB9] font-sans font-semibold text-[11px] col-span-2 sm:col-span-1">IDR. {item.price ? item.price.toLocaleString('id-ID') : '300.000'}</div>
                    </div>
                    <div className="flex sm:flex-col gap-2 w-full sm:w-36">
                      <button onClick={() => { setSelectedProductForAdd(item.productId.toString()); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }} className={`flex-1 py-2 text-[8px] tracking-[0.15em] uppercase font-bold transition ${isLowStock ? 'bg-[#FF3B30] text-white hover:bg-[#E02D22]' : 'bg-[#965848] text-white hover:bg-[#80483C]'}`}>Tambah Stock</button>
                      <button onClick={() => handleCreateQR(item.productId)} className="flex-1 bg-[#80483C] hover:bg-[#68392F] text-white py-2 text-[8px] tracking-[0.15em] uppercase font-bold transition">Create QR</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-center">
              <div className="w-full max-w-xl bg-[#C8C4B7] border border-[#B3AE9F] p-6 shadow-xs space-y-4">
                <h3 className="font-serif text-sm tracking-[0.25em] uppercase text-[#3D3A34] font-medium border-b border-[#B3AE9F] pb-2">Tambah Stock</h3>
                <form onSubmit={handleAddStockSubmit} className="space-y-3 text-[10px] tracking-[0.15em] uppercase text-[#4A4741] font-medium">
                  <div className="flex items-center justify-between gap-4">
                    <label className="w-28">Category</label>
                    <select value={selectedCategoryMitra} onChange={(e) => setSelectedCategoryMitra(e.target.value)} className="flex-1 bg-[#ECE9E2] border border-[#B3AE9F] p-1.5 text-xs outline-none">
                      <option value="ALL">ALL CATEGORIES</option>
                      <option value="TOPI">TOPI</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <label className="w-28">Pilih Product</label>
                    <select value={selectedProductForAdd} onChange={(e) => setSelectedProductForAdd(e.target.value)} required className="flex-1 bg-[#ECE9E2] border border-[#B3AE9F] p-1.5 text-xs outline-none">
                      <option value="">-- PILIH PRODUCT --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <label className="w-28">Jumlah Stock</label>
                    <input type="number" value={addStockQty} onChange={(e) => setAddStockQty(e.target.value)} required className="flex-1 bg-[#ECE9E2] border border-[#B3AE9F] p-1.5 text-xs outline-none font-bold" />
                  </div>
                  <div className="pt-2">
                    <button type="submit" className="bg-[#965848] hover:bg-[#80483C] text-white px-6 py-2 text-[9px] tracking-[0.2em] uppercase font-medium transition">Tambah Stock</button>
                  </div>
                </form>
              </div>
            </div>

            <div className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-40 pt-2"><h3 className="font-serif text-sm tracking-[0.3em] uppercase text-[#3D3A34] font-medium">History</h3></div>
                <div className="flex-1 w-full bg-[#FAF8F5] border border-[#D3CFC3] p-6 shadow-xs font-mono text-[11px] text-[#4A4741] space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#E8E4D8] pb-2 gap-1">
                    <span className="text-[#7A7568]">12-02-2026 _ 14.00</span>
                    <span className="font-semibold text-[#3D3A34]">Penjualan TOP-01-TOPI MLB - 1 Buah - 300.000,-</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* MODAL GENERATE QR CODE */}
      {qrModalData && (
        <div className="fixed inset-0 bg-[#3D3A34]/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#ECE9E2] border border-[#B3AE9F] max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <h3 className="font-serif text-sm tracking-[0.2em] uppercase text-[#3D3A34] font-semibold border-b border-[#C0BBB0] pb-2">
              Tag QR Code Konsinyasi
            </h3>
            <div className="bg-white p-4 border border-[#B3AE9F] inline-block rounded-md">
              <img src={qrModalData.qrImageDataUrl} alt="QR Code Tag" className="w-48 h-48 mx-auto" />
              <p className="text-[10px] font-mono text-[#7A7568] mt-2">{qrModalData.inventory.qrCodeKey}</p>
            </div>
            <div className="space-y-2 pt-2">
              <a href={qrModalData.qrImageDataUrl} download={`TAG-${qrModalData.inventory.qrCodeKey}.png`} className="block w-full bg-[#965848] hover:bg-[#80483C] text-white py-2 text-[9px] tracking-[0.2em] uppercase font-medium shadow-xs">
                Download Gambar QR Tag
              </a>
              <button onClick={() => setQrModalData(null)} className="w-full bg-[#D8D4C8] hover:bg-[#C8C2B3] py-2 text-[9px] tracking-[0.2em] uppercase font-medium text-[#4A4741]">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}