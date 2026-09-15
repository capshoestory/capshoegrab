'use client';

import { useState } from 'react';

export default function CheckoutPage({ params }: { params: { qrCodeKey: string } }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 150000, // Sesuaikan dengan nominal harga produk/layanan
          title: 'Pembayaran Capshoe Story & Preloved',
          customerName: 'Pelanggan',
        }),
      });

      const data = await res.json();

      if (data.success && data.paymentUrl) {
        // Redirect pembeli ke halaman pembayaran Flip (QRIS / Transfer Bank)
        window.location.href = data.paymentUrl;
      } else {
        alert(data.error || 'Gagal memproses pembayaran');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Checkout Pembayaran</h1>
      {/* Detail item/stok */}
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-amber-800 text-white py-3 rounded-lg font-semibold hover:bg-amber-900 transition"
      >
        {loading ? 'Memproses...' : 'Bayar Sekarang via Flip'}
      </button>
    </div>
  );
}