export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  )
}
