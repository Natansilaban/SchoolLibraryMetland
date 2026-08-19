'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setError('Email atau password salah. Silakan coba lagi.');
      setLoading(false);
    } else {
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      if (session?.user?.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/siswa/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background orbs for Light Mode */}
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

      <div className="w-full max-w-md relative">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 p-2.5 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(241,245,249,0.9) 100%)',
              border: '1px solid rgba(226,232,240,0.9)',
              boxShadow: '0 10px 25px -5px rgba(37,99,235,0.1)',
            }}
          >
            <img src="/logo.png" alt="Metland School Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            Metland Library
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Sistem Perpustakaan Digital Sekolah
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 shadow-lg">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Masuk ke akun Anda</h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Gunakan email dan password terdaftar Anda
            </p>
          </div>

          {error && (
            <div
              className="flex items-center gap-3 p-3 rounded-xl mb-5 text-sm font-medium"
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Alamat Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  className="glass-input pl-10"
                  placeholder="admin@metland.sch.id"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  className="glass-input pl-10 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2 text-base font-semibold"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memproses...
                </>
              ) : 'Masuk'}
            </button>
          </form>

          <hr className="glass-divider mt-6" />

          <p className="text-center text-xs mt-4 text-slate-500 font-medium">
            Belum punya akun?{' '}
            <a href="/register" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
              Daftar sebagai siswa
            </a>
          </p>
        </div>

        <p className="text-center text-xs mt-6 text-slate-400 font-medium">
          © 2026 Metland School Library System
        </p>
      </div>
    </div>
  );
}
