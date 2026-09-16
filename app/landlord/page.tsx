import Link from "next/link";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/page-header";
import type { Property } from "@/lib/types";

export default async function AdminDashboardPage() {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const response = await backendFetch("/api/v1/properties/mine", session.backendToken);
  const properties: Property[] = await response.json();

  const totalProperties = properties.length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here is what is happening with your rental portfolio."
      />

      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl border border-default bg-gradient-to-br from-brand-green-tint via-accent-tint to-subtle px-6 py-7 sm:px-8 flex items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-semibold text-heading">
            Welcome back{session?.fullName ? `, ${session.fullName}` : ""}
          </h2>
          <p className="text-sm text-muted mt-1">
            Here&apos;s what&apos;s happening with your portfolio.
          </p>
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

      {/* Property summary - 4 colored stat tiles */}
      <div>
        <h2 className="font-semibold text-heading text-sm mb-3">Property summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: "#0f4a42" }}>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Properties
            </div>
            <p className="text-xl font-bold mt-2">{totalProperties}</p>
          </div>
          <div className="rounded-2xl p-4 text-white bg-accent">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Occupied
            </div>
            <p className="text-xl font-bold mt-2">{totalProperties > 0 ? `${totalProperties}/${totalProperties}` : "0/0"}</p>
          </div>
          <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: "#7c4dff" }}>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
              Maint.
            </div>
            <p className="text-xl font-bold mt-2">0</p>
          </div>
          <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: "#1f6fd9" }}>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Vacancy
            </div>
            <p className="text-xl font-bold mt-2">0</p>
          </div>
        </div>
      </div>

      {/* Rent overview */}
      <div>
        <h2 className="font-semibold text-heading text-sm mb-3">Rent overview</h2>
        <div className="bg-white rounded-2xl p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-heading">Last month</span>
              <span className="text-xs text-muted">No data yet</span>
            </div>
            <div className="h-1.5 rounded-full bg-accent-tint" />
            <div className="flex justify-between mt-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                  Collected
                </div>
                <p className="text-sm font-semibold text-heading mt-0.5">&mdash;</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Outstanding
                </div>
                <p className="text-sm font-semibold text-heading mt-0.5">&mdash;</p>
              </div>
            </div>
          </div>

          <div className="border-t border-subtle pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-heading">This month</span>
              <span className="text-xs text-muted">No data yet</span>
            </div>
            <div className="h-1.5 rounded-full bg-accent-tint" />
            <div className="flex justify-between mt-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                  Collected
                </div>
                <p className="text-sm font-semibold text-heading mt-0.5">&mdash;</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Outstanding
                </div>
                <p className="text-sm font-semibold text-heading mt-0.5">&mdash;</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties list & quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-heading text-sm">My properties</h2>
            <Link
              href="/landlord/properties"
              className="text-xs font-semibold text-brand-green hover:text-brand-green-dark"
            >
              View all &rarr;
            </Link>
          </div>

          {properties.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-subtle flex items-center justify-center text-muted mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-heading">No properties added yet</p>
              <p className="text-xs text-muted mt-1 mb-4">
                Get started by adding your first rental unit.
              </p>
              <Link
                href="/landlord/properties/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-tint text-accent-dark text-xs font-semibold hover:opacity-80 transition"
              >
                + Add property
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {properties.slice(0, 5).map((property) => (
                <Link
                  key={property.id}
                  href={`/landlord/properties/${property.id}`}
                  className="bg-white rounded-2xl p-3 flex items-center gap-3 hover:bg-subtle transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-green-tint text-brand-green flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-heading truncate">
                      {property.name}
                    </p>
                    <p className="text-xs font-medium text-accent truncate">{property.propertyType}</p>
                    <p className="text-xs text-muted truncate">{property.city}</p>
                  </div>
                  <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-brand-green-tint text-brand-green-dark">
                    Active
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold text-heading text-sm mb-3">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/landlord/properties/new"
              className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:bg-subtle transition"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-green-tint text-brand-green flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-heading">Add property</p>
            </Link>

            <Link
              href="/landlord/tenants"
              className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:bg-subtle transition"
            >
              <div className="w-9 h-9 rounded-xl bg-accent-tint text-accent flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-heading">Add tenant</p>
            </Link>

            <Link
              href="/landlord/tenants"
              className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:bg-subtle transition"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#e3f0fc", color: "#1f6fd9" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-heading">Add rent</p>
            </Link>

            <Link
              href="/landlord/tenants"
              className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:bg-subtle transition"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#efe7fb", color: "#7c4dff" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-heading">Reports</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}