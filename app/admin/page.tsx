export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Properties</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="rounded border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Tenants</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="rounded border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Rent collected this month</p>
          <p className="text-2xl font-bold">$0</p>
        </div>
      </div>
    </div>
  );
}