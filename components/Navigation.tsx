'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const isActive = (path: string) => {
    if (path === '/meals') {
      return pathname === '/meals' || pathname.startsWith('/meals/');
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const navLinks = [
    { href: '/meals', label: 'Meals' },
    { href: '/candidates', label: 'Candidates' },
    { href: '/categories', label: 'Categories' },
  ];

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/meals"
            className="text-xl font-bold text-gray-900 hover:text-aubergine-400 transition-colors"
          >
            Meal Planner
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-aubergine-100 text-aubergine-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <Link
                href="/meals/add"
                className="bg-aubergine-700 text-white px-4 py-2 rounded-md hover:bg-aubergine-800 transition-colors text-sm font-medium"
              >
                Add Meal
              </Link>
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium disabled:opacity-50"
              >
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-2 border-t border-gray-100 pt-4">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-aubergine-100 text-aubergine-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/meals/add"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-aubergine-700 text-white px-3 py-2 rounded-md hover:bg-aubergine-800 transition-colors text-sm font-medium text-center mt-2"
              >
                Add Meal
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                disabled={isSigningOut}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium disabled:opacity-50 px-3 py-2 text-left"
              >
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
