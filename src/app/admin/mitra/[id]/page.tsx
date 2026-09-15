'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function AdminMitraDetail() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState<any>(null);
  const [allStores, setAllStores] = useState<any[]>([]);
  const [stockList, setStockList] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [qrModalData, setQrModalData] = useState<any>(null);

  const fetchStoreDetail = async () => {
    try {
      setLoading(true);
      const [resDetail, resStores] = await Promise.all([
        fetch(`/api/stores/${storeId}`),
        fetch('/api/stores'),
      ]);

      if (resDetail.ok) {
        const data = await resDetail.json();
        setStoreData(data);
        setStockList(data.stockList || []);
      }
      if (resStores.ok) {
        setAllStores(await resStores.json());
      }
    } catch (err) {
      console.error('Failed to fetch store detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) fetchStoreDetail();
  }, [storeId]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const handleSelectStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/admin/mitra/${e.target.value}`);
  };

  const handleCreateQR = async (productId: number) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, productId, stockToAdd: 0 }),
      });
      const data = await res.json();
      if (res.ok) {
        setQrModalData(data);
      } else {
        alert(data.error || 'Gagal membuat QR');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ECE9E2] flex items-center justify-center font-sans text-xs uppercase tracking-widest text-[#7A7568]">
        Memuat Monitoring Mitra...
      </div>
    );
  }

  const filteredStock = selectedCategory === 'ALL'
    ? stockList
    : stockList.filter((item) => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#ECE9E2] text-[#4A4741] font-sans antialiased pb-20">
      {/* HEADER LOGO & LOG OUT */}
      <header className="bg-[#C2C5B4] px-6 py-4 border-b border-[#B0B3A2] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-[#00A896] text-white px-3 py-1 font-bold rounded">Capshoe</div>
          <span className="text-xs uppercase tracking-widest text-[#4A4741]">Adventure Story</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs uppercase tracking-[0.2em] font-bold text-[#686356] hover:text-black"
        >
          Log Out
        </button>
      </header>

      {/* NAVIGATION BAR */}
      <div className="bg-[#C2C5B4] border-b border-[#B0B3A2] px-6">
        <div className="max-w-4xl mx-auto flex justify-center gap-2 pt-2">
          <button onClick={() => router.push('/admin')} className="px-8 py-3 text-xs uppercase font-bold text-[#686356]">
            Dashboard
          </button>
          <button onClick={() => router.push('/admin')} className="px-8 py-3 text-xs uppercase font-bold text-[#686356]">
            Stock
          </button>
          <button className="px-8 py-3 text-xs uppercase font-bold bg-[#00A896] text-white rounded-t-md">
            Mitra
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-8">
        <div className="text-center space-y-4">
          <h2 className="font-serif text-base tracking-widest uppercase font-bold">
            Monitoring Mitra
          </h2>
          <div className="flex justify-center items-center gap-4 text-xs font-bold uppercase">
            <span>Nama Toko:</span>
            <select
              value={storeData?.id || storeId}
              onChange={handleSelectStoreChange}
              className="bg-white border border-[#B3AE9F] px-4 py-2 font-bold"
            >
              {allStores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* OWNER INFO & CARDS */}
        <div className="bg-white p-6 border border-[#B3AE9F] space-y-4">
          <div className="flex justify-between text-xs font-bold uppercase border-b pb-4">
            <p>Owner: <span className="font-normal">{storeData?.owner || '-'}</span></p>
            <p>Alamat: <span className="font-normal">{storeData?.alamat || '-'}</span></p>
            <p>Contact: <span className="font-normal">{storeData?.phone || '-'}</span></p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="border p-4 bg-[#ECE9E2]">
              <p className="text-[10px] font-bold uppercase">Total Stock</p>
              <p className="text-2xl font-bold text-[#00A896] mt-1">
                {stockList.reduce((sum, item) => sum + item.stock, 0)}
              </p>
            </div>
            <div className="border p-4 bg-[#ECE9E2]">
              <p className="text-[10px] font-bold uppercase">Sales Fee (%)</p>
              <p className="text-2xl font-bold text-[#965848] mt-1">
                {storeData?.commissionRate || 15}%
              </p>
            </div>
            <div className="border p-4 bg-[#ECE9E2]">
              <p className="text-[10px] font-bold uppercase">Password</p>
              <p className="text-lg font-mono font-bold mt-2">
                {storeData?.password || '******'}
              </p>
            </div>
          </div>
        </div>

        {/* LIST STOCK TOKO */}
        <div className="space-y-4">
          <h3 className="font-serif text-center font-bold uppercase tracking-widest">STOCK TOKO</h3>
          {filteredStock.map((item) => (
            <div key={item.inventoryId} className="border border-[#B3AE9F] bg-white p-4 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm">{item.productName}</h4>
                <p className="text-xs text-[#736E60]">Kategori: {item.category || 'TOPI'} | Stok: {item.stock} pcs</p>
                <p className="text-xs font-bold text-[#00A896]">IDR {item.price?.toLocaleString('id-ID')}</p>
              </div>
              <button
                onClick={() => handleCreateQR(item.productId)}
                className="bg-[#965848] text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#80483B]"
              >
                CREATE QR
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL DISPLAY QR */}
      {qrModalData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 max-w-sm w-full text-center space-y-4 rounded shadow-2xl">
            <h3 className="font-bold uppercase text-sm tracking-widest text-[#00A896]">
              QR PAYMENT UNIK (FLIP.ID)
            </h3>
            <img src={qrModalData.qrImageDataUrl} alt="QR Code" className="w-48 h-48 mx-auto border p-2" />
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