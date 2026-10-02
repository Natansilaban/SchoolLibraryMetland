export default function Footer({ className = '' }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xs py-4 px-4 text-xs text-slate-500 dark:text-slate-400 transition-colors ${className}`}
      role="contentinfo"
    >
      <div className="max-w-6xl mx-auto text-center">
        <p className="font-medium text-slate-600 dark:text-slate-400">
          &copy; {currentYear} <span className="font-semibold text-slate-800 dark:text-slate-200">Fikri, Natan, Arthur</span>
        </p>
      </div>
    </footer>
  );
}
