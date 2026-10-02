'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Hash, GraduationCap, Phone, MapPin, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nama: '',
    nis: '',
    kelas: '',
    email: '',
    password: '',
    noHp: '',
    alamat: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/anggota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan saat pendaftaran');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch {
      setError('Terjadi kendala koneksi dengan server');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#FBFBF9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative">
      {/* Theme Switcher in Corner */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg space-y-5">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Kembali ke Halaman Masuk
        </Link>

        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs mx-auto p-1.5">
            <img src="/logo.png" alt="Logo Metland School" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Pendaftaran Anggota Baru
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Daftarkan diri untuk mengakses peminjaman buku perpustakaan Metland School
          </p>
        </div>

        <div className="library-card p-6 sm:p-7 space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          {success ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pendaftaran Berhasil</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Akun perpustakaan kamu berhasil dibuat. Mengalihkan ke halaman masuk...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-2.5 p-3 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200"
                >
                  <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-nama" className="form-label text-xs">
                      Nama Lengkap Siswa *
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        id="reg-nama"
                        type="text"
                        required
                        className="library-input pl-10 text-xs sm:text-sm"
                        placeholder="Nama lengkap"
                        value={form.nama}
                        onChange={(e) => setForm({ ...form, nama: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-nis" className="form-label text-xs">
                      Nomor Induk Siswa (NIS) *
                    </label>
                    <div className="relative">
                      <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        id="reg-nis"
                        type="text"
                        required
                        className="library-input pl-10 text-xs sm:text-sm"
                        placeholder="Contoh: 20241001"
                        value={form.nis}
                        onChange={(e) => setForm({ ...form, nis: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-kelas" className="form-label text-xs">
                      Rombongan Belajar (Kelas) *
                    </label>
                    <div className="relative">
                      <GraduationCap size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        id="reg-kelas"
                        type="text"
                        required
                        className="library-input pl-10 text-xs sm:text-sm"
                        placeholder="Contoh: X RPL 1"
                        value={form.kelas}
                        onChange={(e) => setForm({ ...form, kelas: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-phone" className="form-label text-xs">
                      No. WhatsApp / Telepon
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        id="reg-phone"
                        type="tel"
                        className="library-input pl-10 text-xs sm:text-sm"
                        placeholder="08xxxxxxxxxx"
                        value={form.noHp}
                        onChange={(e) => setForm({ ...form, noHp: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" className="form-label text-xs">
                    Alamat Email Siswa *
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      autoComplete="email"
                      className="library-input pl-10 text-xs sm:text-sm"
                      placeholder="siswa@metland.sch.id"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-password" className="form-label text-xs">
                    Kata Sandi Akun *
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      id="reg-password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="library-input pl-10 text-xs sm:text-sm"
                      placeholder="Minimal 6 karakter"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-alamat" className="form-label text-xs">
                    Alamat Domisili Siswa
                  </label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
                    <textarea
                      id="reg-alamat"
                      rows={2}
                      className="library-input pl-10 text-xs sm:text-sm"
                      placeholder="Alamat tempat tinggal siswa"
                      value={form.alamat}
                      onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-xs sm:text-sm font-semibold min-h-[44px]"
                >
                  {loading ? 'Mendaftarkan Akun...' : 'Kirim Pendaftaran Anggota'}
                </button>
              </form>
            </>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sudah memiliki akun terdaftar?{' '}
              <Link
                href="/login"
                className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
              >
                Masuk ke Perpustakaan
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

