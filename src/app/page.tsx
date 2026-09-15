'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  
  // State Role: 'mitra' atau 'admin'
  const [role, setRole] = useState<'mitra' | 'admin'>('mitra');

  // Form State Admin
  const [adminPassword, setAdminPassword] = useState('');

  // Form State Mitra
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === 'admin') {
      if (adminPassword === 'admin123') {
        localStorage.setItem('user_role', 'admin');
        router.push('/admin');
      } else {
        alert('Password Admin salah! (Default: admin123)');
      }
    } else {
      try {
        const res = await fetch('/api/stores');
        const stores = await res.json();

        const matchedStore = stores.find(
          (s: any) =>
            (s.username || '').toLowerCase() === username.trim().toLowerCase() &&
            (s.password || '') === password
        );

        if (matchedStore) {
          localStorage.setItem('user_role', 'mitra');
          localStorage.setItem('mitra_store_id', matchedStore.id.toString());
          router.push(`/mitra/${matchedStore.id}`);
        } else {
          alert('Username atau Password Mitra salah/tidak ditemukan!');
        }
      } catch (err) {
        alert('Gagal terhubung ke server');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#C2C7B8] text-[#3D3A34] font-sans flex flex-col justify-between items-center py-10 px-4 relative overflow-hidden selection:bg-[#47443C] selection:text-white">
      
      {/* BACKGROUND LEAF / BOTANICAL OVERLAY SILHOUETTE */}
      <div className="absolute inset-0 pointer-events-none opacity-15 flex items-center justify-center">
        <svg className="w-[120%] h-[120%] text-[#3D3A34]" fill="currentColor" viewBox="0 0 100 100">
          <path d="M50 0 C60 30, 80 40, 100 50 C70 60, 60 80, 50 100 C40 70, 20 60, 0 50 C30 40, 40 20, 50 0 Z" />
        </svg>
      </div>

      {/* HEADER: LOGO ARCH ARCHITECTURE */}
      <header className="z-10 text-center space-y-2 mt-4">
        <div className="flex items-center justify-center gap-3">
          {/* Minimalist Arch Outline */}
          <div className="w-14 h-20 border border-[#3D3A34] rounded-t-full flex items-center justify-center"></div>
          
          <div className="text-left">
            <h1 className="font-serif tracking-[0.3em] text-lg uppercase text-[#3D3A34] font-light leading-tight">
              Capshoe
            </h1>
            <h1 className="font-serif tracking-[0.35em] text-base uppercase text-[#3D3A34] font-light leading-tight">
              Grab
            </h1>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER / LOGIN CARD */}
      <main className="z-10 w-full max-w-sm my-8 space-y-6 text-center">
        
        {/* SUBTITLE */}
        <p className="text-xs tracking-[0.25em] uppercase text-[#47443C] font-medium">
          Selamat Datang Di Halaman Login.
        </p>

        {/* EARTH TONE LOGIN CARD */}
        <div className="bg-[#EFECE6] p-8 shadow-sm border border-[#D8D4C8] text-center space-y-5">
          
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* VIEW 1: FORM LOGIN MITRA */}
            {role === 'mitra' && (
              <>
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#524F46] font-medium leading-relaxed">
                  Silahkan Mengisi ID Toko Di Bawah Ini
                </p>

                <div className="space-y-3 pt-2">
                  <input
                    type="text"
                    value={username || ''}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="NAMA TOKO"
                    required
                    className="w-full bg-[#EFECE6] border border-[#3D3A34] p-3 text-center text-xs tracking-[0.2em] uppercase text-[#3D3A34] outline-none placeholder-[#7A7568] focus:bg-[#FAF8F5] transition"
                  />

                  <input
                    type="password"
                    value={password || ''}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="PASWORD"
                    required
                    className="w-full bg-[#EFECE6] border border-[#3D3A34] p-3 text-center text-xs tracking-[0.2em] uppercase text-[#3D3A34] outline-none placeholder-[#7A7568] focus:bg-[#FAF8F5] transition"
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className="text-[9px] tracking-[0.2em] uppercase text-[#47443C] underline underline-offset-4 hover:text-[#000] transition"
                  >
                    Masuk Sebagai Admin
                  </button>
                </div>
              </>
            )}

            {/* VIEW 2: FORM LOGIN ADMIN */}
            {role === 'admin' && (
              <>
                <div className="space-y-1">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#524F46] font-medium">
                    Welcome Back
                  </p>
                  <p className="text-[11px] tracking-[0.2em] uppercase text-[#3D3A34] font-semibold">
                    Admin Capshoe
                  </p>
                </div>

                <div className="pt-2">
                  <input
                    type="password"
                    value={adminPassword || ''}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="PASWORD ADMIN"
                    required
                    className="w-full bg-[#EFECE6] border border-[#3D3A34] p-3 text-center text-xs tracking-[0.2em] uppercase text-[#3D3A34] outline-none placeholder-[#7A7568] focus:bg-[#FAF8F5] transition"
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setRole('mitra')}
                    className="text-[9px] tracking-[0.2em] uppercase text-[#47443C] underline underline-offset-4 hover:text-[#000] transition"
                  >
                    Masuk Sebagai Mitra Toko
                  </button>
                </div>
              </>
            )}

            {/* MAIN BUTTON MASUK */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-[#47443C] hover:bg-[#33312B] text-[#EFECE6] py-3 text-xs tracking-[0.25em] uppercase font-medium transition shadow-xs"
              >
                Masuk
              </button>
            </div>

            {/* LUPA PASWORD LINK */}
            <div className="pt-2">
              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin,%20saya%20lupa%20password%20login%20konsinyasi"
                target="_blank"
                rel="noreferrer"
                className="text-[9px] tracking-[0.2em] uppercase text-[#47443C] underline underline-offset-4 hover:text-[#000] transition inline-block"
              >
                Lupa Pasword?
              </a>
            </div>

          </form>
        </div>
      </main>

      {/* FOOTER: CONTACT INFORMASI & SOCIAL ICONS */}
      <footer className="z-10 text-center space-y-3 mb-2">
        <p className="text-[10px] tracking-[0.25em] uppercase text-[#47443C] font-medium">
          Contact Informasi
        </p>

        <div className="flex justify-center items-center gap-4 text-[#3D3A34]">
          {/* Instagram Icon */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="w-7 h-7 border border-[#3D3A34] rounded-md flex items-center justify-center hover:bg-[#3D3A34] hover:text-[#C2C7B8] transition"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>

          {/* Twitter / X Icon */}
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noreferrer"
            className="w-7 h-7 border border-[#3D3A34] rounded-md flex items-center justify-center hover:bg-[#3D3A34] hover:text-[#C2C7B8] transition"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </div>
      </footer>

    </div>
  );
}