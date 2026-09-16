'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stock' | 'mitra'>('dashboard');

  const [reports, setReports] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);

  // Form State Tambah/Edit Mitra
  const [namaToko, setNamaToko] = useState('');
  const [owner, setOwner] = useState('');
  const [alamat, setAlamat] = useState('');
  const [kontak, setKontak] = useState('');
  const [fee, setFee] = useState('15');
  const [pasword, setPasword] = useState('123456');
  const [mitraPhotoBase64, setMitraPhotoBase64] = useState('');

  // Form State Input/Edit Stock
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [category, setCategory] = useState('TOPI');
  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [price, setPrice] = useState('');
  const [productPhoto, setProductPhoto] = useState('');

  const [shortCategory, setShortCategory] = useState('ALL');
  const [selectedMitraId, setSelectedMitraId] = useState<string>('');
  const [qrModalData, setQrModalData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FETCH ALL DATA FROM SUPABASE
  const fetchData = async () => {
    try {
      const [resR, resP, resS] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/products'),
        fetch('/api/stores'),
      ]);

      if (resR.ok) {
        const dataR = await resR.json();
        dataR.sort((a: any, b: any) => b.totalQty - a.totalQty);
        setReports(dataR);
        if (dataR.length > 0 && !selectedMitraId) {
          setSelectedMitraId(dataR[0].storeId.toString());
        }
      }
      if (resP.ok) setProducts(await resP.json());
      if (resS.ok) setStores(await resS.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // AUTO COMPRESS PHOTO TO 200x200 PX
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, setTarget: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 200, 200);
          setTarget(canvas.toDataURL('image/webp', 0.8));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // SUBMIT HANDLER TAMBAH MITRA
  const handleAddMitra = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: namaToko,
          phone: kontak,
          owner,
          alamat,
          commissionRate: parseFloat(fee),
          password: pasword,
          photoUrl: mitraPhotoBase64,
          username: namaToko.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
        }),
      });

      if (res.ok) {
        const newStore = await res.json();
        const sheetsUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL;
        if (sheetsUrl) {
          fetch(sheetsUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'ADD_MITRA', ...newStore }),
          }).catch(console.error);
        }

        alert('Mitra Berhasil Ditambahkan & Tersinkron!');
        setNamaToko(''); setOwner(''); setAlamat(''); setKontak(''); setMitraPhotoBase64('');
        await fetchData();
      } else {
        alert('Gagal menambah mitra.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUBMIT HANDLER STOK (INPUT/EDIT)
  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const endpoint = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
      const method = editingProductId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku,
          name: productName,
          category,
          price: parseFloat(price),
          stock: parseInt(stockQty) || 0,
          photoUrl: productPhoto,
        }),
      });

      if (res.ok) {
        const resultData = await res.json();
        const sheetsUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL;
        if (sheetsUrl) {
          fetch(sheetsUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: editingProductId ? 'EDIT_PRODUCT' : 'ADD_PRODUCT', ...resultData }),
          }).catch(console.error);
        }

        alert(editingProductId ? 'Stok produk berhasil diperbarui!' : 'Stok produk berhasil ditambahkan!');
        setEditingProductId(null); setCategory('TOPI'); setSku(''); setProductName(''); setStockQty(''); setPrice(''); setProductPhoto('');
        await fetchData();
      } else {
        alert('Gagal menyimpan stok produk.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStockClick = (p: any) => {
    setEditingProductId(p.id);
    setCategory(p.category || 'TOPI');
    setSku(p.sku || '');
    setProductName(p.name || '');
    setPrice(p.price?.toString() || '');
    setStockQty(p.stock?.toString() || '12');
    setProductPhoto(p.photoUrl || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // METRIK AKUMULASI DASHBOARD
  const totalMitraCount = stores.length || reports.length;
  const totalVarianCount = products.length;
  const totalTerjualBulanIni = reports.reduce((sum, r) => sum + (r.totalQty || 0), 0);
  const totalLimitedStock = reports.reduce((sum, r) => {
    const lowItems = r.stockList?.filter((i: any) => i.stock < 5).length || 0;
    return sum + lowItems;
  }, 0);

  const totalPenjualanRp = reports.reduce((sum, r) => sum + (r.totalGrossSales || 0), 0);
  const totalShareProfitRp = reports.reduce((sum, r) => sum + (r.totalStoreCommission || 0), 0);

  const filteredProducts = shortCategory === 'ALL'
    ? products
    : products.filter((p) => p.category?.toUpperCase() === shortCategory);

  const activeMitraData = reports.find((r) => r.storeId.toString() === selectedMitraId) || reports[0];

  return (
    <div className="min-h-screen bg-[#EFECE6] text-[#333333] font-sans antialiased pb-20">
      {/* HEADER LOGO CAPSHOE & LOGOUT */}
      <header className="bg-[#D8D4CA] px-6 py-4 border-b border-[#C8C4B8] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="text-[#00A896] text-xl font-black font-serif">Capshoe</div>
          <span className="text-[9px] uppercase tracking-[0.25em] text-[#666666] font-medium pt-1">
            ADVENTURE STORY
          </span>
        </div>
        <button
          onClick={() => {
            localStorage.clear();
            router.push('/');
          }}
          className="text-xs tracking-[0.2em] uppercase font-bold text-[#666666] hover:text-black"
        >
          LOG OUT
        </button>
      </header>

      {/* TABS NAVIGATION BAR */}
      <div className="bg-[#D8D4CA] border-b border-[#C8C4B8] px-4">
        <div className="max-w-xl mx-auto flex justify-center gap-1 pt-2">
          {['dashboard', 'stock', 'mitra'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2 text-xs uppercase tracking-[0.2em] font-bold ${
                activeTab === tab ? 'bg-[#EFECE6] text-[#333333]' : 'bg-[#00A896] text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 pt-6 space-y-8">
        {/* ================= TAB 1: DASHBOARD ================= */}
        {activeTab === 'dashboard' && (
          <>
            <div className="text-center">
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-[#555555]">
                SELAMAT DATANG DI HALAMAN<br />DASHBOARD MITRA.
              </h2>
            </div>

            {/* 4 TOP METRIC CARDS */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="border border-[#CCCCCC] bg-[#EFECE6] p-2 space-y-1">
                <p className="text-[7px] font-bold tracking-widest uppercase text-[#666666]">JUMLAH MITRA</p>
                <p className="text-2xl font-normal text-[#333333] font-serif">{totalMitraCount}</p>
              </div>
              <div className="border border-[#CCCCCC] bg-[#EFECE6] p-2 space-y-1">
                <p className="text-[7px] font-bold tracking-widest uppercase text-[#666666]">TOTAL VARIAN PRODUK</p>
                <p className="text-2xl font-normal text-[#333333] font-serif">{totalVarianCount}</p>
              </div>
              <div className="border border-[#CCCCCC] bg-[#EFECE6] p-2 space-y-1">
                <p className="text-[7px] font-bold tracking-widest uppercase text-[#666666]">TERJUAL BULAN INI</p>
                <p className="text-2xl font-normal text-[#333333] font-serif">{totalTerjualBulanIni}</p>
              </div>
              <div className="border border-[#CCCCCC] bg-[#EFECE6] p-2 space-y-1">
                <p className="text-[7px] font-bold tracking-widest uppercase text-[#666666]">REMINDER LIMITED STOCK</p>
                <p className="text-2xl font-normal text-[#333333] font-serif">{totalLimitedStock}</p>
              </div>
            </div>

            {/* 2 TOTAL SUMMARY CARDS */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-[8px] font-bold tracking-[0.15em] uppercase text-[#666666]">TOTAL PENJUALAN BULAN INI</p>
                <p className="text-sm font-bold tracking-wider text-[#333333] mt-1">
                  IDR. {totalPenjualanRp.toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-[8px] font-bold tracking-[0.15em] uppercase text-[#666666]">TOTAL SHARE PROFIT</p>
                <p className="text-sm font-bold tracking-wider text-[#333333] mt-1">
                  IDR. {totalShareProfitRp.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <hr className="border-t-2 border-[#8E7CC3] my-4" />

            {/* DAFTAR MITRA */}
            <div className="space-y-4">
              <h3 className="text-center text-sm font-bold tracking-[0.25em] uppercase text-[#333333]">
                DAFTAR MITRA
              </h3>

              {reports.map((item) => (
                <div key={item.storeId} className="border border-[#CCCCCC] bg-[#EFECE6] p-3 flex gap-3 items-center shadow-2xs">
                  <img
                    src={item.photoUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200'}
                    alt={item.storeName}
                    className="w-20 h-20 object-cover border border-[#CCCCCC]"
                  />

                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="font-bold text-xs tracking-wider uppercase text-[#333333]">{item.storeName}</h4>
                      <p className="text-[9px] uppercase tracking-wider text-[#666666]">{item.alamat || 'KOPANG'}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div className="bg-[#E5E0D8] p-1 border border-[#CCCCCC]">
                        <p className="text-[6px] font-bold uppercase text-[#777777]">TOTAL PENJUALAN</p>
                        <p className="text-xs font-bold text-[#333333]">{item.totalQty || 0}</p>
                      </div>
                      <div className="bg-[#E5E0D8] p-1 border border-[#CCCCCC]">
                        <p className="text-[6px] font-bold uppercase text-[#777777]">SISA STOCK</p>
                        <p className="text-xs font-bold text-[#333333]">{item.totalStock || 0}</p>
                      </div>
                      <div className="bg-[#E5E0D8] p-1 border border-[#CCCCCC]">
                        <p className="text-[6px] font-bold uppercase text-[#777777]">ORDER STOCK</p>
                        <p className="text-xs font-bold text-[#333333]">5</p>
                      </div>
                    </div>
                  </div>

                  <div className="w-24 text-right space-y-1.5">
                    <div>
                      <p className="text-[7px] font-bold uppercase text-[#777777]">PROFIT</p>
                      <p className="text-[10px] font-bold text-[#333333]">
                        IDR. {(item.totalStoreCommission || 0).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => window.open(`https://wa.me/${(item.phone || '').replace(/[^0-9]/g, '')}`, '_blank')}
                      className="w-full bg-[#E5E0D8] text-[#333333] py-1 text-[8px] font-bold uppercase tracking-wider border border-[#CCCCCC]"
                    >
                      INBOX
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMitraId(item.storeId.toString());
                        setActiveTab('mitra');
                      }}
                      className="w-full bg-[#8D5B4C] hover:bg-[#7A4E41] text-white py-1 text-[8px] font-bold uppercase tracking-wider"
                    >
                      EDIT INFO
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <hr className="border-t-2 border-[#8E7CC3] my-4" />

            {/* FORM TAMBAH MITRA */}
            <div className="bg-[#C8C4B8] border border-[#B8B4A8] p-4 space-y-4">
              <h3 className="text-center text-xs font-bold tracking-[0.25em] uppercase text-[#333333]">
                TAMBAH MITRA
              </h3>

              <form onSubmit={handleAddMitra} className="space-y-3">
                <div className="flex gap-3 items-center">
                  <label className="w-24 h-20 bg-[#00A896] text-white flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:bg-[#008D7D] transition">
                    <span className="text-[8px] font-bold tracking-wider uppercase leading-tight">
                      UPLOAD PHOTO HERE
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, setMitraPhotoBase64)}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-1 grid grid-cols-2 gap-2 text-[9px] font-bold uppercase">
                    <div className="flex items-center gap-1">
                      <span className="w-16">NAMA TOKO</span>
                      <input
                        type="text"
                        value={namaToko}
                        onChange={(e) => setNamaToko(e.target.value)}
                        required
                        className="flex-1 bg-white border border-[#B3AE9F] p-1 text-[9px] outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-16">KONTAK</span>
                      <input
                        type="text"
                        value={kontak}
                        onChange={(e) => setKontak(e.target.value)}
                        required
                        className="flex-1 bg-white border border-[#B3AE9F] p-1 text-[9px] outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-16">OWNER</span>
                      <input
                        type="text"
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                        required
                        className="flex-1 bg-white border border-[#B3AE9F] p-1 text-[9px] outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-16">FEE (%)</span>
                      <input
                        type="number"
                        value={fee}
                        onChange={(e) => setFee(e.target.value)}
                        required
                        className="flex-1 bg-white border border-[#B3AE9F] p-1 text-[9px] outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-16">ALAMAT</span>
                      <input
                        type="text"
                        value={alamat}
                        onChange={(e) => setAlamat(e.target.value)}
                        required
                        className="flex-1 bg-white border border-[#B3AE9F] p-1 text-[9px] outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-16">PASWORD</span>
                      <input
                        type="text"
                        value={pasword}
                        onChange={(e) => setPasword(e.target.value)}
                        required
                        className="flex-1 bg-white border border-[#B3AE9F] p-1 text-[9px] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#8D5B4C] hover:bg-[#7A4E41] text-white px-8 py-2 text-xs font-bold tracking-[0.2em] uppercase transition"
                  >
                    {isSubmitting ? 'MENYIMPAN...' : 'SUBMIT'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* ================= TAB 2: STOCK ================= */}
        {activeTab === 'stock' && (
          <>
            <div className="text-center">
              <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-[#333333]">
                {editingProductId ? 'EDIT STOCK PRODUK' : 'INPUT STOCK'}
              </h2>
            </div>

            <div className="bg-[#EFECE6] border border-[#CCCCCC] p-5 shadow-2xs">
              <form onSubmit={handleStockSubmit} className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="flex-1 space-y-2 text-[9px] font-bold uppercase">
                    <div className="flex items-center gap-2">
                      <span className="w-24 text-[#555555]">CATEGORY</span>
                      <div className="relative flex-1">
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-white border border-[#B3AE9F] p-1.5 text-[9px] uppercase outline-none appearance-none"
                        >
                          <option value="TOPI">TOPI</option>
                          <option value="PAKAIAN">PAKAIAN</option>
                          <option value="AKSESORIS">AKSESORIS</option>
                          <option value="SEPATU">SEPATU</option>
                        </select>
                        <span className="absolute right-2 top-2 text-[8px] pointer-events-none">▼</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-24 text-[#555555]">SKU PRODUCT</span>
                      <input
                        type="text"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        required
                        className="flex-1 bg-white border border-[#B3AE9F] p-1.5 text-[9px] outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-24 text-[#555555]">NAMA PRODUCT</span>
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        required
                        className="flex-1 bg-white border border-[#B3AE9F] p-1.5 text-[9px] outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-24 text-[#555555]">STOCK</span>
                      <input
                        type="number"
                        value={stockQty}
                        onChange={(e) => setStockQty(e.target.value)}
                        required
                        className="flex-1 bg-white border border-[#B3AE9F] p-1.5 text-[9px] outline-none"
                      />
                    </div>
                  </div>

                  <div className="w-36 space-y-3">
                    <div className="flex items-center gap-1 text-[9px] font-bold uppercase">
                      <span className="text-[#555555]">HARGA</span>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        className="w-full bg-white border border-[#B3AE9F] p-1.5 text-[9px] outline-none"
                      />
                    </div>

                    <label className="w-full h-24 bg-[#00A896] hover:bg-[#008D7D] text-white flex flex-col items-center justify-center p-2 text-center cursor-pointer transition relative overflow-hidden">
                      {productPhoto ? (
                        <img src={productPhoto} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] font-bold tracking-wider uppercase leading-tight">
                          UPLOAD PHOTO HERE
                        </span>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, setProductPhoto)} className="hidden" />
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#8D5B4C] hover:bg-[#7A4E41] text-white py-2 text-[10px] font-bold tracking-[0.2em] uppercase transition"
                    >
                      {isSubmitting ? 'SAVING...' : 'SUBMIT'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="pt-4 text-center">
              <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-[#333333]">
                LIST STOCK
              </h2>
            </div>

            <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-wider text-[#666666]">
              <div className="flex items-center gap-2">
                <span>SHORT BY CATEGORY</span>
                <select
                  value={shortCategory}
                  onChange={(e) => setShortCategory(e.target.value)}
                  className="bg-transparent border-b border-[#888888] text-[8px] font-bold outline-none"
                >
                  <option value="ALL">ALL CATEGORIES</option>
                  <option value="TOPI">TOPI</option>
                  <option value="PAKAIAN">PAKAIAN</option>
                  <option value="AKSESORIS">AKSESORIS</option>
                  <option value="SEPATU">SEPATU</option>
                </select>
              </div>
              <div className="flex items-center gap-1 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <span>UP</span>
                <span>▲</span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 text-center text-[7px] font-bold uppercase tracking-widest text-[#777777] border-b pb-1">
              <span>PHOTO</span>
              <span>SKU</span>
              <span>NAMA PRODUCT</span>
              <span>CATEGORY</span>
              <span>STOCK</span>
              <span>PRICE</span>
            </div>

            <div className="space-y-3">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="border border-[#CCCCCC] bg-[#EFECE6] p-2 flex gap-2 items-center shadow-2xs"
                >
                  <img
                    src={p.photoUrl || 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=150'}
                    alt={p.name}
                    className="w-14 h-14 object-cover border border-[#CCCCCC]"
                  />

                  <div className="flex-1 grid grid-cols-5 gap-1.5 text-center text-[8px] font-bold uppercase">
                    <div className="bg-[#E5E0D8] p-2 border border-[#CCCCCC] flex items-center justify-center">
                      <span>{p.sku || 'TOP-01'}</span>
                    </div>

                    <div className="bg-[#E5E0D8] p-2 border border-[#CCCCCC] flex items-center justify-center">
                      <span className="truncate">{p.name}</span>
                    </div>

                    <div className="bg-[#E5E0D8] p-2 border border-[#CCCCCC] flex items-center justify-center">
                      <span>{p.category || 'TOPI'}</span>
                    </div>

                    <div className="bg-[#E5E0D8] p-2 border border-[#CCCCCC] flex items-center justify-center">
                      <span>{p.stock || 12}</span>
                    </div>

                    <div className="bg-[#E5E0D8] p-2 border border-[#CCCCCC] flex items-center justify-center">
                      <span>IDR. {(p.price || 300000).toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEditStockClick(p)}
                    className="bg-[#8D5B4C] hover:bg-[#7A4E41] text-white px-3 py-4 text-[9px] font-bold uppercase tracking-widest"
                  >
                    EDIT
                  </button>
                </div>
              ))}
            </div>

            <div className="text-center pt-2">
              <span className="text-lg text-[#666666]">▼</span>
            </div>
          </>
        )}

        {/* ================= TAB 3: MITRA ================= */}
        {activeTab === 'mitra' && (
          <div className="space-y-6">
            <div className="bg-white p-4 border border-[#CCCCCC] space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase">PILIH NAMA TOKO: </label>
                <select
                  value={selectedMitraId}
                  onChange={(e) => setSelectedMitraId(e.target.value)}
                  className="p-2 border font-bold text-xs uppercase"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-center text-xs font-bold tracking-[0.2em] uppercase">STOK TOKO TERPILIH</h3>
              {activeMitraData?.stockList?.map((item: any) => (
                <div key={item.inventoryId} className="border bg-white p-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs">{item.productName}</h4>
                    <p className="text-[10px] text-gray-500">Stok Toko: {item.stock} pcs | IDR {item.price?.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}