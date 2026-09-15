'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function DirectCheckoutPage() {
  const params = useParams();
  const qrKey = params.qrKey as string;
  const [error, setError] = useState('');

  useEffect(() => {
    async function processPaymentRedirect() {
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCodeKey: qrKey }),
        });

        const data = await res.json();

        if (res.ok && data.paymentUrl) {
          // LANGSUNG DIARAHKAN KE PAYMENT GATEWAY FLIP.ID
          window.location.href = data.paymentUrl;
        } else {
          setError(data.error || 'Gagal terhubung ke gateway pembayaran Flip.id');
        }
      } catch (err) {
        setError('Terjadi kesalahan jaringan.');
      }
    }

    if (qrKey) {
      processPaymentRedirect();
    }
  }, [qrKey]);

  return (
    <div className="min-h-screen bg-[#ECE9E2] flex flex-col items-center justify-center p-6 text-center font-sans">
      {!error ? (
        <div className="space-y-4">
          <div className="w-12 h-12 border-4 border-[#965848] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="font-serif text-sm tracking-[0.2em] uppercase text-[#3D3A34] font-medium">
            Mengarahkan ke Pembayaran Flip.id...
          </h2>
          <p className="text-xs text-[#7A7568] tracking-widest uppercase">
            Mohon tunggu sebentar
          </p>
        </div>
      ) : (
        <div className="bg-[#FAF8F5] border border-[#B3AE9F] p-6 max-w-sm w-full space-y-3">
          <p className="text-xs uppercase tracking-widest text-[#8C4A3E] font-bold">
            Gagal Memuat Pembayaran
          </p>
          <p className="text-xs text-[#4A4741]">{error}</p>
        </div>
      )}
    </div>
  );
}