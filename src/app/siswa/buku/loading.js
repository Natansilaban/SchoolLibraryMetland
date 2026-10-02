export default function BukuLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Catalog Header Skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-72 max-w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
      </div>

      {/* Toolbar Skeleton */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="h-9 flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        <div className="h-9 sm:w-56 bg-slate-100 dark:bg-slate-800 rounded-lg" />
      </div>

      {/* Book Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="library-card p-3.5 flex flex-col h-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
          >
            <div className="w-full h-44 rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-16 bg-blue-100/60 dark:bg-blue-950/60 rounded" />
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
