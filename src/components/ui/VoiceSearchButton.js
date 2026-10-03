'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, AlertCircle, Loader2 } from 'lucide-react';

export default function VoiceSearchButton({
  onTranscript,
  onListeningChange,
  className = '',
}) {
  const [listening, setListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [supported, setSupported] = useState(true);
  const [permissionState, setPermissionState] = useState('unknown'); // 'granted'|'denied'|'prompt'|'unknown'
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef(null);
  const errorTimerRef = useRef(null);
  const startingTimerRef = useRef(null);

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
      clearTimeout(startingTimerRef.current);
    };
  }, []);

  const showError = useCallback((msg, duration = 5000) => {
    setErrorMessage(msg);
    setIsStarting(false);
    clearTimeout(startingTimerRef.current);
    clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setErrorMessage(''), duration);
  }, []);

  const stopListening = useCallback(() => {
    clearTimeout(startingTimerRef.current);
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
    setIsStarting(false);
    onListeningChange?.(false);
  }, [onListeningChange]);

  const startListening = useCallback(() => {
    if (!supported) {
      showError('Pencarian suara memerlukan Google Chrome atau Microsoft Edge.');
      return;
    }

    if (isStarting || listening) {
      stopListening();
      return;
    }

    setIsStarting(true);
    setErrorMessage('');

    // Safety watchdog: reset if browser SpeechRecognition hangs/doesn't fire onstart
    clearTimeout(startingTimerRef.current);
    startingTimerRef.current = setTimeout(() => {
      setIsStarting(false);
      showError('Mikrofon tidak merespons. Periksa izin mikrofon di browser Anda.');
    }, 6000);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = 'id-ID';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      clearTimeout(startingTimerRef.current);
      setIsStarting(false);
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
      clearTimeout(startingTimerRef.current);
      setIsStarting(false);
      setListening(false);
      onListeningChange?.(false);

      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          setPermissionState('denied');
          showError(
            'Mikrofon diblokir. Klik ikon setelan di address bar → Izin Mikrofon → Izinkan, lalu coba lagi.',
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
          // User dismissed or input shifted
          break;
        default:
          showError(`Gagal: ${event.error}. Coba lagi.`);
      }
    };

    rec.onend = () => {
      clearTimeout(startingTimerRef.current);
      setIsStarting(false);
      setListening(false);
      onListeningChange?.(false);
    };

    recognitionRef.current = rec;

    try {
      rec.start();
    } catch (err) {
      clearTimeout(startingTimerRef.current);
      setIsStarting(false);
      showError('Gagal memulai pengenalan suara. Coba lagi.');
      setListening(false);
      onListeningChange?.(false);
    }
  }, [supported, isStarting, listening, onTranscript, onListeningChange, showError, stopListening]);

  const toggle = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (listening || isStarting) stopListening();
    else startListening();
  }, [listening, isStarting, startListening, stopListening]);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        id="btn-voice-search"
        onClick={toggle}
        title={listening ? 'Berhenti mendengarkan' : isStarting ? 'Menghubungkan mikrofon...' : 'Cari dengan suara (Bahasa Indonesia)'}
        aria-label={listening ? 'Berhenti mendengarkan suara' : isStarting ? 'Menghubungkan mikrofon' : 'Mulai pencarian dengan suara'}
        aria-pressed={listening}
        className={`relative h-8 w-8 sm:h-7 sm:w-7 rounded-md flex items-center justify-center transition-all
          outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 dark:focus-visible:ring-slate-600/40
          touch-manipulation [-webkit-tap-highlight-color:transparent]
          before:absolute before:-inset-1.5 before:content-['']
          ${listening
            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30 shadow-xs'
            : isStarting
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
              : permissionState === 'denied'
                ? 'text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 active:bg-slate-200 dark:active:bg-slate-700 active:scale-95'
          } ${className}`}
      >
        {listening ? (
          <MicOff size={16} className="animate-pulse" />
        ) : isStarting ? (
          <Loader2 size={16} className="animate-spin text-slate-600 dark:text-slate-300" />
        ) : (
          <Mic size={16} className={permissionState === 'denied' ? 'opacity-50' : ''} />
        )}
      </button>

      {listening && (
        <div
          role="status"
          aria-live="polite"
          className="absolute right-0 top-full mt-2.5 z-50 whitespace-nowrap bg-rose-600 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1.5 animate-fade-in"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>Mendengarkan...</span>
        </div>
      )}

      {errorMessage && !listening && (
        <div
          role="alert"
          className="absolute right-0 top-full mt-2.5 z-50 max-w-[280px] bg-slate-900 text-slate-100 dark:bg-slate-800 dark:text-slate-200 text-[11px] font-medium px-3 py-2 rounded-lg shadow-xl border border-slate-700/80 flex items-start gap-2 animate-fade-in"
        >
          <AlertCircle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <span className="whitespace-normal leading-snug">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
