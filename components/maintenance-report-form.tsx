"use client";

// The tenant's "Report a problem" form: what and where, a description, the emergency box, photos, and the access details (remembered from the
// last request). It warns when an open request for the same place already exists. After the request is saved the photos are uploaded and the
// tenant lands on the request page.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessFields } from "@/components/maintenance-access-fields";
import { PhotoPicker } from "@/components/maintenance-photo-picker";
import { PlaceFields } from "@/components/maintenance-place-fields";
import { reportProblemAction, similarRequestsAction } from "@/lib/maintenance-actions";
import type { AccessInput, ReportForm, SimilarRequest } from "@/lib/maintenance-types";
import { uploadRequestFiles } from "@/lib/maintenance-upload";
import { goToSessionExpired } from "@/lib/session-expired-client";

const labelClass = "mb-2 block text-sm font-semibold text-heading";
const cardClass = "rounded-2xl border border-default bg-white p-5 shadow-sm";
const primaryButton = "rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50";
const ghostButton = "rounded-full border border-default bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50";

// The access details the form starts with: the ones remembered by the backend.
function initialAccess(form: ReportForm): AccessInput {
  const saved = form.access;
  return {
    permissionToEnter: saved.permissionToEnter,
    accessNotes: saved.accessNotes ?? "",
    bestTimes: saved.bestTimes,
    contactMethod: saved.contactMethod,
    contactPhone: saved.contactPhone ?? "",
    hasPets: saved.hasPets,
  };
}

export function ReportProblemForm({ form }: { form: ReportForm }) {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [commonArea, setCommonArea] = useState("");
  const [description, setDescription] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [access, setAccess] = useState<AccessInput>(() => initialAccess(form));
  // True once the tenant changed the access details; with nothing remembered and nothing typed, none are sent.
  const [accessTouched, setAccessTouched] = useState(false);
  const [similar, setSimilar] = useState<SimilarRequest[]>([]);
  const [similarDismissed, setSimilarDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Set when the request was saved but a photo failed: the form is then locked so it cannot be sent twice.
  const [savedId, setSavedId] = useState<number | null>(null);

  const placeChosen = !!category && !!location && (location !== "CommonArea" || !!commonArea);

  // Ask the backend for open requests about the same place whenever the place changes. The answer is only a suggestion.
  useEffect(() => {
    if (!placeChosen) return;
    let stale = false;
    similarRequestsAction(form.tenancyId, category, location, location === "CommonArea" ? commonArea : null).then((result) => {
      if (stale || !("ok" in result)) return;
      setSimilar(result.data);
      setSimilarDismissed(false);
    });
    return () => {
      stale = true;
    };
  }, [form.tenancyId, category, location, commonArea, placeChosen]);

  const shownSimilar = placeChosen && !similarDismissed ? similar : [];
  const hasAccess = form.accessSource !== "None" || accessTouched;

  async function submit() {
    setError("");
    if (!category || !location) return setError("Choose what kind of problem it is and where it is.");
    if (location === "CommonArea" && !commonArea) return setError("Choose which part of the building it is.");
    if (!description.trim()) return setError("Describe the problem.");

    setBusy(true);
    const created = await reportProblemAction({
      tenancyId: form.tenancyId,
      category,
      location,
      commonAreaLocation: location === "CommonArea" ? commonArea : null,
      description: description.trim(),
      isEmergency,
      access: hasAccess
        ? { ...access, accessNotes: access.accessNotes.trim() || null, contactPhone: access.contactPhone.trim() || null }
        : null,
    });
    if (!("ok" in created)) {
      setBusy(false);
      if (created.expired) goToSessionExpired();
      else setError(created.error);
      return;
    }

    const problem = await uploadRequestFiles(created.data.id, files);
    if (problem) {
      setBusy(false);
      setSavedId(created.data.id);
      setError(`Your request was sent, but a photo did not upload (${problem}). You can add it again on the request page.`);
      return;
    }
    router.push(`/tenant/requests/${created.data.id}`);
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className={cardClass}>
        <h2 className="mb-4 font-head text-lg font-bold text-heading">What is the problem?</h2>

        <PlaceFields
          category={category}
          location={location}
          commonArea={commonArea}
          onCategory={setCategory}
          onLocation={setLocation}
          onCommonArea={setCommonArea}
        />

        {shownSimilar.length > 0 && (
          <div className="mt-4 rounded-lg bg-accent-tint px-3.5 py-3 text-sm text-accent-dark">
            <p>
              <span className="font-semibold">{shownSimilar[0].number} is already open</span> for this place ({shownSimilar[0].reportedByMe ? "you" : shownSimilar[0].reportedByName}).
              Adding to it helps your landlord more than a second request.
            </p>
            <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
              <Link href={`/tenant/requests/${shownSimilar[0].id}`} className="underline">Add a comment to {shownSimilar[0].number}</Link>
              <button type="button" onClick={() => setSimilarDismissed(true)} className="underline">This is a different problem, continue</button>
            </p>
          </div>
        )}

        <label htmlFor="description" className={`${labelClass} mt-5`}>Describe it *</label>
        <textarea
          id="description"
          rows={4}
          maxLength={2000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="The tub tap drips all night and now there is water under the bathroom sink."
          className="w-full rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none"
        />

        <label className={`mt-4 flex cursor-pointer gap-3 rounded-lg border p-3 ${isEmergency ? "border-red-300 bg-red-50" : "border-default"}`}>
          <input type="checkbox" checked={isEmergency} onChange={(event) => setIsEmergency(event.target.checked)} className="mt-1" />
          <span className="text-sm">
            <span className="block font-semibold text-heading">This is an emergency</span>
            {isEmergency ? (
              <span className="block text-red-800">
                If anyone is in danger, call 911 first. Your landlord will be told at once.
                {form.emergencyPhone ? <> For an emergency you can also call <span className="font-semibold">{form.emergencyPhone}</span>.</> : null}
              </span>
            ) : (
              <span className="block text-muted">Water you cannot stop, no heat in winter, no power, a gas smell, a broken lock or a safety problem.</span>
            )}
          </span>
        </label>

        <span className={`${labelClass} mt-5`}>Photos or a video <span className="font-normal text-muted">(optional)</span></span>
        <PhotoPicker files={files} onChange={setFiles} disabled={busy} />
      </div>

      <div className={cardClass}>
        <h2 className="font-head text-lg font-bold text-heading">
          Getting into your unit <span className="text-sm font-normal text-muted">(optional)</span>
        </h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          {form.accessSource === "None"
            ? "Skip it if you like. What you enter is remembered for your next request."
            : `Filled in from ${form.accessSource === "YourLastRequest" ? "your last request" : "a request in your home"}${form.accessFromNumber ? ` (${form.accessFromNumber})` : ""}. Change anything that is different this time.`}
        </p>
        <AccessFields
          value={access}
          onChange={(next) => {
            setAccess(next);
            setAccessTouched(true);
          }}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          {error}{" "}
          {savedId && <Link href={`/tenant/requests/${savedId}`} className="underline">Open your request</Link>}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Link href="/tenant/requests" className={ghostButton}>Cancel</Link>
        <button type="button" disabled={busy || savedId !== null} onClick={submit} className={primaryButton}>
          {busy ? "Sending…" : "Send request"}
        </button>
      </div>
    </div>
  );
}
