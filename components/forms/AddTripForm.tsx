'use client'

import { useState } from 'react'
import { type Car } from '@/lib/supabase-client'
import { fetchWithTimeout } from '@/lib/fetch-with-timeout'

interface AddTripFormProps {
  cars: Car[]
  onSuccess: () => void
}

export default function AddTripForm({ cars, onSuccess }: AddTripFormProps) {
  const [formData, setFormData] = useState({
    car_id: cars[0]?.id || '',
    date: new Date().toLocaleDateString('en-CA'),
    start_location: '',
    end_location: '',
    purpose: 'business',
    business_purpose: '',
    miles: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    try {
      const response = await fetchWithTimeout('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          miles: parseFloat(formData.miles)
        })
      })

      if (response.ok) {
        // Reset form
        setFormData({
          car_id: cars[0]?.id || '',
          date: new Date().toLocaleDateString('en-CA'),
          start_location: '',
          end_location: '',
          purpose: 'business',
          business_purpose: '',
          miles: '',
          notes: ''
        })
        onSuccess()
      } else {
        const error = await response.json()
        setErrorMessage(error.error || 'Failed to add trip')
      }
    } catch (error) {
      console.error('Error adding trip:', error)
      setErrorMessage('Failed to add trip')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add Trip</h2>
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
              className="input-field"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Start Location</label>
            <input
              type="text"
              value={formData.start_location}
              onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
              className="input-field"
              placeholder="Home, Office, etc."
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">End Location *</label>
            <input
              type="text"
              required
              value={formData.end_location}
              onChange={(e) => setFormData({ ...formData, end_location: e.target.value })}
              className="input-field"
              placeholder="Client site, Job location, etc."
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Purpose *</label>
            <select
              required
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="input-field"
            >
              <option value="business">Business</option>
              <option value="personal">Personal</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Miles Driven *</label>
            <input
              type="number"
              required
              min="0"
              step="0.1"
              value={formData.miles}
              onChange={(e) => setFormData({ ...formData, miles: e.target.value })}
              className="input-field"
              placeholder="25.5"
            />
          </div>
        </div>

        {formData.purpose === 'business' && (
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Business Purpose * (IRS Required)</label>
            <input
              type="text"
              required
              value={formData.business_purpose}
              onChange={(e) => setFormData({ ...formData, business_purpose: e.target.value })}
              className="input-field"
              placeholder="Client meeting at ABC Corp, Job site visit for Project X, etc."
            />
          </div>
        )}

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input-field !h-auto"
            rows={3}
            placeholder="Additional trip details..."
          />
        </div>

        {errorMessage && (
          <p role="alert" className="text-red-600 dark:text-red-400 text-sm">{errorMessage}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Trip'}
        </button>
      </form>
    </div>
  )
}
