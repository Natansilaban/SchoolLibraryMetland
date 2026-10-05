export default function SiswaDashboardLoading() {
  return (
    <div className="space-y-6">
      {}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
            <div className="space-y-2 min-w-0">
              <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-6 sm:h-7 w-48 sm:w-56 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-6 w-28 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse self-start sm:self-auto" />
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="library-card p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="h-8 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse my-1.5" />
            <div className="h-3 w-36 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="library-card p-5 flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
              <div className="space-y-1.5 flex-1 pr-4">
                <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-3 w-52 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              </div>
            </div>
            <div className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
          </div>
        ))}
      </div>

      {}
      <div className="library-card p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="h-4 w-44 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-60 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <div className="aspect-3/4 w-full rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse mb-2.5" />
              <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
              <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="library-card p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-52 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="h-3.5 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        </div>

        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-13 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse self-start sm:self-center" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
