'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  // Determine active page
  const isActive = (path: string) => {
    if (path === '/meals') {
      return pathname === '/meals' || pathname.startsWith('/meals/');
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // Check if we're on a detail/edit page (not main pages)
  const isDetailPage = pathname.includes('/meals/') && pathname !== '/meals';

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/meals"
              className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors"
            >
              Meal Planner
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/meals"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/meals')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Meals
              </Link>
              <Link
                href="/candidates"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/candidates')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Candidates
              </Link>
              <Link
                href="/weeks"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/weeks')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Week Planning
              </Link>
              <Link
                href="/categories"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/categories')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Categories
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/meals/add"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
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
      </div>
    </header>
  );
}
