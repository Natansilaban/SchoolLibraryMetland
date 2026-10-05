export default function SiswaDefaultLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {}
      <div className="h-28 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-56 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3"
          >
            <div className="h-3.5 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
