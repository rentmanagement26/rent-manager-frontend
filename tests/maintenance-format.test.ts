// Checks for lib/maintenance-format.ts (the lines shown on the tenant's request screens) and the maintenance notification link.
import { describe, expect, it } from "vitest";
import { accessSummary, landlordProgressLine, progressLine, visitLine } from "@/lib/maintenance-format";
import { notificationHref } from "@/lib/notification-target";
import type { NotificationItem } from "@/lib/types";

const base = { updatedAt: "2026-11-02T10:00:00Z", progress: null, progressDate: null };

describe("progressLine", () => {
  it("says what is happening in words a tenant may read", () => {
    expect(progressLine({ ...base, status: "New" })).toBe("Waiting for your landlord");
    expect(progressLine({ ...base, status: "InProgress", progress: "VisitScheduled", progressDate: "2026-11-06" })).toBe("Visit Nov 6, 2026");
    expect(progressLine({ ...base, status: "InProgress", progress: "WaitingForParts", progressDate: "2026-11-20" })).toBe("Waiting for parts, expected Nov 20, 2026");
    expect(progressLine({ ...base, status: "Done" })).toBe("Done Nov 2, 2026");
  });

  it("never shows quotes or offers to a tenant", () => {
    for (const progress of ["QuotesRequested", "Offered", "Accepted"]) {
      expect(progressLine({ ...base, status: "InProgress", progress })).toBe("Your landlord is arranging a repair");
    }
  });
});

describe("visitLine", () => {
  it("names the contractor, the day and the window", () => {
    expect(visitLine({ contractorName: "Dave's Plumbing", visitDate: "2026-11-06", visitWindow: "Morning", waitingForParts: false, partsExpectedBy: null })).toBe(
      "Dave's Plumbing: Nov 6, 2026, morning",
    );
    expect(visitLine({ contractorName: "Dave's Plumbing", visitDate: "2026-11-06", visitWindow: "Morning", waitingForParts: true, partsExpectedBy: "2026-11-20" })).toBe(
      "Dave's Plumbing: waiting for parts, expected Nov 20, 2026",
    );
  });
});

describe("accessSummary", () => {
  it("joins what was filled in", () => {
    expect(
      accessSummary({ permissionToEnter: "CallFirst", accessNotes: "Back door", bestTimes: ["Evenings"], contactMethod: "Phone", contactPhone: "(204) 555-0188", hasPets: true }),
    ).toBe("Call me first · Back door · Evenings · Phone (204) 555-0188 · Pets in the unit");
  });
});

describe("notificationHref for maintenance", () => {
  const item = (type: string, data: string): NotificationItem => ({ type, data }) as NotificationItem;

  it("opens the shared request link", () => {
    expect(notificationHref(item("MaintenanceUpdated", '{"requestId":12}'))).toBe("/maintenance/12");
    expect(notificationHref(item("MaintenanceRequestCreated", '{"requestId":7}'))).toBe("/maintenance/7");
  });

  it("opens a contractor's job or quote page", () => {
    expect(notificationHref(item("MaintenanceJobUpdated", '{"requestId":12,"jobId":34}'))).toBe("/contractor/jobs/34");
    expect(notificationHref(item("MaintenanceJobUpdated", '{"requestId":12,"quoteId":61}'))).toBe("/contractor/quotes/61");
  });

  it("is just a message without a request id", () => {
    expect(notificationHref(item("MaintenanceUpdated", "{}"))).toBeNull();
  });
});

describe("landlordProgressLine", () => {
  it("names quotes and contractors, which a tenant never sees", () => {
    expect(landlordProgressLine({ status: "InProgress", progress: "QuotesRequested", progressDate: null }, { received: 1, open: 3 })).toBe("Waiting for quotes (1 of 3 received)");
    expect(landlordProgressLine({ status: "InProgress", progress: "Offered", progressDate: null })).toBe("Offered to a contractor");
    expect(landlordProgressLine({ status: "New", progress: null, progressDate: null })).toBeNull();
  });
});
