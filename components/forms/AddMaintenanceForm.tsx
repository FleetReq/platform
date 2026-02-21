'use client'

import { useState, useEffect } from 'react'
import { type Car, type MaintenanceRecord, hasFeatureAccess } from '@/lib/supabase-client'
import { MAINTENANCE_TYPES } from '@/lib/constants'
import { useReceiptUpload } from '@/lib/use-receipt-upload'
import ReceiptPhotoPicker from '@/components/ReceiptPhotoPicker'
import { isFutureDate } from '@/lib/date-utils'
import { fetchWithTimeout } from '@/lib/fetch-with-timeout'

interface AddMaintenanceFormProps {
  cars: Car[]
  onSuccess: () => void
  subscriptionPlan?: 'free' | 'personal' | 'business'
  userId?: string
}

export default function AddMaintenanceForm({ cars, onSuccess, subscriptionPlan = 'free', userId = '' }: AddMaintenanceFormProps) {
  const receiptUpload = useReceiptUpload()
  const canUploadReceipts = hasFeatureAccess(userId, subscriptionPlan, 'receipt_upload')

  const [formData, setFormData] = useState({
    car_id: cars[0]?.id || '',
    date: new Date().toLocaleDateString('en-CA'),
    type: 'oil_change',
    oil_type: 'conventional',
    cost: '',
    mileage: '',
    service_provider: '',
    location: '',
    next_service_date: '',
    next_service_mileage: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [recentServiceProviders, setRecentServiceProviders] = useState<string[]>([])
  const [recentLocations, setRecentLocations] = useState<string[]>([])

  // Fetch recent maintenance data for smart defaults and autocomplete
  useEffect(() => {
    const fetchRecentData = async () => {
      if (!formData.car_id) return

      try {
        const response = await fetchWithTimeout(`/api/maintenance?car_id=${formData.car_id}&limit=10`)
        if (response.ok) {
          const { maintenanceRecords } = await response.json()

          if (maintenanceRecords && maintenanceRecords.length > 0) {
            const selectedCar = cars.find(c => c.id === formData.car_id)

            // Set smart defaults from car data
            setFormData(prev => ({
              ...prev,
              mileage: selectedCar?.current_mileage?.toString() || ''
            }))

            // Build unique lists for autocomplete (filter out nulls/empty strings)
            const providers = [...new Set(maintenanceRecords
              .map((m: MaintenanceRecord) => m.service_provider)
              .filter((p: string | null): p is string => p !== null && p.trim() !== '')
            )]
            const locations = [...new Set(maintenanceRecords
              .map((m: MaintenanceRecord) => m.location)
              .filter((l: string | null): l is string => l !== null && l.trim() !== '')
            )]

            setRecentServiceProviders(providers as string[])
            setRecentLocations(locations as string[])
          } else {
            // No previous maintenance, just set current mileage
            const selectedCar = cars.find(c => c.id === formData.car_id)
            setFormData(prev => ({
              ...prev,
              mileage: selectedCar?.current_mileage?.toString() || ''
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching recent maintenance:', error)
      }
    }

    fetchRecentData()
  }, [formData.car_id, cars])

  const maintenanceTypeSelectOptions = MAINTENANCE_TYPES.map(t => ({ value: t.key, label: t.label }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetchWithTimeout('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const { maintenanceRecord: createdRecord } = await response.json()

        // Upload receipt photos if any
        const pendingPhotos = receiptUpload.files.filter(f => f.status === 'pending')
        if (pendingPhotos.length > 0 && createdRecord?.id && userId) {
          const paths = await receiptUpload.uploadAll(userId, 'maintenance', createdRecord.id)
          if (paths.length > 0) {
            const patchRes = await fetchWithTimeout(`/api/maintenance/${createdRecord.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ receipt_urls: paths })
            })
            if (!patchRes.ok) {
              setErrorMessage('Record saved, but receipt attachment failed — please re-open the record and re-attach.')
              receiptUpload.reset()
              onSuccess()
              return
            }
          }
        }

        // Reset form to initial state
        setFormData({
          car_id: cars[0]?.id || '',
          date: new Date().toLocaleDateString('en-CA'),
          type: 'oil_change',
          oil_type: 'conventional',
          cost: '',
          mileage: '',
          service_provider: '',
          location: '',
          next_service_date: '',
          next_service_mileage: '',
          notes: ''
        })
        receiptUpload.reset()
        onSuccess()
      } else {
        const error = await response.json()
        setErrorMessage(error.error || 'Failed to add maintenance record')
      }
    } catch (error) {
      console.error('Error adding maintenance record:', error)
      setErrorMessage('Failed to add maintenance record')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add Maintenance Record</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Car *</label>
            <select
              required
              value={formData.car_id}
              onChange={(e) => setFormData({ ...formData, car_id: e.target.value })}
              className="input-field"
            >
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.nickname || `${car.year} ${car.make} ${car.model}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={`w-full px-4 py-2 h-12 border rounded-lg focus:ring-2 bg-white text-gray-900 dark:bg-gray-700 dark:text-white ${isFutureDate(formData.date) ? 'border-yellow-500 dark:border-yellow-500 focus:ring-yellow-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
            />
            {isFutureDate(formData.date) && (
              <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">This date is in the future</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Type *</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input-field"
            >
              {maintenanceTypeSelectOptions.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          {formData.type === 'oil_change' && (
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Oil Type</label>
              <select
                value={formData.oil_type}
                onChange={(e) => setFormData({ ...formData, oil_type: e.target.value })}
                className="input-field"
              >
                <option value="conventional">Conventional Oil</option>
                <option value="full_synthetic">Full Synthetic Oil</option>
                <option value="synthetic_blend">Synthetic Blend Oil</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Odometer Reading</label>
            <input
              type="number"
              min="0"
              value={formData.mileage}
              onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
              className="input-field"
              placeholder="Miles"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Cost</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="input-field"
              placeholder="89.99"
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Service Provider</label>
            <input
              type="text"
              list="service-providers-list"
              value={formData.service_provider}
              onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
              className="input-field"
              placeholder="Jiffy Lube, Dealership..."
            />
            <datalist id="service-providers-list">
              {recentServiceProviders.map((provider, idx) => (
                <option key={idx} value={provider} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Location</label>
            <input
              type="text"
              list="maintenance-locations-list"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="input-field"
              placeholder="City, State"
            />
            <datalist id="maintenance-locations-list">
              {recentLocations.map((location, idx) => (
                <option key={idx} value={location} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Next Service fields - Personal+ only */}
        {subscriptionPlan !== 'free' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                Next Service Date <span className="text-xs text-blue-600 dark:text-blue-400">(Personal+)</span>
              </label>
              <input
                type="date"
                value={formData.next_service_date}
                onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                Next Service Mileage <span className="text-xs text-blue-600 dark:text-blue-400">(Personal+)</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.next_service_mileage}
                onChange={(e) => setFormData({ ...formData, next_service_mileage: e.target.value })}
                className="input-field"
                placeholder="Miles"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input-field !h-auto"
            rows={3}
            placeholder="Any additional notes..."
          />
        </div>

        {canUploadReceipts && (
          <ReceiptPhotoPicker
            files={receiptUpload.files}
            canAddMore={receiptUpload.canAddMore}
            remainingSlots={receiptUpload.remainingSlots}
            isUploading={receiptUpload.isUploading}
            onAddFiles={receiptUpload.addFiles}
            onRemoveFile={receiptUpload.removeFile}
          />
        )}

        {errorMessage && (
          <p role="alert" className="text-red-600 dark:text-red-400 text-sm">{errorMessage}</p>
        )}
        <button
          type="submit"
          disabled={loading || receiptUpload.isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors duration-200"
        >
          {loading ? 'Adding...' : 'Add Maintenance Record'}
        </button>
      </form>
    </div>
  )
}
