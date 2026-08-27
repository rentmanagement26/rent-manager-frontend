import Link from "next/link";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/page-header";
import type { Property } from "@/lib/types";

export default async function AdminDashboardPage() {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const response = await backendFetch("/api/properties/mine", session.backendToken);
  const properties: Property[] = await response.json();

  const totalProperties = properties.length;
  const occupancyRate = totalProperties > 0 ? "100%" : "0%";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here is what is happening with your rental portfolio."
      />

      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-green-tint via-blue-50 to-slate-50 px-6 py-7 sm:px-8 flex items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Welcome back{session?.fullName ? `, ${session.fullName}` : ""}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Here&apos;s what&apos;s happening with your portfolio.
          </p>
          <Link
            href="/landlord/properties/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add property
          </Link>
        </div>
        <svg
          className="hidden sm:block shrink-0 text-brand-green/60"
          width="110" height="84" viewBox="0 0 120 90" fill="none" stroke="currentColor" strokeWidth={3} strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M60 10 L110 45 L100 45 L100 80 L20 80 L20 45 L10 45 Z" />
          <rect x="34" y="55" width="16" height="25" />
          <rect x="66" y="55" width="14" height="14" />
        </svg>
      </div>

      {/* 3 KPI metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Properties
            </span>
            <div className="p-2 bg-blue-50 text-brand-blue rounded-lg">
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

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Occupancy
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

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Revenue
            </span>
            <div className="p-2 bg-brand-green-tint text-brand-green-dark rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">
              &mdash;<span className="text-sm font-normal text-slate-500">/mo</span>
            </p>
            <p className="text-xs text-slate-400 font-medium mt-1">Rent data not tracked yet</p>
          </div>
        </div>
      </div>

      {/* Properties list & quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 text-base">Your properties</h2>
              <p className="text-xs text-slate-500 mt-0.5">Overview of active rentals</p>
            </div>
            <Link
              href="/landlord/properties"
              className="text-xs font-semibold text-brand-blue hover:underline"
            >
              View all &rarr;
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
                href="/landlord/properties/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-brand-blue text-xs font-semibold hover:bg-blue-100 transition"
              >
                + Add property
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
                      {property.line1}
                    </p>
                    <p className="text-xs text-slate-500">{property.city}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-green-tint text-brand-green-dark border border-brand-green/30">
                      Active
                    </span>
                    <Link
                      href={`/landlord/properties/${property.id}`}
                      className="text-xs font-medium text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition"
                      title="View details"
                    >
                      &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h2 className="font-semibold text-slate-900 text-sm mb-3">Quick actions</h2>
            <div className="space-y-2">
              <Link
                href="/landlord/properties/new"
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
              >
                <div className="p-1.5 bg-blue-50 text-brand-blue rounded-md">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Add new property</p>
                  <p className="text-[11px] text-slate-500">Create a new rental listing</p>
                </div>
              </Link>

              <Link
                href="/landlord/tenants"
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
              >
                <div className="p-1.5 bg-brand-green-tint text-brand-green-dark rounded-md">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Manage tenants</p>
                  <p className="text-[11px] text-slate-500">View roster or assign units</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}