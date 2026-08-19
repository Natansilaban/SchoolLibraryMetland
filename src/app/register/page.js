'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Hash, GraduationCap, Phone, MapPin, AlertCircle, ArrowLeft } from 'lucide-react';

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
      setError('Terjadi kesalahan koneksi');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-40 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
            top: '-10%',
            left: '10%',
          }}
        />
        <div
          className="absolute w-[450px] h-[450px] rounded-full opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
            bottom: '10%',
            right: '10%',
          }}
        />
      </div>

      <div className="w-full max-w-lg relative">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft size={16} /> Kembali ke Login
        </Link>

        {/* Logo & Branding */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 p-2 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(241,245,249,0.9) 100%)',
              border: '1px solid rgba(226,232,240,0.9)',
              boxShadow: '0 10px 25px -5px rgba(37,99,235,0.1)',
            }}
          >
            <img src="/logo.png" alt="Metland School Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
            Pendaftaran Siswa Baru
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Daftar untuk mengakses perpustakaan digital Metland School
          </p>
        </div>

        {/* Register Card */}
        <div className="glass-card p-6 sm:p-8 shadow-lg">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                ✓
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Pendaftaran Berhasil!</h2>
              <p className="text-sm text-slate-600 font-medium">Mengalihkan ke halaman login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl text-sm font-medium mb-4"
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                  }}
                >
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div>
                <label className="form-label">Nama Lengkap *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    className="glass-input pl-10"
                    placeholder="Contoh: Budi Santoso"
                    value={form.nama}
                    onChange={e => setForm({ ...form, nama: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">NIS *</label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      className="glass-input pl-10"
                      placeholder="2024002"
                      value={form.nis}
                      onChange={e => setForm({ ...form, nis: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Kelas *</label>
                  <div className="relative">
                    <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      className="glass-input pl-10"
                      placeholder="10A / 11B"
                      value={form.kelas}
                      onChange={e => setForm({ ...form, kelas: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Alamat Email *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    className="glass-input pl-10"
                    placeholder="siswa@metland.sch.id"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Password *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="glass-input pl-10"
                    placeholder="Minimal 6 karakter"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">No. HP (Opsional)</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="glass-input pl-10"
                      placeholder="08123456789"
                      value={form.noHp}
                      onChange={e => setForm({ ...form, noHp: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Alamat (Opsional)</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="glass-input pl-10"
                      placeholder="Jakarta / Bekasi"
                      value={form.alamat}
                      onChange={e => setForm({ ...form, alamat: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 mt-4 text-base font-semibold"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Daftar...' : 'Daftar Sekarang'}
              </button>
            </form>
          )}

          <hr className="glass-divider mt-6" />

          <p className="text-center text-xs mt-4 text-slate-500 font-medium">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
