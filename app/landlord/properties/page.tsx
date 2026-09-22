import Link from "next/link";
import { redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/page-header";
import { PropertiesGrid } from "./properties-grid";
import type { Property } from "@/lib/types";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived } = await searchParams;
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const response = await backendFetch("/api/v1/properties/mine", session.backendToken);

  if (response.status === 401) {
    redirect("/login");
  }

  const properties: Property[] = await response.json();

  const totalUnits = properties.reduce((sum, p) => sum + p.units.length, 0);
  const totalCities = new Set(properties.map((p) => p.city)).size;

  return (
    <div>
      {archived === "1" && (
        <p className="mb-4 rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">
          Property archived.
        </p>
      )}

      <PageHeader
        title="Properties"
        description="Every property in your portfolio, in one place."
      />

      <div className="mb-6 rounded-2xl border border-default bg-accent-tint px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm font-medium text-accent-dark">Have another property to manage?</p>
        <Link
          href="/landlord/properties/new"
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-dark whitespace-nowrap"
        >
          Add property
        </Link>
      </div>

      {properties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          <div className="bg-white rounded-2xl border border-default shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-accent-tint text-accent-dark flex items-center justify-center text-lg font-bold shrink-0">
              🏢
            </div>
            <div>
              <p className="text-2xl font-bold text-heading">{properties.length}</p>
              <p className="text-sm text-muted">Properties</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-default shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-accent-tint text-accent-dark flex items-center justify-center text-lg font-bold shrink-0">
              🔑
            </div>
            <div>
              <p className="text-2xl font-bold text-heading">{totalUnits}</p>
              <p className="text-sm text-muted">Total units</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-default shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-accent-tint text-accent-dark flex items-center justify-center text-lg font-bold shrink-0">
              📍
            </div>
            <div>
              <p className="text-2xl font-bold text-heading">{totalCities}</p>
              <p className="text-sm text-muted">Cities</p>
            </div>
          </div>
        </div>
      )}

      <PropertiesGrid properties={properties} />
    </div>
  );
}