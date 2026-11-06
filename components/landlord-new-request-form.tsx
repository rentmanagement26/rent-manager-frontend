"use client";

// The landlord's "New request" form: pick the property and the unit (or a common area), describe the problem, set the urgency, and choose
// whether the unit's tenants see it. After the request is saved the photos are uploaded and the landlord lands on the request page.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChoiceChips } from "@/components/choice-chips";
import { PhotoPicker } from "@/components/maintenance-photo-picker";
import { PlaceFields } from "@/components/maintenance-place-fields";
import { createRequestAction, requestFormAction } from "@/lib/landlord-maintenance-actions";
import type { LandlordRequestForm } from "@/lib/landlord-maintenance-types";
import { LOCATIONS, URGENCIES } from "@/lib/maintenance-format";
import { LANDLORD_UPLOADER, uploadRequestFiles } from "@/lib/maintenance-upload";
import { goToSessionExpired } from "@/lib/session-expired-client";

// A property with its units, as much as the form needs.
export interface PickerProperty {
  id: number;
  name: string;
  units: { id: number; label: string }[];
}

const COMMON = "common";
const labelClass = "mb-2 block text-sm font-semibold text-heading";
const cardClass = "rounded-2xl border border-default bg-white p-5 shadow-sm";
const inputClass = "w-full rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none";
const primaryButton = "rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50";
const ghostButton = "rounded-full border border-default bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-subtle";

// The places for a request inside a unit: every place except "Common area", which has its own choice above.
const UNIT_LOCATIONS = LOCATIONS.filter((option) => option.value !== "CommonArea");

export function NewRequestForm({ properties, initialUnitId }: { properties: PickerProperty[]; initialUnitId: number | null }) {
  const router = useRouter();
  // The property the starting unit belongs to, or the first one.
  const startProperty = properties.find((property) => property.units.some((unit) => unit.id === initialUnitId)) ?? properties[0];
  const [propertyId, setPropertyId] = useState(startProperty.id);
  // "common" for a common area, or the unit's id as text.
  const [place, setPlace] = useState(initialUnitId && startProperty.units.some((unit) => unit.id === initialUnitId) ? String(initialUnitId) : "");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [commonArea, setCommonArea] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("Normal");
  const [title, setTitle] = useState("");
  const [share, setShare] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [unitForm, setUnitForm] = useState<LandlordRequestForm | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Set when the request was saved but a photo failed: the form is then locked so it cannot be sent twice.
  const [savedId, setSavedId] = useState<number | null>(null);

  const property = properties.find((item) => item.id === propertyId) ?? startProperty;
  const isCommon = place === COMMON;
  const unitId = place && !isCommon ? Number(place) : null;
  // The form data for the chosen unit; ignored when the landlord has since picked something else.
  const form = unitForm && unitForm.unitId === unitId ? unitForm : null;

  // Ask who rents the chosen unit, so the form can say who will see the request.
  useEffect(() => {
    if (!unitId) return;
    let stale = false;
    requestFormAction(unitId).then((result) => {
      if (!stale && "ok" in result) setUnitForm(result.data);
    });
    return () => {
      stale = true;
    };
  }, [unitId]);

  function choosePlace(value: string) {
    setPlace(value);
    // A common-area request has the place "Common area"; a unit request cannot.
    setLocation(value === COMMON ? "CommonArea" : location === "CommonArea" ? "" : location);
    setCommonArea("");
  }

  async function submit() {
    setError("");
    if (!place) return setError("Choose the unit, or a common area.");
    if (!category || !location) return setError("Choose what kind of problem it is and where it is.");
    if (isCommon && !commonArea) return setError("Choose which part of the building it is.");
    if (!description.trim()) return setError("Describe the problem.");

    setBusy(true);
    const created = await createRequestAction({
      unitId,
      propertyId: isCommon ? property.id : null,
      category,
      location,
      commonAreaLocation: isCommon ? commonArea : null,
      description: description.trim(),
      urgency,
      title: title.trim() || null,
      shareWithTenants: share && !isCommon && !!form?.hasActiveTenancy,
    });
    if (!("ok" in created)) {
      setBusy(false);
      if (created.expired) goToSessionExpired();
      else setError(created.error);
      return;
    }

    const problem = await uploadRequestFiles(created.data.id, files, LANDLORD_UPLOADER);
    if (problem) {
      setBusy(false);
      setSavedId(created.data.id);
      setError(`The request was created, but a photo did not upload (${problem}). You can add it again on the request page.`);
      return;
    }
    router.push(`/landlord/maintenance/${created.data.id}`);
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className={cardClass}>
        <h2 className="mb-4 font-head text-lg font-bold text-heading">Where is the problem?</h2>

        {properties.length > 1 && (
          <>
            <label htmlFor="property" className={labelClass}>Property *</label>
            <select
              id="property"
              value={propertyId}
              onChange={(event) => {
                setPropertyId(Number(event.target.value));
                choosePlace("");
              }}
              className={`${inputClass} mb-4 max-w-sm`}
            >
              {properties.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </>
        )}

        <span className={labelClass}>Unit or common area *</span>
        <ChoiceChips
          label="Unit or common area"
          options={[...property.units.map((unit) => ({ value: String(unit.id), label: unit.label })), { value: COMMON, label: "Common area" }]}
          selected={place ? [place] : []}
          onToggle={choosePlace}
        />

        {unitId && form && (
          <p className="mt-3 rounded-lg bg-bg px-3 py-2 text-sm text-body">
            {form.hasActiveTenancy ? `Rented by ${form.tenants.join(", ")}.` : "Nobody rents this unit now, so no tenant will see this request."}
          </p>
        )}
        {isCommon && <p className="mt-3 rounded-lg bg-bg px-3 py-2 text-sm text-body">A common-area request is only seen by you and your contractors, never by tenants.</p>}
      </div>

      <div className={cardClass}>
        <h2 className="mb-4 font-head text-lg font-bold text-heading">What is the problem?</h2>
        <PlaceFields
          category={category}
          location={location}
          commonArea={commonArea}
          onCategory={setCategory}
          onLocation={setLocation}
          onCommonArea={setCommonArea}
          locations={UNIT_LOCATIONS}
          hideLocation={isCommon}
        />

        <label htmlFor="description" className={`${labelClass} mt-5`}>Describe it *</label>
        <textarea
          id="description"
          rows={4}
          maxLength={2000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none"
        />

        <span className={`${labelClass} mt-5`}>Urgency</span>
        <ChoiceChips label="Urgency" options={URGENCIES} selected={[urgency]} onToggle={setUrgency} />

        <label htmlFor="title" className={`${labelClass} mt-5`}>Title <span className="font-normal text-muted">(optional, made for you if empty)</span></label>
        <input id="title" maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Plumbing, Bathroom" className={`${inputClass} max-w-md`} />

        <span className={`${labelClass} mt-5`}>Photos or a video <span className="font-normal text-muted">(optional)</span></span>
        <PhotoPicker files={files} onChange={setFiles} disabled={busy} />
      </div>

      {!isCommon && form?.hasActiveTenancy && (
        <label className={`${cardClass} flex cursor-pointer gap-3`}>
          <input type="checkbox" checked={share} onChange={(event) => setShare(event.target.checked)} className="mt-1" />
          <span className="text-sm">
            <span className="block font-semibold text-heading">Share with the tenants</span>
            <span className="block text-muted">They see the request, can add comments and photos, and are told about it. Untick to keep it to yourself.</span>
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          {error}{" "}
          {savedId && <Link href={`/landlord/maintenance/${savedId}`} className="underline">Open the request</Link>}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Link href="/landlord/maintenance" className={ghostButton}>Cancel</Link>
        <button type="button" disabled={busy || savedId !== null} onClick={submit} className={primaryButton}>
          {busy ? "Creating…" : "Create request"}
        </button>
      </div>
    </div>
  );
}
