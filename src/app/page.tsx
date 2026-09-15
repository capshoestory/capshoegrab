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
    <div className="min-h-screen bg-[#00A896] flex flex-col items-center justify-between p-6 text-[#333333]">
      <div className="text-center pt-8">
        <h1 className="text-5xl font-black tracking-widest text-[#008073]/40 font-sans">GRAB</h1>
        <div className="mt-2 inline-block border border-white/40 px-6 py-2 rounded-full bg-white/10 backdrop-blur-xs">
          <h2 className="text-2xl font-bold text-white tracking-wider">Capshoe</h2>
          <p className="text-[9px] uppercase tracking-[0.25em] text-white/80">Adventure Story</p>
        </div>
      </div>

      <div className="w-full max-w-sm bg-[#EFECE6] p-8 shadow-xl space-y-4 text-center">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#666666] font-medium">
          SILAHKAN MENGISI ID TOKO DI BAWAH INI
        </p>

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="text"
            placeholder="NAMA TOKO"
            value={namaToko}
            onChange={(e) => setNamaToko(e.target.value)}
            className="w-full bg-[#E5E0D8] border border-[#CCCCCC] p-3 text-center text-xs tracking-widest uppercase outline-none"
            required
          />
          <input
            type="password"
            placeholder="PASWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#E5E0D8] border border-[#CCCCCC] p-3 text-center text-xs tracking-widest outline-none"
            required
          />

          <div className="pt-2">
            <button
              type="button"
              onClick={() => router.push('/admin/login')}
              className="text-[9px] tracking-[0.15em] uppercase text-[#666666] underline hover:text-black"
            >
              MASUK SEBAGAI ADMIN
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-[#00A896] text-white py-3 text-xs tracking-[0.2em] font-bold uppercase transition hover:bg-[#008D7D]"
          >
            MASUK
          </button>
        </form>

        <a
          href="https://wa.me/6285924761500?text=Halo%20Admin,%20saya%20lupa%20password%20toko%20mitra"
          target="_blank"
          rel="noreferrer"
          className="block text-[9px] tracking-[0.2em] uppercase text-[#666666] underline pt-2"
        >
          LUPA PASWORD?
        </a>
      </div>

      <div className="text-center text-white/80 space-y-1 pb-4">
        <p className="text-[9px] tracking-[0.2em] uppercase">CONTACT INFORMASI</p>
        <p className="text-xs tracking-wider font-semibold">@CAPSHOESTORY</p>
        <p className="text-[8px] tracking-widest text-white/60 pt-2">VERSION 1.0</p>
      </div>
    </div>
  );
}