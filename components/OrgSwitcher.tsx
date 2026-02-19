'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface OrgEntry {
  org_id: string
  role: 'owner' | 'editor' | 'viewer'
  org_name: string
  subscription_plan: 'free' | 'personal' | 'business'
}

interface OrgSwitcherProps {
  onSwitch: () => void
}

const planLabels: Record<string, string> = {
  free: 'Free',
  personal: 'Family',
  business: 'Business',
}

const planColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  personal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  business: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

const roleLabels: Record<string, string> = {
  owner: 'Owner',
  editor: 'Editor',
  viewer: 'Viewer',
}

export default function OrgSwitcher({ onSwitch }: OrgSwitcherProps) {
  const [orgs, setOrgs] = useState<OrgEntry[]>([])
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [switchError, setSwitchError] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const loadOrgs = useCallback(async () => {
    try {
      const res = await fetch('/api/org?all=true')
      if (res.ok) {
        const data = await res.json()
        setOrgs(data.orgs || [])
        setActiveOrgId(data.active_org_id)
      }
    } catch (err) {
      console.error('Failed to load orgs:', err)
    }
  }, [])

  useEffect(() => {
    loadOrgs()
  }, [loadOrgs])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Don't render if user belongs to only 1 org
  if (orgs.length <= 1) return null

  const activeOrg = orgs.find(o => o.org_id === activeOrgId) || orgs[0]

  const handleSwitch = async (orgId: string) => {
    if (orgId === activeOrg?.org_id) {
      setIsOpen(false)
      return
    }

    setSwitching(true)
    setSwitchError('')
    try {
      const res = await fetch('/api/org/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId }),
      })

      if (res.ok) {
        // Also set cookie client-side for immediate reads
        document.cookie = `fleetreq-active-org=${orgId}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
        setActiveOrgId(orgId)
        setIsOpen(false)
        onSwitch()
      } else {
        setSwitchError('Failed to switch organization. Please try again.')
      }
    } catch (err) {
      console.error('Failed to switch org:', err)
      setSwitchError('Failed to switch organization. Please try again.')
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div ref={dropdownRef} className="relative mb-4">
      {switchError && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400 mb-1">{switchError}</p>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {activeOrg?.org_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {activeOrg?.org_name || 'Select Organization'}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`inline-block px-1.5 py-0 text-[10px] font-medium rounded ${planColors[activeOrg?.subscription_plan || 'free']}`}>
                {planLabels[activeOrg?.subscription_plan || 'free']}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {roleLabels[activeOrg?.role || 'viewer']}
              </span>
            </div>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
          {orgs.map((org) => (
            <button
              key={org.org_id}
              onClick={() => handleSwitch(org.org_id)}
              disabled={switching}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                org.org_id === activeOrg?.org_id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {org.org_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {org.org_name}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block px-1.5 py-0 text-[10px] font-medium rounded ${planColors[org.subscription_plan]}`}>
                    {planLabels[org.subscription_plan]}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {roleLabels[org.role]}
                  </span>
                </div>
              </div>
              {org.org_id === activeOrg?.org_id && (
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
