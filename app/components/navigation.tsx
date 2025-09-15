"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "../theme-toggle";
import Search from "./Search";

const navigationItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Resume", href: "/resume" },
  { name: "Projects", href: "/projects" },
  { name: "Contact", href: "/contact" },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  // Helper function to check if current page matches navigation item
  const isCurrentPage = (href: string) => {
    // Remove trailing slash from pathname for comparison
    const normalizedPathname = pathname.replace(/\/$/, '') || '/';
    const normalizedHref = href.replace(/\/$/, '') || '/';
    return normalizedPathname === normalizedHref;
  };

  return (
    <nav className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-2xl border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Left: Logo */}
          <div className="flex items-center flex-shrink-0 min-w-0">
            <Link href="/" className="group">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105 flex-shrink-0">
                  <span className="text-base font-bold text-white dark:text-gray-900">BT</span>
                </div>
                <div className="hidden sm:block min-w-0">
                  <div className="text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">Bruce Truong</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate">Site Reliability Engineer</div>
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <div className="hidden md:flex justify-center flex-1 max-w-md">
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

          {/* Right: Search, CTA, Theme Toggle */}
          <div className="flex items-center flex-shrink-0 space-x-2">
            {/* Search - Desktop */}
            <div className="hidden lg:block">
              <Search className="w-48" />
            </div>

            {/* CTA Button */}
            <div className="hidden xl:block">
              <Link
                href="/contact"
                className="inline-flex items-center px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-300 shadow-sm hover:shadow-md whitespace-nowrap"
              >
                Contact
                <svg className="ml-1.5 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <ThemeToggle />

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
            {/* Search - Mobile */}
            <div className="mb-6">
              <Search className="w-full" />
            </div>

            {/* Mobile Navigation Links */}
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

            {/* Mobile CTA */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <Link
                href="/contact"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-base font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
                Get In Touch
                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}