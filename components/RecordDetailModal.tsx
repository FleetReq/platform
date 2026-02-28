'use client'

import { useState, useEffect } from 'react'
import type { Car, FillUp, MaintenanceRecord } from '@/lib/supabase-client'
import { MAINTENANCE_TYPE_LABELS } from '@/lib/maintenance'
import { useReceiptUpload, MAX_RECEIPTS } from '@/lib/use-receipt-upload'
import ReceiptPhotoPicker from './ReceiptPhotoPicker'
import ReceiptGallery from './ReceiptGallery'

type RecordType = 'fillup' | 'maintenance'

interface RecordDetailModalProps {
  recordType: RecordType
  record: FillUp | MaintenanceRecord
  car: Car
  userId: string
  subscriptionPlan: 'free' | 'personal' | 'business'
  onClose: () => void
  onSaved: () => void
}

const FUEL_TYPE_LABELS: Record<string, string> = {
  regular: 'Regular (87)',
  midgrade: 'Midgrade (89)',
  premium: 'Premium (91-93)',
  diesel: 'Diesel',
  e85: 'E85 (Flex Fuel)',
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white text-right">{value}</span>
    </div>
  )
}

export default function RecordDetailModal({
  recordType,
  record,
  car,
  userId,
  subscriptionPlan,
  onClose,
  onSaved,
}: RecordDetailModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const canUploadReceipts = subscriptionPlan !== 'free'

  // Existing receipt URLs on the record
  const existingReceiptUrls: string[] = (record as { receipt_urls?: string[] }).receipt_urls || []
  const [currentReceiptUrls, setCurrentReceiptUrls] = useState<string[]>(existingReceiptUrls)

  // For new photo uploads in edit mode
  const receiptUpload = useReceiptUpload()

  // Edit form state
  const [editData, setEditData] = useState<Record<string, string>>({})

  useEffect(() => {
    if (mode === 'edit') {
      if (recordType === 'fillup') {
        const f = record as FillUp
        setEditData({
          date: f.date || '',
          odometer_reading: f.odometer_reading?.toString() || '',
          gallons: f.gallons?.toString() || '',
          price_per_gallon: f.price_per_gallon?.toString() || '',
          fuel_type: f.fuel_type || 'regular',
          gas_station: f.gas_station || '',
          location: f.location || '',
          notes: f.notes || '',
        })
      } else {
        const m = record as MaintenanceRecord
        setEditData({
          date: m.date || '',
          type: m.type || 'oil_change',
          oil_type: m.oil_type || '',
          cost: m.cost?.toString() || '',
          mileage: m.mileage?.toString() || '',
          service_provider: m.service_provider || '',
          location: m.location || '',
          next_service_date: m.next_service_date || '',
          next_service_mileage: m.next_service_mileage?.toString() || '',
          notes: m.notes || '',
        })
      }
      setCurrentReceiptUrls(existingReceiptUrls)
      receiptUpload.reset()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: record.id covers record changes; receiptUpload.reset is stable; recordType is constant for a given modal instance
  }, [mode, record.id, existingReceiptUrls])

  const handleRemoveExistingPhoto = (path: string) => {
    setCurrentReceiptUrls((prev) => prev.filter((p) => p !== path))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      // Upload new photos first
      let newPaths: string[] = []
      const pendingFiles = receiptUpload.files.filter((f) => f.status === 'pending')
      if (pendingFiles.length > 0) {
        const storageType = recordType === 'fillup' ? 'fill_ups' : 'maintenance'
        newPaths = await receiptUpload.uploadAll(userId, storageType, record.id)
      }

      const allReceiptUrls = [...currentReceiptUrls, ...newPaths]

      // Build PATCH body
      const body: Record<string, unknown> = { ...editData, receipt_urls: allReceiptUrls }
      // Convert numeric strings, guarding against NaN from non-numeric input
      if (recordType === 'fillup') {
        const odo = parseInt(body.odometer_reading as string)
        if (body.odometer_reading && !isNaN(odo)) body.odometer_reading = odo
        const gal = parseFloat(body.gallons as string)
        if (body.gallons && !isNaN(gal)) body.gallons = gal
        const ppg = parseFloat(body.price_per_gallon as string)
        if (body.price_per_gallon && !isNaN(ppg)) body.price_per_gallon = ppg
      } else {
        const cost = parseFloat(body.cost as string)
        if (body.cost && !isNaN(cost)) body.cost = cost
        const mil = parseInt(body.mileage as string)
        if (body.mileage && !isNaN(mil)) body.mileage = mil
        const nsm = parseInt(body.next_service_mileage as string)
        if (body.next_service_mileage && !isNaN(nsm)) body.next_service_mileage = nsm
      }

      const endpoint = recordType === 'fillup' ? '/api/fill-ups' : '/api/maintenance'
      const response = await fetch(`${endpoint}/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errData = await response.json()
        // Rollback uploaded photos on failure
        if (newPaths.length > 0) {
          const { error: cleanupError } = await receiptUpload.deleteFromStorage(newPaths)
          if (cleanupError) {
            throw new Error(`${errData.error || 'Failed to save'} — receipt cleanup may be incomplete`)
          }
        }
        throw new Error(errData.error || 'Failed to save')
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const carLabel = car.nickname || `${car.year} ${car.make} ${car.model}`

  // Adjust remaining slots for the picker to account for existing photos
  const totalPhotoSlots = MAX_RECEIPTS
  const usedSlots = currentReceiptUrls.length + receiptUpload.files.length
  const adjustedCanAddMore = usedSlots < totalPhotoSlots
  const adjustedRemaining = totalPhotoSlots - usedSlots

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      tabIndex={-1}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-modal-title"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 id="record-modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
              {recordType === 'fillup' ? 'Fill-up Details' : 'Maintenance Details'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{carLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'view' && (
              <button
                onClick={() => setMode('edit')}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {mode === 'view' ? (
            <ViewMode
              recordType={recordType}
              record={record}
              receiptUrls={existingReceiptUrls}
            />
          ) : (
            <EditMode
              recordType={recordType}
              editData={editData}
              setEditData={setEditData}
              subscriptionPlan={subscriptionPlan}
              canUploadReceipts={canUploadReceipts}
              currentReceiptUrls={currentReceiptUrls}
              onRemoveExistingPhoto={handleRemoveExistingPhoto}
              receiptUpload={receiptUpload}
              adjustedCanAddMore={adjustedCanAddMore}
              adjustedRemaining={adjustedRemaining}
            />
          )}

          {error && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Footer (edit mode) */}
        {mode === 'edit' && (
          <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setMode('view')}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || receiptUpload.isUploading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ViewMode({
  recordType,
  record,
  receiptUrls,
}: {
  recordType: RecordType
  record: FillUp | MaintenanceRecord
  receiptUrls: string[]
}) {
  if (recordType === 'fillup') {
    const f = record as FillUp
    return (
      <div className="space-y-0">
        <DetailRow label="Date" value={new Date(f.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
        <DetailRow label="Odometer" value={f.odometer_reading?.toLocaleString() ? `${f.odometer_reading.toLocaleString()} mi` : undefined} />
        <DetailRow label="Gallons" value={f.gallons?.toString()} />
        <DetailRow label="Price/Gallon" value={f.price_per_gallon ? `$${f.price_per_gallon.toFixed(3)}` : undefined} />
        <DetailRow label="Total Cost" value={f.total_cost ? `$${f.total_cost.toFixed(2)}` : undefined} />
        <DetailRow label="MPG" value={f.mpg?.toFixed(1)} />
        <DetailRow label="Fuel Type" value={f.fuel_type ? FUEL_TYPE_LABELS[f.fuel_type] || f.fuel_type : undefined} />
        <DetailRow label="Gas Station" value={f.gas_station} />
        <DetailRow label="Location" value={f.location} />
        <DetailRow label="Notes" value={f.notes} />
        {receiptUrls.length > 0 && (
          <div className="pt-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 block mb-2">Receipt Photos</span>
            <ReceiptGallery receiptUrls={receiptUrls} />
          </div>
        )}
      </div>
    )
  }

  const m = record as MaintenanceRecord
  return (
    <div className="space-y-0">
      <DetailRow label="Date" value={new Date(m.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
      <DetailRow label="Type" value={MAINTENANCE_TYPE_LABELS[m.type] || m.type} />
      <DetailRow label="Oil Type" value={m.oil_type} />
      <DetailRow label="Cost" value={m.cost ? `$${m.cost.toFixed(2)}` : undefined} />
      <DetailRow label="Mileage" value={m.mileage ? `${m.mileage.toLocaleString()} mi` : undefined} />
      <DetailRow label="Service Provider" value={m.service_provider} />
      <DetailRow label="Location" value={m.location} />
      <DetailRow label="Next Service Date" value={m.next_service_date ? new Date(m.next_service_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : undefined} />
      <DetailRow label="Next Service Mileage" value={m.next_service_mileage ? `${m.next_service_mileage.toLocaleString()} mi` : undefined} />
      <DetailRow label="Notes" value={m.notes} />
      {receiptUrls.length > 0 && (
        <div className="pt-3">
          <span className="text-sm text-gray-500 dark:text-gray-400 block mb-2">Receipt Photos</span>
          <ReceiptGallery receiptUrls={receiptUrls} />
        </div>
      )}
    </div>
  )
}

function EditMode({
  recordType,
  editData,
  setEditData,
  subscriptionPlan,
  canUploadReceipts,
  currentReceiptUrls,
  onRemoveExistingPhoto,
  receiptUpload,
  adjustedCanAddMore,
  adjustedRemaining,
}: {
  recordType: RecordType
  editData: Record<string, string>
  setEditData: (data: Record<string, string>) => void
  subscriptionPlan: string
  canUploadReceipts: boolean
  currentReceiptUrls: string[]
  onRemoveExistingPhoto: (path: string) => void
  receiptUpload: ReturnType<typeof useReceiptUpload>
  adjustedCanAddMore: boolean
  adjustedRemaining: number
}) {
  const inputClass = "w-full px-3 py-2 h-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white"

  const update = (field: string, value: string) => {
    setEditData({ ...editData, [field]: value })
  }

  if (recordType === 'fillup') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date</label>
            <input type="date" value={editData.date} onChange={(e) => update('date', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Odometer</label>
            <input type="number" value={editData.odometer_reading} onChange={(e) => update('odometer_reading', e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Gallons</label>
            <input type="number" step="0.001" value={editData.gallons} onChange={(e) => update('gallons', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Price/Gallon</label>
            <input type="number" step="0.001" value={editData.price_per_gallon} onChange={(e) => update('price_per_gallon', e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Fuel Type</label>
            <select value={editData.fuel_type} onChange={(e) => update('fuel_type', e.target.value)} className={inputClass}>
              <option value="regular">Regular (87)</option>
              <option value="midgrade">Midgrade (89)</option>
              <option value="premium">Premium (91-93)</option>
              <option value="diesel">Diesel</option>
              <option value="e85">E85 (Flex Fuel)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Gas Station</label>
            <input type="text" value={editData.gas_station} onChange={(e) => update('gas_station', e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Location</label>
          <input type="text" value={editData.location} onChange={(e) => update('location', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</label>
          <textarea value={editData.notes} onChange={(e) => update('notes', e.target.value)} className={`${inputClass} h-auto`} rows={2} />
        </div>

        {/* Receipt photos section */}
        {canUploadReceipts && (
          <div className="pt-2">
            {currentReceiptUrls.length > 0 && (
              <div className="mb-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Existing Photos</span>
                <ReceiptGallery receiptUrls={currentReceiptUrls} editable onRemove={onRemoveExistingPhoto} />
              </div>
            )}
            <ReceiptPhotoPicker
              files={receiptUpload.files}
              canAddMore={adjustedCanAddMore}
              remainingSlots={adjustedRemaining}
              isUploading={receiptUpload.isUploading}
              onAddFiles={receiptUpload.addFiles}
              onRemoveFile={receiptUpload.removeFile}
            />
          </div>
        )}
      </div>
    )
  }

  // Maintenance edit
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date</label>
          <input type="date" value={editData.date} onChange={(e) => update('date', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Type</label>
          <select value={editData.type} onChange={(e) => update('type', e.target.value)} className={inputClass}>
            {Object.entries(MAINTENANCE_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      {editData.type === 'oil_change' && (
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Oil Type</label>
          <select value={editData.oil_type} onChange={(e) => update('oil_type', e.target.value)} className={inputClass}>
            <option value="conventional">Conventional</option>
            <option value="full_synthetic">Full Synthetic</option>
            <option value="synthetic_blend">Synthetic Blend</option>
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Cost</label>
          <input type="number" step="0.01" value={editData.cost} onChange={(e) => update('cost', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Mileage</label>
          <input type="number" value={editData.mileage} onChange={(e) => update('mileage', e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Service Provider</label>
          <input type="text" value={editData.service_provider} onChange={(e) => update('service_provider', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Location</label>
          <input type="text" value={editData.location} onChange={(e) => update('location', e.target.value)} className={inputClass} />
        </div>
      </div>
      {subscriptionPlan !== 'free' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Next Service Date</label>
            <input type="date" value={editData.next_service_date} onChange={(e) => update('next_service_date', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Next Service Mileage</label>
            <input type="number" value={editData.next_service_mileage} onChange={(e) => update('next_service_mileage', e.target.value)} className={inputClass} />
          </div>
        </div>
      )}
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</label>
        <textarea value={editData.notes} onChange={(e) => update('notes', e.target.value)} className={`${inputClass} h-auto`} rows={2} />
      </div>

      {/* Receipt photos section */}
      {canUploadReceipts && (
        <div className="pt-2">
          {currentReceiptUrls.length > 0 && (
            <div className="mb-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Existing Photos</span>
              <ReceiptGallery receiptUrls={currentReceiptUrls} editable onRemove={onRemoveExistingPhoto} />
            </div>
          )}
          <ReceiptPhotoPicker
            files={receiptUpload.files}
            canAddMore={adjustedCanAddMore}
            remainingSlots={adjustedRemaining}
            isUploading={receiptUpload.isUploading}
            onAddFiles={receiptUpload.addFiles}
            onRemoveFile={receiptUpload.removeFile}
          />
        </div>
      )}
    </div>
  )
}
