'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stock' | 'mitra'>('mitra');

  const [reports, setReports] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);

  // State Halaman Dashboard & Stock
  const [namaToko, setNamaToko] = useState('');
  const [owner, setOwner] = useState('');
  const [alamat, setAlamat] = useState('');
  const [kontak, setKontak] = useState('');
  const [fee, setFee] = useState('15');
  const [pasword, setPasword] = useState('123456');
  const [mitraPhotoBase64, setMitraPhotoBase64] = useState('');

  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [category, setCategory] = useState('TOPI');
  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [price, setPrice] = useState('');
  const [productPhoto, setProductPhoto] = useState('');
  const [shortCategory, setShortCategory] = useState('ALL');

  // State Halaman Monitoring Mitra
  const [selectedMitraId, setSelectedMitraId] = useState<string>('');
  const [editPasswordInput, setEditPasswordInput] = useState('');
  const [addStockProductSku, setAddStockProductSku] = useState('');
  const [addStockQty, setAddStockQty] = useState('');
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
          setEditPasswordInput(dataR[0].password || '123456');
        }
      }
      if (resP.ok) {
        const dataP = await resP.json();
        setProducts(dataP);
        if (dataP.length > 0 && !addStockProductSku) {
          setAddStockProductSku(dataP[0].sku || '');
        }
      }
      if (resS.ok) setStores(await resS.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // COMPRESS PHOTO TO 200x200 PX
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

  // HANDLER UPDATE PASSWORD MITRA
  const handleUpdatePassword = async () => {
    if (!selectedMitraId || !editPasswordInput) return;
    try {
      const res = await fetch('/api/stores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedMitraId, password: editPasswordInput }),
      });
      if (res.ok) {
        alert('Password Mitra Berhasil Diperbarui!');
        await fetchData();
      } else {
        alert('Gagal memperbarui password.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // HANDLER TAMBAH STOK KE TOKO MITRA
  const handleAddStockToMitra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMitraId || !addStockProductSku || !addStockQty) return;
    setIsSubmitting(true);

    try {
      const selectedProduct = products.find((p) => p.sku === addStockProductSku);
      if (!selectedProduct) return alert('Produk tidak ditemukan!');

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: Number(selectedMitraId),
          productId: selectedProduct.id,
          stockToAdd: Number(addStockQty),
        }),
      });

      if (res.ok) {
        alert(`Berhasil menambahkan ${addStockQty} pcs stok ke toko!`);
        setAddStockQty('');
        await fetchData();
      } else {
        alert('Gagal mengalokasikan stok.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // HANDLER CREATE QR CODE UNIK (FLIP.ID INTEGRATION)
  const handleCreateQR = async (productId: number) => {
    if (!selectedMitraId) return alert('Pilih Toko Mitra terlebih dahulu!');
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: Number(selectedMitraId), productId, stockToAdd: 0 }),
      });

      const data = await res.json();
      if (res.ok) {
        setQrModalData(data);
      } else {
        alert('Gagal membuat QR Tag: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Kesalahan koneksi saat membuat QR Code.');
    }
  };

  // HANDLER SUBMIT MITRA BARU
  const handleAddMitra = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: namaToko, phone: kontak, owner, alamat,
          commissionRate: parseFloat(fee), password: pasword, photoUrl: mitraPhotoBase64,
          username: namaToko.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
        }),
      });
      if (res.ok) {
        alert('Mitra Berhasil Ditambahkan!');
        setNamaToko(''); setOwner(''); setAlamat(''); setKontak(''); setMitraPhotoBase64('');
        await fetchData();
      }
    } finally { setIsSubmitting(false); }
  };

  // HANDLER SUBMIT STOK BARU
  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const endpoint = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
      const method = editingProductId ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, name: productName, category, price: parseFloat(price), stock: parseInt(stockQty) || 0, photoUrl: productPhoto }),
      });
      if (res.ok) {
        alert('Stok produk berhasil disimpan!');
        setEditingProductId(null); setCategory('TOPI'); setSku(''); setProductName(''); setStockQty(''); setPrice(''); setProductPhoto('');
        await fetchData();
      }
    } finally { setIsSubmitting(false); }
  };

  // DATA COMPUTATIONS
  const totalMitraCount = stores.length || reports.length;
  const totalVarianCount = products.length;
  const totalTerjualBulanIni = reports.reduce((sum, r) => sum + (r.totalQty || 0), 0);
  const totalLimitedStock = reports.reduce((sum, r) => sum + (r.stockList?.filter((i: any) => i.stock < 5).length || 0), 0);
  const totalPenjualanRp = reports.reduce((sum, r) => sum + (r.totalGrossSales || 0), 0);
  const totalShareProfitRp = reports.reduce((sum, r) => sum + (r.totalStoreCommission || 0), 0);

  const activeMitraData = reports.find((r) => r.storeId.toString() === selectedMitraId) || reports[0];
  const stockListMitra = activeMitraData?.stockList || [];

  const selectedProductDetail = products.find((p) => p.sku === addStockProductSku) || products[0];

  return (
    <div className="min-h-screen bg-[#EFECE6] text-[#333333] font-sans antialiased pb-20">
      {/* HEADER LOGO & LOGOUT */}
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

            <div className="space-y-4">
              <h3 className="text-center text-sm font-bold tracking-[0.25em] uppercase text-[#333333]">DAFTAR MITRA</h3>
              {reports.map((item) => (
                <div key={item.storeId} className="border border-[#CCCCCC] bg-[#EFECE6] p-3 flex gap-3 items-center shadow-2xs">
                  <img src={item.photoUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200'} alt={item.storeName} className="w-20 h-20 object-cover border border-[#CCCCCC]" />
                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="font-bold text-xs tracking-wider uppercase text-[#333333]">{item.storeName}</h4>
                      <p className="text-[9px] uppercase tracking-wider text-[#666666]">{item.alamat || 'KOPANG'}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div className="bg-[#E5E0D8] p-1 border border-[#CCCCCC]"><p className="text-[6px] font-bold uppercase text-[#777777]">TOTAL PENJUALAN</p><p className="text-xs font-bold text-[#333333]">{item.totalQty || 0}</p></div>
                      <div className="bg-[#E5E0D8] p-1 border border-[#CCCCCC]"><p className="text-[6px] font-bold uppercase text-[#777777]">SISA STOCK</p><p className="text-xs font-bold text-[#333333]">{item.totalStock || 0}</p></div>
                      <div className="bg-[#E5E0D8] p-1 border border-[#CCCCCC]"><p className="text-[6px] font-bold uppercase text-[#777777]">ORDER STOCK</p><p className="text-xs font-bold text-[#333333]">5</p></div>
                    </div>
                  </div>
                  <div className="w-24 text-right space-y-1.5">
                    <div><p className="text-[7px] font-bold uppercase text-[#777777]">PROFIT</p><p className="text-[10px] font-bold text-[#333333]">IDR. {(item.totalStoreCommission || 0).toLocaleString('id-ID')}</p></div>
                    <button onClick={() => window.open(`https://wa.me/${(item.phone || '').replace(/[^0-9]/g, '')}`, '_blank')} className="w-full bg-[#E5E0D8] text-[#333333] py-1 text-[8px] font-bold uppercase border">INBOX</button>
                    <button onClick={() => { setSelectedMitraId(item.storeId.toString()); setEditPasswordInput(item.password || '123456'); setActiveTab('mitra'); }} className="w-full bg-[#8D5B4C] text-white py-1 text-[8px] font-bold uppercase">EDIT INFO</button>
                  </div>
                </div>
              ))}
            </div>

            <hr className="border-t-2 border-[#8E7CC3] my-4" />

            <div className="bg-[#C8C4B8] border border-[#B8B4A8] p-4 space-y-4">
              <h3 className="text-center text-xs font-bold tracking-[0.25em] uppercase text-[#333333]">TAMBAH MITRA</h3>
              <form onSubmit={handleAddMitra} className="space-y-3">
                <div className="flex gap-3 items-center">
                  <label className="w-24 h-20 bg-[#00A896] text-white flex flex-col items-center justify-center p-2 text-center cursor-pointer">
                    <span className="text-[8px] font-bold uppercase">UPLOAD PHOTO HERE</span>
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, setMitraPhotoBase64)} className="hidden" />
                  </label>
                  <div className="flex-1 grid grid-cols-2 gap-2 text-[9px] font-bold uppercase">
                    <div className="flex items-center gap-1"><span className="w-16">NAMA TOKO</span><input type="text" value={namaToko} onChange={(e) => setNamaToko(e.target.value)} required className="flex-1 bg-white border p-1 text-[9px]" /></div>
                    <div className="flex items-center gap-1"><span className="w-16">KONTAK</span><input type="text" value={kontak} onChange={(e) => setKontak(e.target.value)} required className="flex-1 bg-white border p-1 text-[9px]" /></div>
                    <div className="flex items-center gap-1"><span className="w-16">OWNER</span><input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} required className="flex-1 bg-white border p-1 text-[9px]" /></div>
                    <div className="flex items-center gap-1"><span className="w-16">FEE (%)</span><input type="number" value={fee} onChange={(e) => setFee(e.target.value)} required className="flex-1 bg-white border p-1 text-[9px]" /></div>
                    <div className="flex items-center gap-1"><span className="w-16">ALAMAT</span><input type="text" value={alamat} onChange={(e) => setAlamat(e.target.value)} required className="flex-1 bg-white border p-1 text-[9px]" /></div>
                    <div className="flex items-center gap-1"><span className="w-16">PASWORD</span><input type="text" value={pasword} onChange={(e) => setPasword(e.target.value)} required className="flex-1 bg-white border p-1 text-[9px]" /></div>
                  </div>
                </div>
                <div className="text-center pt-2"><button type="submit" disabled={isSubmitting} className="bg-[#8D5B4C] text-white px-8 py-2 text-xs font-bold uppercase">{isSubmitting ? 'MENYIMPAN...' : 'SUBMIT'}</button></div>
              </form>
            </div>
          </>
        )}

        {/* ================= TAB 2: STOCK ================= */}
        {activeTab === 'stock' && (
          <>
            <div className="text-center"><h2 className="text-xs font-bold tracking-[0.3em] uppercase">{editingProductId ? 'EDIT STOCK PRODUK' : 'INPUT STOCK'}</h2></div>
            <div className="bg-[#EFECE6] border p-5 shadow-2xs">
              <form onSubmit={handleStockSubmit} className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="flex-1 space-y-2 text-[9px] font-bold uppercase">
                    <div className="flex items-center gap-2"><span className="w-24 text-[#555555]">CATEGORY</span><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-white border p-1.5 text-[9px] uppercase"><option value="TOPI">TOPI</option><option value="PAKAIAN">PAKAIAN</option><option value="AKSESORIS">AKSESORIS</option><option value="SEPATU">SEPATU</option></select></div>
                    <div className="flex items-center gap-2"><span className="w-24 text-[#555555]">SKU PRODUCT</span><input type="text" value={sku} onChange={(e) => setSku(e.target.value)} required className="flex-1 bg-white border p-1.5 text-[9px]" /></div>
                    <div className="flex items-center gap-2"><span className="w-24 text-[#555555]">NAMA PRODUCT</span><input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} required className="flex-1 bg-white border p-1.5 text-[9px]" /></div>
                    <div className="flex items-center gap-2"><span className="w-24 text-[#555555]">STOCK</span><input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} required className="flex-1 bg-white border p-1.5 text-[9px]" /></div>
                  </div>
                  <div className="w-36 space-y-3">
                    <div className="flex items-center gap-1 text-[9px] font-bold uppercase"><span className="text-[#555555]">HARGA</span><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full bg-white border p-1.5 text-[9px]" /></div>
                    <label className="w-full h-24 bg-[#00A896] text-white flex flex-col items-center justify-center p-2 text-center cursor-pointer">{productPhoto ? <img src={productPhoto} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-[9px] font-bold uppercase">UPLOAD PHOTO HERE</span>}<input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, setProductPhoto)} className="hidden" /></label>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-[#8D5B4C] text-white py-2 text-[10px] font-bold uppercase">{isSubmitting ? 'SAVING...' : 'SUBMIT'}</button>
                  </div>
                </div>
              </form>
            </div>

            <div className="pt-4 text-center"><h2 className="text-sm font-bold tracking-[0.3em] uppercase">LIST STOCK</h2></div>
            <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-wider text-[#666666]">
              <div className="flex items-center gap-2"><span>SHORT BY CATEGORY</span><select value={shortCategory} onChange={(e) => setShortCategory(e.target.value)} className="bg-transparent border-b text-[8px] font-bold"><option value="ALL">ALL CATEGORIES</option><option value="TOPI">TOPI</option><option value="PAKAIAN">PAKAIAN</option><option value="AKSESORIS">AKSESORIS</option></select></div>
              <div className="flex items-center gap-1 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span>UP</span><span>▲</span></div>
            </div>

            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="border bg-[#EFECE6] p-2 flex gap-2 items-center">
                  <img src={p.photoUrl || 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=150'} alt={p.name} className="w-14 h-14 object-cover border" />
                  <div className="flex-1 grid grid-cols-5 gap-1.5 text-center text-[8px] font-bold uppercase">
                    <div className="bg-[#E5E0D8] p-2 border"><span>{p.sku || 'TOP-01'}</span></div>
                    <div className="bg-[#E5E0D8] p-2 border"><span className="truncate">{p.name}</span></div>
                    <div className="bg-[#E5E0D8] p-2 border"><span>{p.category || 'TOPI'}</span></div>
                    <div className="bg-[#E5E0D8] p-2 border"><span>{p.stock || 12}</span></div>
                    <div className="bg-[#E5E0D8] p-2 border"><span>IDR. {(p.price || 300000).toLocaleString('id-ID')}</span></div>
                  </div>
                  <button onClick={() => { setEditingProductId(p.id); setCategory(p.category); setSku(p.sku); setProductName(p.name); setPrice(p.price); setStockQty(p.stock); setProductPhoto(p.photoUrl); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-[#8D5B4C] text-white px-3 py-4 text-[9px] font-bold uppercase">EDIT</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ================= TAB 3: MONITORING MITRA (SESUAI MOCK-UP 3) ================= */}
        {activeTab === 'mitra' && (
          <>
            <div className="text-center">
              <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-[#333333]">
                MONITORING MITRA
              </h2>
            </div>

            {/* HEADER METRICS MITRA */}
            <div className="space-y-4">
              {/* ROW 1: SELECT NAMA TOKO & EDIT PASSWORD */}
              <div className="grid grid-cols-2 gap-4 text-[9px] font-bold uppercase">
                <div className="flex items-center gap-2">
                  <span className="w-20 text-[#555555]">NAMA TOKO</span>
                  <div className="relative flex-1">
                    <select
                      value={selectedMitraId}
                      onChange={(e) => {
                        setSelectedMitraId(e.target.value);
                        const storeFound = reports.find((r) => r.storeId.toString() === e.target.value);
                        if (storeFound) setEditPasswordInput(storeFound.password || '123456');
                      }}
                      className="w-full bg-white border border-[#B3AE9F] p-2 text-[9px] font-bold uppercase outline-none appearance-none"
                    >
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-2 top-2 text-[8px] pointer-events-none">▼</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-20 text-[#555555]">PASSWORD</span>
                  <input
                    type="text"
                    value={editPasswordInput}
                    onChange={(e) => setEditPasswordInput(e.target.value)}
                    className="flex-1 bg-white border border-[#B3AE9F] p-2 text-[9px] outline-none"
                  />
                  <button
                    onClick={handleUpdatePassword}
                    className="bg-[#00A896] hover:bg-[#008D7D] text-white px-2 py-2 text-[8px] font-bold uppercase"
                  >
                    UBAH
                  </button>
                </div>
              </div>

              {/* ROW 2: OWNER, ALAMAT, CONTACT, SALES FEE */}
              <div className="grid grid-cols-4 gap-2 text-center text-[8px] font-bold uppercase">
                <div>
                  <p className="text-[#777777] mb-1">OWNER</p>
                  <div className="bg-white p-2 border border-[#CCCCCC]">{activeMitraData?.owner || 'AMIN'}</div>
                </div>
                <div>
                  <p className="text-[#777777] mb-1">ALAMAT</p>
                  <div className="bg-white p-2 border border-[#CCCCCC]">{activeMitraData?.alamat || 'MANTANG'}</div>
                </div>
                <div>
                  <p className="text-[#777777] mb-1">CONTACT</p>
                  <div className="bg-white p-2 border border-[#CCCCCC]">{activeMitraData?.phone || '081333939393'}</div>
                </div>
                <div>
                  <p className="text-[#777777] mb-1">SALES FEE</p>
                  <div className="bg-white p-2 border border-[#CCCCCC]">{activeMitraData?.commissionRate || 15}%</div>
                </div>
              </div>

              {/* ROW 3: FOTO TOKO + 3 CARDS (TOTAL STOCK, TERJUAL BULAN INI, PROFIT SHARING) */}
              <div className="grid grid-cols-4 gap-2 items-center text-center">
                {/* Store Photo Container */}
                <div className="space-y-1">
                  <img
                    src={activeMitraData?.photoUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200'}
                    alt="Store Photo"
                    className="w-full h-20 object-cover border border-[#CCCCCC]"
                  />
                  <label className="block w-full bg-[#8D5B4C] hover:bg-[#7A4E41] text-white py-1 text-[7px] font-bold uppercase tracking-wider cursor-pointer">
                    GANTI PHOTO
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, setMitraPhotoBase64)} className="hidden" />
                  </label>
                </div>

                <div className="border border-[#CCCCCC] bg-[#EFECE6] p-3 space-y-1">
                  <p className="text-[7px] font-bold uppercase tracking-widest text-[#666666]">TOTAL STOCK</p>
                  <p className="text-3xl font-normal text-[#333333] font-serif">{activeMitraData?.totalStock || 5}</p>
                </div>

                <div className="border border-[#CCCCCC] bg-[#EFECE6] p-3 space-y-1">
                  <p className="text-[7px] font-bold uppercase tracking-widest text-[#666666]">TERJUAL BULAN INI</p>
                  <p className="text-3xl font-normal text-[#333333] font-serif">{activeMitraData?.totalQty || 4}</p>
                </div>

                <div className="border border-[#CCCCCC] bg-[#EFECE6] p-3 space-y-1">
                  <p className="text-[7px] font-bold uppercase tracking-widest text-[#666666]">PROFIT SHARING</p>
                  <p className="text-[9px] font-bold text-[#666666]">IDR.</p>
                  <p className="text-xl font-normal text-[#333333] font-serif">
                    {(activeMitraData?.totalStoreCommission || 210000).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION TITLE: STOCK TOKO */}
            <div className="pt-4 text-center">
              <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-[#333333]">
                STOCK TOKO
              </h2>
            </div>

            {/* TABLE HEADERS & FILTER */}
            <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-wider text-[#666666]">
              <div className="flex items-center gap-2">
                <span>SHORT BY CATEGORY</span>
                <select className="bg-transparent border-b text-[8px] font-bold outline-none">
                  <option value="ALL">ALL CATEGORIES</option>
                  <option value="TOPI">TOPI</option>
                </select>
              </div>
              <div className="flex items-center gap-1 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <span>UP</span><span>▲</span>
              </div>
            </div>

            {/* LIST STOCK TOKO MITRA */}
            <div className="space-y-3">
              {stockListMitra.map((item: any) => {
                const isLowStock = item.stock < 5;

                return (
                  <div key={item.inventoryId} className="border border-[#CCCCCC] bg-[#EFECE6] p-2 flex gap-2 items-center shadow-2xs">
                    <img
                      src="https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=150"
                      alt={item.productName}
                      className="w-14 h-14 object-cover border border-[#CCCCCC]"
                    />

                    <div className="flex-1 grid grid-cols-5 gap-1 text-center text-[8px] font-bold uppercase">
                      <div className="bg-[#E5E0D8] p-2 border border-[#CCCCCC] flex items-center justify-center">
                        <span>{item.sku || 'TOP-01'}</span>
                      </div>
                      <div className="bg-[#E5E0D8] p-2 border border-[#CCCCCC] flex items-center justify-center">
                        <span className="truncate">{item.productName}</span>
                      </div>
                      <div className="bg-[#E5E0D8] p-2 border border-[#CCCCCC] flex items-center justify-center">
                        <span>{item.category || 'TOPI'}</span>
                      </div>
                      <div className="bg-[#E5E0D8] p-2 border border-[#CCCCCC] flex items-center justify-center">
                        <span>{item.stock}</span>
                      </div>
                      <div className="bg-[#E5E0D8] p-2 border border-[#CCCCCC] flex items-center justify-center">
                        <span>IDR. {(item.price || 300000).toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* TWO ACTION BUTTONS: TAMBAH STOCK & CREATE QR */}
                    <div className="w-32 space-y-1">
                      {/* TOMBOL MERAH JIKA STOK < 5 */}
                      <button
                        type="button"
                        onClick={() => {
                          setAddStockProductSku(item.sku || '');
                          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                        }}
                        className={`w-full py-1.5 text-[8px] font-bold uppercase tracking-wider transition ${
                          isLowStock
                            ? 'bg-[#FF3B30] text-white hover:bg-[#E02D22]'
                            : 'bg-[#8D5B4C] text-white hover:bg-[#7A4E41]'
                        }`}
                      >
                        TAMBAH STOCK
                      </button>

                      {/* TOMBOL CREATE QR CODE UNIK */}
                      <button
                        type="button"
                        onClick={() => handleCreateQR(item.productId)}
                        className="w-full bg-[#8D5B4C] hover:bg-[#7A4E41] text-white py-1.5 text-[8px] font-bold uppercase tracking-wider"
                      >
                        CREATE QR
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FORM TAMBAH STOCK TOKO */}
            <div className="bg-[#C8C4B8] border border-[#B8B4A8] p-4 space-y-3 my-6">
              <h3 className="text-center text-xs font-bold tracking-[0.25em] uppercase text-[#333333]">
                TAMBAH STOCK
              </h3>

              <form onSubmit={handleAddStockToMitra} className="flex gap-4 items-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#8D5B4C] hover:bg-[#7A4E41] text-white px-6 py-4 text-xs font-bold uppercase tracking-wider"
                >
                  {isSubmitting ? 'MENYIMPAN...' : 'TAMBAH STOCK'}
                </button>

                <div className="flex-1 space-y-2 text-[9px] font-bold uppercase">
                  <div className="flex items-center gap-2">
                    <span className="w-24 text-[#555555]">CATEGORY</span>
                    <select
                      value={selectedProductDetail?.category || 'TOPI'}
                      disabled
                      className="flex-1 bg-white border border-[#B3AE9F] p-1 text-[9px] uppercase outline-none"
                    >
                      <option value="TOPI">TOPI</option>
                      <option value="PAKAIAN">PAKAIAN</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-24 text-[#555555]">SKU PRODUCT</span>
                    <select
                      value={addStockProductSku}
                      onChange={(e) => setAddStockProductSku(e.target.value)}
                      className="flex-1 bg-white border border-[#B3AE9F] p-1 text-[9px] uppercase outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.sku}>
                          {p.sku} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-24 text-[#555555]">NAMA PRODUCT</span>
                    <input
                      type="text"
                      value={selectedProductDetail?.name || ''}
                      disabled
                      className="flex-1 bg-white border border-[#B3AE9F] p-1 text-[9px] outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-24 text-[#555555]">STOCK</span>
                    <input
                      type="number"
                      placeholder="JUMLAH ALOKASI STOK"
                      value={addStockQty}
                      onChange={(e) => setAddStockQty(e.target.value)}
                      required
                      className="flex-1 bg-white border border-[#B3AE9F] p-1 text-[9px] outline-none"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* SECTION HISTORY TRANSAKSI */}
            <div className="bg-white border border-[#CCCCCC] p-4 flex gap-4 items-start shadow-2xs">
              <div className="w-24 text-center font-bold text-xs uppercase tracking-widest text-[#333333] pt-2">
                HISTORY
              </div>
              <div className="flex-1 space-y-2 text-[9px] font-mono text-[#555555]">
                <div className="flex justify-between border-b pb-1">
                  <span>12-02-2026 _ 14.00</span>
                  <span>Penjualan TOP-01-TOPI MLB - 1 Buah - 300.000,-</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span>11-02-2026 _ 14.00</span>
                  <span>Penarikan Bulan Agustus - 250.000,-</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span>22-06-2026 _ 14.00</span>
                  <span>Penjualan TOP-01-TOPI MLB - 1 Buah - 300.000,-</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span>8-10-2026 _ 14.00</span>
                  <span>Penambahan Stock TOP-010TOPIMLB - 5 Buah</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* MODAL DISPLAY QR PAYMENT UNIK (FLIP.ID) */}
      {qrModalData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 max-w-sm w-full text-center space-y-4 rounded shadow-2xl">
            <h3 className="font-bold uppercase text-sm tracking-widest text-[#00A896]">
              QR PAYMENT UNIK (FLIP.ID)
            </h3>
            <img src={qrModalData.qrImageDataUrl} alt="QR Code" className="w-48 h-48 mx-auto border p-2" />
            <p className="text-[10px] text-gray-500 font-mono">
              Invoice: {qrModalData.orderNumber}
            </p>
            <button
              onClick={() => setQrModalData(null)}
              className="w-full bg-gray-200 py-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-300"
            >
              TUTUP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}