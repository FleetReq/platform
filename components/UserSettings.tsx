'use client'

import { useState, useEffect } from 'react'
import { supabase, type Car } from '@/lib/supabase-client'
import { fetchWithTimeout } from '@/lib/fetch-with-timeout'
import { validateSubscriptionPlan } from '@/lib/validation'
import { ACCOUNT_DELETION_GRACE_DAYS, PLAN_LIMITS, PLAN_DISPLAY_NAMES, getPlanColor, type SubscriptionPlan } from '@/lib/constants'
import type { User } from '@supabase/supabase-js'

// User Settings Component
export default function UserSettings({ cars, onCarDeleted, initialSubscriptionPlan = 'free', orgRole = 'owner' }: { cars?: Car[], onCarDeleted?: () => void, initialSubscriptionPlan?: 'free' | 'personal' | 'business', orgRole?: 'owner' | 'editor' | 'viewer' }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [deletingCarId, setDeletingCarId] = useState<string | null>(null)
  const [confirmDeleteCarId, setConfirmDeleteCarId] = useState<string | null>(null)
  const [subscriptionPlan, setSubscriptionPlan] = useState<'free' | 'personal' | 'business'>(initialSubscriptionPlan)
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null)
  const [subscriptionFetchError, setSubscriptionFetchError] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [confirmationText, setConfirmationText] = useState('')

  // Notification preferences
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true)
  const [notificationFrequency, setNotificationFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [notificationWarningEnabled, setNotificationWarningEnabled] = useState(true)
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false)
  const [isSavingNotificationSettings, setIsSavingNotificationSettings] = useState(false)

  // Downgrade modal state
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)
  const [downgradeTargetTier, setDowngradeTargetTier] = useState<'free' | 'personal' | null>(null)
  const [isDowngrading, setIsDowngrading] = useState(false)
  const [showVehicleSelectionModal, setShowVehicleSelectionModal] = useState(false)
  const [vehiclesToDelete, setVehiclesToDelete] = useState<string[]>([])
  const [vehiclesNeededToDelete, setVehiclesNeededToDelete] = useState(0)

  useEffect(() => {
    const getUser = async () => {
      if (!supabase) return
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        window.location.href = '/login'
        return
      }
      setCurrentUser(user)

      // Fetch subscription info from org + notification prefs from user_profiles
      if (user) {
        // Get org subscription info
        try {
          const orgRes = await fetchWithTimeout('/api/org')
          if (orgRes.ok) {
            const orgData = await orgRes.json()
            setSubscriptionPlan(validateSubscriptionPlan(orgData.org?.subscription_plan) ?? 'free')
            setSubscriptionEndDate(orgData.org?.subscription_end_date || null)
          }
        } catch (err) {
          console.error('[Dashboard] Failed to fetch org subscription info:', err)
          setSubscriptionFetchError(true)
        }

        // Get notification preferences from user_profiles
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('email_notifications_enabled, notification_frequency, notification_warning_enabled')
          .eq('id', user.id)
          .maybeSingle()

        if (profile) {
          setEmailNotificationsEnabled(profile.email_notifications_enabled ?? true)
          setNotificationFrequency((profile.notification_frequency as 'daily' | 'weekly' | 'monthly') || 'weekly')
          setNotificationWarningEnabled(profile.notification_warning_enabled ?? true)
        }
      }
    }
    getUser()
  }, [])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    if (!currentPassword.trim()) {
      setMessage({ type: 'error', text: 'Current password is required' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' })
      return
    }

    if (newPassword === currentPassword) {
      setMessage({ type: 'error', text: 'New password must be different from current password' })
      return
    }

    setIsChangingPassword(true)
    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser?.email || '',
        password: currentPassword
      })

      if (signInError) {
        setMessage({ type: 'error', text: 'Current password is incorrect' })
        return
      }

      // If verification successful, update password
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update password'
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLinkGoogle = async () => {
    // Account linking disabled for security in single-organization setup
    setMessage({
      type: 'error',
      text: 'Account linking is disabled for security. Contact your administrator for account changes.'
    })
  }

  const handleDeleteCar = async (carId: string) => {
    if (confirmDeleteCarId !== carId) {
      setConfirmDeleteCarId(carId)
      return
    }

    setDeletingCarId(carId)
    try {
      const response = await fetchWithTimeout(`/api/cars/${carId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete vehicle')
      }

      setMessage({ type: 'success', text: 'Vehicle deleted successfully' })
      setConfirmDeleteCarId(null)
      if (onCarDeleted) onCarDeleted()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete vehicle'
      })
    } finally {
      setDeletingCarId(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!currentUser) return

    setIsCancelling(true)
    try {
      const response = await fetchWithTimeout('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancellationReason
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      const data = await response.json()
      setMessage({
        type: 'success',
        text: `Account deletion scheduled. Your account will remain active until ${new Date(data.subscription_end_date).toLocaleDateString()}. All data will be permanently deleted ${ACCOUNT_DELETION_GRACE_DAYS} days after that date.`
      })
      setShowCancelModal(false)
      setCancellationReason('')
      setConfirmationText('')

      // Refresh subscription info from org
      try {
        const orgRes = await fetchWithTimeout('/api/org')
        if (orgRes.ok) {
          const orgData = await orgRes.json()
          setSubscriptionPlan(validateSubscriptionPlan(orgData.org?.subscription_plan) ?? 'free')
          setSubscriptionEndDate(orgData.org?.subscription_end_date || null)
        }
      } catch (err) {
        console.error('[Dashboard] Failed to refresh org after cancellation:', err)
        setMessage({
          type: 'success',
          text: 'Account deletion scheduled. Refresh the page to see your updated plan.'
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to cancel subscription'
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleDowngrade = async () => {
    if (!currentUser || !downgradeTargetTier) return

    setIsDowngrading(true)
    try {
      const response = await fetchWithTimeout('/api/subscription/downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetTier: downgradeTargetTier,
          vehiclesToDelete: vehiclesToDelete.length > 0 ? vehiclesToDelete : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if vehicle selection is required
        if (data.requiresVehicleSelection) {
          setVehiclesNeededToDelete(data.vehiclesToDelete)
          setShowDowngradeModal(false)
          setShowVehicleSelectionModal(true)
          setIsDowngrading(false)
          return
        }
        throw new Error(data.error || 'Failed to downgrade subscription')
      }

      setMessage({
        type: 'success',
        text: data.message
      })
      setShowDowngradeModal(false)
      setShowVehicleSelectionModal(false)
      setDowngradeTargetTier(null)
      setVehiclesToDelete([])

      // Refresh data
      if (onCarDeleted) onCarDeleted()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to downgrade subscription'
      })
    } finally {
      setIsDowngrading(false)
    }
  }

  const isGoogleLinked = currentUser?.app_metadata?.providers?.includes('google')

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Settings</h2>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Account Information */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h3>
        <div className="space-y-3">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Email: </span>
            <span className="text-gray-900 dark:text-white">{currentUser?.email}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Account Created: </span>
            <span className="text-gray-900 dark:text-white">
              {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications</h3>
        <div className="space-y-3">
          {/* Master on/off toggle — all users */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Maintenance reminders</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Email alerts when maintenance items are overdue{subscriptionPlan !== 'free' ? ' or approaching due' : ''}
              </div>
            </div>
            <button
              onClick={async () => {
                if (!supabase || !currentUser) return
                setIsTogglingNotifications(true)
                const newValue = !emailNotificationsEnabled
                try {
                  const { error } = await supabase
                    .from('user_profiles')
                    .update({ email_notifications_enabled: newValue })
                    .eq('id', currentUser.id)
                  if (!error) {
                    setEmailNotificationsEnabled(newValue)
                    setMessage({ type: 'success', text: newValue ? 'Email notifications enabled' : 'Email notifications disabled' })
                  } else {
                    setMessage({ type: 'error', text: 'Failed to update notification preference' })
                  }
                } catch (err) {
                  console.error('[Dashboard] Failed to update notification preference:', err)
                  setMessage({ type: 'error', text: 'Failed to update notification preference' })
                } finally {
                  setIsTogglingNotifications(false)
                }
              }}
              disabled={isTogglingNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                emailNotificationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              role="switch"
              aria-checked={emailNotificationsEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Advanced notification settings — Family/Business only */}
          {subscriptionPlan !== 'free' && emailNotificationsEnabled && (
            <div className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 space-y-4">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                Family+ Settings
              </div>

              {/* Reminder frequency */}
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">Overdue reminder frequency</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    How often to re-send alerts for still-overdue items
                  </div>
                </div>
                <select
                  value={notificationFrequency}
                  onChange={async (e) => {
                    if (!supabase || !currentUser) return
                    const newFreq = e.target.value as 'daily' | 'weekly' | 'monthly'
                    setNotificationFrequency(newFreq)
                    setIsSavingNotificationSettings(true)
                    try {
                      const { error } = await supabase
                        .from('user_profiles')
                        .update({ notification_frequency: newFreq })
                        .eq('id', currentUser.id)
                      if (!error) {
                        setMessage({ type: 'success', text: 'Reminder frequency updated' })
                      } else {
                        setMessage({ type: 'error', text: 'Failed to update frequency' })
                      }
                    } catch (err) {
                      console.error('[Dashboard] Failed to update notification frequency:', err)
                      setMessage({ type: 'error', text: 'Failed to update frequency' })
                    } finally {
                      setIsSavingNotificationSettings(false)
                    }
                  }}
                  disabled={isSavingNotificationSettings}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Warning emails toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">Upcoming due warnings</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    🟡 Alert when maintenance is approaching due (before it&apos;s overdue)
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!supabase || !currentUser) return
                    setIsSavingNotificationSettings(true)
                    const newValue = !notificationWarningEnabled
                    try {
                      const { error } = await supabase
                        .from('user_profiles')
                        .update({ notification_warning_enabled: newValue })
                        .eq('id', currentUser.id)
                      if (!error) {
                        setNotificationWarningEnabled(newValue)
                        setMessage({ type: 'success', text: newValue ? 'Warning emails enabled' : 'Warning emails disabled' })
                      } else {
                        setMessage({ type: 'error', text: 'Failed to update warning preference' })
                      }
                    } catch (err) {
                      console.error('[Dashboard] Failed to update warning preference:', err)
                      setMessage({ type: 'error', text: 'Failed to update warning preference' })
                    } finally {
                      setIsSavingNotificationSettings(false)
                    }
                  }}
                  disabled={isSavingNotificationSettings}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex-shrink-0 ${
                    notificationWarningEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  role="switch"
                  aria-checked={notificationWarningEnabled}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationWarningEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onKeyDown={(e) => e.key === 'Escape' && setShowCancelModal(false)}
          tabIndex={-1}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 id="cancel-modal-title" className="text-2xl font-bold text-red-600 dark:text-red-400 mb-3">
                  ⚠️ DELETE ACCOUNT?
                </h3>
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-semibold">
                    This action is <span className="text-red-600 dark:text-red-400 uppercase">permanent and cannot be undone</span>.
                  </p>
                  <p>
                    Your subscription will remain active until{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {subscriptionEndDate ? new Date(subscriptionEndDate).toLocaleDateString() : 'the end of your billing period'}
                    </span>.
                  </p>
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    {ACCOUNT_DELETION_GRACE_DAYS} days after that date, ALL of your data will be permanently deleted:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>All vehicles and their information</li>
                    <li>All fuel fill-up records</li>
                    <li>All maintenance records</li>
                    <li>All trip tracking data</li>
                    <li>Your account and profile</li>
                  </ul>
                  <p className="font-semibold pt-2">
                    There is no way to recover this data after deletion.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Why are you leaving? (Optional)
              </label>
              <textarea
                id="cancellationReason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                placeholder="Help us improve..."
              />
            </div>

            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-lg p-4">
              <label htmlFor="confirmationText" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                To confirm deletion, type <span className="text-red-600 dark:text-red-400 font-mono">Confirm Deletion</span> below:
              </label>
              <input
                id="confirmationText"
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border-2 border-red-300 dark:border-red-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900"
                placeholder="Type: Confirm Deletion"
                autoComplete="off"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancellationReason('')
                  setConfirmationText('')
                }}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling || confirmationText !== 'Confirm Deletion'}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isCancelling ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Downgrade Modal */}
      {showDowngradeModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onKeyDown={(e) => e.key === 'Escape' && setShowDowngradeModal(false)}
          tabIndex={-1}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="downgrade-modal-title"
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <h3 id="downgrade-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Downgrade Subscription
            </h3>

            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select the tier you want to downgrade to. You&apos;ll keep your current {subscriptionPlan} tier access until the end of your billing period.
              </p>

              {/* Tier Selection */}
              <div className="space-y-2">
                {subscriptionPlan === 'business' && (
                  <button
                    onClick={() => setDowngradeTargetTier('personal')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                      downgradeTargetTier === 'personal'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">Family Tier - $4/month</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Up to 3 vehicles, full maintenance tracking</div>
                  </button>
                )}
                {(subscriptionPlan === 'business' || subscriptionPlan === 'personal') && (
                  <>
                    <button
                      onClick={() => setDowngradeTargetTier('free')}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                        downgradeTargetTier === 'free'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">Free Tier</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">1 vehicle, basic features</div>
                    </button>

                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDowngradeModal(false)
                  setDowngradeTargetTier(null)
                }}
                disabled={isDowngrading}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDowngrade}
                disabled={isDowngrading || !downgradeTargetTier}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isDowngrading ? 'Processing...' : 'Downgrade'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Selection Modal */}
      {showVehicleSelectionModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onKeyDown={(e) => e.key === 'Escape' && setShowVehicleSelectionModal(false)}
          tabIndex={-1}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-select-modal-title"
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6"
          >
            <h3 id="vehicle-select-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Select Vehicles to Remove
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              You have {cars?.length || 0} vehicles but the {downgradeTargetTier} tier allows {downgradeTargetTier ? PLAN_LIMITS[downgradeTargetTier].maxVehicles : 1}.
              Please select {vehiclesNeededToDelete} vehicle{vehiclesNeededToDelete > 1 ? 's' : ''} to remove:
            </p>

            <div className="space-y-2 mb-6 max-h-80 overflow-y-auto">
              {cars?.map((car) => (
                <div
                  key={car.id}
                  onClick={() => {
                    if (vehiclesToDelete.includes(car.id)) {
                      setVehiclesToDelete(vehiclesToDelete.filter(id => id !== car.id))
                    } else if (vehiclesToDelete.length < vehiclesNeededToDelete) {
                      setVehiclesToDelete([...vehiclesToDelete, car.id])
                    }
                  }}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    vehiclesToDelete.includes(car.id)
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {car.year} {car.make} {car.model}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {car.nickname && `"${car.nickname}" • `}{car.license_plate}
                      </div>
                    </div>
                    {vehiclesToDelete.includes(car.id) && (
                      <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowVehicleSelectionModal(false)
                  setVehiclesToDelete([])
                  setShowDowngradeModal(true)
                }}
                disabled={isDowngrading}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleDowngrade}
                disabled={isDowngrading || vehiclesToDelete.length !== vehiclesNeededToDelete}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isDowngrading ? 'Processing...' : `Remove ${vehiclesToDelete.length}/${vehiclesNeededToDelete} & Downgrade`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Linked Accounts */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Linked Accounts</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Google</div>
                <div className="text-sm text-gray-500">Sign in with your Google account</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isGoogleLinked ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-green-600">Connected</span>
                </div>
              ) : (
                <button
                  onClick={handleLinkGoogle}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Link Account
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter current password"
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password"
              required
              minLength={6}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm new password"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={isChangingPassword}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Delete Vehicles */}
      {cars && cars.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delete Vehicles</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Deleting a vehicle will permanently remove all associated fill-up and maintenance records.
          </p>
          <div className="space-y-3">
            {cars.map((car) => (
              <div key={car.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {car.year} {car.make} {car.model}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {car.nickname && `"${car.nickname}" • `}
                    {car.license_plate}
                  </div>
                </div>
                <div className="flex gap-2">
                  {confirmDeleteCarId === car.id ? (
                    <>
                      <button
                        onClick={() => setConfirmDeleteCarId(null)}
                        className="px-3 py-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteCar(car.id)}
                        disabled={deletingCarId === car.id}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors"
                      >
                        {deletingCarId === car.id ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDeleteCar(car.id)}
                      disabled={deletingCarId !== null}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscription Management — owner of this org only */}
      {orgRole === 'owner' && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subscription Management</h3>
          <div className="space-y-4">
            {subscriptionFetchError && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                Could not load current plan. Showing last known plan — please refresh to get the latest.
              </p>
            )}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Current Plan</div>
                <div className={`text-xl font-bold ${getPlanColor(subscriptionPlan as SubscriptionPlan)}`}>
                  {PLAN_DISPLAY_NAMES[subscriptionPlan as SubscriptionPlan] ?? subscriptionPlan}
                </div>
              </div>
              {subscriptionPlan !== 'free' && subscriptionEndDate && (
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Renews on
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(subscriptionEndDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>

            {subscriptionPlan !== 'free' && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowDowngradeModal(true)}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Downgrade Subscription
                </button>
              </div>
            )}

            {subscriptionPlan === 'free' && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Upgrade to unlock more vehicles, full maintenance tracking, and professional features
                </p>
                <a
                  href="/pricing"
                  className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  View Pricing Plans
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Account — always visible, clearly scoped to the user's own account */}
      {orgRole === 'owner' && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Delete My Account</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Permanently delete your account and all data for this organization. This cannot be undone.
          </p>
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Delete Account
          </button>
        </div>
      )}
    </div>
  )
}
