import { useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Icon from "./Icon";

export default function Layout({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-full">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Мобильная шапка */}
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-white/60 px-4 py-3 backdrop-blur-xl lg:hidden">
        <button
          onClick={() => setMenuOpen(true)}
          className="rounded-lg p-2 text-core-ink transition-colors hover:bg-black/5"
          aria-label="Открыть меню"
        >
          <Icon name="menu" size={22} />
        </button>
        <span className="text-core-ink">
          <Icon name="logo" size={24} />
        </span>
        <span className="truncate text-base font-bold tracking-tight">{title}</span>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 sm:px-6 lg:pl-[272px] lg:pr-8">
        <div className="mb-6 hidden lg:block">
          <h1 className="text-[26px] font-bold tracking-tight">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
}
