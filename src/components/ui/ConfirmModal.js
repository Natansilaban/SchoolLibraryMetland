'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

let resolver = null;

export const confirmModal = (options) => {
  return new Promise((resolve) => {
    resolver = resolve;
    const config = typeof options === 'string' ? { message: options } : options;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-confirm-dialog', { detail: config }));
    } else {
      resolve(false);
    }
  });
};

export default function ConfirmModalContainer() {
  const [dialog, setDialog] = useState(null);

  const handleClose = useCallback((result) => {
    if (resolver) {
      resolver(result);
      resolver = null;
    }
    setDialog(null);
  }, []);

  useEffect(() => {
    const handleOpen = (e) => {
      setDialog(e.detail || {});
    };

    const handleKeyDown = (e) => {
      if (!dialog) return;
      if (e.key === 'Escape') {
        handleClose(false);
      }
    };

    window.addEventListener('app-confirm-dialog', handleOpen);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('app-confirm-dialog', handleOpen);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dialog, handleClose]);

  useEffect(() => {
    if (dialog) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [dialog]);

  if (!dialog) return null;

  const isDanger = dialog.type !== 'info' && dialog.type !== 'primary';
  const Icon = isDanger ? AlertTriangle : (dialog.type === 'info' ? HelpCircle : AlertCircle);

  return (
    <div
      onClick={() => handleClose(false)}
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-modal max-w-sm w-full p-6 text-center shadow-2xl animate-scaleUp"
      >
        <div
          className={`w-12 h-12 rounded-2xl mx-auto mb-3.5 flex items-center justify-center border shadow-sm ${
            isDanger
              ? 'bg-rose-100/90 text-rose-600 border-rose-200'
              : 'bg-blue-100/90 text-blue-600 border-blue-200'
          }`}
        >
          <Icon size={24} />
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-1.5">
          {dialog.title || (isDanger ? 'Konfirmasi Tindakan' : 'Konfirmasi')}
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-6">
          {dialog.message || 'Apakah Anda yakin ingin melanjutkan?'}
        </p>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="btn-glass flex-1 justify-center py-2.5 text-xs font-bold"
          >
            {dialog.cancelText || 'Batal'}
          </button>
          <button
            type="button"
            onClick={() => handleClose(true)}
            className={`flex-1 justify-center py-2.5 text-xs font-bold ${
              isDanger ? 'btn-danger' : 'btn-primary'
            }`}
          >
            {dialog.confirmText || 'Ya, Lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
