import Link from "next/link";
import { getSession } from "@/lib/get-session";
import { listProperties } from "@/lib/data/store";

export default async function AdminDashboardPage() {
  const session = await getSession();
  const properties = listProperties();

  // Calculate live statistics
  const totalProperties = properties.length;
  const totalRent = properties.reduce((acc, p) => acc + (p.rentAmount || 0), 0);
  const occupancyRate = totalProperties > 0 ? "100%" : "0%";

  return (
    <div className="space-y-8">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back! Here is what is happening with your rental portfolio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/landlord/properties/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Property
          </Link>
        </div>
      </div>

      {/* 4 KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Properties */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Properties
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">{totalProperties}</p>
            <p className="text-xs text-slate-500 mt-1">Active units in management</p>
          </div>
        </div>

        {/* Metric 2: Monthly Rent Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Monthly Revenue
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">
              ${totalRent.toLocaleString()}<span className="text-sm font-normal text-slate-500">/mo</span>
            </p>
            <p className="text-xs text-emerald-600 font-medium mt-1">Projected collection</p>
          </div>
        </div>

        {/* Metric 3: Occupancy Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Occupancy Rate
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">{occupancyRate}</p>
            <p className="text-xs text-slate-500 mt-1">Current occupied status</p>
          </div>
        </div>

        {/* Metric 4: Action Items */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Maintenance & Alerts
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">0</p>
            <p className="text-xs text-slate-500 mt-1">No pending requests</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Properties List & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Properties Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 text-base">Your Properties</h2>
              <p className="text-xs text-slate-500 mt-0.5">Overview of active rentals</p>
            </div>
            <Link
              href="/admin/properties"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              View all →
            </Link>
          </div>

          {properties.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-700">No properties added yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Get started by adding your first rental unit.
              </p>
              <Link
                href="/admin/properties/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition"
              >
                + Add Property
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {properties.slice(0, 5).map((property) => (
                <div
                  key={property.id}
                  className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 transition"
                >
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {property.address}
                    </p>
                    <p className="text-xs text-slate-500">{property.city}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        ${property.rentAmount}
                      </p>
                      <p className="text-xs text-slate-400">per month</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Active
                    </span>
                    <Link
                      href={`/admin/properties/${property.id}`}
                      className="text-xs font-medium text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition"
                      title="View Details"
                    >
                      →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Actions & Help */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h2 className="font-semibold text-slate-900 text-sm mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/admin/properties/new"
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
              >
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Add New Property</p>
                  <p className="text-[11px] text-slate-500">Create a new rental listing</p>
                </div>
              </Link>

              <Link
                href="/admin/tenants"
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
              >
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Manage Tenants</p>
                  <p className="text-[11px] text-slate-500">View roster or assign units</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Notice / Tips Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white shadow-xs">
            <h3 className="text-sm font-semibold">Rent Manager Tip</h3>
            <p className="text-xs text-blue-100 mt-1 leading-relaxed">
              Keep tenant contact records updated so automated rent reminders and maintenance alerts can reach them instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}