'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stock' | 'mitra'>('stock');

  const [reports, setReports] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);

  // Form State Input/Edit Stock
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [category, setCategory] = useState('TOPI');
  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [price, setPrice] = useState('');
  const [productPhoto, setProductPhoto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category Filter State for LIST STOCK
  const [shortCategory, setShortCategory] = useState('ALL');

  // FETCH ALL DATA FROM SUPABASE
  const fetchData = async () => {
    try {
      const [resR, resP, resS] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/products'),
        fetch('/api/stores'),
      ]);

      if (resR.ok) setReports(await resR.json());
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
          setProductPhoto(canvas.toDataURL('image/webp', 0.8));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // SUBMIT HANDLER FOR TAMBAH/EDIT STOK
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

        // GOOGLE SHEETS AUTOMATIC WEBHOOK SYNC
        const sheetsUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL;
        if (sheetsUrl) {
          fetch(sheetsUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: editingProductId ? 'EDIT_PRODUCT' : 'ADD_PRODUCT', ...resultData }),
          }).catch(console.error);
        }

        alert(editingProductId ? 'Stok produk berhasil diperbarui!' : 'Stok produk berhasil ditambahkan ke listing!');

        // RESET FORM
        setEditingProductId(null);
        setCategory('TOPI');
        setSku('');
        setProductName('');
        setStockQty('');
        setPrice('');
        setProductPhoto('');

        // REFRESH LISTING AUTOMATICALLY
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

  // EDIT CLICK HANDLER
  const handleEditClick = (p: any) => {
    setEditingProductId(p.id);
    setCategory(p.category || 'TOPI');
    setSku(p.sku || '');
    setProductName(p.name || '');
    setPrice(p.price?.toString() || '');
    setStockQty(p.stock?.toString() || '12');
    setProductPhoto(p.photoUrl || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // FILTERED PRODUCTS FOR LIST STOCK
  const filteredProducts = shortCategory === 'ALL'
    ? products
    : products.filter((p) => p.category?.toUpperCase() === shortCategory);

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
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 text-xs uppercase tracking-[0.2em] font-bold ${
              activeTab === 'dashboard' ? 'bg-[#EFECE6] text-[#333333]' : 'bg-[#00A896] text-white'
            }`}
          >
            DASHBOARD
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex-1 py-2 text-xs uppercase tracking-[0.2em] font-bold ${
              activeTab === 'stock' ? 'bg-[#EFECE6] text-[#333333]' : 'bg-[#00A896] text-white'
            }`}
          >
            STOCK
          </button>
          <button
            onClick={() => setActiveTab('mitra')}
            className={`flex-1 py-2 text-xs uppercase tracking-[0.2em] font-bold ${
              activeTab === 'mitra' ? 'bg-[#EFECE6] text-[#333333]' : 'bg-[#00A896] text-white'
            }`}
          >
            MITRA
          </button>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 pt-6 space-y-8">
        {/* ================= TAB STOCK ================= */}
        {activeTab === 'stock' && (
          <>
            {/* TITLE: INPUT STOCK */}
            <div className="text-center">
              <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-[#333333]">
                {editingProductId ? 'EDIT STOCK PRODUK' : 'INPUT STOCK'}
              </h2>
            </div>

            {/* FORM CARD INPUT STOCK */}
            <div className="bg-[#EFECE6] border border-[#CCCCCC] p-5 shadow-2xs">
              <form onSubmit={handleStockSubmit} className="space-y-4">
                <div className="flex gap-4 items-start">
                  {/* LEFT FORM FIELDS */}
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

                  {/* RIGHT FORM FIELDS & UPLOAD PHOTO */}
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

                    {/* UPLOAD PHOTO CYAN BUTTON */}
                    <label className="w-full h-24 bg-[#00A896] hover:bg-[#008D7D] text-white flex flex-col items-center justify-center p-2 text-center cursor-pointer transition relative overflow-hidden">
                      {productPhoto ? (
                        <img src={productPhoto} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] font-bold tracking-wider uppercase leading-tight">
                          UPLOAD PHOTO HERE
                        </span>
                      )}
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>

                    {/* SUBMIT BUTTON */}
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

            {/* TITLE: LIST STOCK */}
            <div className="pt-4 text-center">
              <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-[#333333]">
                LIST STOCK
              </h2>
            </div>

            {/* HEADER TABLE & SHORT BY CATEGORY */}
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

            {/* COLUMN HEADERS */}
            <div className="grid grid-cols-6 gap-2 text-center text-[7px] font-bold uppercase tracking-widest text-[#777777] border-b pb-1">
              <span>PHOTO</span>
              <span>SKU</span>
              <span>NAMA PRODUCT</span>
              <span>CATEGORY</span>
              <span>STOCK</span>
              <span>PRICE</span>
            </div>

            {/* LIST STOCK ITEMS */}
            <div className="space-y-3">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="border border-[#CCCCCC] bg-[#EFECE6] p-2 flex gap-2 items-center shadow-2xs"
                >
                  {/* PHOTO */}
                  <img
                    src={p.photoUrl || 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=150'}
                    alt={p.name}
                    className="w-14 h-14 object-cover border border-[#CCCCCC]"
                  />

                  {/* DETAILS GRID */}
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

                  {/* EDIT BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleEditClick(p)}
                    className="bg-[#8D5B4C] hover:bg-[#7A4E41] text-white px-3 py-4 text-[9px] font-bold uppercase tracking-widest"
                  >
                    EDIT
                  </button>
                </div>
              ))}
            </div>

            {/* DOWN ARROW FOOTER */}
            <div className="text-center pt-2">
              <span className="text-lg text-[#666666]">▼</span>
            </div>
          </>
        )}

        {/* TAB DASHBOARD PLACEHOLDER */}
        {activeTab === 'dashboard' && (
          <div className="text-center py-10 text-xs font-bold uppercase">
            Halaman Dashboard (Klik Tab STOCK untuk mengelola stok)
          </div>
        )}

        {/* TAB MITRA PLACEHOLDER */}
        {activeTab === 'mitra' && (
          <div className="text-center py-10 text-xs font-bold uppercase">
            Halaman Mitra
          </div>
        )}
      </main>
    </div>
  );
}