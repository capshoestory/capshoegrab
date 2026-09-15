'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginMitra() {
  const router = useRouter();
  const [namaToko, setNamaToko] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: namaToko, password, role: 'MITRA' }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('user_role', 'MITRA');
      localStorage.setItem('store_id', data.storeId);
      router.push(`/mitra/${data.storeId}`);
    } else {
      alert('Nama Toko atau Password salah!');
    }
  };

  return (
    <div className="min-h-screen bg-[#00A896] flex flex-col items-center justify-between py-10 px-6 text-[#333333] font-sans antialiased">
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-6xl font-black tracking-[0.25em] text-[#008073]/30 font-sans uppercase select-none">
          GRAB
        </h1>
        
        <div className="relative inline-block border-x border-white/30 px-8 py-2">
          <h2 className="text-3xl font-bold text-white tracking-wider font-serif">
            Capshoe
          </h2>
          <p className="text-[9px] uppercase tracking-[0.3em] text-white/90 font-medium">
            Adventure Story
          </p>
        </div>

        <div className="pt-6">
          <p className="text-[11px] tracking-[0.25em] uppercase text-white font-medium leading-relaxed">
            Selamat Datang Di<br />Halaman Login.
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm bg-[#EFECE6] p-8 shadow-2xl space-y-5 text-center my-6">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#666666] font-medium leading-relaxed">
          Silahkan Mengisi ID Toko<br />Di Bawah Ini
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="NAMA TOKO"
            value={namaToko}
            onChange={(e) => setNamaToko(e.target.value)}
            className="w-full bg-[#E5E0D8] border border-[#B3AE9F] p-3 text-center text-xs tracking-[0.2em] uppercase text-[#333333] outline-none placeholder-[#888888]"
            required
          />

          <input
            type="password"
            placeholder="PASWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#E5E0D8] border border-[#B3AE9F] p-3 text-center text-xs tracking-[0.2em] uppercase text-[#333333] outline-none placeholder-[#888888]"
            required
          />

          <div className="pt-1">
            <button
              type="button"
              onClick={() => router.push('/admin/login')}
              className="text-[10px] tracking-[0.2em] uppercase text-[#333333] underline hover:text-[#00A896] transition font-medium"
            >
              MASUK SEBAGAI ADMIN
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-[#008D7D] hover:bg-[#007A6C] text-white py-3 text-xs tracking-[0.25em] font-bold uppercase transition shadow-xs"
          >
            MASUK
          </button>
        </form>

        <a
          href="https://wa.me/6285924761500?text=Halo%20Admin,%20saya%20lupa%20password%20toko%20mitra"[cite: 1]
          target="_blank"
          rel="noreferrer"
          className="block text-[10px] tracking-[0.2em] uppercase text-[#333333] underline hover:text-[#00A896] transition pt-1 font-medium"
        >
          LUPA PASWORD?
        </a>
      </div>

      <div className="text-center text-white space-y-2 pb-2">
        <p className="text-[9px] tracking-[0.25em] uppercase text-white/80 font-medium">
          CONTACT INFORMASI
        </p>
        <p className="text-xs tracking-[0.2em] uppercase font-bold text-white">
          @CAPSHOESTORY
        </p>
        <p className="text-[9px] tracking-[0.2em] uppercase text-white/60 pt-4">
          VERSION 1.0
        </p>
      </div>
    </div>
  );
}