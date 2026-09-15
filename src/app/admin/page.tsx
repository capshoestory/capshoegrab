'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stock' | 'mitra'>('dashboard');

  // Data States
  const [reports, setReports] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);

  // Form Tambah Mitra Baru
  const [newStoreName, setNewStoreName] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newAlamat, setNewAlamat] = useState('');
  const [newKontak, setNewKontak] = useState('');
  const [newFee, setNewFee] = useState('15');
  const [newPassword, setNewPassword] = useState('123456');
  const [newPhotoBase64, setNewPhotoBase64] = useState('');

  // Selected Mitra di Tab Mitra
  const [selectedMitraId, setSelectedMitraId] = useState<string>('');
  const [mitraPassword, setMitraPassword] = useState('');
  const [mitraFee, setMitraFee] = useState('15');

  // State Form Stock
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('TOPI');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [productPhoto, setProductPhoto] = useState('');

  // Modal QR
  const [qrModalData, setQrModalData] = useState<any>(null);

  const fetchData = async () => {
    const [resR, resP, resS] = await Promise.all([
      fetch('/api/reports'),
      fetch('/api/products'),
      fetch('/api/stores'),
    ]);
    if (resR.ok) {
      const dataR = await resR.json();
      // Urutkan Mitra berdasarkan Total Penjualan Tertinggi ke Rendah
      dataR.sort((a: any, b: any) => b.totalQty - a.totalQty);
      setReports(dataR);
      if (dataR.length > 0 && !selectedMitraId) setSelectedMitraId(dataR[0].storeId.toString());
    }
    if (resP.ok) setProducts(await resP.json());
    if (resS.ok) setStores(await resS.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update password/fee mitra saat dropdown berubah
  useEffect(() => {
    const currentStore = stores.find((s) => s.id.toString() === selectedMitraId);
    if (currentStore) {
      setMitraPassword(currentStore.password || '123456');
      setMitraFee((currentStore.commissionRate || 15).toString());
    }
  }, [selectedMitraId, stores]);

  // FUNGSI COMPRESS PHOTO CLIENT-SIDE (200x200 PX)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
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
          callback(canvas.toDataURL('image/webp', 0.8));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // HANDLER TAMBAH MITRA
  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newStoreName,
        phone: newKontak,
        owner: newOwner,
        alamat: newAlamat,
        commissionRate: parseFloat(newFee),
        password: newPassword,
        photoUrl: newPhotoBase64,
        username: newStoreName.toLowerCase().replace(/\s+/g, '_'),
      }),
    });

    if (res.ok) {
      alert('Toko Mitra Berhasil Ditambahkan!');
      setNewStoreName(''); setNewOwner(''); setNewAlamat(''); setNewKontak(''); setNewPhotoBase64('');
      fetchData();
    }
  };

  // HANDLER UPDATE PASSWORD MITRA + WA NOTIF
  const handleUpdateMitraPassword = async () => {
    if (!confirm(`Apakah Anda yakin ingin merubah Password toko mitra ini menjadi "${mitraPassword}"?`)) return;

    const currentStore = stores.find((s) => s.id.toString() === selectedMitraId);
    const res = await fetch('/api/stores', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: Number(selectedMitraId),
        password: mitraPassword,
        commissionRate: parseFloat(mitraFee),
      }),
    });

    if (res.ok && currentStore) {
      // Direct WA ke Mitra untuk pemberitahuan perubahan password
      const waMsg = `Halo ${currentStore.name}, Password akun dashboard mitra Anda telah diperbarui menjadi: ${mitraPassword}`;
      window.open(`https://wa.me/${currentStore.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMsg)}`, '_blank');
      alert('Data Mitra dan Password berhasil diperbarui!');
      fetchData();
    }
  };

  // HANDLER CREATE UNIQUE QR CODE FOR FLIP PAYMENT
  const handleCreateQR = async (productId: number) => {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: selectedMitraId,
        productId: productId,
        stockToAdd: 0,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setQrModalData(data);
    } else {
      alert('Gagal membuat QR Tag: ' + data.error);
    }
  };

  const totalSalesMonth = reports.reduce((sum, r) => sum + r.totalGrossSales, 0);
  const totalShareProfit = reports.reduce((sum, r) => sum + r.totalStoreCommission, 0);
  const activeMitra = reports.find((r) => r.storeId.toString() === selectedMitraId) || reports[0];

  return (
    <div className="min-h-screen bg-[#ECE9E2] text-[#4A4741] font-sans antialiased pb-20">
      {/* HEADER LOGO CAPSHOE & LOGOUT */}
      <header className="bg-[#C2C5B4] px-6 py-4 border-b border-[#B0B3A2] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-[#00A896] text-white px-3 py-1 font-bold rounded">Capshoe</div>
          <span className="text-xs uppercase tracking-widest text-[#4A4741]">Adventure Story</span>
        </div>
        <button onClick={() => router.push('/')} className="text-xs tracking-widest uppercase font-bold text-[#686356]">
          LOG OUT
        </button>
      </header>

      {/* TABS NAVIGATION */}
      <div className="bg-[#C2C5B4] border-b border-[#B0B3A2] px-6">
        <div className="max-w-4xl mx-auto flex justify-center gap-2 pt-2">
          {['dashboard', 'stock', 'mitra'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-8 py-3 text-xs uppercase tracking-widest font-bold transition rounded-t-md ${
                activeTab === tab ? 'bg-[#00A896] text-white' : 'text-[#686356] hover:bg-[#B0B3A2]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-10">
        {/* TAB 1: DASHBOARD UTAMA ADMIN */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="font-serif text-sm tracking-widest uppercase font-bold text-[#4A4741]">
                SELAMAT DATANG DI HALAMAN DASHBOARD MITRA.
              </h2>
            </div>

            {/* AKUMULASI PENJUALAN & TOTAL SHARE PROFIT */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 text-center">
                <p className="text-[10px] uppercase text-[#736E60] font-bold">TOTAL PENJUALAN BULAN INI</p>
                <p className="font-serif text-2xl font-bold text-[#00A896] mt-2">
                  IDR. {totalSalesMonth.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 text-center">
                <p className="text-[10px] uppercase text-[#736E60] font-bold">TOTAL SHARE PROFIT</p>
                <p className="font-serif text-2xl font-bold text-[#965848] mt-2">
                  IDR. {totalShareProfit.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* LIST MITRA URUT DARI TERGI TINGGI */}
            <div className="space-y-4 pt-4">
              <h3 className="font-serif text-center text-sm tracking-widest uppercase font-bold">
                DAFTAR MITRA (SORTED BY HIGH SALES)
              </h3>
              {reports.map((r) => (
                <div key={r.storeId} className="border border-[#B3AE9F] bg-[#ECE9E2] p-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <img
                      src={r.photoUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150'}
                      alt={r.storeName}
                      className="w-16 h-16 object-cover border border-[#B3AE9F]"
                    />
                    <div>
                      <h4 className="font-bold text-sm tracking-wider uppercase">{r.storeName}</h4>
                      <p className="text-xs text-[#736E60]">Total Penjualan: {r.totalQty} pcs</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMitraId(r.storeId.toString());
                      setActiveTab('mitra');
                    }}
                    className="bg-[#965848] text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
                  >
                    EDIT INFO
                  </button>
                </div>
              ))}
            </div>

            {/* FORM TAMBAH MITRA (FEE & PASSWORD) */}
            <div className="bg-[#C8C4B7] border border-[#B3AE9F] p-6 space-y-4">
              <h3 className="font-serif text-center text-sm font-bold uppercase tracking-widest">TAMBAH MITRA</h3>
              <form onSubmit={handleAddStore} className="grid grid-cols-2 gap-4 text-xs font-bold uppercase">
                <div className="col-span-2 sm:col-span-1">
                  <label>Nama Toko</label>
                  <input
                    type="text"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    required
                    className="w-full p-2 mt-1 bg-white border border-[#B3AE9F]"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label>Kontak (WA)</label>
                  <input
                    type="text"
                    value={newKontak}
                    onChange={(e) => setNewKontak(e.target.value)}
                    required
                    className="w-full p-2 mt-1 bg-white border border-[#B3AE9F]"
                  />
                </div>
                <div>
                  <label>Fee (%)</label>
                  <input
                    type="number"
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
                    required
                    className="w-full p-2 mt-1 bg-white border border-[#B3AE9F]"
                  />
                </div>
                <div>
                  <label>Pasword</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full p-2 mt-1 bg-white border border-[#B3AE9F]"
                  />
                </div>
                <div className="col-span-2">
                  <label>Upload Photo Toko (Auto 200x200)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, setNewPhotoBase64)}
                    className="w-full p-2 mt-1 bg-white border border-[#B3AE9F]"
                  />
                </div>
                <button type="submit" className="col-span-2 bg-[#965848] text-white py-3 font-bold tracking-widest uppercase">
                  SUBMIT
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: STOCK */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            <h2 className="font-serif text-center font-bold tracking-widest uppercase">INPUT STOCK</h2>
            {/* Form Input/Edit Product... */}
          </div>
        )}

        {/* TAB 3: MONITORING MITRA & QR GENERATION */}
        {activeTab === 'mitra' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 border border-[#B3AE9F]">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest">PILIH NAMA TOKO: </label>
                <select
                  value={selectedMitraId}
                  onChange={(e) => setSelectedMitraId(e.target.value)}
                  className="p-2 border border-[#B3AE9F] font-bold text-xs uppercase"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mitraPassword}
                  onChange={(e) => setMitraPassword(e.target.value)}
                  className="p-2 border border-[#B3AE9F] text-xs font-mono"
                  placeholder="Password"
                />
                <button
                  onClick={handleUpdateMitraPassword}
                  className="bg-[#00A896] text-white px-4 py-2 text-xs font-bold uppercase"
                >
                  Simpan & Notif WA
                </button>
              </div>
            </div>

            {/* LIST STOCK TOKO & TOMBOL CREATE QR UNIK */}
            <div className="space-y-4">
              {activeMitra?.stockList?.map((item: any) => (
                <div key={item.inventoryId} className="border p-4 bg-white flex justify-between items-center">
                  <div>
                    <h4 className="font-bold">{item.productName}</h4>
                    <p className="text-xs text-[#736E60]">Stok: {item.stock} pcs</p>
                  </div>
                  <button
                    onClick={() => handleCreateQR(item.productId)}
                    className="bg-[#965848] text-white px-4 py-2 text-xs font-bold uppercase tracking-widest"
                  >
                    CREATE QR
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* POPUP MODAL QR CODE TAG (DIRECT FLIP.ID PAYMENT) */}
      {qrModalData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 max-w-sm w-full text-center space-y-4 rounded shadow-2xl">
            <h3 className="font-bold uppercase text-sm tracking-widest text-[#00A896]">
              QR PAYMENT UNIK (FLIP.ID)
            </h3>
            <img src={qrModalData.qrImageDataUrl} alt="QR Code" className="w-48 h-48 mx-auto border p-2" />
            <p className="text-[10px] font-mono text-gray-500">{qrModalData.inventory.qrCodeKey}</p>
            <button
              onClick={() => setQrModalData(null)}
              className="w-full bg-gray-200 py-2 text-xs font-bold uppercase tracking-widest"
            >
              TUTUP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}