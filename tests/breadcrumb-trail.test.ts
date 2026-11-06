// Checks for lib/breadcrumb-trail.ts: the parent pages shown as a Back button and breadcrumbs.
import { describe, expect, it } from "vitest";
import { backTarget, breadcrumbTrail } from "@/lib/breadcrumb-trail";

const labels = (path: string) => breadcrumbTrail(path).map((crumb) => crumb.label);

describe("breadcrumbTrail", () => {
  it("shows nothing on the dashboard and the main sidebar pages", () => {
    expect(breadcrumbTrail("/landlord")).toEqual([]);
    expect(breadcrumbTrail("/landlord/properties")).toEqual([]);
    expect(backTarget("/landlord/leases")).toBeNull();
  });

  it("sends pages reached from menus back to the dashboard", () => {
    expect(backTarget("/landlord/billing")?.href).toBe("/landlord");
    expect(backTarget("/landlord/settings")?.href).toBe("/landlord");
    expect(backTarget("/landlord/notifications")?.href).toBe("/landlord");
  });

  it("goes back to the nearest parent", () => {
    expect(backTarget("/landlord/properties/12/units/5/edit")?.href).toBe("/landlord/properties/12/units/5");
    expect(backTarget("/landlord/properties/12")?.label).toBe("Properties");
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

  it("puts a tenant's maintenance request under Requests", () => {
    expect(labels("/tenant/requests")).toEqual([]);
    expect(labels("/tenant/requests/new")).toEqual(["Dashboard", "Requests"]);
    expect(labels("/tenant/requests/12")).toEqual(["Dashboard", "Requests"]);
    expect(backTarget("/tenant/requests/12")?.href).toBe("/tenant/requests");
  });

  it("puts a landlord's maintenance request and settings under Maintenance", () => {
    expect(labels("/landlord/maintenance")).toEqual([]);
    expect(labels("/landlord/maintenance/12")).toEqual(["Dashboard", "Maintenance"]);
    expect(labels("/landlord/maintenance/settings")).toEqual(["Dashboard", "Maintenance"]);
    expect(labels("/landlord/maintenance/new")).toEqual(["Dashboard", "Maintenance"]);
    expect(backTarget("/landlord/maintenance/12")?.href).toBe("/landlord/maintenance");
  });

  it("shows the reminder settings under Renewals", () => {
    expect(labels("/landlord/renewals/settings")).toEqual(["Dashboard", "Renewals"]);
  });
});
