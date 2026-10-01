import SiswaNav from '@/components/layout/SiswaNav';

export default function SiswaLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FBFBF9]">
      <SiswaNav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-24 md:pb-12">
        {children}
      </main>
    </div>
  );
}
