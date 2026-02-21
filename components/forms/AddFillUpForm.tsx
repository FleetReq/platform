'use client'

import { useState, useEffect } from 'react'
import { type Car, type FillUp, hasFeatureAccess } from '@/lib/supabase-client'
import { useReceiptUpload } from '@/lib/use-receipt-upload'
import ReceiptPhotoPicker from '@/components/ReceiptPhotoPicker'
import { isFutureDate } from '@/lib/date-utils'
import { fetchWithTimeout } from '@/lib/fetch-with-timeout'

interface AddFillUpFormProps {
  cars: Car[]
  onSuccess: () => void
  subscriptionPlan?: 'free' | 'personal' | 'business'
  userId?: string
}

export default function AddFillUpForm({ cars, onSuccess, subscriptionPlan = 'free', userId = '' }: AddFillUpFormProps) {
  const receiptUpload = useReceiptUpload()
  const canUploadReceipts = hasFeatureAccess(userId, subscriptionPlan, 'receipt_upload')
  const [formData, setFormData] = useState({
    car_id: cars[0]?.id || '',
    date: new Date().toLocaleDateString('en-CA'),
    odometer_reading: '',
    gallons: '',
    price_per_gallon: '',
    fuel_type: 'regular',
    gas_station: '',
    location: '',
    notes: '',
    consecutive_fillup: true
  })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [recentGasStations, setRecentGasStations] = useState<string[]>([])
  const [recentLocations, setRecentLocations] = useState<string[]>([])

  // Fetch recent fill-up data for smart defaults and autocomplete
  useEffect(() => {
    const fetchRecentData = async () => {
      if (!formData.car_id) return

      try {
        const response = await fetchWithTimeout(`/api/fill-ups?car_id=${formData.car_id}&limit=10`)
        if (response.ok) {
          const { fillUps } = await response.json()

          if (fillUps && fillUps.length > 0) {
            const mostRecent = fillUps[0]
            const selectedCar = cars.find(c => c.id === formData.car_id)

            // Set smart defaults from most recent fill-up and car data
            setFormData(prev => ({
              ...prev,
              odometer_reading: selectedCar?.current_mileage?.toString() || '',
              gallons: mostRecent.gallons?.toString() || '',
              price_per_gallon: mostRecent.price_per_gallon?.toString() || '',
              fuel_type: mostRecent.fuel_type || 'regular'
            }))

            // Build unique lists for autocomplete (filter out nulls/empty strings)
            const stations = [...new Set(fillUps
              .map((f: FillUp) => f.gas_station)
              .filter((s: string | null): s is string => s !== null && s.trim() !== '')
            )]
            const locations = [...new Set(fillUps
              .map((f: FillUp) => f.location)
              .filter((l: string | null): l is string => l !== null && l.trim() !== '')
            )]

            setRecentGasStations(stations as string[])
            setRecentLocations(locations as string[])
          } else {
            // No previous fill-ups, just set current mileage
            const selectedCar = cars.find(c => c.id === formData.car_id)
            setFormData(prev => ({
              ...prev,
              odometer_reading: selectedCar?.current_mileage?.toString() || ''
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching recent fill-ups:', error)
      }
    }

    fetchRecentData()
  }, [formData.car_id, cars])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // First, create the record
      const response = await fetchWithTimeout('/api/fill-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const { fillUp: createdFillUp } = await response.json()

        // Upload receipt photos if any
        const pendingPhotos = receiptUpload.files.filter(f => f.status === 'pending')
        if (pendingPhotos.length > 0 && createdFillUp?.id && userId) {
          const paths = await receiptUpload.uploadAll(userId, 'fill_ups', createdFillUp.id)
          if (paths.length > 0) {
            // Update the record with receipt URLs
            const patchRes = await fetchWithTimeout(`/api/fill-ups/${createdFillUp.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ receipt_urls: paths })
            })
            if (!patchRes.ok) {
              setErrorMessage('Fill-up saved, but receipt attachment failed — please re-open the record and re-attach.')
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
          odometer_reading: '',
          gallons: '',
          price_per_gallon: '',
          fuel_type: 'regular',
          gas_station: '',
          location: '',
          notes: '',
          consecutive_fillup: true
        })
        receiptUpload.reset()
        onSuccess()
      } else {
        const error = await response.json()
        setErrorMessage(error.error || 'Failed to add fill-up')
      }
    } catch (error) {
      console.error('Error adding fill-up:', error)
      setErrorMessage('Failed to add fill-up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add Fill-up</h2>
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

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Odometer Reading *</label>
            <input
              type="number"
              required
              min="0"
              value={formData.odometer_reading}
              onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
              className="input-field"
              placeholder="Miles"
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Gallons *</label>
            <input
              type="number"
              required
              min="0"
              step="0.001"
              value={formData.gallons}
              onChange={(e) => setFormData({ ...formData, gallons: e.target.value })}
              className="input-field"
              placeholder="10.5"
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Price per Gallon</label>
            <input
              type="number"
              min="0"
              step="0.001"
              value={formData.price_per_gallon}
              onChange={(e) => setFormData({ ...formData, price_per_gallon: e.target.value })}
              className="input-field"
              placeholder="3.45"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Fuel Type</label>
            <select
              value={formData.fuel_type}
              onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
              className="input-field"
            >
              <option value="regular">Regular (87 Octane)</option>
              <option value="midgrade">Midgrade (89 Octane)</option>
              <option value="premium">Premium (91-93 Octane)</option>
              <option value="diesel">Diesel</option>
              <option value="e85">E85 (Flex Fuel)</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Gas Station</label>
            <input
              type="text"
              list="gas-stations-list"
              value={formData.gas_station}
              onChange={(e) => setFormData({ ...formData, gas_station: e.target.value })}
              className="input-field"
              placeholder="Shell, Chevron, etc."
            />
            <datalist id="gas-stations-list">
              {recentGasStations.map((station, idx) => (
                <option key={idx} value={station} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Location</label>
            <input
              type="text"
              list="locations-list"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="input-field"
              placeholder="City, State"
            />
            <datalist id="locations-list">
              {recentLocations.map((location, idx) => (
                <option key={idx} value={location} />
              ))}
            </datalist>
          </div>
        </div>

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

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.consecutive_fillup}
              onChange={(e) => setFormData({ ...formData, consecutive_fillup: e.target.checked })}
              className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <div className="flex-1">
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Consecutive Fill-up</span>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Check this if this fill-up immediately follows your last fill-up (tank was filled completely both times).
                This ensures accurate MPG calculations. Uncheck if you missed recording previous fill-ups.
              </p>
            </div>
          </label>
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
          {loading ? 'Adding...' : 'Add Fill-up'}
        </button>
      </form>
    </div>
  )
}
