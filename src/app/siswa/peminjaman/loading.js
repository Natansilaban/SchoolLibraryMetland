export default function PeminjamanLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {}
      <div className="space-y-2">
        <div className="h-7 w-52 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-80 max-w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
      </div>

      {}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-8 w-28 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
        <div className="h-8 w-28 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
      </div>

      {}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 flex-1">
              <div className="w-12 h-16 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800/60 rounded" />
              </div>
            </div>
            <div className="h-7 w-24 bg-slate-100 dark:bg-slate-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
