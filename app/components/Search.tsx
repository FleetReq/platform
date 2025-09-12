'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface SearchResult {
  id: string
  title: string
  content: string
  url: string
  type: 'page' | 'section' | 'skill' | 'experience'
}

interface SearchProps {
  className?: string
}

export default function Search({ className = '' }: SearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Search data - you can expand this with your actual content
  const searchData: SearchResult[] = [
    // Pages
    { id: '1', title: 'About', content: 'Site Reliability Engineer communication skills team leadership', url: '/about', type: 'page' },
    { id: '2', title: 'Resume', content: 'Experience skills MongoDB migration Apex Fintech Trimble', url: '/resume', type: 'page' },
    { id: '3', title: 'Projects', content: 'Professional work Infrastructure automation MongoDB migration', url: '/projects', type: 'page' },
    { id: '4', title: 'Contact', content: 'Get in touch email LinkedIn GitHub careers collaboration', url: '/contact', type: 'page' },
    
    // Skills
    { id: '5', title: 'Go Programming', content: 'Go programming language development backend systems', url: '/resume#skills', type: 'skill' },
    { id: '6', title: 'Kubernetes', content: 'Kubernetes container orchestration DevOps infrastructure', url: '/resume#skills', type: 'skill' },
    { id: '7', title: 'MongoDB', content: 'MongoDB database migration Atlas cloud 60 billion documents', url: '/projects', type: 'skill' },
    { id: '8', title: 'Python', content: 'Python programming automation scripting development', url: '/resume#skills', type: 'skill' },
    { id: '9', title: 'Terraform', content: 'Terraform infrastructure as code IaC automation', url: '/resume#skills', type: 'skill' },
    
    // Experience
    { id: '10', title: 'Apex Fintech Solutions', content: 'Site Reliability Engineer MongoDB migration DataDog monitoring', url: '/resume#experience', type: 'experience' },
    { id: '11', title: 'Trimble Internship', content: 'Software Engineer Intern SQL Server Azure DevOps C# VB', url: '/resume#experience', type: 'experience' },
    { id: '12', title: 'Teaching Experience', content: 'Math coding photography instructor curriculum development', url: '/resume#experience', type: 'experience' },
    
    // Projects
    { id: '13', title: 'Bike Index Platform', content: 'Team lead capstone project PSU theft information Bryan Hance', url: '/projects', type: 'section' },
    { id: '14', title: 'Infrastructure Monitoring', content: 'Production monitoring DataDog Kubernetes high-scale', url: '/projects', type: 'section' },
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
      if (event.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    
    if (searchQuery.trim().length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    
    // Simple search implementation
    const filtered = searchData.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 8) // Limit to 8 results

    // Simulate slight delay for real-world feel
    setTimeout(() => {
      setResults(filtered)
      setIsLoading(false)
    }, 150)
  }

  const handleResultClick = () => {
    setIsOpen(false)
    setQuery('')
    setResults([])
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'page':
        return <span className="text-blue-500">📄</span>
      case 'skill':
        return <span className="text-green-500">⚡</span>
      case 'experience':
        return <span className="text-purple-500">💼</span>
      case 'section':
        return <span className="text-orange-500">📋</span>
      default:
        return <span className="text-gray-500">🔍</span>
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search site... (⌘K)"
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
        
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <span className="ml-2">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={result.url}
                  onClick={handleResultClick}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="mr-3 text-lg">
                    {getTypeIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {result.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {result.content.substring(0, 60)}...
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    {result.type}
                  </div>
                </Link>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}