'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const toast = {
  success: (message) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { id: Date.now() + Math.random(), type: 'success', message } }));
    }
  },
  error: (message) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { id: Date.now() + Math.random(), type: 'error', message } }));
    }
  },
  warning: (message) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { id: Date.now() + Math.random(), type: 'warning', message } }));
    }
  },
  info: (message) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { id: Date.now() + Math.random(), type: 'info', message } }));
    }
  },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const { id, type, message } = e.detail;
      setToasts((prev) => [...prev, { id, type, message }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    };

    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center gap-2.5 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((t) => {
        let bgClass = 'bg-white/95 border-slate-200 text-slate-800 shadow-lg';
        let Icon = Info;
        let iconColor = 'text-blue-500';

        if (t.type === 'success') {
          bgClass = 'bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-emerald-500/10 shadow-lg';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-600';
        } else if (t.type === 'error') {
          bgClass = 'bg-rose-50/95 border-rose-200 text-rose-900 shadow-rose-500/10 shadow-lg';
          Icon = AlertCircle;
          iconColor = 'text-rose-600';
        } else if (t.type === 'warning') {
          bgClass = 'bg-amber-50/95 border-amber-200 text-amber-900 shadow-amber-500/10 shadow-lg';
          Icon = AlertTriangle;
          iconColor = 'text-amber-600';
        }

        return (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl transition-all duration-300 transform animate-slideUp w-full cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${bgClass}`}
          >
            <Icon size={20} className={`${iconColor} flex-shrink-0`} />
            <div className="text-xs sm:text-sm font-semibold flex-1 leading-snug break-words">
              {t.message}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(t.id);
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition-colors flex-shrink-0"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
