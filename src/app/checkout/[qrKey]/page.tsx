'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function CheckoutPage() {
  const params = useParams();
  const qrKey = params.qrKey as string;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  const handleSimulatePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCodeKey: qrKey }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setOrderData(data.order);
      } else {
        alert(data.error || 'Pembayaran gagal atau stok habis!');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header Store */}
        <div className="bg-indigo-600 text-white p-6 text-center">
          <p className="text-xs font-semibold tracking-wider uppercase opacity-80">Pembayaran Konsinyasi</p>
          <h1 className="text-xl font-bold mt-1">Self-Checkout QR</h1>
          <p className="text-xs text-indigo-200 mt-1">Kode Tag: {qrKey}</p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {!success ? (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Metode Bayar</span>
                  <span className="font-semibold text-slate-700">QRIS Dynamic</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Status Barang</span>
                  <span className="text-emerald-600 font-medium">Tersedia di Toko</span>
                </div>
              </div>

              {/* QRIS Graphic Simulation */}
              <div className="text-center space-y-3">
                <p className="text-xs text-slate-400">Simulasi Scan QRIS oleh Pembeli</p>
                <div className="w-48 h-48 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl mx-auto flex flex-col items-center justify-center p-4">
                  <div className="w-32 h-32 bg-slate-800 rounded-lg flex items-center justify-center text-white font-bold text-xs text-center p-2">
                    [ Tampilan QRIS Bank / E-Wallet ]
                  </div>
                </div>
              </div>

              <button
                onClick={handleSimulatePayment}
                disabled={loading}
                className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-emerald-700 active:scale-[0.98] transition disabled:opacity-50"
              >
                {loading ? 'Memproses Transaksi...' : 'Bayar Sekarang (Simulasi)'}
              </button>

              <p className="text-[11px] text-center text-slate-400">
                Tunjukkan bukti sukses di layar ini kepada kasir/pemilik toko sebelum membawa barang.
              </p>
            </div>
          ) : (
            /* Success Receipt */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                ✓
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Pembayaran Sukses!</h2>
                <p className="text-xs text-slate-500 mt-1">Terima kasih telah berbelanja.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Invoice</span>
                  <span className="font-mono font-bold text-slate-700">{orderData?.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="text-emerald-600 font-bold">LUNAS</span>
                </div>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="w-full bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl hover:bg-slate-200 transition text-sm"
              >
                Selesai / Transaksi Baru
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
