// Data for the Add lease stepper: the landlord's properties with, for each unit, its active lease (if any) and any lease document
// still being signed. Used by both entry points of the stepper (the Leases page button and a lease's own page).
import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError } from "@/lib/api-error";
import { listDocuments } from "@/lib/document-api";
import { STATUS_LABELS, isOpen } from "@/lib/document-format";
import { listTenancies } from "@/lib/tenancy-api";
import type { DocumentListItem } from "@/lib/document-types";
import type { Property } from "@/lib/types";

export interface PickerUnit {
  id: number;
  label: string;
  // The active lease on this unit, if any.
  tenancyId: number | null;
  tenantName: string | null;
  // A lease document already being signed on that lease, if any.
  openDocumentId: number | null;
  openDocumentWord: string | null;
}

export interface PickerProperty {
  id: number;
  name: string;
  // Street and city, for the property card.
  address: string;
  // Province as typed in the address ("ON", "Manitoba"); decides which deposit limits the lease form warns about.
  region: string;
  units: PickerUnit[];
}

export async function loadPickerProperties(token: string): Promise<PickerProperty[]> {
  const [leases, propertyResponse, documents] = await Promise.all([
    listTenancies(token, { activeOnly: true, page: 1, pageSize: 100 }),
    backendFetch("/api/v1/properties/mine", token, { cache: "no-store" }),
    listDocuments(token).catch(() => [] as DocumentListItem[]),
  ]);
  if (propertyResponse.status === 401) throw new SessionExpiredError();
  const properties: Property[] = propertyResponse.ok ? await propertyResponse.json() : [];

  const leaseByUnit = new Map(leases.items.map((lease) => [lease.unitId, lease]));
  const openDocumentByLease = new Map<number, DocumentListItem>();
  for (const document of documents) {
    if (document.tenancyId !== null && isOpen(document.status) && !openDocumentByLease.has(document.tenancyId)) openDocumentByLease.set(document.tenancyId, document);
  }

  return properties.map((property) => ({
    id: property.id,
    name: property.name,
    address: `${property.line1}, ${property.city}`,
    region: property.region,
    units: property.units.map((unit) => {
      const lease = leaseByUnit.get(unit.id);
      const openDocument = lease ? openDocumentByLease.get(lease.id) : undefined;
      return {
        id: unit.id,
        label: unit.label,
        tenancyId: lease?.id ?? null,
        tenantName: lease?.primaryTenantName ?? null,
        openDocumentId: openDocument?.id ?? null,
        openDocumentWord: openDocument ? STATUS_LABELS[openDocument.status].label : null,
      };
    }),
  }));
}
