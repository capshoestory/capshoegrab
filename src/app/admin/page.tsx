'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stock' | 'mitra'>('dashboard');

  const [reports, setReports] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);

  // Form State Tambah Mitra
  const [namaToko, setNamaToko] = useState('');
  const [owner, setOwner] = useState('');
  const [alamat, setAlamat] = useState('');
  const [kontak, setKontak] = useState('');
  const [fee, setFee] = useState('15');
  const [pasword, setPasword] = useState('123456');
  const [photoBase64, setPhotoBase64] = useState('');

  const fetchData = async () => {
    try {
      const [resR, resP, resS] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/products'),
        fetch('/api/stores'),
      ]);

      if (resR.ok) {
        const dataR = await resR.json();
        // Urutkan mitra berdasarkan total penjualan tertinggi ke terendah
        dataR.sort((a: any, b: any) => b.totalQty - a.totalQty);
        setReports(dataR);
      }
      if (resP.ok) setProducts(await resP.json());
      if (resS.ok) setStores(await resS.json());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Upload Photo Auto Compress (200x200)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setPhotoBase64(canvas.toDataURL('image/webp', 0.8));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddMitra = async (e: React.FormEvent) => {
    e.preventDefault();
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
        photoUrl: photoBase64,
        username: namaToko.toLowerCase().replace(/\s+/g, '_'),
      }),
    });

    if (res.ok) {
      alert('Mitra Berhasil Ditambahkan!');
      setNamaToko(''); setOwner(''); setAlamat(''); setKontak(''); setPhotoBase64('');
      fetchData();
    } else {
      alert('Gagal menambah mitra');
    }
  };

  // Akumulasi Metrik
  const totalMitraCount = stores.length || reports.length;
  const totalVarianCount = products.length;
  const totalTerjualBulanIni = reports.reduce((sum, r) => sum + (r.totalQty || 0), 0);
  const totalLimitedStock = reports.reduce((sum, r) => {
    const lowItems = r.stockList?.filter((i: any) => i.stock < 5).length || 0;
    return sum + lowItems;
  }, 0);

  const totalPenjualanRp = reports.reduce((sum, r) => sum + (r.totalGrossSales || 0), 0);
  const totalShareProfitRp = reports.reduce((sum, r) => sum + (r.totalStoreCommission || 0), 0);

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

      {/* NAVIGATION TABS */}
      <div className="bg-[#D8D4CA] border-b border-[#C8C4B8] px-4">
        <div className="max-w-xl mx-auto flex justify-center gap-1 pt-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 text-xs uppercase tracking-[0.2em] font-bold ${
              activeTab === 'dashboard'
                ? 'bg-[#EFECE6] text-[#333333]'
                : 'bg-[#00A896] text-white'
            }`}
          >
            DASHBOARD
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex-1 py-2 text-xs uppercase tracking-[0.2em] font-bold ${
              activeTab === 'stock'
                ? 'bg-[#EFECE6] text-[#333333]'
                : 'bg-[#00A896] text-white'
            }`}
          >
            STOCK
          </button>
          <button
            onClick={() => setActiveTab('mitra')}
            className={`flex-1 py-2 text-xs uppercase tracking-[0.2em] font-bold ${
              activeTab === 'mitra'
                ? 'bg-[#EFECE6] text-[#333333]'
                : 'bg-[#00A896] text-white'
            }`}
          >
            MITRA
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-xl mx-auto px-4 pt-6 space-y-8">
        {activeTab === 'dashboard' && (
          <>
            {/* WELCOME TITLE */}
            <div className="text-center">
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-[#555555]">
                SELAMAT DATANG DI HALAMAN<br />DASHBOARD MITRA.
              </h2>
            </div>

            {/* 4 TOP METRIC CARDS */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="border border-[#CCCCCC] bg-[#EFECE6] p-2 space-y-1">
                <p className="text-[7px] font-bold tracking-widest uppercase text-[#666666]">
                  JUMLAH MITRA
                </p>
                <p className="text-2xl font-normal text-[#333333] font-serif">{totalMitraCount}</p>
              </div>

              <div className="border border-[#CCCCCC] bg-[#EFECE6] p-2 space-y-1">
                <p className="text-[7px] font-bold tracking-widest uppercase text-[#666666]">
                  TOTAL VARIAN PRODUK
                </p>
                <p className="text-2xl font-normal text-[#333333] font-serif">{totalVarianCount}</p>
              </div>

              <div className="border border-[#CCCCCC] bg-[#EFECE6] p-2 space-y-1">
                <p className="text-[7px] font-bold tracking-widest uppercase text-[#666666]">
                  TERJUAL BULAN INI
                </p>
                <p className="text-2xl font-normal text-[#333333] font-serif">{totalTerjualBulanIni}</p>
              </div>

              <div className="border border-[#CCCCCC] bg-[#EFECE6] p-2 space-y-1">
                <p className="text-[7px] font-bold tracking-widest uppercase text-[#666666]">
                  REMINDER LIMITED STOCK
                </p>
                <p className="text-2xl font-normal text-[#333333] font-serif">{totalLimitedStock}</p>
              </div>
            </div>

            {/* 2 TOTAL SUMMARY CARDS */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-[8px] font-bold tracking-[0.15em] uppercase text-[#666666]">
                  TOTAL PENJUALAN BULAN INI
                </p>
                <p className="text-sm font-bold tracking-wider text-[#333333] mt-1">
                  IDR. {totalPenjualanRp.toLocaleString('id-ID')}
                </p>
              </div>

              <div>
                <p className="text-[8px] font-bold tracking-[0.15em] uppercase text-[#666666]">
                  TOTAL SHARE PROFIT
                </p>
                <p className="text-sm font-bold tracking-wider text-[#333333] mt-1">
                  IDR. {totalShareProfitRp.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <hr className="border-t-2 border-[#8E7CC3] my-4" />

            {/* SECTION DAFTAR MITRA */}
            <div className="space-y-4">
              <h3 className="text-center text-sm font-bold tracking-[0.25em] uppercase text-[#333333]">
                DAFTAR MITRA
              </h3>

              {reports.map((item) => (
                <div key={item.storeId} className="border border-[#CCCCCC] bg-[#EFECE6] p-3 flex gap-3 items-center shadow-2xs">
                  {/* Photo Toko */}
                  <img
                    src={item.photoUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200'}
                    alt={item.storeName}
                    className="w-20 h-20 object-cover border border-[#CCCCCC]"
                  />

                  {/* Info Toko & Metrics */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="font-bold text-xs tracking-wider uppercase text-[#333333]">
                        {item.storeName}
                      </h4>
                      <p className="text-[9px] uppercase tracking-wider text-[#666666]">
                        {item.alamat || 'KOPANG'}
                      </p>
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

                  {/* Profit & Action Buttons */}
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
                      className="w-full bg-[#E5E0D8] hover:bg-[#D8D4CA] text-[#333333] py-1 text-[8px] font-bold uppercase tracking-wider border border-[#CCCCCC]"
                    >
                      INBOX
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('mitra')}
                      className="w-full bg-[#8D5B4C] hover:bg-[#7A4E41] text-white py-1 text-[8px] font-bold uppercase tracking-wider"
                    >
                      EDIT INFO
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <hr className="border-t-2 border-[#8E7CC3] my-4" />

            {/* SECTION TAMBAH MITRA */}
            <div className="bg-[#C8C4B8] border border-[#B8B4A8] p-4 space-y-4">
              <h3 className="text-center text-xs font-bold tracking-[0.25em] uppercase text-[#333333]">
                TAMBAH MITRA
              </h3>

              <form onSubmit={handleAddMitra} className="space-y-3">
                <div className="flex gap-3 items-center">
                  {/* UPLOAD PHOTO BUTTON */}
                  <label className="w-24 h-20 bg-[#00A896] text-white flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:bg-[#008D7D] transition">
                    <span className="text-[8px] font-bold tracking-wider uppercase leading-tight">
                      UPLOAD PHOTO HERE
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {/* INPUT FIELDS GRID */}
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

                {/* SUBMIT BUTTON */}
                <div className="text-center pt-2">
                  <button
                    type="submit"
                    className="bg-[#8D5B4C] hover:bg-[#7A4E41] text-white px-8 py-2 text-xs font-bold tracking-[0.2em] uppercase transition"
                  >
                    SUBMIT
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* TAB STOCK */}
        {activeTab === 'stock' && (
          <div className="space-y-4 text-center py-10">
            <h3 className="font-serif font-bold uppercase tracking-widest text-sm">HALAMAN STOCK</h3>
            <p className="text-xs text-[#666666]">Silakan kelola stok produk pada tab ini.</p>
          </div>
        )}

        {/* TAB MITRA */}
        {activeTab === 'mitra' && (
          <div className="space-y-4 text-center py-10">
            <h3 className="font-serif font-bold uppercase tracking-widest text-sm">HALAMAN MITRA</h3>
            <p className="text-xs text-[#666666]">Silakan monitor detail mitra dan kelola QR Code unik.</p>
          </div>
        )}
      </main>
    </div>
  );
}