'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

export default function VoiceSearchButton({
  onTranscript,
  onListeningChange,
  className = '',
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [permissionState, setPermissionState] = useState('unknown'); // 'granted'|'denied'|'prompt'|'unknown'
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef(null);
  const errorTimerRef = useRef(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasSpeech = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setSupported(hasSpeech);

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' }).then((status) => {
        setPermissionState(status.state);
        status.onchange = () => setPermissionState(status.state);
      }).catch(() => {
        setPermissionState('unknown');
      });
    }

    return () => {
      try { recognitionRef.current?.abort(); } catch {}
      clearTimeout(errorTimerRef.current);
    };
  }, []);

  const showError = useCallback((msg, duration = 5000) => {
    setErrorMessage(msg);
    clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setErrorMessage(''), duration);
  }, []);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
    onListeningChange?.(false);
  }, [onListeningChange]);

  const startListening = useCallback(() => {
    if (!supported) {
      showError('Pencarian suara memerlukan Google Chrome atau Microsoft Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = 'id-ID';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setListening(true);
      setErrorMessage('');
      onListeningChange?.(true);
    };

    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript?.trim()) {
        onTranscript?.(transcript.trim());
      }
    };

    rec.onerror = (event) => {
      setListening(false);
      onListeningChange?.(false);

      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          setPermissionState('denied');
          showError(
            'Mikrofon diblokir. Klik ikon kunci di address bar → Site settings → Microphone → Allow, lalu refresh.',
            8000
          );
          break;
        case 'no-speech':
          showError('Suara tidak terdeteksi. Coba bicara lebih dekat ke mikrofon.');
          break;
        case 'network':
          showError('Gagal terhubung ke server pengenalan suara. Cek koneksi internet.');
          break;
        case 'audio-capture':
          showError('Mikrofon tidak ditemukan atau sedang dipakai aplikasi lain.');
          break;
        case 'aborted':
          break;
        default:
          showError(`Gagal: ${event.error}. Coba lagi.`);
      }
    };

    rec.onend = () => {
      setListening(false);
      onListeningChange?.(false);
    };

    recognitionRef.current = rec;

    try {
      rec.start();
    } catch (err) {
      showError('Gagal memulai pengenalan suara. Coba lagi.');
      setListening(false);
      onListeningChange?.(false);
    }
  }, [supported, permissionState, onTranscript, onListeningChange, showError]);

  const toggle = useCallback(() => {
    if (listening) stopListening();
    else startListening();
  }, [listening, startListening, stopListening]);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        id="btn-voice-search"
        onClick={toggle}
        title={listening ? 'Berhenti mendengarkan' : 'Cari dengan suara (Bahasa Indonesia)'}
        aria-label={listening ? 'Berhenti mendengarkan suara' : 'Mulai pencarian dengan suara'}
        aria-pressed={listening}
        className={`min-h-[44px] min-w-[44px] p-2.5 rounded-lg flex items-center justify-center transition-all
          focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2
          ${listening
            ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-700 shadow-sm'
            : permissionState === 'denied'
              ? 'text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              : 'text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          } ${className}`}
      >
        {listening
          ? <MicOff size={18} className="animate-pulse" />
          : <Mic size={18} className={permissionState === 'denied' ? 'opacity-50' : ''} />
        }
      </button>

      {listening && (
        <div
          role="status"
          aria-live="polite"
          className="absolute right-0 -bottom-10 z-50 whitespace-nowrap bg-rose-600 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>Mendengarkan...</span>
        </div>
      )}

      {errorMessage && !listening && (
        <div
          role="alert"
          className="absolute right-0 -bottom-14 z-50 max-w-[280px] bg-slate-900 text-slate-100 dark:bg-slate-800 dark:text-slate-200 text-[11px] font-medium px-3 py-2 rounded-lg shadow-xl border border-slate-700 flex items-start gap-2"
        >
          <AlertCircle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <span className="whitespace-normal leading-snug">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
