export default function Footer({ className = '' }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-4 px-4 text-xs text-slate-500 dark:text-slate-400 transition-colors ${className}`}
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
