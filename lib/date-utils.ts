/** Check if a date string (YYYY-MM-DD) is in the future */
export function isFutureDate(dateStr: string): boolean {
  if (!dateStr) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const inputDate = new Date(dateStr + 'T00:00:00')
  return inputDate > today
}
