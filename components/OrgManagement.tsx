'use client'

import { useState, useEffect, useCallback } from 'react'

interface OrgMember {
  id: string
  user_id: string | null
  role: 'owner' | 'editor' | 'viewer'
  invited_email: string | null
  invited_at: string | null
  accepted_at: string | null
  email: string | null
  full_name: string | null
  avatar_url: string | null
}

interface OrgDetails {
  id: string
  name: string
  subscription_plan: 'free' | 'personal' | 'business'
  max_members: number
}

export default function OrgManagement() {
  const [org, setOrg] = useState<OrgDetails | null>(null)
  const [role, setRole] = useState<'owner' | 'editor' | 'viewer'>('viewer')
  const [members, setMembers] = useState<OrgMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [orgName, setOrgName] = useState('')

  const loadOrg = useCallback(async () => {
    try {
      const [orgRes, membersRes] = await Promise.all([
        fetch('/api/org'),
        fetch('/api/org/members'),
      ])

      if (orgRes.ok) {
        const data = await orgRes.json()
        setOrg(data.org)
        setRole(data.role)
        setOrgName(data.org?.name || '')
      }

      if (membersRes.ok) {
        const data = await membersRes.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error('Error loading org:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrg()
  }, [loadOrg])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/org/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to send invitation' })
        return
      }

      setMessage({ type: 'success', text: `Invitation sent to ${inviteEmail}` })
      setInviteEmail('')
      loadOrg()
    } catch {
      setMessage({ type: 'error', text: 'Failed to send invitation' })
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member from the organization?')) return

    try {
      const res = await fetch('/api/org/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId }),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Member removed' })
        loadOrg()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to remove member' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove member' })
    }
  }

  const handleChangeRole = async (memberId: string, newRole: 'editor' | 'viewer') => {
    try {
      const res = await fetch(`/api/org/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Role updated' })
        loadOrg()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to update role' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update role' })
    }
  }

  const handleSaveName = async () => {
    if (!orgName.trim()) return

    try {
      const res = await fetch('/api/org', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName.trim() }),
      })

      if (res.ok) {
        setEditingName(false)
        setMessage({ type: 'success', text: 'Organization name updated' })
        loadOrg()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to update name' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update name' })
    }
  }

  if (loading) {
    return (
      <div className="card-professional p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!org) return null

  // Hide for free tier (single user)
  if (org.subscription_plan === 'free') return null

  const isOwnerRole = role === 'owner'
  const memberCount = members.length
  const canInvite = isOwnerRole && memberCount < org.max_members

  const roleBadgeColor = (r: string) => {
    switch (r) {
      case 'owner': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
      case 'editor': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'viewer': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="card-professional p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gradient-primary">Team Management</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {memberCount}/{org.max_members} members
        </span>
      </div>

      {/* Org Name */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Organization Name
        </label>
        {editingName && isOwnerRole ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              autoFocus
            />
            <button
              onClick={handleSaveName}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => { setEditingName(false); setOrgName(org.name) }}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{org.name || 'Unnamed Organization'}</span>
            {isOwnerRole && (
              <button
                onClick={() => setEditingName(true)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`text-sm px-3 py-2 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Member List */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Members</h4>
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3 min-w-0">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-500">
                  {(member.email || '?')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {member.full_name || member.email || member.invited_email}
                </div>
                {member.full_name && member.email && (
                  <div className="text-xs text-gray-500 truncate">{member.email}</div>
                )}
                {!member.user_id && (
                  <div className="text-xs text-amber-600 dark:text-amber-400">Pending invite</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor(member.role)}`}>
                {member.role}
              </span>
              {isOwnerRole && member.role !== 'owner' && (
                <div className="flex items-center gap-1">
                  <select
                    value={member.role}
                    onChange={(e) => handleChangeRole(member.id, e.target.value as 'editor' | 'viewer')}
                    className="text-xs border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-500 hover:text-red-700 text-xs p-1"
                    title="Remove member"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Form (owner only) */}
      {canInvite && (
        <form onSubmit={handleInvite} className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Invite Member</h4>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400"
              required
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {inviting ? 'Sending...' : 'Invite'}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Editors can add/edit vehicles and records. Viewers can only view data.
          </p>
        </form>
      )}

      {isOwnerRole && memberCount >= org.max_members && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Member limit reached ({org.max_members}). Upgrade your plan for more team members.
        </p>
      )}
    </div>
  )
}
