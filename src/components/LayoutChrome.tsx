import React from 'react';
import { BookOpen, Sun, Moon } from 'lucide-react';

interface BrandHeaderProps {
  onBrandClick?: () => void;
  brandHref?: string;
  centerNav?: React.ReactNode;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  rightActions?: React.ReactNode;
  variant?: 'landing' | 'app';
}

export function BrandHeader({
  onBrandClick,
  brandHref,
  centerNav,
  darkMode,
  onToggleDarkMode,
  rightActions,
  variant = 'app',
}: BrandHeaderProps) {
  const headerClass =
    variant === 'landing'
      ? 'flex items-center justify-between gap-3 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-12 py-3.5 sm:py-4 border-b border-slate-200/80 dark:border-slate-800 bg-[#FAF8F5]/90 dark:bg-[#121417]/90 backdrop-blur sticky top-0 z-30'
      : 'flex items-center justify-between gap-3 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-12 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur sticky top-0 z-30';

  const brandContent = (
    <>
      <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-500 shrink-0" aria-hidden="true" />
      <span className={variant === 'landing' ? 'text-xl font-bold tracking-tight font-serif-custom' : 'text-lg font-bold tracking-tight font-serif-custom'}>
        Luminary
      </span>
    </>
  );

  return (
    <header className={headerClass}>
      {brandHref ? (
        <a href={brandHref} className="flex items-center gap-2 sm:gap-2.5 whitespace-nowrap shrink-0">
          {brandContent}
        </a>
      ) : (
        <button
          type="button"
          onClick={onBrandClick}
          className="flex items-center gap-2 sm:gap-2.5 whitespace-nowrap shrink-0 text-left min-h-[40px]"
        >
          {brandContent}
        </button>
      )}

      {centerNav}

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="p-2.5 min-w-[40px] min-h-[40px] inline-flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
          aria-label="Toggle color theme"
          title="Toggle theme"
        >
          {darkMode ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
        </button>
        {rightActions}
      </div>
    </header>
  );
}

export interface FooterLink {
  label: string;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
}

interface SiteFooterProps {
  text?: string;
  links?: FooterLink[];
}

export function SiteFooter({
  text = '© 2026 Luminary Daily Journal. All rights reserved.',
  links = [],
}: SiteFooterProps) {
  return (
    <footer className="py-6 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <p>{text}</p>
        {links.length > 0 && (
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            {links.map((link) =>
              link.href ? (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={link.onClick}
                  className="py-1.5 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  {link.label}
                </a>
              ) : (
                <button
                  key={link.label}
                  type="button"
                  onClick={link.onClick}
                  className="py-1.5 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  {link.label}
                </button>
              )
            )}
          </nav>
        )}
      </div>
    </footer>
  );
}
