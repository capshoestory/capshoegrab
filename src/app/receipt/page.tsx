'use client';

import { use } from 'react';

export default function ReceiptPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const resolvedParams = use(params);

  return (
    <div className="min-h-screen bg-[#C2C5B4] flex items-center justify-center p-4 antialiased">
      <div className="bg-[#EFECE6] border border-[#CCCCCC] p-8 max-w-sm w-full space-y-6 shadow-2xl text-center">
        {/* BRANDING HEADER */}
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#00A896]">Capshoe</h1>
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#666666]">ADVENTURE STORY</p>
        </div>

        <div className="w-12 h-12 bg-[#00A896] text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
          ✓
        </div>

        <div className="space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#333333]">
            PEMBAYARAN BERHASIL!
          </h2>
          <p className="text-[10px] text-gray-500 font-mono">
            INVOICE: {resolvedParams.orderNumber}
          </p>
        </div>

        <hr className="border-t border-dashed border-[#B3AE9F]" />

        {/* DETAIL TRANSAKSI */}
        <div className="text-left text-[10px] space-y-2 uppercase font-mono text-[#333333]">
          <div className="flex justify-between">
            <span className="text-gray-500">TANGGAL:</span>
            <span>{new Date().toLocaleDateString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">METODE:</span>
            <span>QRIS / FLIP.ID</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">STATUS:</span>
            <span className="text-[#00A896] font-bold">LUNAS (PAID)</span>
          </div>
        </div>

        <hr className="border-t border-dashed border-[#B3AE9F]" />

        <button
          onClick={() => window.print()}
          className="w-full bg-[#8D5B4C] hover:bg-[#7A4E41] text-white py-2 text-xs font-bold uppercase tracking-widest transition"
        >
          CETAK RESI / STRUK
        </button>
      </div>
    </div>
  );
}