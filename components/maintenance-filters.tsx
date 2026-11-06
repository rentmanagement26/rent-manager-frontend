"use client";

// The filters above the landlord's maintenance list: property, urgency, category, a search box and the sort order. Changing one updates the
// page address (so the list can be shared and the Back button works) and starts again at page 1.
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CATEGORIES, URGENCIES, type Option } from "@/lib/maintenance-format";

const fieldClass = "rounded-lg border border-default bg-white px-2.5 py-2 text-sm text-heading focus:border-accent focus:outline-none";

const SORTS: Option[] = [
  { value: "priority", label: "Priority" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "recent", label: "Recent activity" },
];

export function MaintenanceFilters({ properties }: { properties: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");

  // Sets one filter (empty removes it) and keeps the others; the status chips and the page number are handled the same way.
  function change(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`${pathname}?${next}`);
  }

  function select(key: string, label: string, options: Option[], anyLabel: string) {
    return (
      <select aria-label={label} value={params.get(key) ?? ""} onChange={(event) => change(key, event.target.value)} className={fieldClass}>
        <option value="">{anyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {select("propertyId", "Property", properties, "All properties")}
      {select("urgency", "Urgency", URGENCIES, "Any urgency")}
      {select("category", "Category", CATEGORIES, "Any category")}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          change("q", search.trim());
        }}
      >
        <input
          type="search"
          aria-label="Search by request number or words"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search WO number or words"
          className={`${fieldClass} w-56`}
        />
      </form>
      <label className="ml-auto flex items-center gap-2 text-sm text-muted">
        Sort by
        <select aria-label="Sort by" value={params.get("sort") ?? "priority"} onChange={(event) => change("sort", event.target.value)} className={fieldClass}>
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
