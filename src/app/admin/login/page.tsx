'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, role: 'ADMIN' }),
    });

    if (res.ok) {
      localStorage.setItem('user_role', 'ADMIN');
      router.push('/admin');
    } else {
      alert('Password Admin salah!');
    }
  };

  return (
    <div className="min-h-screen bg-[#C2C5B4] flex flex-col items-center justify-between py-10 px-6 text-[#333333] font-sans antialiased">
      {/* HEADER LOGO & BRANDING */}
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-6xl font-black tracking-[0.25em] text-[#8E9281]/40 font-sans uppercase select-none">
          GRAB
        </h1>
        
        <div className="relative inline-block border-x border-white/40 px-8 py-2">
          <h2 className="text-3xl font-bold text-white tracking-wider font-serif">
            Capshoe
          </h2>
          <p className="text-[9px] uppercase tracking-[0.3em] text-white/90 font-medium">
            Adventure Story
          </p>
        </div>

        <div className="pt-6">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#4A4741] font-medium leading-relaxed">
            Selamat Datang Di<br />Halaman Login.
          </p>
        </div>
      </div>

      {/* CARD FORM LOGIN ADMIN */}
      <div className="w-full max-w-sm bg-[#EFECE6] p-8 shadow-2xl space-y-5 text-center my-6">
        <div className="space-y-1">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#666666] font-medium">
            WELCOME BACK
          </p>
          <p className="text-xs tracking-[0.2em] uppercase text-[#333333] font-bold">
            ADMIN CAPSHOE
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4 pt-2">
          <input
            type="password"
            placeholder="PASWORD ADMIN"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#E5E0D8] border border-[#B3AE9F] p-3 text-center text-xs tracking-[0.2em] uppercase text-[#333333] outline-none placeholder-[#888888]"
            required
          />

          <button
            type="submit"
            className="w-full bg-[#008D7D] hover:bg-[#007A6C] text-white py-3 text-xs tracking-[0.25em] font-bold uppercase transition shadow-xs"
          >
            MASUK
          </button>
        </form>

        <a
          href="https://wa.me/6285924761500?text=Halo%20Admin,%20bantu%20reset%20password%20admin"
          target="_blank"
          rel="noreferrer"
          className="block text-[10px] tracking-[0.2em] uppercase text-[#333333] underline hover:text-[#00A896] transition pt-2 font-medium"
        >
          LUPA PASWORD?
        </a>
      </div>

      {/* FOOTER INFORMASI */}
      <div className="text-center text-[#4A4741] space-y-2 pb-2">
        <p className="text-[9px] tracking-[0.25em] uppercase text-[#686356] font-medium">
          CONTACT INFORMASI
        </p>

        <a
          href="https://instagram.com/capshoestory"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-bold text-[#333333] hover:text-[#00A896] transition"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <span>@CAPSHOESTORY</span>
        </a>

        <p className="text-[9px] tracking-[0.2em] uppercase text-[#7A7568] pt-4">
          VERSION 1.0
        </p>
      </div>
    </div>
  );
}