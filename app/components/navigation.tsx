"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeToggle } from "../theme-toggle";
import { SubscriptionBadge } from "./SubscriptionBadge";
import { supabase, getUserSubscriptionPlan } from "@/lib/supabase-client";

const baseNavigationItems = [
  { name: "Home", href: "/" },
  { name: "Pricing", href: "/pricing" },
];

const authenticatedNavigationItems = [
  { name: "Home", href: "/" },
  { name: "Pricing", href: "/pricing" },
  { name: "Dashboard", href: "/dashboard" },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string } } | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'personal' | 'business'>('free');
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string | null>(null);

  // Fetch user and subscription tier
  useEffect(() => {
    const fetchUserData = async () => {
      if (!supabase) return;

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const tier = await getUserSubscriptionPlan(currentUser.id);
        setSubscriptionTier(tier);

        // Fetch subscription start date from user_profiles
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_start_date')
          .eq('id', currentUser.id)
          .single();

        if (profile?.subscription_start_date) {
          setSubscriptionStartDate(profile.subscription_start_date);
        }
      }
    };

    fetchUserData();

    if (!supabase) return;

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const tier = await getUserSubscriptionPlan(session.user.id);
        setSubscriptionTier(tier);

        // Fetch subscription start date
        if (supabase) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('subscription_start_date')
            .eq('id', session.user.id)
            .single();

          if (profile?.subscription_start_date) {
            setSubscriptionStartDate(profile.subscription_start_date);
          }
        }
      } else {
        setSubscriptionTier('free');
        setSubscriptionStartDate(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSubscriptionTier('free');
    router.push('/');
  };

  // Helper function to check if current page matches navigation item
  const isCurrentPage = (href: string) => {
    // Remove trailing slash from pathname for comparison
    const normalizedPathname = pathname.replace(/\/$/, '') || '/';
    const normalizedHref = href.replace(/\/$/, '') || '/';
    return normalizedPathname === normalizedHref;
  };

  // Get navigation items based on auth state
  const navigationItems = user ? authenticatedNavigationItems : baseNavigationItems;

  return (
    <nav className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-2xl border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-20 gap-4">
          {/* Left: Logo + Badge */}
          <div className="flex items-center flex-shrink-0 min-w-0 gap-2 z-10">
            <Link href={user ? "/dashboard" : "/"} className="group">
              <div className="flex items-center space-x-3">
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">Fleet<span className="text-blue-600 dark:text-blue-400">Req</span></div>
                  <div className="hidden sm:block text-xs text-gray-600 dark:text-gray-400 truncate">Fleet Management Platform</div>
                </div>
              </div>
            </Link>
            {user && <SubscriptionBadge tier={subscriptionTier} subscriptionStartDate={subscriptionStartDate} />}
          </div>

          {/* Center: Desktop Navigation - Absolutely centered */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-1 bg-gray-50/80 dark:bg-gray-800/50 rounded-full px-2 py-2 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-3 py-2 text-sm font-medium rounded-full transition-all duration-300 ease-out whitespace-nowrap ${
                    isCurrentPage(item.href)
                      ? "text-white bg-gray-900 dark:text-gray-900 dark:bg-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-gray-700/70"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Welcome, Sign Out/Sign In, Theme Toggle */}
          <div className="flex items-center flex-shrink-0 space-x-2 z-10">
            {/* Welcome message - shown when logged in */}
            {user && (
              <div className="hidden md:flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white font-medium">
                  Welcome, {(() => {
                    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
                    const parts = fullName.split(' ');
                    if (parts.length > 1) {
                      return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
                    }
                    return fullName;
                  })()}!
                </span>
              </div>
            )}

            <ThemeToggle />

            {/* Sign In button - shown when logged out */}
            {!user && (
              <Link
                href="/dashboard"
                className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors duration-200 shadow-sm"
              >
                Sign In
                <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </Link>
            )}

            {/* Sign Out button - shown when logged in */}
            {user && (
              <button
                onClick={handleSignOut}
                className="hidden md:inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!isOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800">
          <div className="px-6 py-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
            {/* Dashboard Quick Actions - shown when on /dashboard */}
            {user && pathname === '/dashboard' && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 mb-2">Dashboard</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Graph', tab: 'dashboard', icon: '📊' },
                    { label: 'Add Car', tab: 'add-car', icon: '🚗' },
                    { label: 'Add Fill-up', tab: 'add-fillup', icon: '⛽' },
                    { label: 'Add Trip', tab: 'add-trip', icon: '🛣️' },
                    { label: 'Maintenance', tab: 'add-maintenance', icon: '🔧' },
                    { label: 'Records', tab: 'records', icon: '📋' },
                    { label: 'Settings', tab: 'settings', icon: '⚙️' },
                  ].map((item) => (
                    <Link
                      key={item.tab}
                      href={`/dashboard?tab=${item.tab}`}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Site Navigation Links */}
            {user && pathname === '/dashboard' && (
              <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 mb-2">Navigate</div>
            )}
            <div className="space-y-2 mb-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 ${
                    isCurrentPage(item.href)
                      ? "text-white bg-gray-900 dark:text-gray-900 dark:bg-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile CTA / Sign Out / Sign In */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              {user ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-base font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
                >
                  <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/dashboard"
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white text-base font-medium rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 shadow-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                  <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}