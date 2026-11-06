"use client";

// The "what and where" part shared by the tenant's report form and the landlord's new-request form: the kind of problem, where it is, and,
// for a common area, which part of the building. The parent owns the values.
import { ChoiceChips } from "@/components/choice-chips";
import { CATEGORIES, COMMON_AREAS, LOCATIONS, type Option } from "@/lib/maintenance-format";

const labelClass = "mb-2 block text-sm font-semibold text-heading";

export function PlaceFields({
  category,
  location,
  commonArea,
  onCategory,
  onLocation,
  onCommonArea,
  locations = LOCATIONS,
  hideLocation = false,
}: {
  category: string;
  location: string;
  commonArea: string;
  onCategory: (value: string) => void;
  onLocation: (value: string) => void;
  onCommonArea: (value: string) => void;
  // The places offered (a landlord's unit request leaves out "Common area").
  locations?: Option[];
  // True when the place is already decided (a common-area request): only the part of the building is asked.
  hideLocation?: boolean;
}) {
  return (
    <>
      <span className={labelClass}>Kind of problem *</span>
      <ChoiceChips label="Kind of problem" options={CATEGORIES} selected={[category]} onToggle={onCategory} />

      {!hideLocation && (
        <>
          <span className={`${labelClass} mt-5`}>Where in the unit? *</span>
          <ChoiceChips label="Where in the unit" options={locations} selected={[location]} onToggle={onLocation} />
        </>
      )}

      {location === "CommonArea" && (
        <>
          <span className={`${labelClass} mt-5`}>Which part of the building? *</span>
          <ChoiceChips label="Which part of the building" options={COMMON_AREAS} selected={[commonArea]} onToggle={onCommonArea} />
        </>
      )}
    </>
  );
}
