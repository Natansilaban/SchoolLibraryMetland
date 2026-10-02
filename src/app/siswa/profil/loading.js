export default function SiswaProfilLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <div className="h-7 w-52 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
      </div>

      <div className="library-card overflow-hidden">
        <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-16 h-16 rounded-xl bg-slate-200 animate-pulse flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-44 bg-slate-200 rounded animate-pulse mx-auto sm:mx-0" />
            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse mx-auto sm:mx-0" />
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-200 animate-pulse flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
