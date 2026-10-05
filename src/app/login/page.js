"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const executeLogin = async (email, password) => {
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau password tidak sesuai. Silakan periksa kembali.");
        setLoading(false);
      } else {
        try {
          const sessionRes = await fetch("/api/auth/session").then((r) =>
            r.json(),
          );
          const target =
            sessionRes?.user?.role === "ADMIN"
              ? "/admin/dashboard"
              : "/siswa/dashboard";
          window.location.replace(target);
        } catch {
          window.location.replace("/siswa/dashboard");
        }
      }
    } catch {
      setError("Terjadi kendala saat menghubungkan ke server perpustakaan.");
      setLoading(false);
    }
  };

  const executeDemoLogin = async (role) => {
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        isDemo: "true",
        demoRole: role,
        redirect: false,
      });

      if (result?.error) {
        setError("Akses demo mode tidak aktif atau akun tidak ditemukan.");
        setLoading(false);
      } else {
        const target =
          role === "ADMIN" ? "/admin/dashboard" : "/siswa/dashboard";
        window.location.replace(target);
      }
    } catch {
      setError("Terjadi kendala saat menghubungkan ke server perpustakaan.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await executeLogin(form.email, form.password);
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#FBFBF9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative"
      role="main"
    >
      {}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs mx-auto p-2">
            <img
              src="/logo.png"
              alt="Logo Metland School"
              width={64}
              height={64}
              decoding="async"
              fetchPriority="high"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Perpustakaan Metland School
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Sistem Informasi Peminjaman &amp; Koleksi Buku
          </p>
        </div>

        {}
        <div className="library-card p-6 sm:p-7 space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Masuk dengan Kredensial
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gunakan email dan kata sandi akun perpustakaan Anda
            </p>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="flex items-center gap-2.5 p-3 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200"
            >
              <AlertCircle
                size={16}
                className="text-rose-600 dark:text-rose-400 shrink-0"
              />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="form-label text-xs">
                Alamat Email Terdaftar
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  className="library-input pl-10 text-xs sm:text-sm"
                  placeholder="nama@metland.sch.id"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="form-label text-xs">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                />
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  className="library-input pl-10 pr-10 text-xs sm:text-sm"
                  placeholder="Masukkan kata sandi"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-0.5"
                  aria-label={
                    showPass ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                  }
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-xs sm:text-sm font-semibold min-h-[44px]"
            >
              {loading ? "Memverifikasi..." : "Masuk ke Sistem Perpustakaan"}
            </button>
          </form>

          {}
          {process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true" && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span>Akses Cepat Demo</span>
                <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  Demo Mode
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="demo-login-admin"
                  disabled={loading}
                  onClick={() => executeDemoLogin("ADMIN")}
                  className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-left transition-colors min-h-[44px] flex flex-col justify-center cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Admin Petugas
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Mode Pengelola
                  </div>
                </button>

                <button
                  type="button"
                  id="demo-login-siswa"
                  disabled={loading}
                  onClick={() => executeDemoLogin("SISWA")}
                  className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-left transition-colors min-h-[44px] flex flex-col justify-center cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    Siswa Perpustakaan
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Mode Peminjam
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          &copy; {new Date().getFullYear()} Fikri, Natan, Arthur
        </p>
      </div>
    </main>
  );
}
