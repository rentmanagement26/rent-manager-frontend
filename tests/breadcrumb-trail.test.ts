// Checks for lib/breadcrumb-trail.ts: the parent pages shown as a Back button and breadcrumbs.
import { describe, expect, it } from "vitest";
import { breadcrumbTrail } from "@/lib/breadcrumb-trail";

const labels = (path: string) => breadcrumbTrail(path).map((crumb) => crumb.label);

describe("breadcrumbTrail", () => {
  it("shows nothing on the dashboard and top-level pages", () => {
    expect(breadcrumbTrail("/landlord")).toEqual([]);
    expect(breadcrumbTrail("/landlord/billing")).toEqual([]);
    expect(breadcrumbTrail("/landlord/properties")).toEqual([]);
  });

  it("goes from a property to Properties and the Dashboard", () => {
    expect(labels("/landlord/properties/12")).toEqual(["Dashboard", "Properties"]);
    expect(labels("/landlord/properties/new")).toEqual(["Dashboard", "Properties"]);
  });

  it("goes from a unit's edit page up through the unit, property and list", () => {
    expect(labels("/landlord/properties/12/units/5/edit")).toEqual(["Dashboard", "Properties", "Property", "Unit"]);
    expect(breadcrumbTrail("/landlord/properties/12/units/5/edit").pop()?.href).toBe("/landlord/properties/12/units/5");
  });

  it("puts leases under Leases, including their documents", () => {
    expect(labels("/landlord/tenancies/4")).toEqual(["Dashboard", "Leases"]);
    expect(labels("/landlord/tenancies/4/documents/new")).toEqual(["Dashboard", "Leases", "Lease"]);
    expect(labels("/landlord/documents/3")).toEqual(["Dashboard", "Leases"]);
    expect(labels("/landlord/documents/3/sign")).toEqual(["Dashboard", "Leases", "Lease document"]);
  });

  it("works for the tenant portal", () => {
    expect(labels("/tenant/documents")).toEqual([]);
    expect(labels("/tenant/documents/3")).toEqual(["Dashboard", "Documents"]);
    expect(labels("/tenant/documents/3/sign")).toEqual(["Dashboard", "Documents", "Document"]);
  });

  it("shows the reminder settings under Renewals", () => {
    expect(labels("/landlord/renewals/settings")).toEqual(["Dashboard", "Renewals"]);
  });
});
