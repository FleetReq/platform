"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "../theme-toggle";
import { SubscriptionBadge } from "./SubscriptionBadge";
import { supabase, getUserSubscriptionPlan } from "@/lib/supabase-client";

const planLabels: Record<string, string> = {
  free: 'Free', personal: 'Family', business: 'Business',
}
const planColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  personal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  business: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

interface OrgEntry {
  org_id: string
  role: 'owner' | 'editor' | 'viewer'
  org_name: string
  subscription_plan: 'free' | 'personal' | 'business'
}

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
  const [orgs, setOrgs] = useState<OrgEntry[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const orgMenuRef = useRef<HTMLDivElement>(null);

  // Fetch user and subscription tier
  useEffect(() => {
    const fetchUserData = async () => {
      if (!supabase) return;

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const tier = await getUserSubscriptionPlan(currentUser.id);
        setSubscriptionTier(tier);

        // Fetch orgs for switcher
        try {
          const res = await fetch('/api/org?all=true');
          if (res.status === 401) {
            setSubscriptionTier('free');
            setOrgs([]);
          } else if (res.ok) {
            const data = await res.json();
            setOrgs(data.orgs || []);
            setActiveOrgId(data.active_org_id);
          }
        } catch (err) {
          console.error('[nav] Failed to load orgs:', err);
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

        // Re-fetch orgs on every sign-in so the switcher is up-to-date
        // (fetchUserData only runs on mount, so it misses sign-ins that happen
        // after the initial load, e.g. after sign out → sign back in)
        try {
          const res = await fetch('/api/org?all=true');
          if (res.status === 401) {
            setSubscriptionTier('free');
            setOrgs([]);
          } else if (res.ok) {
            const data = await res.json();
            setOrgs(data.orgs || []);
            setActiveOrgId(data.active_org_id);
          }
        } catch (err) {
          console.error('[nav] Failed to load orgs:', err);
        }
      } else {
        setSubscriptionTier('free');
        setSubscriptionStartDate(null);
        setOrgs([]);
        setActiveOrgId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    // Optimistically clear UI state immediately — don't wait for the network call.
    // This makes the nav look signed-out the instant the button is clicked.
    setUser(null)
    setOrgs([])
    setActiveOrgId(null)
    setSubscriptionTier('free')
    setSubscriptionStartDate(null)
    // Fire signOut in the background with a 3s timeout, then force-clear auth
    // cookies in case the network call timed out before Supabase cleared them.
    if (supabase) {
      await Promise.race([
        supabase.auth.signOut().catch(console.error),
        new Promise(resolve => setTimeout(resolve, 3000)),
      ])
    }
    try {
      document.cookie.split(';').forEach(c => {
        const name = c.split('=')[0].trim()
        if (name.startsWith('sb-')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; samesite=lax`
        }
      })
    } catch (e) {
      console.warn('[nav] Failed to clear auth cookies:', e);
    }
    window.location.href = '/'
  };

  // Listen for org name changes dispatched by OrgManagement after a successful save
  useEffect(() => {
    const handler = (e: Event) => {
      const { id, name } = (e as CustomEvent<{ id: string; name: string }>).detail
      setOrgs(prev => prev.map(o => o.org_id === id ? { ...o, org_name: name } : o))
    }
    window.addEventListener('fleetreq:org-updated', handler)
    return () => window.removeEventListener('fleetreq:org-updated', handler)
  }, [])

  // Close org menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (orgMenuRef.current && !orgMenuRef.current.contains(e.target as Node)) {
        setOrgMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOrgSwitch = (orgId: string) => {
    if (orgId === activeOrgId) { setOrgMenuOpen(false); return; }
    setOrgMenuOpen(false)
    // Set cookie immediately client-side — the dropdown only shows orgs the user
    // already belongs to (validated when the list was fetched), so no API round-
    // trip is needed. The reload sends the new cookie with every server request.
    document.cookie = `fleetreq-active-org=${orgId}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    window.location.reload()
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
    <nav className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-2xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-[9999] shadow-sm dark:shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-20 gap-4">
          {/* Left: Logo + Badge + Org Switcher */}
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

            {/* Org Switcher — only when authenticated with 2+ orgs */}
            {user && orgs.length > 1 && (
              <div ref={orgMenuRef} className="relative">
                <button
                  onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                >
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {(orgs.find(o => o.org_id === activeOrgId) || orgs[0])?.org_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span className="truncate max-w-[100px]">
                    {(orgs.find(o => o.org_id === activeOrgId) || orgs[0])?.org_name || 'Switch Org'}
                  </span>
                  <svg className={`w-3 h-3 flex-shrink-0 transition-transform ${orgMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {orgMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden z-50">
                    {orgs.map((org) => {
                      const isActive = org.org_id === (activeOrgId || orgs[0]?.org_id);
                      return (
                        <button
                          key={org.org_id}
                          onClick={() => handleOrgSwitch(org.org_id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {org.org_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{org.org_name}</div>
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-block px-1.5 text-[10px] font-medium rounded ${planColors[org.subscription_plan]}`}>
                                {planLabels[org.subscription_plan]}
                              </span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">{org.role}</span>
                            </div>
                          </div>
                          {isActive && (
                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center: Desktop Navigation - Absolutely centered */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800/50 rounded-full px-2 py-2 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50">
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

          {/* Right: Welcome + Theme Toggle + Sign Out/Sign In */}
          <div className="flex items-center flex-shrink-0 space-x-2 z-10">
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
                href="/login"
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
                disabled={signingOut}
                className="hidden md:inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {signingOut ? 'Signing out...' : 'Sign Out'}
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

            {/* Mobile org switcher */}
            {user && orgs.length > 1 && (
              <div className="pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">Switch Organization</p>
                <div className="space-y-1">
                  {orgs.map((org) => {
                    const isActive = org.org_id === (activeOrgId || orgs[0]?.org_id);
                    return (
                      <button
                        key={org.org_id}
                        onClick={() => { handleOrgSwitch(org.org_id); setIsOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {org.org_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{org.org_name}</div>
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-block px-1.5 text-[10px] font-medium rounded ${planColors[org.subscription_plan]}`}>
                              {planLabels[org.subscription_plan]}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">{org.role}</span>
                          </div>
                        </div>
                        {isActive && (
                          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mobile CTA / Sign Out / Sign In */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              {user ? (
                <button
                  onClick={() => { handleSignOut(); setIsOpen(false); }}
                  disabled={signingOut}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-base font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 disabled:opacity-50"
                >
                  <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
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