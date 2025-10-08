/**
 * Subscription Logic Tests
 *
 * Tests for feature access control and subscription tier logic.
 * These tests ensure the freemium model works correctly.
 */

import { hasFeatureAccess, getUpgradeMessage, isAdmin } from '@/lib/supabase-client'

describe('Subscription Feature Access', () => {
  describe('Free Tier', () => {
    const userId = 'test-free-user-id'
    const plan = 'free'

    it('should allow fuel tracking', () => {
      expect(hasFeatureAccess(userId, plan, 'fuel_tracking')).toBe(true)
    })

    it('should allow basic analytics', () => {
      expect(hasFeatureAccess(userId, plan, 'basic_analytics')).toBe(true)
    })

    it('should NOT allow maintenance tracking', () => {
      expect(hasFeatureAccess(userId, plan, 'maintenance_tracking')).toBe(false)
    })

    it('should NOT allow mobile app', () => {
      expect(hasFeatureAccess(userId, plan, 'mobile_app')).toBe(false)
    })

    it('should NOT allow unlimited history', () => {
      expect(hasFeatureAccess(userId, plan, 'unlimited_history')).toBe(false)
    })

    it('should NOT allow team collaboration', () => {
      expect(hasFeatureAccess(userId, plan, 'team_collaboration')).toBe(false)
    })

    it('should NOT allow tax mileage tracking', () => {
      expect(hasFeatureAccess(userId, plan, 'tax_mileage_tracking')).toBe(false)
    })

    it('should NOT allow professional reporting', () => {
      expect(hasFeatureAccess(userId, plan, 'professional_reporting')).toBe(false)
    })
  })

  describe('Personal Tier', () => {
    const userId = 'test-personal-user-id'
    const plan = 'personal'

    it('should allow fuel tracking', () => {
      expect(hasFeatureAccess(userId, plan, 'fuel_tracking')).toBe(true)
    })

    it('should allow basic analytics', () => {
      expect(hasFeatureAccess(userId, plan, 'basic_analytics')).toBe(true)
    })

    it('should allow maintenance tracking', () => {
      expect(hasFeatureAccess(userId, plan, 'maintenance_tracking')).toBe(true)
    })

    it('should allow mobile app', () => {
      expect(hasFeatureAccess(userId, plan, 'mobile_app')).toBe(true)
    })

    it('should allow unlimited history', () => {
      expect(hasFeatureAccess(userId, plan, 'unlimited_history')).toBe(true)
    })

    it('should NOT allow team collaboration', () => {
      expect(hasFeatureAccess(userId, plan, 'team_collaboration')).toBe(false)
    })

    it('should NOT allow tax mileage tracking', () => {
      expect(hasFeatureAccess(userId, plan, 'tax_mileage_tracking')).toBe(false)
    })

    it('should NOT allow professional reporting', () => {
      expect(hasFeatureAccess(userId, plan, 'professional_reporting')).toBe(false)
    })
  })

  describe('Business Tier', () => {
    const userId = 'test-business-user-id'
    const plan = 'business'

    it('should allow all features', () => {
      expect(hasFeatureAccess(userId, plan, 'fuel_tracking')).toBe(true)
      expect(hasFeatureAccess(userId, plan, 'basic_analytics')).toBe(true)
      expect(hasFeatureAccess(userId, plan, 'maintenance_tracking')).toBe(true)
      expect(hasFeatureAccess(userId, plan, 'mobile_app')).toBe(true)
      expect(hasFeatureAccess(userId, plan, 'unlimited_history')).toBe(true)
      expect(hasFeatureAccess(userId, plan, 'team_collaboration')).toBe(true)
      expect(hasFeatureAccess(userId, plan, 'tax_mileage_tracking')).toBe(true)
      expect(hasFeatureAccess(userId, plan, 'professional_reporting')).toBe(true)
      expect(hasFeatureAccess(userId, plan, 'advanced_mobile_features')).toBe(true)
    })
  })

  describe('Admin Override', () => {
    const adminUserId = 'b73a07b2-ed72-41b1-943f-e119afc9eddb' // deeahtee@live.com

    it('should grant admin access to all features regardless of plan', () => {
      expect(hasFeatureAccess(adminUserId, 'free', 'team_collaboration')).toBe(true)
      expect(hasFeatureAccess(adminUserId, 'free', 'professional_reporting')).toBe(true)
      expect(hasFeatureAccess(adminUserId, 'personal', 'professional_reporting')).toBe(true)
    })

    it('should correctly identify admin users', () => {
      expect(isAdmin(adminUserId)).toBe(true)
      expect(isAdmin('random-user-id')).toBe(false)
    })
  })
})

describe('Upgrade Messages', () => {
  it('should return correct message for maintenance tracking', () => {
    const message = getUpgradeMessage('maintenance_tracking')
    expect(message).toContain('Personal')
    expect(message).toContain('$4/month')
  })

  it('should return correct message for mobile app', () => {
    const message = getUpgradeMessage('mobile_app')
    expect(message).toContain('Personal')
    expect(message).toContain('$4/month')
  })

  it('should return correct message for team collaboration', () => {
    const message = getUpgradeMessage('team_collaboration')
    expect(message).toContain('Business')
    expect(message).toContain('$12/vehicle/month')
  })

  it('should return correct message for tax mileage tracking', () => {
    const message = getUpgradeMessage('tax_mileage_tracking')
    expect(message).toContain('Business')
    expect(message).toContain('$12/vehicle/month')
  })

  it('should return correct message for professional reporting', () => {
    const message = getUpgradeMessage('professional_reporting')
    expect(message).toContain('Business')
    expect(message).toContain('$12/vehicle/month')
  })

  it('should return default message for unknown feature', () => {
    const message = getUpgradeMessage('unknown_feature')
    expect(message).toBe('Upgrade to unlock this feature')
  })
})

describe('Feature Access Edge Cases', () => {
  it('should return false for non-existent feature', () => {
    expect(hasFeatureAccess('user-id', 'personal', 'non_existent_feature')).toBe(false)
  })

  it('should handle null userId gracefully', () => {
    expect(hasFeatureAccess(null as any, 'personal', 'fuel_tracking')).toBe(true)
  })

  it('should handle empty string userId', () => {
    expect(hasFeatureAccess('', 'personal', 'fuel_tracking')).toBe(true)
  })
})
