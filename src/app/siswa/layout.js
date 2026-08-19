import SiswaNav from '@/components/layout/SiswaNav';

export default function SiswaLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <SiswaNav />
      <main className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-8 pb-20 md:pb-8">
        {children}
      </main>
    </div>
  );
}
