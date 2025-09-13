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
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200">
                BT
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 ease-in-out ${
                  isCurrentPage(item.href)
                    ? "text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-blue-600 after:to-blue-500 dark:after:from-blue-400 dark:after:to-blue-300 after:rounded-full"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 after:absolute after:bottom-0 after:left-1/2 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-blue-600 after:to-blue-500 dark:after:from-blue-400 dark:after:to-blue-300 after:transition-all after:duration-300 after:rounded-full hover:after:left-0 hover:after:w-full"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {/* Search - Desktop */}
            <div className="hidden md:block">
              <Search className="w-64" />
            </div>
            
            <ThemeToggle />
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!isOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
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
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-3 sm:px-3 bg-gray-50 dark:bg-gray-800">
            {/* Search - Mobile */}
            <div className="px-3">
              <Search className="w-full" />
            </div>
            
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 ease-in-out ${
                  isCurrentPage(item.href)
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-blue-600 before:to-blue-500 dark:before:from-blue-400 dark:before:to-blue-300 before:rounded-r-full"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 before:absolute before:left-0 before:top-1/2 before:w-0 before:h-0 before:bg-gradient-to-b before:from-blue-600 before:to-blue-500 dark:before:from-blue-400 dark:before:to-blue-300 before:transition-all before:duration-300 before:rounded-r-full hover:before:top-0 hover:before:bottom-0 hover:before:w-1"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}