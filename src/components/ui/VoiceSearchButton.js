'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, AlertCircle, Loader2, X, RefreshCw } from 'lucide-react';

export default function VoiceSearchButton({
  onTranscript,
  onListeningChange,
  className = '',
}) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'requesting' | 'listening' | 'error' | 'success'
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef(null);
  const isStartingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    const hasSpeech = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setSupported(hasSpeech);
  }, []);

  const cleanupRecognition = useCallback(() => {
    isStartingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    onListeningChange?.(false);
  }, [onListeningChange]);

  const closeModal = useCallback(() => {
    cleanupRecognition();
    setIsOpen(false);
    setStatus('idle');
    setTranscript('');
    setErrorMessage('');
  }, [cleanupRecognition]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeModal]);

  const startVoiceSession = useCallback(async () => {
    if (!supported) {
      setStatus('error');
      setErrorMessage('Browser ini tidak mendukung pencarian suara. Silakan gunakan Google Chrome di Android atau Edge.');
      return;
    }

    if (isStartingRef.current) return;
    isStartingRef.current = true;

    setStatus('requesting');
    setErrorMessage('');
    setTranscript('');

    // Step 1: Prime microphone permissions via getUserMedia if available
    // On Chrome Android, this triggers the native permission prompt reliably.
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately stop tracks to free hardware audio focus for SpeechRecognition
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.warn('Microphone permission not granted:', err);
        isStartingRef.current = false;
        setStatus('error');
        setErrorMessage(
          'Izin mikrofon diperlukan. Ketuk ikon setelan/kunci di sebelah kiri address bar, izinkan akses mikrofon, lalu coba lagi.'
        );
        return;
      }
    }

    // Step 2: Initialize Web Speech API
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.lang = 'id-ID';
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        isStartingRef.current = false;
        setStatus('listening');
        onListeningChange?.(true);
      };

      rec.onresult = (event) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          currentText += item[0]?.transcript || '';
          if (item.isFinal) {
            const finalQuery = currentText.trim();
            setTranscript(finalQuery);
            setStatus('success');
            onListeningChange?.(false);
            
            // Deliver search query and close modal after brief visual confirmation
            setTimeout(() => {
              if (finalQuery) {
                onTranscript?.(finalQuery);
              }
              closeModal();
            }, 600);
            return;
          }
        }
        if (currentText) {
          setTranscript(currentText);
        }
      };

      rec.onerror = (event) => {
        isStartingRef.current = false;
        onListeningChange?.(false);

        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            setStatus('error');
            setErrorMessage(
              'Akses mikrofon diblokir. Klik ikon setelan di address bar browser → Izin Mikrofon → Izinkan, lalu coba lagi.'
            );
            break;
          case 'no-speech':
            setStatus('error');
            setErrorMessage('Tidak ada suara terdeteksi. Silakan bicara lebih dekat ke mikrofon.');
            break;
          case 'network':
            setStatus('error');
            setErrorMessage('Gagal terhubung ke server pengenalan suara. Pastikan koneksi internet aktif.');
            break;
          case 'audio-capture':
            setStatus('error');
            setErrorMessage('Mikrofon tidak ditemukan atau sedang dipakai aplikasi lain.');
            break;
          case 'aborted':
            // If user closed or aborted, do not scream an error if already success
            if (status !== 'success') {
              setStatus('error');
              setErrorMessage('Perekaman suara terputus. Silakan ketuk tombol coba lagi.');
            }
            break;
          default:
            setStatus('error');
            setErrorMessage(`Pengenalan suara gagal (${event.error}). Coba lagi.`);
        }
      };

      rec.onend = () => {
        isStartingRef.current = false;
        onListeningChange?.(false);
        // If it ended without success or error (e.g. brief mobile timeout)
        setStatus((prev) => (prev === 'listening' ? 'error' : prev));
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      isStartingRef.current = false;
      setStatus('error');
      setErrorMessage('Gagal memulai pengenalan suara. Silakan coba lagi.');
    }
  }, [supported, status, onTranscript, onListeningChange, closeModal]);

  const handleOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
    startVoiceSession();
  };

  return (
    <>
      {/* Inline Search Bar Trigger Button */}
      <button
        type="button"
        id="btn-voice-search"
        onClick={handleOpen}
        onPointerDown={(e) => e.preventDefault()}
        title="Cari buku dengan suara (Bahasa Indonesia)"
        aria-label="Cari buku dengan suara"
        aria-expanded={isOpen}
        className={`relative h-8 w-8 sm:h-7 sm:w-7 rounded-md flex items-center justify-center transition-colors
          outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 dark:focus-visible:ring-slate-600/40
          touch-manipulation [-webkit-tap-highlight-color:transparent]
          before:absolute before:-inset-1.5 before:content-['']
          text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 
          hover:bg-slate-200/50 dark:hover:bg-slate-800/60 active:scale-95 ${className}`}
      >
        <Mic size={16} />
      </button>

      {/* Voice Search Fullscreen Overlay rendered via Portal directly on document.body */}
      {isOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-search-title"
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={closeModal}
              aria-label="Tutup pencarian suara"
              className="absolute right-3.5 top-3.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <h2 id="voice-search-title" className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Pencarian Suara
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Katakan judul buku, pengarang, atau topik pelajaran
            </p>

            {/* Main Interactive Circle */}
            <div className="relative mb-6 flex items-center justify-center">
              {status === 'listening' && (
                <>
                  <span className="absolute w-24 h-24 rounded-full bg-rose-500/20 animate-ping" />
                  <span className="absolute w-20 h-20 rounded-full bg-rose-500/30 animate-pulse" />
                </>
              )}

              <div
                className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  status === 'listening'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : status === 'requesting'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      : status === 'success'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {status === 'requesting' ? (
                  <Loader2 size={26} className="animate-spin" />
                ) : status === 'listening' ? (
                  <Mic size={26} className="animate-pulse" />
                ) : status === 'success' ? (
                  <Mic size={26} />
                ) : (
                  <MicOff size={26} />
                )}
              </div>
            </div>

            {/* Live Transcript / Status Text */}
            <div className="min-h-[56px] w-full px-2 flex flex-col items-center justify-center mb-5">
              {status === 'requesting' && (
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Menghubungkan mikrofon...
                </p>
              )}

              {status === 'listening' && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                    Mendengarkan...
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 italic break-words">
                    {transcript ? `"${transcript}"` : 'Silakan bicara sekarang...'}
                  </p>
                </div>
              )}

              {status === 'success' && (
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    Mencari buku...
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    &quot;{transcript}&quot;
                  </p>
                </div>
              )}

              {status === 'error' && (
                <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-2.5 rounded-lg text-left">
                  <AlertCircle size={15} className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700 dark:text-rose-300 leading-snug">
                    {errorMessage || 'Pengenalan suara terhenti. Coba lagi.'}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="w-full flex items-center justify-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              {status === 'error' ? (
                <button
                  type="button"
                  onClick={startVoiceSession}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <RefreshCw size={13} />
                  <span>Coba Lagi</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
